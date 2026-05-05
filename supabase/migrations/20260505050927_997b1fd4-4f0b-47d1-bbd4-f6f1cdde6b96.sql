
-- Partners table
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_name TEXT NOT NULL,
  contact_email TEXT,
  partner_type TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  api_key_hash TEXT,
  api_key_prefix TEXT,
  intake_summary TEXT,
  capabilities JSONB DEFAULT '[]'::jsonb,
  contract_payload JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage partners"
ON public.partners FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER trg_partners_updated
BEFORE UPDATE ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Partner documents table
CREATE TABLE public.partner_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  summary TEXT,
  parsed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage partner docs"
ON public.partner_documents FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE INDEX idx_partner_documents_partner ON public.partner_documents(partner_id);

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-documents', 'partner-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins read partner docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'partner-documents' AND is_admin(auth.uid()));

CREATE POLICY "Admins write partner docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'partner-documents' AND is_admin(auth.uid()));

CREATE POLICY "Admins update partner docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'partner-documents' AND is_admin(auth.uid()));

CREATE POLICY "Admins delete partner docs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'partner-documents' AND is_admin(auth.uid()));
