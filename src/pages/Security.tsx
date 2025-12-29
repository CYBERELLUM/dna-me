import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, QrCode, Trash2, Check, Loader2, ArrowLeft } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { MFASetup } from "@/components/auth/MFASetup";
import { toast } from "sonner";
import { Navigation } from "@/components/layout/Navigation";

interface MFAFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
}

const Security = () => {
  const navigate = useNavigate();
  const { user, loading, listMFAFactors, unenrollMFA } = useAuthContext();
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [showSetup, setShowSetup] = useState(false);
  const [loadingFactors, setLoadingFactors] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadFactors();
    }
  }, [user]);

  const loadFactors = async () => {
    setLoadingFactors(true);
    const { data, error } = await listMFAFactors();
    if (!error && data) {
      setFactors(data.totp || []);
    }
    setLoadingFactors(false);
  };

  const handleRemoveFactor = async (factorId: string) => {
    setRemovingId(factorId);
    const { error } = await unenrollMFA(factorId);
    if (error) {
      toast.error("Failed to remove 2FA");
    } else {
      toast.success("Two-factor authentication removed");
      loadFactors();
    }
    setRemovingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const verifiedFactors = factors.filter(f => f.status === "verified");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 pb-12 px-4 max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Security Settings</h1>
          <p className="text-muted-foreground">Manage your account security and two-factor authentication.</p>
        </div>

        {showSetup ? (
          <MFASetup 
            onComplete={() => {
              setShowSetup(false);
              loadFactors();
            }}
            onSkip={() => setShowSetup(false)}
          />
        ) : (
          <div className="space-y-6">
            {/* 2FA Section */}
            <div className="glass-panel glow-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Two-Factor Authentication</h2>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
              </div>

              {loadingFactors ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : verifiedFactors.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-primary mb-4">
                    <Check className="w-4 h-4" />
                    Two-factor authentication is enabled
                  </div>

                  {verifiedFactors.map((factor) => (
                    <div
                      key={factor.id}
                      className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <QrCode className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {factor.friendly_name || "Authenticator App"}
                          </p>
                          <p className="text-xs text-muted-foreground">TOTP</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFactor(factor.id)}
                        disabled={removingId === factor.id}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                      >
                        {removingId === factor.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Shield className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Two-factor authentication is not enabled
                  </p>
                  <button
                    onClick={() => setShowSetup(true)}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    Enable 2FA
                  </button>
                </div>
              )}
            </div>

            {/* Session Info */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Account Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground">{user?.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account Created</span>
                  <span className="text-foreground font-mono">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Sign In</span>
                  <span className="text-foreground font-mono">
                    {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Security;
