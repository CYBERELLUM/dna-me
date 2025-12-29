import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Shield, Settings, ChevronDown } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const UserMenu = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  if (!user) {
    return (
      <button
        onClick={() => navigate("/auth")}
        className="btn-primary flex items-center gap-2"
      >
        <User className="w-4 h-4" />
        <span className="hidden sm:inline">Sign In</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm text-foreground hidden sm:inline max-w-[120px] truncate">
          {user.user_metadata?.display_name || user.email?.split("@")[0]}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 top-full mt-2 w-56 glass-panel border border-border rounded-lg shadow-lg z-50 py-2">
            <div className="px-4 py-2 border-b border-border">
              <p className="text-sm font-medium text-foreground truncate">
                {user.user_metadata?.display_name || "Researcher"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>

            <div className="py-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/settings");
                }}
                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-secondary/50 flex items-center gap-3"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                Settings
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/security");
                }}
                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-secondary/50 flex items-center gap-3"
              >
                <Shield className="w-4 h-4 text-muted-foreground" />
                Security & 2FA
              </button>
            </div>

            <div className="border-t border-border pt-2">
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-3"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
