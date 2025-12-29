import { useState, useEffect, useCallback } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.session) {
      // Check if MFA is required
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors?.totp.some(f => f.status === "verified")) {
        setMfaRequired(true);
      }
    }
    
    return { data, error };
  }, []);

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
