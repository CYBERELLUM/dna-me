import { useState, useEffect } from "react";
import { Navigation } from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { useAuthContext } from "@/contexts/AuthContext";
import { api } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Bell, 
  Moon, 
  Sun,
  Loader2,
  Save,
  LogIn,
  Shield,
  Mail,
  Key,
  CheckCircle2,
  Smartphone,
  Monitor,
  Trash2,
  QrCode,
  ShieldCheck,
  ShieldOff
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MFAFactor {
  id: string;
  friendly_name: string | null;
  factor_type: string;
  status: string;
}

const Settings = () => {
  const { user, loading, enrollMFA, verifyMFA, unenrollMFA, listMFAFactors } = useAuthContext();
  const [displayName, setDisplayName] = useState("");
  const [institution, setInstitution] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [researchAlerts, setResearchAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  
  // Security state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  
  // MFA state
  const [mfaFactors, setMfaFactors] = useState<MFAFactor[]>([]);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaVerificationCode, setMfaVerificationCode] = useState("");
  const [mfaStep, setMfaStep] = useState<"qr" | "verify">("qr");

  useEffect(() => {
    if (user) {
      setIsEmailVerified(user.email_confirmed_at !== null);
      fetchMFAFactors();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    // Check current theme
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await api.auth.getProfile();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setDisplayName(String(data?.user?.display_name || ""));
    setInstitution(String(data?.user?.institution || ""));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await api.auth.updateUser({
        display_name: displayName,
        institution,
      });

      if (error) throw error;
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    
    toast({
      title: "Theme Updated",
      description: `Switched to ${newMode ? "dark" : "light"} mode.`,
    });
  };

  const handleSendVerificationEmail = async () => {
    if (!user?.email) return;
    
    setVerificationLoading(true);
    try {
      const { error } = await api.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/settings`
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox and click the verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email.",
        variant: "destructive",
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in both password fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    setPasswordLoading(true);
    try {
      const { error } = await api.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      setNewPassword("");
      setConfirmPassword("");
      
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password.",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendPasswordResetEmail = async () => {
    if (!user?.email) return;
    
    setPasswordLoading(true);
    try {
      const { error } = await api.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/settings`
      });
      
      if (error) throw error;
      
      toast({
        title: "Password Reset Email Sent",
        description: "Check your inbox for a link to reset your password.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email.",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const fetchMFAFactors = async () => {
    const { data, error } = await listMFAFactors();
    if (data?.totp) {
      setMfaFactors(data.totp);
    }
  };

  const handleEnableMFA = async () => {
    setMfaLoading(true);
    try {
      const { data, error } = await enrollMFA("GenomicsLab Authenticator");
      
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to set up 2FA",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setMfaQrCode(data.totp.qr_code);
        setMfaSecret(data.totp.secret);
        setMfaFactorId(data.id);
        setMfaStep("qr");
        setShowMFASetup(true);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to set up 2FA",
        variant: "destructive",
      });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    if (mfaVerificationCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setMfaLoading(true);
    try {
      const { error } = await verifyMFA(mfaFactorId, mfaVerificationCode);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Invalid verification code",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication is now active.",
      });
      
      setShowMFASetup(false);
      setMfaVerificationCode("");
      fetchMFAFactors();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to verify code",
        variant: "destructive",
      });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMFA = async (factorId: string) => {
    setMfaLoading(true);
    try {
      const { error } = await unenrollMFA(factorId);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to disable 2FA",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been removed.",
      });
      
      fetchMFAFactors();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to disable 2FA",
        variant: "destructive",
      });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleSignOutAllSessions = async () => {
    try {
      const { error } = await api.auth.signOut({ scope: 'global' });
      
      if (error) throw error;
      
      toast({
        title: "Signed Out",
        description: "All sessions have been terminated. Please sign in again.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out of all sessions.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Auth gate temporarily disabled for open access

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24 pb-16 px-4 max-w-4xl mx-auto w-full">
        <PageBreadcrumb currentPage="Settings" />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and notifications.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-secondary/50 flex-wrap h-auto">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal details and research affiliation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={user.email || ""} 
                    disabled 
                    className="bg-secondary/30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input 
                    id="displayName" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Dr. Jane Smith"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="institution">Institution / Organization</Label>
                  <Input 
                    id="institution" 
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Research Institute"
                  />
                </div>
                
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6">
              {/* Email Verification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Verification
                  </CardTitle>
                  <CardDescription>
                    Verify your email address to secure your account.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isEmailVerified ? 'bg-green-500/20' : 'bg-yellow-500/20'
                      }`}>
                        {isEmailVerified ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Mail className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user?.email}</p>
                        <p className={`text-sm ${isEmailVerified ? 'text-green-500' : 'text-yellow-500'}`}>
                          {isEmailVerified ? 'Verified' : 'Not verified'}
                        </p>
                      </div>
                    </div>
                    {!isEmailVerified && (
                      <Button 
                        onClick={handleSendVerificationEmail}
                        disabled={verificationLoading}
                        variant="outline"
                      >
                        {verificationLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Mail className="w-4 h-4 mr-2" />
                        )}
                        Resend Verification
                      </Button>
                    )}
                  </div>
                  {!isEmailVerified && (
                    <p className="text-sm text-muted-foreground">
                      A verified email helps secure your account and enables password recovery.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Password Reset */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input 
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button 
                      onClick={handlePasswordReset}
                      disabled={passwordLoading || !newPassword || !confirmPassword}
                    >
                      {passwordLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Key className="w-4 h-4 mr-2" />
                      )}
                      Update Password
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={handleSendPasswordResetEmail}
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4 mr-2" />
                      )}
                      Send Reset Link
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                    Password must be at least 8 characters. Use a mix of letters, numbers, and symbols for best security.
                  </p>
                </CardContent>
              </Card>

              {/* Two-Factor Authentication */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Two-Factor Authentication
                  </CardTitle>
                  <CardDescription>
                    Add an extra layer of security with authenticator app verification.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mfaFactors.filter(f => f.status === 'verified').length > 0 ? (
                    <div className="space-y-3">
                      {mfaFactors.filter(f => f.status === 'verified').map((factor) => (
                        <div key={factor.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                              <ShieldCheck className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {factor.friendly_name || "Authenticator App"}
                              </p>
                              <p className="text-sm text-green-500">Active</p>
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive border-destructive/50 hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove 2FA from your account. You can re-enable it at any time.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDisableMFA(factor.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Disable 2FA
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))}
                    </div>
                  ) : showMFASetup ? (
                    <div className="space-y-4">
                      {mfaStep === "qr" ? (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Scan this QR code with Google Authenticator or your preferred TOTP app.
                          </p>
                          <div className="bg-white p-4 rounded-lg mx-auto w-fit">
                            <img src={mfaQrCode} alt="2FA QR Code" className="w-48 h-48" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Or enter this secret manually:</p>
                            <code className="block p-3 bg-secondary rounded font-mono text-xs text-foreground break-all">
                              {mfaSecret}
                            </code>
                          </div>
                          <Button onClick={() => setMfaStep("verify")} className="w-full">
                            Continue to Verification
                          </Button>
                          <Button 
                            variant="ghost" 
                            onClick={() => setShowMFASetup(false)} 
                            className="w-full"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Enter the 6-digit code from your authenticator app.
                          </p>
                          <Input
                            type="text"
                            value={mfaVerificationCode}
                            onChange={(e) => setMfaVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="000000"
                            className="text-center text-2xl tracking-[0.5em] font-mono"
                            maxLength={6}
                          />
                          <div className="flex gap-3">
                            <Button 
                              variant="outline" 
                              onClick={() => setMfaStep("qr")}
                              className="flex-1"
                            >
                              Back
                            </Button>
                            <Button 
                              onClick={handleVerifyMFA}
                              disabled={mfaLoading || mfaVerificationCode.length !== 6}
                              className="flex-1"
                            >
                              {mfaLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                              )}
                              Verify & Enable
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <ShieldOff className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Not Enabled</p>
                          <p className="text-sm text-muted-foreground">Add 2FA for enhanced security</p>
                        </div>
                      </div>
                      <Button onClick={handleEnableMFA} disabled={mfaLoading}>
                        {mfaLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <QrCode className="w-4 h-4 mr-2" />
                        )}
                        Enable 2FA
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Session Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Active Sessions
                  </CardTitle>
                  <CardDescription>
                    Manage your active sessions and sign out from other devices.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Monitor className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Current Session</p>
                        <p className="text-sm text-muted-foreground">
                          {navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Browser"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded">
                      Active Now
                    </span>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full text-destructive border-destructive/50 hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Sign Out All Other Sessions
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Sign Out All Sessions?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will sign you out from all devices including this one. You'll need to sign in again.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleSignOutAllSessions}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Sign Out All
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    If you suspect unauthorized access, sign out of all sessions immediately.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the application looks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle between light and dark themes.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-muted-foreground" />
                    <Switch 
                      checked={isDarkMode}
                      onCheckedChange={toggleTheme}
                    />
                    <Moon className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how you want to receive updates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive important updates via email.
                    </p>
                  </div>
                  <Switch 
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Research Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new research in your areas of interest.
                    </p>
                  </div>
                  <Switch 
                    checked={researchAlerts}
                    onCheckedChange={setResearchAlerts}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a weekly summary of platform activity.
                    </p>
                  </div>
                  <Switch 
                    checked={weeklyDigest}
                    onCheckedChange={setWeeklyDigest}
                  />
                </div>
                
                <p className="text-xs text-muted-foreground pt-4 border-t border-border">
                  Note: Notification preferences are saved locally. Full notification system coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default Settings;
