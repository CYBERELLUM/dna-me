// Patient Intake Questionnaire — collects health, lifestyle, and genomics
// context so the platform can calibrate research outputs to the patient.
// Saves to public.patient_intake (RLS: own-row only) and exports a PDF copy.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { api } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, FileDown, Save, ArrowRight, HeartPulse, Dna, ClipboardList } from "lucide-react";
import jsPDF from "jspdf";

const GOALS = [
  "Longevity & healthspan",
  "Disease prevention",
  "Weight & metabolism",
  "Mental health & cognition",
  "Reproductive / hormonal",
  "Athletic performance",
  "Manage chronic condition",
  "Pharmacogenomics",
];

const CONCERNS = [
  "Cardiovascular",
  "Cancer risk",
  "Diabetes / metabolic",
  "Neurodegenerative",
  "Autoimmune",
  "Allergies / inflammation",
  "Hormonal / endocrine",
  "Gastrointestinal",
];

type Form = {
  full_name: string;
  date_of_birth: string;
  biological_sex: string;
  ethnicity: string;
  primary_goals: string[];
  areas_of_concern: string[];
  current_conditions: string;
  medications: string;
  allergies: string;
  past_surgeries: string;
  family_history: string;
  diet_pattern: string;
  exercise_frequency: string;
  sleep_hours: string;
  stress_level: string;
  smoking_status: string;
  alcohol_use: string;
  prior_genetic_tests: string;
  known_variants: string;
  additional_notes: string;
  consent_research: boolean;
  consent_data_sharing: boolean;
};

const EMPTY: Form = {
  full_name: "",
  date_of_birth: "",
  biological_sex: "",
  ethnicity: "",
  primary_goals: [],
  areas_of_concern: [],
  current_conditions: "",
  medications: "",
  allergies: "",
  past_surgeries: "",
  family_history: "",
  diet_pattern: "",
  exercise_frequency: "",
  sleep_hours: "",
  stress_level: "",
  smoking_status: "",
  alcohol_use: "",
  prior_genetic_tests: "",
  known_variants: "",
  additional_notes: "",
  consent_research: false,
  consent_data_sharing: false,
};

