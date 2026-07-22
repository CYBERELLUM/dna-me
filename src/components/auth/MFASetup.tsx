import { useState } from "react";
import { QrCode, Shield, Check, Loader2, Mail, Download, KeyRound } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { api } from "@/integrations/api/client";
import { toast } from "sonner";

interface MFASetupProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

type WalletResult = {
  wallet_id?: string;
  did?: string;
  parent_wallet_id?: string;
  origin_domain?: string;
  provider?: string;
  user_shard?: string | null;
  shard_notice?: string | null;
};

export const MFASetup = ({ onComplete, onSkip }: MFASetupProps) => {
  const { enrollMFA, verifyMFA } = useAuthContext();
  const [step, setStep] = useState<"choice" | "qr" | "totp-verify" | "otp-verify" | "wallet">("choice");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [destinationHint, setDestinationHint] = useState("");
  const [wallet, setWallet] = useState<WalletResult | null>(null);
  const [loading, setLoading] = useState(false);

  const finish = (result: any) => {
    const custodyWallet = result?.custody_wallet as WalletResult | undefined;
    if (custodyWallet) {
      setWallet(custodyWallet);
      setStep("wallet");
    } else {
      onComplete?.();
    }
  };

  const startAuthenticator = async () => {
    setLoading(true);
    const { data, error } = await enrollMFA("Genomics Collaborative — Google Authenticator");
    setLoading(false);
    if (error) return toast.error(error.message);
    setQrCode(data?.qr_data_url || "");
    setSecret(data?.manual_entry_key || "");
    setFactorId(data?.factor_id || data?.id || "");
    setStep("qr");
  };

  const startEmailOtp = async () => {
    setLoading(true);
    const { data, error } = await api.auth.mfa.requestOtp();
    setLoading(false);
    if (error) return toast.error(error.message);
    setDestinationHint(data?.destination_hint || "your registered email");
    setVerificationCode("");
    setStep("otp-verify");
    toast.success("One-time passcode sent");
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(verificationCode)) return toast.error("Enter the 6-digit code");
    setLoading(true);
    const result = step === "otp-verify"
      ? await api.auth.mfa.verifyOtp(verificationCode)
      : await verifyMFA(factorId, verificationCode);
    setLoading(false);
    if (result.error) return toast.error(result.error.message);
    toast.success("Two-factor authentication enabled");
    finish(result.data);
  };

  const downloadShard = () => {
    if (!wallet?.user_shard) return;
    const payload = JSON.stringify({
      wallet_id: wallet.wallet_id,
      did: wallet.did,
      parent_wallet_id: wallet.parent_wallet_id,
      origin_domain: wallet.origin_domain,
      provider: wallet.provider,
      subscriber_shard: wallet.user_shard,
      warning: "Store securely. This subscriber shard is required for governed signing and is not recoverable from the platform.",
    }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `genomics-custody-${wallet.wallet_id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (step === "choice") return (
    <div className="glass-panel glow-border p-6 max-w-lg mx-auto space-y-5">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center"><Shield className="w-7 h-7 text-primary" /></div>
        <h2 className="text-xl font-bold text-foreground">Choose Two-Factor Authentication</h2>
        <p className="text-sm text-muted-foreground mt-2">Both options verify this session and activate your AXIOM CORE custody identity.</p>
      </div>
      <button onClick={startAuthenticator} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />} Google Authenticator
      </button>
      <button onClick={startEmailOtp} disabled={loading} className="w-full py-3 rounded-lg border border-border bg-secondary hover:border-primary/50 flex items-center justify-center gap-2">
        <Mail className="w-4 h-4" /> Email One-Time Passcode (OTP)
      </button>
      {onSkip && <button onClick={onSkip} className="w-full py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>}
    </div>
  );

  if (step === "qr") return (
    <div className="glass-panel glow-border p-6 max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold text-center">Google Authenticator</h2>
      <p className="text-sm text-muted-foreground text-center">Scan this QR code, then enter the 6-digit code.</p>
      <div className="bg-white p-4 rounded-lg mx-auto w-fit"><img src={qrCode} alt="Google Authenticator QR code" className="w-48 h-48" /></div>
      <code className="block p-3 bg-secondary rounded font-mono text-xs break-all">{secret}</code>
      <button onClick={() => { setVerificationCode(""); setStep("totp-verify"); }} className="btn-primary w-full">Continue</button>
      <button onClick={() => setStep("choice")} className="w-full py-2 text-sm text-muted-foreground">Back</button>
    </div>
  );

  if (step === "wallet") return (
    <div className="glass-panel glow-border p-6 max-w-lg mx-auto space-y-4">
      <div className="text-center"><KeyRound className="w-9 h-9 text-primary mx-auto mb-2" /><h2 className="text-xl font-bold">AXIOM CORE Custody Bound</h2></div>
      <div className="text-sm space-y-2 bg-secondary/40 p-4 rounded-lg">
        <p><span className="text-muted-foreground">Wallet:</span> <code>{wallet?.wallet_id}</code></p>
        <p><span className="text-muted-foreground">Parent:</span> <code>{wallet?.parent_wallet_id}</code></p>
        <p><span className="text-muted-foreground">Origin:</span> {wallet?.origin_domain}</p>
      </div>
      {wallet?.user_shard && <button onClick={downloadShard} className="btn-primary w-full flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Download One-Time Subscriber Shard</button>}
      <p className="text-xs text-amber-400">{wallet?.shard_notice || "Your existing governed wallet was attached; no second wallet was minted."}</p>
      <button onClick={onComplete} className="w-full py-2 rounded-lg border border-border">Continue</button>
    </div>
  );

  return (
    <div className="glass-panel glow-border p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-center mb-2">Verify Security Code</h2>
      <p className="text-sm text-muted-foreground text-center mb-5">
        {step === "otp-verify" ? `Enter the code sent to ${destinationHint}.` : "Enter the code from Google Authenticator."}
      </p>
      <form onSubmit={verify} className="space-y-4">
        <input type="text" inputMode="numeric" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000" className="input-scientific w-full text-center text-2xl tracking-[0.5em] font-mono" maxLength={6} autoFocus />
        <button type="submit" disabled={loading || verificationCode.length !== 6} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Verify &amp; Enable
        </button>
        {step === "otp-verify" && <button type="button" onClick={startEmailOtp} disabled={loading} className="w-full text-sm text-muted-foreground">Send another code</button>}
        <button type="button" onClick={() => setStep(step === "otp-verify" ? "choice" : "qr")} className="w-full text-sm text-muted-foreground">Back</button>
      </form>
    </div>
  );
};
