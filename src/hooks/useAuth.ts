import { useState, useEffect, useCallback } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const AUTH_SECURITY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-security`;

interface RateLimitResponse {
  allowed: boolean;
  blocked?: boolean;
  blockReason?: string;
  attemptsRemaining?: number;
  cooldownSeconds?: number;
  suspicious?: boolean;
  suspicionReason?: string;
  riskScore?: number;
}

export interface MFAFactor {
  id: string;
  friendly_name?: string;
  factor_type: "totp";
  status: "verified" | "unverified";
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Check if MFA verification is needed after sign in
        if (event === "SIGNED_IN" && session) {
          setTimeout(() => {
            checkMFAStatus();
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkMFAStatus = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data.totp.length > 0) {
      const verifiedFactors = data.totp.filter(f => f.status === "verified");
      if (verifiedFactors.length > 0) {
        setMfaRequired(true);
      }
    }
  };

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        },
      },
    });
    return { data, error };
  }, []);

  const checkRateLimit = useCallback(async (email: string): Promise<RateLimitResponse> => {
    try {
      const response = await fetch(AUTH_SECURITY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ action: "check", email }),
      });
      
      if (!response.ok && response.status === 429) {
        const data = await response.json();
        return data as RateLimitResponse;
      }
      
      return await response.json();
    } catch (error) {
      console.error("Rate limit check failed:", error);
      // Fail open - allow the attempt
      return { allowed: true };
    }
  }, []);

  const logLoginAttempt = useCallback(async (
    email: string, 
    success: boolean, 
    failureReason?: string
  ) => {
    try {
      await fetch(AUTH_SECURITY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          action: "log", 
          email, 
          success, 
          failureReason 
        }),
      });
    } catch (error) {
      console.error("Failed to log login attempt:", error);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    // Check rate limit before attempting login
    const rateCheck = await checkRateLimit(email);
    
    if (!rateCheck.allowed) {
      return {
        data: null,
        error: {
          message: rateCheck.blockReason || "Too many login attempts. Please try again later.",
          status: 429,
        } as AuthError,
        rateLimit: rateCheck,
      };
    }

    // Warn about suspicious activity but allow the attempt
    if (rateCheck.suspicious) {
      console.warn("Suspicious login detected:", rateCheck.suspicionReason);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Log the attempt
    await logLoginAttempt(email, !error, error?.message);
    
    if (!error && data.session) {
      // Check if MFA is required
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors?.totp.some(f => f.status === "verified")) {
        setMfaRequired(true);
      }
    }
    
    return { 
      data, 
      error,
      rateLimit: rateCheck,
    };
  }, [checkRateLimit, logLoginAttempt]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    setMfaRequired(false);
    return { error };
  }, []);

  const enrollMFA = useCallback(async (friendlyName?: string) => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: friendlyName || "Authenticator App",
    });
    return { data, error };
  }, []);

  const verifyMFA = useCallback(async (factorId: string, code: string) => {
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });
    
    if (!error) {
      setMfaRequired(false);
    }
    
    return { data, error };
  }, []);

  const unenrollMFA = useCallback(async (factorId: string) => {
    const { data, error } = await supabase.auth.mfa.unenroll({
      factorId,
    });
    return { data, error };
  }, []);

  const listMFAFactors = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    return { data, error };
  }, []);

  return {
    user,
    session,
    loading,
    mfaRequired,
    signUp,
    signIn,
    signOut,
    enrollMFA,
    verifyMFA,
    unenrollMFA,
    listMFAFactors,
    setMfaRequired,
  };
};
