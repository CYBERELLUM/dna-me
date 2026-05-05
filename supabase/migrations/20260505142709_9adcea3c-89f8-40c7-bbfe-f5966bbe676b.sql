CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_requested TEXT;
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'display_name')
  ON CONFLICT (id) DO NOTHING;

  -- Always grant base user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  v_requested := NEW.raw_user_meta_data ->> 'requested_role';

  -- Patient: self-serve, auto-grant immediately
  IF v_requested = 'patient' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'patient')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Practitioner / admin / developer: require manual approval
  IF v_requested IN ('admin', 'developer', 'practitioner') THEN
    INSERT INTO public.role_requests (user_id, email, requested_role, status)
    VALUES (NEW.id, NEW.email, v_requested::public.app_role, 'pending');
  END IF;

  RETURN NEW;
END;
$function$;