import { useState, useEffect } from "react";
import { QrCode, Shield, Check, X, Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MFASetupProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export const MFASetup = ({ onComplete, onSkip }: MFASetupProps) => {
  const { enrollMFA, verifyMFA } = useAuthContext();
  const [step, setStep] = useState<"intro" | "qr" | "verify">("intro");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const { data, error } = await enrollMFA("GenomicsLab Authenticator");
      
      if (error) {
        toast.error(error.message);
        return;
      }

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setStep("qr");
      }
    } catch (err) {
      toast.error("Failed to set up 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const { error } = await verifyMFA(factorId, verificationCode);
      
      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Two-factor authentication enabled!");
      onComplete?.();
    } catch (err) {
      toast.error("Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  if (step === "intro") {
    return (
      <div className="glass-panel glow-border p-8 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Enable Two-Factor Authentication</h2>
          <p className="text-muted-foreground text-sm">
            Protect your research data with an additional layer of security using Google Authenticator or any TOTP app.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleEnroll}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
            Set Up 2FA
          </button>
          
          {onSkip && (
            <button
              onClick={onSkip}
              className="w-full py-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === "qr") {
    return (
      <div className="glass-panel glow-border p-8 max-w-md mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Scan QR Code</h2>
          <p className="text-muted-foreground text-sm">
            Scan this QR code with Google Authenticator or your preferred TOTP app.
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg mx-auto w-fit mb-6">
          <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
        </div>

        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-2">Or enter this secret manually:</p>
          <code className="block p-3 bg-secondary rounded font-mono text-xs text-foreground break-all">
            {secret}
          </code>
        </div>

        <button
          onClick={() => setStep("verify")}
          className="btn-primary w-full"
        >
          Continue to Verification
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel glow-border p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Verify Setup</h2>
        <p className="text-muted-foreground text-sm">
          Enter the 6-digit code from your authenticator app to complete setup.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="input-scientific w-full text-center text-2xl tracking-[0.5em] font-mono"
            maxLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading || verificationCode.length !== 6}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Verify & Enable
        </button>

        <button
          type="button"
          onClick={() => setStep("qr")}
          className="w-full py-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          Back to QR Code
        </button>
      </form>
    </div>
  );
};
