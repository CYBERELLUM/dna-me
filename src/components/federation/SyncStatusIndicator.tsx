import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, CheckCircle, XCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConnectionStatus {
  isConnected: boolean;
  nodeId: string | null;
  lastCheck: Date | null;
  latency: number | null;
}

export const SyncStatusIndicator = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    nodeId: null,
    lastCheck: null,
    latency: null,
  });
  const [checking, setChecking] = useState(false);

  const checkConnection = async () => {
    setChecking(true);
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke("federated-query", {
        body: { action: "discover" },
      });

      const latency = Date.now() - startTime;

      if (error || !data?.success) {
        setStatus({
          isConnected: false,
          nodeId: null,
          lastCheck: new Date(),
          latency: null,
        });
      } else {
        setStatus({
          isConnected: true,
          nodeId: data.node?.id || null,
          lastCheck: new Date(),
          latency,
        });
      }
    } catch {
      setStatus({
        isConnected: false,
        nodeId: null,
        lastCheck: new Date(),
        latency: null,
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
      <div className="relative">
        {checking ? (
          <RefreshCw className="w-5 h-5 text-primary animate-spin" />
        ) : status.isConnected ? (
          <Wifi className="w-5 h-5 text-green-500" />
        ) : (
          <WifiOff className="w-5 h-5 text-destructive" />
        )}
        <span
          className={cn(
            "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-background",
            status.isConnected ? "bg-green-500" : "bg-destructive",
            status.isConnected && "animate-pulse"
          )}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {status.isConnected ? "Connected" : "Disconnected"}
          </span>
          {status.isConnected && status.nodeId && (
            <Badge variant="outline" className="text-xs font-mono truncate max-w-[120px]">
              {status.nodeId}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {status.latency !== null && (
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              {status.latency}ms
            </span>
          )}
          {status.lastCheck && (
            <span>Last check: {status.lastCheck.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      <button
        onClick={checkConnection}
        disabled={checking}
        className="p-1.5 rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
      >
        <RefreshCw className={cn("w-4 h-4 text-muted-foreground", checking && "animate-spin")} />
      </button>
    </div>
  );
};
