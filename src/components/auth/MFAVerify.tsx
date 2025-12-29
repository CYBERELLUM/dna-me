import { useState, useEffect } from "react";
import { Shield, Loader2, Check } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MFAVerifyProps {
  onSuccess?: () => void;
}

export const MFAVerify = ({ onSuccess }: MFAVerifyProps) => {
  const { listMFAFactors, verifyMFA } = useAuthContext();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState<string>("");

  useEffect(() => {
    const getFactors = async () => {
      const { data } = await listMFAFactors();
      if (data?.totp?.length > 0) {
        const verifiedFactor = data.totp.find((f: any) => f.status === "verified");
        if (verifiedFactor) {
          setFactorId(verifiedFactor.id);
        }
      }
    };
    getFactors();
  }, [listMFAFactors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || !factorId) return;

    setLoading(true);
    try {
      const { error } = await verifyMFA(factorId, code);
      
      if (error) {
        toast.error(error.message);
        setCode("");
        return;
      }

      toast.success("Verified successfully!");
      onSuccess?.();
    } catch (err) {
      toast.error("Verification failed");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-panel glow-border p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Two-Factor Authentication</h2>
          <p className="text-muted-foreground text-sm">
            Enter the 6-digit code from your authenticator app to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="input-scientific w-full text-center text-2xl tracking-[0.5em] font-mono"
              maxLength={6}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Verify
          </button>
        </form>
      </div>
    </div>
  );
};
