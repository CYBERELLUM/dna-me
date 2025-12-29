import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  mfaRequired: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  enrollMFA: (friendlyName?: string) => Promise<{ data: any; error: any }>;
  verifyMFA: (factorId: string, code: string) => Promise<{ data: any; error: any }>;
  unenrollMFA: (factorId: string) => Promise<{ data: any; error: any }>;
  listMFAFactors: () => Promise<{ data: any; error: any }>;
  setMfaRequired: (required: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
