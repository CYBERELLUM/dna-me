
-- Allow users to submit their own role request
CREATE POLICY "Users insert own role request"
ON public.role_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Remove federation_sync_history from realtime broadcast (admin-only data)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'federation_sync_history'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.federation_sync_history';
  END IF;
END $$;
