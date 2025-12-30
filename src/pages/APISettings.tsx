import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/layout/Navigation";
import { DNAMatrix } from "@/components/layout/DNAMatrix";
import Footer from "@/components/layout/Footer";
import { AIProviderConfig } from "@/components/research/AIProviderConfig";
import { useAuth } from "@/hooks/useAuth";
import { Lock, Eye, EyeOff, Shield, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const APISettings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error("Please enter your password");
      return;
    }

    setIsVerifying(true);
    try {
      // Re-authenticate with Supabase using the user's email and password
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: password,
      });

      if (error) {
        toast.error("Incorrect password. Please try again.");
      } else {
        setIsVerified(true);
        toast.success("Access granted");
      }
    } catch (error) {
      toast.error("Verification failed");
    } finally {
      setIsVerifying(false);
      setPassword("");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <DNAMatrix />
      <Navigation />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Research
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-4">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono text-primary">Secure Area</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Multi-AI API <span className="text-gradient-primary">Settings</span>
            </h1>
            <p className="text-muted-foreground">
              Configure your AI provider API keys and external connections
            </p>
          </div>

          {!isVerified ? (
            <div className="max-w-md mx-auto">
              <div className="card-scientific p-8">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Verify Your Identity
                  </h2>
                  <p className="text-sm text-muted-foreground text-center">
                    Enter your password to access API settings
                  </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1 font-mono">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full input-scientific pr-10"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Access Settings
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <AIProviderConfig />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default APISettings;
