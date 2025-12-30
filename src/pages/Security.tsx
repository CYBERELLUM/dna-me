import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, 
  QrCode, 
  Trash2, 
  Check, 
  Loader2, 
  ArrowLeft, 
  Users, 
  Key, 
  Globe, 
  Plus, 
  X,
  Database,
  Server,
  Lock
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { MFASetup } from "@/components/auth/MFASetup";
import { toast } from "sonner";
import { Navigation } from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MFAFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
}

interface Collaborator {
  id: string;
  email: string;
  role: "viewer" | "editor" | "admin";
  status: "active" | "pending";
  addedAt: string;
}

interface APIKey {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  createdAt: string;
  lastUsed?: string;
}

interface SafeIP {
  id: string;
  ip: string;
  label: string;
  addedAt: string;
}

const Security = () => {
  const navigate = useNavigate();
  const { user, loading, listMFAFactors, unenrollMFA } = useAuthContext();
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [showSetup, setShowSetup] = useState(false);
  const [loadingFactors, setLoadingFactors] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Collaborators state
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { id: "1", email: "researcher@lab.org", role: "editor", status: "active", addedAt: "2024-01-10" },
    { id: "2", email: "analyst@university.edu", role: "viewer", status: "pending", addedAt: "2024-01-15" }
  ]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");
  const [newCollaboratorRole, setNewCollaboratorRole] = useState<"viewer" | "editor" | "admin">("viewer");
  const [showAddCollaborator, setShowAddCollaborator] = useState(false);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    { id: "1", name: "Research API", prefix: "sk_live_abc12", permissions: ["read", "write"], createdAt: "2024-01-05", lastUsed: "2024-01-20" },
    { id: "2", name: "Analysis Pipeline", prefix: "sk_live_def34", permissions: ["read"], createdAt: "2024-01-12" }
  ]);
  const [newKeyName, setNewKeyName] = useState("");
  const [showAddKey, setShowAddKey] = useState(false);

  // Safe IPs state
  const [safeIPs, setSafeIPs] = useState<SafeIP[]>([
    { id: "1", ip: "192.168.1.0/24", label: "Office Network", addedAt: "2024-01-01" },
    { id: "2", ip: "10.0.0.1", label: "VPN Gateway", addedAt: "2024-01-08" }
  ]);
  const [newIP, setNewIP] = useState("");
  const [newIPLabel, setNewIPLabel] = useState("");
  const [showAddIP, setShowAddIP] = useState(false);

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

  const handleAddCollaborator = () => {
    if (!newCollaboratorEmail.trim()) return;
    const newCollab: Collaborator = {
      id: Date.now().toString(),
      email: newCollaboratorEmail,
      role: newCollaboratorRole,
      status: "pending",
      addedAt: new Date().toISOString().split("T")[0]
    };
    setCollaborators([...collaborators, newCollab]);
    setNewCollaboratorEmail("");
    setShowAddCollaborator(false);
    toast.success("Collaborator invitation sent");
  };

  const handleRemoveCollaborator = (id: string) => {
    setCollaborators(collaborators.filter(c => c.id !== id));
    toast.success("Collaborator removed");
  };

  const handleGenerateAPIKey = () => {
    if (!newKeyName.trim()) return;
    const newKey: APIKey = {
      id: Date.now().toString(),
      name: newKeyName,
      prefix: `sk_live_${Math.random().toString(36).slice(2, 8)}`,
      permissions: ["read"],
      createdAt: new Date().toISOString().split("T")[0]
    };
    setApiKeys([...apiKeys, newKey]);
    setNewKeyName("");
    setShowAddKey(false);
    toast.success("API key generated! Make sure to copy it now.");
  };

  const handleRevokeAPIKey = (id: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== id));
    toast.success("API key revoked");
  };

  const handleAddSafeIP = () => {
    if (!newIP.trim()) return;
    const newSafeIP: SafeIP = {
      id: Date.now().toString(),
      ip: newIP,
      label: newIPLabel || "Unnamed",
      addedAt: new Date().toISOString().split("T")[0]
    };
    setSafeIPs([...safeIPs, newSafeIP]);
    setNewIP("");
    setNewIPLabel("");
    setShowAddIP(false);
    toast.success("Safe IP added");
  };

  const handleRemoveSafeIP = (id: string) => {
    setSafeIPs(safeIPs.filter(ip => ip.id !== id));
    toast.success("IP removed from safe list");
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="pt-20 pb-12 px-4 max-w-6xl mx-auto flex-1 w-full">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Security Settings</h1>
          <p className="text-muted-foreground">Manage your account security, collaborators, API access, and network settings.</p>
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
          <Tabs defaultValue="2fa" className="space-y-6">
            <TabsList className="grid grid-cols-4 max-w-2xl">
              <TabsTrigger value="2fa" className="gap-2">
                <Shield className="w-4 h-4" />
                2FA
              </TabsTrigger>
              <TabsTrigger value="collaborators" className="gap-2">
                <Users className="w-4 h-4" />
                Collaborators
              </TabsTrigger>
              <TabsTrigger value="api" className="gap-2">
                <Key className="w-4 h-4" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="network" className="gap-2">
                <Globe className="w-4 h-4" />
                Network
              </TabsTrigger>
            </TabsList>

            {/* 2FA Tab */}
            <TabsContent value="2fa">
              <div className="space-y-6">
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

                {/* Account Info */}
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
            </TabsContent>

            {/* Collaborators Tab */}
            <TabsContent value="collaborators">
              <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-science/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-science" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Collaborators Database</h2>
                      <p className="text-sm text-muted-foreground">
                        Manage who can access your research data
                      </p>
                    </div>
                  </div>
                  <Dialog open={showAddCollaborator} onOpenChange={setShowAddCollaborator}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Collaborator
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Collaborator</DialogTitle>
                        <DialogDescription>
                          Invite a researcher to collaborate on your projects.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="collab-email">Email Address</Label>
                          <Input
                            id="collab-email"
                            type="email"
                            placeholder="researcher@institution.edu"
                            value={newCollaboratorEmail}
                            onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Access Level</Label>
                          <Select value={newCollaboratorRole} onValueChange={(v) => setNewCollaboratorRole(v as any)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Viewer - Read only access</SelectItem>
                              <SelectItem value="editor">Editor - Can modify data</SelectItem>
                              <SelectItem value="admin">Admin - Full access</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddCollaborator} className="w-full">
                          Send Invitation
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-3">
                  {collaborators.map((collab) => (
                    <div
                      key={collab.id}
                      className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {collab.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{collab.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="capitalize text-xs">{collab.role}</Badge>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${collab.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}
                            >
                              {collab.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCollaborator(collab.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {collaborators.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No collaborators added yet
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* API Keys Tab */}
            <TabsContent value="api">
              <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Key className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">API Configuration</h2>
                      <p className="text-sm text-muted-foreground">
                        Manage API keys for programmatic access
                      </p>
                    </div>
                  </div>
                  <Dialog open={showAddKey} onOpenChange={setShowAddKey}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Generate Key
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Generate API Key</DialogTitle>
                        <DialogDescription>
                          Create a new API key for external integrations.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="key-name">Key Name</Label>
                          <Input
                            id="key-name"
                            placeholder="e.g., Research Pipeline"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                          />
                        </div>
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <p className="text-sm text-yellow-400">
                            ⚠️ The API key will only be shown once. Make sure to copy it immediately.
                          </p>
                        </div>
                        <Button onClick={handleGenerateAPIKey} className="w-full">
                          Generate API Key
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-3">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Server className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{key.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs bg-secondary px-2 py-0.5 rounded font-mono text-muted-foreground">
                              {key.prefix}...
                            </code>
                            {key.permissions.map((p) => (
                              <Badge key={p} variant="secondary" className="text-xs capitalize">{p}</Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created: {key.createdAt} {key.lastUsed && `• Last used: ${key.lastUsed}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeAPIKey(key.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Revoke
                      </Button>
                    </div>
                  ))}

                  {apiKeys.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No API keys generated
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Network / Safe IP Tab */}
            <TabsContent value="network">
              <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Safe IP Allowlist</h2>
                      <p className="text-sm text-muted-foreground">
                        Restrict access to trusted IP addresses and networks
                      </p>
                    </div>
                  </div>
                  <Dialog open={showAddIP} onOpenChange={setShowAddIP}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add IP
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Safe IP</DialogTitle>
                        <DialogDescription>
                          Add an IP address or CIDR range to the allowlist.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="ip-address">IP Address or CIDR</Label>
                          <Input
                            id="ip-address"
                            placeholder="e.g., 192.168.1.0/24 or 10.0.0.1"
                            value={newIP}
                            onChange={(e) => setNewIP(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ip-label">Label (optional)</Label>
                          <Input
                            id="ip-label"
                            placeholder="e.g., Office Network"
                            value={newIPLabel}
                            onChange={(e) => setNewIPLabel(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleAddSafeIP} className="w-full">
                          Add to Allowlist
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-3">
                  {safeIPs.map((ip) => (
                    <div
                      key={ip.id}
                      className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono text-foreground">{ip.ip}</code>
                            <Badge variant="secondary" className="text-xs">{ip.label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Added: {ip.addedAt}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSafeIP(ip.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {safeIPs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No IP restrictions configured. All IPs allowed.
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-400">
                    💡 When the allowlist is empty, access is allowed from all IP addresses. 
                    Adding IPs will restrict access to only those listed.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Security;
