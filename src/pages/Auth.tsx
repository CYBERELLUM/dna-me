import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Loader2, ArrowRight, Dna, CheckCircle, Shield } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { MFASetup } from "@/components/auth/MFASetup";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuthContext();
  const [isLogin, setIsLogin] = useState(true);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
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
        const result = await signIn(email, password);
        const { error } = result;
        const rateLimit = (result as any).rateLimit;
        
        if (rateLimit?.blocked) {
          const minutes = Math.ceil((rateLimit.cooldownSeconds || 0) / 60);
          toast.error(`Account temporarily locked. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`);
        } else if (error) {
          if (error.message.includes("Invalid login credentials")) {
            const remaining = rateLimit?.attemptsRemaining;
            if (remaining !== undefined && remaining <= 3) {
              toast.error(`Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
            } else {
              toast.error("Invalid email or password");
            }
          } else {
            toast.error(error.message);
          }
        } else {
          if (rateLimit?.suspicious) {
            toast.warning("Unusual login detected. Please verify your recent activity.");
          }
          toast.success("Welcome back!");
          navigate("/dashboard");
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
          // Email confirmation is required - show confirmation screen
          setShowEmailConfirmation(true);
          toast.success("Please check your email to verify your account");
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

  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>
        
        <div className="glass-panel glow-border p-8 max-w-md w-full relative z-10 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-4">Verify Your Email</h1>
          
          <p className="text-muted-foreground mb-6">
            We've sent a verification link to <span className="text-foreground font-medium">{email}</span>. 
            Please check your inbox and click the link to activate your account.
          </p>
          
          <div className="p-4 bg-secondary/50 rounded-lg mb-6">
            <div className="flex items-center gap-3 text-left">
              <Shield className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                This verification step protects our research platform from unauthorized access and ensures the integrity of our intellectual property.
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Didn't receive the email? Check your spam folder or
            </p>
            <button
              onClick={() => {
                setShowEmailConfirmation(false);
                setEmail("");
                setPassword("");
                setDisplayName("");
              }}
              className="text-primary hover:underline text-sm font-medium"
            >
              Try a different email address
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-border">
            <button
              onClick={() => {
                setShowEmailConfirmation(false);
                setIsLogin(true);
              }}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Already verified? Sign in here
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showMFASetup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <MFASetup 
          onComplete={() => navigate("/dashboard")} 
          onSkip={() => navigate("/dashboard")}
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
        <div className="mt-6 p-4 bg-secondary/50 rounded-lg space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            🔐 Optional 2FA with Google Authenticator available after signup
          </p>
          {!isLogin && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Password requirements:</span> 12+ chars, uppercase, lowercase, number, special character
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
