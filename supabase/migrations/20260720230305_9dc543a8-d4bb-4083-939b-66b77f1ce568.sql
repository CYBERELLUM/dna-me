
-- 1. Add vault reference column
ALTER TABLE public.api_configurations
  ADD COLUMN IF NOT EXISTS api_key_vault_id UUID;

-- 2. Migrate existing plaintext keys into Vault
DO $mig$
DECLARE
  r RECORD;
  v_id UUID;
  v_name TEXT;
BEGIN
  FOR r IN
    SELECT id, api_key_encrypted
    FROM public.api_configurations
    WHERE api_key_encrypted IS NOT NULL
      AND api_key_encrypted <> ''
      AND api_key_vault_id IS NULL
  LOOP
    v_name := 'api_config_' || r.id::text;
    BEGIN
      v_id := vault.create_secret(r.api_key_encrypted, v_name, 'Migrated user API key');
    EXCEPTION WHEN unique_violation THEN
      SELECT id INTO v_id FROM vault.secrets WHERE name = v_name;
    END;
    UPDATE public.api_configurations
      SET api_key_vault_id = v_id, api_key_encrypted = NULL
      WHERE id = r.id;
  END LOOP;
END
$mig$;

-- 3. Drop plaintext column
ALTER TABLE public.api_configurations DROP COLUMN IF EXISTS api_key_encrypted;

-- 4. Upsert function: stores/updates the key inside Vault
CREATE OR REPLACE FUNCTION public.upsert_api_key(
  _provider   TEXT,
  _api_key    TEXT,
  _model      TEXT DEFAULT NULL,
  _is_enabled BOOLEAN DEFAULT TRUE
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       UUID := auth.uid();
  v_config_id UUID;
  v_vault_id  UUID;
  v_name      TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _api_key IS NULL OR length(_api_key) = 0 THEN
    RAISE EXCEPTION 'api key required';
  END IF;

  SELECT id, api_key_vault_id INTO v_config_id, v_vault_id
    FROM public.api_configurations
    WHERE user_id = v_uid AND provider = _provider;

  IF v_config_id IS NULL THEN
    INSERT INTO public.api_configurations (user_id, provider, model, is_enabled)
      VALUES (v_uid, _provider, _model, _is_enabled)
      RETURNING id INTO v_config_id;
  ELSE
    UPDATE public.api_configurations
      SET model = COALESCE(_model, model),
          is_enabled = _is_enabled,
          updated_at = now()
      WHERE id = v_config_id;
  END IF;

  v_name := 'api_config_' || v_config_id::text;
  IF v_vault_id IS NULL THEN
    BEGIN
      v_vault_id := vault.create_secret(_api_key, v_name, 'User API key');
    EXCEPTION WHEN unique_violation THEN
      SELECT id INTO v_vault_id FROM vault.secrets WHERE name = v_name;
      PERFORM vault.update_secret(v_vault_id, _api_key);
    END;
    UPDATE public.api_configurations SET api_key_vault_id = v_vault_id WHERE id = v_config_id;
  ELSE
    PERFORM vault.update_secret(v_vault_id, _api_key);
  END IF;

  RETURN v_config_id;
END;
$$;

-- 5. Delete function: removes the row and its Vault secret
CREATE OR REPLACE FUNCTION public.delete_api_key(_provider TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid      UUID := auth.uid();
  v_vault_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT api_key_vault_id INTO v_vault_id
    FROM public.api_configurations
    WHERE user_id = v_uid AND provider = _provider;

  DELETE FROM public.api_configurations
    WHERE user_id = v_uid AND provider = _provider;

  IF v_vault_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = v_vault_id;
  END IF;

  RETURN TRUE;
END;
$$;

-- 6. Has-key check: returns booleans without ever exposing the key
CREATE OR REPLACE FUNCTION public.has_api_key(_provider TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.api_configurations
    WHERE user_id = auth.uid()
      AND provider = _provider
      AND api_key_vault_id IS NOT NULL
      AND is_enabled = TRUE
  );
$$;

-- 7. Server-side retrieval for edge functions (service_role only)
CREATE OR REPLACE FUNCTION public.get_user_api_key(_user_id UUID, _provider TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vault_id UUID;
  v_secret   TEXT;
BEGIN
  -- Restrict to service_role; never callable by end users
  IF current_setting('request.jwt.claims', TRUE)::jsonb->>'role' <> 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT api_key_vault_id INTO v_vault_id
    FROM public.api_configurations
    WHERE user_id = _user_id AND provider = _provider AND is_enabled = TRUE;

  IF v_vault_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets
    WHERE id = v_vault_id;

  RETURN v_secret;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_api_key(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_api_key(UUID, TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION public.upsert_api_key(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_api_key(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_api_key(TEXT) TO authenticated, anon;
