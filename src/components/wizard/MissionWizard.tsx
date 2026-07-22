// Mission Wizard — a daily onboarding modal that greets the user by time of day,
// asks what their mission is today, and routes them into the right tool or
// pre-loads the research chat with a pre-filled prompt. Shown once per session.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FlaskConical,
  Dna,
  Box,
  Leaf,
  Database,
  Handshake,
  ShieldCheck,
  BookOpen,
  Sparkles,
  ArrowRight,
  X,
  Loader2,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { api } from "@/integrations/api/client";
import { HeartPulse } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const SESSION_KEY = "mission_wizard_shown_v1";
const PENDING_PROMPT_KEY = "mission_pending_prompt";

type Mission = {
  id: string;
  title: string;
  description: string;
  icon: typeof Search;
  route: string;
  prompt?: string;
};

const MISSIONS: Mission[] = [
  {
    id: "research",
    title: "Run a research query",
    description: "Ask Dr. Vance a genomics question and synthesize multi-source evidence.",
    icon: Search,
    route: "/dashboard",
    prompt: "I'd like to start a focused research session today on:",
  },
  {
    id: "literature",
    title: "Review the literature",
    description: "Map seminal papers, trends, and controversies in a topic area.",
    icon: BookOpen,
    route: "/dashboard",
    prompt: "Please run a senior-author literature review on:",
  },
  {
    id: "analyze-doc",
    title: "Analyze a document",
    description: "Upload a PDF, Word, Excel, or CSV and extract findings.",
    icon: FlaskConical,
    route: "/dashboard",
    prompt: "I'm about to upload a document — please prepare to extract claims, methods, and limitations.",
  },
  {
    id: "sequence",
    title: "Work with a sequence",
    description: "Inspect, align, or design against a DNA/RNA/protein sequence.",
    icon: Dna,
    route: "/sequences",
  },
  {
    id: "visualize",
    title: "Open the 3D Lab",
    description: "Visualize CRISPR edits, chromosomes, proteins, or epigenetic projections.",
    icon: Box,
    route: "/visualizations",
  },
  {
    id: "nutrigenomics",
    title: "Nutrigenomics forecast",
    description: "Model gene–diet interactions and longevity protocols.",
    icon: Leaf,
    route: "/nutrigenomics",
  },
  {
    id: "vault",
    title: "Browse the Data Vault",
    description: "Inspect federated datasets and stored research artifacts.",
    icon: Database,
    route: "/data-vault",
  },
  {
    id: "collaborate",
    title: "Onboard a collaborator",
    description: "Spin up a new partner integration via the intake specialist.",
    icon: Handshake,
    route: "/collaborate",
  },
  {
    id: "axiom-core",
    title: "Verify a node",
    description: "Audit federation node authenticity and signal quality.",
    icon: ShieldCheck,
    route: "/axiom-core-validation",
  },
];

const greetingFor = (date = new Date()): string => {
  const h = date.getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Working late";
};

export const MissionWizard = () => {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Mission | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isPatient, setIsPatient] = useState(false);
  const [intakeComplete, setIntakeComplete] = useState(false);

  // Detect patient role + intake status whenever user resolves
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: roles }, { data: intake }] = await Promise.all([
        api.from("user_roles").select("role").eq("user_id", user.id),
        api.from("patient_intake").select("completed").eq("user_id", user.id).maybeSingle(),
      ]);
      const patient = !!roles?.some((r: any) => r.role === "patient");
      setIsPatient(patient);
      setIntakeComplete(!!intake?.completed);
    })();
  }, [user]);

  // Open once per session, after auth resolves and a user is present
  useEffect(() => {
    if (loading || !user) return;
    try {
      const shown = sessionStorage.getItem(SESSION_KEY);
      if (!shown) {
        // small delay so it doesn't fight the route transition
        const t = setTimeout(() => setOpen(true), 400);
        return () => clearTimeout(t);
      }
    } catch {
      setOpen(true);
    }
  }, [loading, user]);

  const greeting = useMemo(() => greetingFor(), []);
  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Researcher";

  const closeAndRemember = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
    setOpen(false);
    setSelected(null);
    setCustomPrompt("");
  };

  const launch = async () => {
    if (!selected && !customPrompt.trim()) {
      toast.error("Pick a mission or describe what you want to work on.");
      return;
    }
    setSubmitting(true);
    try {
      // If user typed a custom mission, default to the research dashboard
      // and stash the prompt for ChatInterface to consume.
      const mission = selected ?? {
        id: "custom",
        title: "Custom mission",
        description: "",
        icon: Sparkles,
        route: "/dashboard",
        prompt: "Today's mission:",
      };

      let pendingPrompt: string | null = null;
      if (mission.prompt || customPrompt.trim()) {
        pendingPrompt = [mission.prompt, customPrompt.trim()].filter(Boolean).join(" ").trim();
      }

      if (pendingPrompt) {
        try {
          sessionStorage.setItem(PENDING_PROMPT_KEY, pendingPrompt);
        } catch {}
      }

      closeAndRemember();
      navigate(mission.route);
      toast.success(`Mission set: ${mission.title}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : closeAndRemember())}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            {greeting}, {displayName}
          </DialogTitle>
          <DialogDescription className="text-base">
            What is your mission today? Pick a starting point and I'll prepare the workspace.
          </DialogDescription>
        </DialogHeader>

        {isPatient && !intakeComplete && (
          <div className="mt-2 p-4 rounded-xl border border-primary/40 bg-primary/5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/20 text-primary">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Complete your patient intake</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Before the platform can calibrate research to your biology, fill out the intake questionnaire.
                  You can save your draft and export a PDF copy.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  closeAndRemember();
                  navigate("/patient-intake");
                }}
                className="gap-1"
              >
                Start intake <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {isPatient && intakeComplete && (
          <div className="mt-2 p-3 rounded-lg border border-border bg-secondary/30 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-primary" />
              Your intake is complete — research is calibrated to your profile.
            </p>
            <button
              type="button"
              onClick={() => {
                closeAndRemember();
                navigate("/patient-intake");
              }}
              className="text-xs text-primary hover:underline"
            >
              Update intake
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
          {MISSIONS.map((m) => {
            const Icon = m.icon;
            const isActive = selected?.id === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelected(m)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  isActive
                    ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary))]"
                    : "border-border bg-secondary/30 hover:bg-secondary hover:border-primary/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isActive ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{m.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">
                      {m.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium text-foreground">
            Or describe today's mission in your own words
          </label>
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. Compare BRCA1 vs BRCA2 mutation effects on homologous recombination repair efficiency"
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
          <button
            type="button"
            onClick={closeAndRemember}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Skip for now
          </button>
          <Button onClick={launch} disabled={submitting} size="lg" className="gap-2">
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            Begin mission
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper for ChatInterface to pull and clear the pending prompt
export const consumePendingMissionPrompt = (): string | null => {
  try {
    const v = sessionStorage.getItem(PENDING_PROMPT_KEY);
    if (v) sessionStorage.removeItem(PENDING_PROMPT_KEY);
    return v;
  } catch {
    return null;
  }
};