const PatientIntake = () => {
  const { user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    (async () => {
      const { data } = await api
        .from("patient_intake")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          date_of_birth: data.date_of_birth ?? "",
          biological_sex: data.biological_sex ?? "",
          ethnicity: data.ethnicity ?? "",
          primary_goals: data.primary_goals ?? [],
          areas_of_concern: data.areas_of_concern ?? [],
          current_conditions: data.current_conditions ?? "",
          medications: data.medications ?? "",
          allergies: data.allergies ?? "",
          past_surgeries: data.past_surgeries ?? "",
          family_history: data.family_history ?? "",
          diet_pattern: data.diet_pattern ?? "",
          exercise_frequency: data.exercise_frequency ?? "",
          sleep_hours: data.sleep_hours?.toString() ?? "",
          stress_level: data.stress_level?.toString() ?? "",
          smoking_status: data.smoking_status ?? "",
          alcohol_use: data.alcohol_use ?? "",
          prior_genetic_tests: data.prior_genetic_tests ?? "",
          known_variants: data.known_variants ?? "",
          additional_notes: data.additional_notes ?? "",
          consent_research: data.consent_research ?? false,
          consent_data_sharing: data.consent_data_sharing ?? false,
        });
      }
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const update = <K extends keyof Form>(k: K, v: Form[K]) => setForm((p) => ({ ...p, [k]: v }));

  const toggleArr = (key: "primary_goals" | "areas_of_concern", value: string) => {
    setForm((p) => ({
      ...p,
      [key]: p[key].includes(value) ? p[key].filter((x) => x !== value) : [...p[key], value],
    }));
  };

  const save = async (markComplete = false) => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        full_name: form.full_name || null,
        date_of_birth: form.date_of_birth || null,
        biological_sex: form.biological_sex || null,
        ethnicity: form.ethnicity || null,
        primary_goals: form.primary_goals,
        areas_of_concern: form.areas_of_concern,
        current_conditions: form.current_conditions || null,
        medications: form.medications || null,
        allergies: form.allergies || null,
        past_surgeries: form.past_surgeries || null,
        family_history: form.family_history || null,
        diet_pattern: form.diet_pattern || null,
        exercise_frequency: form.exercise_frequency || null,
        sleep_hours: form.sleep_hours ? parseFloat(form.sleep_hours) : null,
        stress_level: form.stress_level ? parseInt(form.stress_level, 10) : null,
        smoking_status: form.smoking_status || null,
        alcohol_use: form.alcohol_use || null,
        prior_genetic_tests: form.prior_genetic_tests || null,
        known_variants: form.known_variants || null,
        additional_notes: form.additional_notes || null,
        consent_research: form.consent_research,
        consent_data_sharing: form.consent_data_sharing,
        completed: markComplete,
        completed_at: markComplete ? new Date().toISOString() : null,
      };
      const { error } = await api
        .from("patient_intake")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      toast.success(markComplete ? "Intake complete — research will calibrate to your profile." : "Progress saved.");
      if (markComplete) navigate("/dashboard");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const margin = 14;
    let y = 20;
    const line = (label: string, value?: string) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      doc.text(label, margin, y);
      doc.setFont("helvetica", "normal");
      const v = value || "—";
      const wrapped = doc.splitTextToSize(v, 180);
      doc.text(wrapped, margin, y + 5);
      y += 5 + wrapped.length * 5 + 3;
    };
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("Patient Intake Questionnaire", margin, y); y += 8;
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y); y += 8;

    line("Full name", form.full_name);
    line("Date of birth", form.date_of_birth);
    line("Biological sex", form.biological_sex);
    line("Ethnicity", form.ethnicity);
    line("Primary goals", form.primary_goals.join(", "));
    line("Areas of concern", form.areas_of_concern.join(", "));
    line("Current conditions", form.current_conditions);
    line("Medications", form.medications);
    line("Allergies", form.allergies);
    line("Past surgeries", form.past_surgeries);
    line("Family history", form.family_history);
    line("Diet pattern", form.diet_pattern);
    line("Exercise frequency", form.exercise_frequency);
    line("Sleep (hrs/night)", form.sleep_hours);
    line("Stress level (1–10)", form.stress_level);
    line("Smoking status", form.smoking_status);
    line("Alcohol use", form.alcohol_use);
    line("Prior genetic tests", form.prior_genetic_tests);
    line("Known variants", form.known_variants);
    line("Additional notes", form.additional_notes);
    line("Consent — research use", form.consent_research ? "Yes" : "No");
    line("Consent — data sharing", form.consent_data_sharing ? "Yes" : "No");

    doc.save(`patient-intake-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <HeartPulse className="w-3.5 h-3.5" /> Patient Intake
          </div>
          <h1 className="text-3xl font-bold text-foreground">Personal Health & Genomics Profile</h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Your answers calibrate the research engine to your biology, goals, and risk profile. All fields are
            private to you and your care team.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i + 1 <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i + 1 < step ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="p-6 space-y-6">
          {step === 1 && (
            <>
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" /> Demographics
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full name</Label>
                  <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
                </div>
                <div>
                  <Label>Date of birth</Label>
                  <Input type="date" value={form.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)} />
                </div>
                <div>
                  <Label>Biological sex</Label>
                  <select
                    className="input-scientific w-full"
                    value={form.biological_sex}
                    onChange={(e) => update("biological_sex", e.target.value)}
                  >
                    <option value="">Select…</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="intersex">Intersex</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <Label>Ethnicity / ancestry</Label>
                  <Input
                    value={form.ethnicity}
                    onChange={(e) => update("ethnicity", e.target.value)}
                    placeholder="e.g. European, East Asian, mixed"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Primary goals (select all that apply)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {GOALS.map((g) => (
                    <label key={g} className="flex items-center gap-2 p-2 rounded border border-border hover:bg-secondary/30 cursor-pointer">
                      <Checkbox
                        checked={form.primary_goals.includes(g)}
                        onCheckedChange={() => toggleArr("primary_goals", g)}
                      />
                      <span className="text-sm">{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Areas of concern</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CONCERNS.map((c) => (
                    <label key={c} className="flex items-center gap-2 p-2 rounded border border-border hover:bg-secondary/30 cursor-pointer">
                      <Checkbox
                        checked={form.areas_of_concern.includes(c)}
                        onCheckedChange={() => toggleArr("areas_of_concern", c)}
                      />
                      <span className="text-sm">{c}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-primary" /> Medical History
              </h2>
              <div>
                <Label>Current conditions / diagnoses</Label>
                <Textarea rows={3} value={form.current_conditions} onChange={(e) => update("current_conditions", e.target.value)} />
              </div>
              <div>
                <Label>Current medications & supplements</Label>
                <Textarea rows={3} value={form.medications} onChange={(e) => update("medications", e.target.value)} />
              </div>
              <div>
                <Label>Allergies</Label>
                <Textarea rows={2} value={form.allergies} onChange={(e) => update("allergies", e.target.value)} />
              </div>
              <div>
                <Label>Past surgeries / hospitalizations</Label>
                <Textarea rows={2} value={form.past_surgeries} onChange={(e) => update("past_surgeries", e.target.value)} />
              </div>
              <div>
                <Label>Family history (parents, siblings — diseases, age of onset)</Label>
                <Textarea rows={3} value={form.family_history} onChange={(e) => update("family_history", e.target.value)} />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" /> Lifestyle
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Diet pattern</Label>
                  <Input value={form.diet_pattern} onChange={(e) => update("diet_pattern", e.target.value)} placeholder="e.g. Mediterranean, keto, vegan" />
                </div>
                <div>
                  <Label>Exercise frequency</Label>
                  <Input value={form.exercise_frequency} onChange={(e) => update("exercise_frequency", e.target.value)} placeholder="e.g. 3x/week strength + cardio" />
                </div>
                <div>
                  <Label>Sleep (hours / night)</Label>
                  <Input type="number" step="0.5" value={form.sleep_hours} onChange={(e) => update("sleep_hours", e.target.value)} />
                </div>
                <div>
                  <Label>Stress level (1–10)</Label>
                  <Input type="number" min="1" max="10" value={form.stress_level} onChange={(e) => update("stress_level", e.target.value)} />
                </div>
                <div>
                  <Label>Smoking status</Label>
                  <select className="input-scientific w-full" value={form.smoking_status} onChange={(e) => update("smoking_status", e.target.value)}>
                    <option value="">Select…</option>
                    <option value="never">Never</option>
                    <option value="former">Former</option>
                    <option value="current">Current</option>
                  </select>
                </div>
                <div>
                  <Label>Alcohol use</Label>
                  <Input value={form.alcohol_use} onChange={(e) => update("alcohol_use", e.target.value)} placeholder="e.g. 2 drinks/week" />
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Dna className="w-5 h-5 text-primary" /> Genomics & Consent
              </h2>
              <div>
                <Label>Prior genetic tests (23andMe, AncestryDNA, clinical panels, WGS, etc.)</Label>
                <Textarea rows={2} value={form.prior_genetic_tests} onChange={(e) => update("prior_genetic_tests", e.target.value)} />
              </div>
              <div>
                <Label>Known variants of interest (RSIDs, gene names, ClinVar IDs)</Label>
                <Textarea rows={3} value={form.known_variants} onChange={(e) => update("known_variants", e.target.value)} placeholder="e.g. rs429358 (APOE ε4), BRCA1 c.5266dupC" />
              </div>
              <div>
                <Label>Anything else we should know</Label>
                <Textarea rows={3} value={form.additional_notes} onChange={(e) => update("additional_notes", e.target.value)} />
              </div>

              <div className="space-y-3 pt-3 border-t border-border">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={form.consent_research}
                    onCheckedChange={(v) => update("consent_research", !!v)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-muted-foreground">
                    I consent to my de-identified intake data being used to calibrate the platform's research outputs for me.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={form.consent_data_sharing}
                    onCheckedChange={(v) => update("consent_data_sharing", !!v)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-muted-foreground">
                    I consent to sharing my profile with practitioners I explicitly invite to my care team.
                  </span>
                </label>
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => save(false)} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save draft
              </Button>
              <Button variant="outline" onClick={exportPDF}>
                <FileDown className="w-4 h-4" /> Export PDF
              </Button>
            </div>
            <div className="flex gap-2">
              {step > 1 && (
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
              {step < totalSteps ? (
                <Button onClick={() => setStep(step + 1)}>
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={() => save(true)} disabled={saving || !form.consent_research}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Complete intake
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PatientIntake;
