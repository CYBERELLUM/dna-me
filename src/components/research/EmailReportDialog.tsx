import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CellularAgingData {
  senescenceLevel: number;
  mitochondrialHealth: number;
  telomereLength: number;
  autophagyActivity: number;
  inflammationLevel: number;
  projectionYears: number;
}

interface EmailReportDialogProps {
  cellularData: CellularAgingData;
  selectedCompound?: string | null;
  aiInsights?: string;
}

const EmailReportDialog = ({ cellularData, selectedCompound, aiInsights }: EmailReportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();

  const handleSendReport = async () => {
    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter a recipient email address.",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-nutrigenomics-report", {
        body: {
          recipientEmail: email.trim(),
          recipientName: name.trim() || undefined,
          cellularData,
          selectedCompound: selectedCompound || undefined,
          aiInsights: customNotes.trim() || aiInsights || undefined,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setIsSent(true);
        toast({
          title: "Report Sent!",
          description: `Nutrigenomics insights sent to ${email}`,
        });
        
        // Reset form after delay
        setTimeout(() => {
          setOpen(false);
          setIsSent(false);
          setEmail("");
          setName("");
          setCustomNotes("");
        }, 2000);
      } else {
        throw new Error(data?.error || "Failed to send email");
      }
    } catch (error: any) {
      console.error("Error sending report:", error);
      toast({
        variant: "destructive",
        title: "Failed to Send",
        description: error.message || "Could not send the report. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Mail className="w-4 h-4" />
          Email Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-science" />
            Send Nutrigenomics Report
          </DialogTitle>
          <DialogDescription>
            Send a personalized nutrigenomics insights report with your current cellular biomarkers and recommendations.
          </DialogDescription>
        </DialogHeader>

        {isSent ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Report Sent!</h3>
            <p className="text-muted-foreground text-sm">
              Check inbox for nutrigenomics insights.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="researcher@lab.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Recipient Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Dr. Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any custom notes or AI insights to include in the report..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                disabled={isLoading}
                className="min-h-[80px]"
              />
            </div>

            {/* Current Biomarker Summary */}
            <div className="bg-secondary/30 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-semibold text-foreground mb-3">Report Preview</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Senescence:</span>
                  <span className="text-foreground font-mono">{Math.round(cellularData.senescenceLevel * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mitochondria:</span>
                  <span className="text-foreground font-mono">{Math.round(cellularData.mitochondrialHealth * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telomeres:</span>
                  <span className="text-foreground font-mono">{Math.round(cellularData.telomereLength * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Autophagy:</span>
                  <span className="text-foreground font-mono">{Math.round(cellularData.autophagyActivity * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inflammation:</span>
                  <span className="text-foreground font-mono">{Math.round(cellularData.inflammationLevel * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Projection:</span>
                  <span className="text-foreground font-mono">{cellularData.projectionYears} years</span>
                </div>
              </div>
              {selectedCompound && (
                <div className="mt-3 pt-3 border-t border-border">
                  <span className="text-xs text-science">Active: {selectedCompound}</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleSendReport}
              disabled={isLoading || !email.trim()}
              className="w-full gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Report
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmailReportDialog;
