import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Loader2, ArrowRight, Dna } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { MFASetup } from "@/components/auth/MFASetup";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuthContext();
  const [isLogin, setIsLogin] = useState(true);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setFormLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Welcome back!");
          navigate("/");
        }
      } else {
        const { data, error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast.error("An account with this email already exists");
          } else {
            toast.error(error.message);
          }
        } else if (data.user) {
          toast.success("Account created! You can now set up 2FA.");
          setShowMFASetup(true);
        }
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showMFASetup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <MFASetup 
          onComplete={() => navigate("/")} 
          onSkip={() => navigate("/")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="glass-panel glow-border p-8 max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Dna className="w-10 h-10 text-primary" />
            <span className="text-2xl font-bold text-foreground">GenomicsLab</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLogin 
              ? "Sign in to access your research workspace" 
              : "Join the genomics research platform"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Dr. Jane Smith"
                  className="input-scientific w-full pl-10"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-muted-foreground mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="researcher@university.edu"
                className={`input-scientific w-full pl-10 ${errors.email ? "border-destructive" : ""}`}
              />
            </div>
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="••••••••"
                className={`input-scientific w-full pl-10 ${errors.password ? "border-destructive" : ""}`}
              />
            </div>
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {formLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="ml-2 text-primary hover:underline font-medium"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            🔐 Optional 2FA with Google Authenticator available after signup
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
