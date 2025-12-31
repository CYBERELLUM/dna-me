import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  History, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Database
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface SyncRecord {
  id: string;
  operation: string;
  node_id: string;
  status: string;
  records_synced: number;
  records_failed: number;
  details: Record<string, unknown>;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export const SyncHistoryLog = () => {
  const [history, setHistory] = useState<SyncRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("federation_sync_history")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setHistory(data as SyncRecord[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("sync-history-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "federation_sync_history",
        },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "pending":
      case "running":
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      default:
        return <RefreshCw className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case "seed":
      case "push":
        return <ArrowUpCircle className="w-4 h-4 text-primary" />;
      case "pull":
      case "query":
        return <ArrowDownCircle className="w-4 h-4 text-accent" />;
      default:
        return <Database className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "running":
        return <Badge variant="default" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Running</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Sync History
        </h3>
        <Button variant="ghost" size="sm" onClick={fetchHistory} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No sync operations recorded yet</p>
          <p className="text-sm">Sync operations will appear here in real-time</p>
        </div>
      ) : (
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {history.map((record) => (
              <div
                key={record.id}
                className="p-4 rounded-lg bg-secondary/30 border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getOperationIcon(record.operation)}
                    <div>
                      <span className="font-medium text-foreground capitalize">
                        {record.operation}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2 font-mono">
                        → {record.node_id}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(record.status)}
                    {getStatusBadge(record.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Records Synced</span>
                    <div className="font-semibold text-green-400">{record.records_synced}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Failed</span>
                    <div className={`font-semibold ${record.records_failed > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {record.records_failed}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Started</span>
                    <div className="text-foreground">
                      {formatDistanceToNow(new Date(record.started_at), { addSuffix: true })}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration</span>
                    <div className="text-foreground">
                      {record.completed_at
                        ? `${Math.round((new Date(record.completed_at).getTime() - new Date(record.started_at).getTime()) / 1000)}s`
                        : "—"}
                    </div>
                  </div>
                </div>

                {record.error_message && (
                  <div className="mt-3 p-2 rounded bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                    {record.error_message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
