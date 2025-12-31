-- Create federation sync history table
CREATE TABLE public.federation_sync_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation TEXT NOT NULL,
  node_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  records_synced INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  details JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.federation_sync_history ENABLE ROW LEVEL SECURITY;

-- Allow public read access for sync status (no auth required for monitoring)
CREATE POLICY "Anyone can view sync history"
ON public.federation_sync_history
FOR SELECT
USING (true);

-- Create index for faster queries
CREATE INDEX idx_federation_sync_history_started_at ON public.federation_sync_history(started_at DESC);
CREATE INDEX idx_federation_sync_history_operation ON public.federation_sync_history(operation);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.federation_sync_history;