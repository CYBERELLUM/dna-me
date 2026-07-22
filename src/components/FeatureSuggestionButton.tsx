import { useState } from "react";
import { Lightbulb, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuthContext } from "@/contexts/AuthContext";
import { api } from "@/integrations/api/client";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = [
  "New Feature",
  "UI / UX Improvement",
  "Performance",
  "Bug Report",
  "Patient Experience",
  "Practitioner Workflow",
  "Research / Data",
  "Other",
];

export const FeatureSuggestionButton = () => {
  const { user } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState("New Feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast({ title: "Please fill in title and description", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await api.functions.invoke("send-feature-suggestion", {
        body: {
          category,
          title: title.trim(),
          description: description.trim(),
          submitterEmail: email || user?.email || "",
          submitterName: name || (user as any)?.user_metadata?.display_name || "",
          submitterRole: (user as any)?.user_metadata?.requested_role || "user",
          pageUrl: typeof window !== "undefined" ? window.location.href : "",
        },
      });
      if (error) throw error;
      toast({ title: "Thank you!", description: "Your suggestion was sent to the team." });
      setTitle(""); setDescription(""); setCategory("New Feature");
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Could not send suggestion", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="fixed bottom-6 right-6 z-50 shadow-lg gap-2 bg-background/90 backdrop-blur border-primary/40 hover:border-primary"
        >
          <Lightbulb className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline">Suggest a Feature</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Suggestions & Feature Enhancements
          </DialogTitle>
          <DialogDescription>
            Share an idea or enhancement. Patients, practitioners, developers and admins
            are all welcome — your input shapes the platform.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fs-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="fs-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fs-title">Title</Label>
            <Input id="fs-title" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary of your idea" maxLength={200} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fs-desc">Description</Label>
            <Textarea id="fs-desc" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the feature, the problem it solves, and who benefits…"
              rows={6} maxLength={5000} required />
          </div>
          {!user && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="fs-name">Your name (optional)</Label>
                <Input id="fs-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fs-email">Email (optional)</Label>
                <Input id="fs-email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
          )}
          <Button type="submit" className="w-full gap-2" disabled={submitting}>
            <Send className="h-4 w-4" />
            {submitting ? "Sending…" : "Send Suggestion"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
