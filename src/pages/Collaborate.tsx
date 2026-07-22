import { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { DNAMatrix } from "@/components/layout/DNAMatrix";
import Footer from "@/components/layout/Footer";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Send, Sparkles, FileText, Key, CheckCircle2, Loader2, Copy, Volume2, VolumeX, Square } from "lucide-react";
import { api } from "@/integrations/api/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import drAria from "@/assets/dr-aria.png";
import { useAuthContext } from "@/contexts/AuthContext";

interface Msg { role: "user" | "assistant"; content: string; }
interface UploadedDoc { filename: string; storage_path: string; mime_type: string; size_bytes: number; summary?: string; }
interface IssuedKey { partner_id: string; api_key: string; api_key_prefix: string; message: string; }

const COLLABORATOR_GREETING =
  "Hello — I'm Dr. Aria, your collaboration intake. I'll help your organization join the Cyberellum network as a partner node.\n\nTo start: **what is the name of your organization, and what kind of work do you do?** If you have any collaboration documents (MOUs, protocols, data dictionaries, capability briefs), feel free to upload them on the right and I'll read them.";

const PATIENT_GREETING =
  "Hello — I'm Dr. Aria. I'm here to help you understand genomics and health information in clear, comfortable language. I can explain and help you prepare questions for your licensed care team, but I don't replace your doctor or diagnose conditions.\n\n**What would you like help understanding today?**";

const SIGN_IN_GREETING =
  "Hello — I'm Dr. Aria. **Please sign in so I can use the right conversation style for you**: warm, plain-language support for patients or precise scientific collaboration for professional users.";

const Collaborate = () => {
  const { user, loading: authLoading } = useAuthContext();
  const patientMode = user?.user_type === "subscriber";
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: SIGN_IN_GREETING }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [contract, setContract] = useState<Record<string, unknown> | null>(null);
  const [issued, setIssued] = useState<IssuedKey | null>(null);
  const [issuing, setIssuing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (authLoading || messages.length !== 1 || messages[0].content !== SIGN_IN_GREETING) return;
    if (user) setMessages([{ role: "assistant", content: patientMode ? PATIENT_GREETING : COLLABORATOR_GREETING }]);
  }, [authLoading, user, patientMode, messages]);

  useEffect(() => () => {
    audioRef.current?.pause();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const stopVoice = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeakingIndex(null);
  };

  const playVoice = async (text: string, index: number) => {
    stopVoice();
    setSpeakingIndex(index);
    const { data, error } = await api.aria.speak(text);
    if (error || !data) {
      setSpeakingIndex(null);
      toast.error(error?.message || "Dr. Aria's voice is unavailable");
      return;
    }
    const url = URL.createObjectURL(data);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => { URL.revokeObjectURL(url); audioRef.current = null; setSpeakingIndex(null); };
    audio.onerror = () => { URL.revokeObjectURL(url); audioRef.current = null; setSpeakingIndex(null); toast.error("Dr. Aria's voice could not be played"); };
    try { await audio.play(); } catch {
      URL.revokeObjectURL(url);
      audioRef.current = null;
      setSpeakingIndex(null);
      toast.error("Select the play button to hear Dr. Aria");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const { data, error } = await api.functions.invoke("partner-onboarding", {
        body: { messages: next, documents: docs.map(d => ({ filename: d.filename, summary: d.summary })) },
      });
      if (error) throw error;
      const reply = data.content || "(no response)";
      setMessages(m => [...m, { role: "assistant", content: reply }]);
      if (voiceEnabled) void playVoice(reply, next.length);
      if (data.contract?.ready) setContract(data.contract);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reach intake AI");
      setMessages(m => m.slice(0, -1));
      setInput(userMsg.content);
    } finally {
      setSending(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (const file of files) {
      const path = `${crypto.randomUUID()}/${file.name}`;
      const { error } = await api.storage.from("partner-documents").upload(path, file);
      if (error) {
        toast.error(`Upload failed: ${file.name} — ${error.message}. (Sign in as admin required.)`);
        continue;
      }
      setDocs(d => [...d, { filename: file.name, storage_path: path, mime_type: file.type, size_bytes: file.size }]);
      setMessages(m => [...m, { role: "user", content: `📎 Uploaded **${file.name}** (${Math.round(file.size / 1024)} KB) for review.` }]);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const finalize = async () => {
    if (!contract) return;
    setIssuing(true);
    try {
      const { data, error } = await api.functions.invoke("partner-issue-key", {
        body: { contract, documents: docs },
      });
      if (error) throw error;
      setIssued(data);
      toast.success("Collaboration contract activated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to issue key");
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DNAMatrix />
      <Navigation />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageBreadcrumb currentPage="Collaborate" />
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono text-primary">PARTNER ONBOARDING</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Join the <span className="text-gradient-primary">Collaboration Network</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Conversational onboarding with Dr. Aria — upload your collaboration documents
              and let our intake AI draft your integration contract.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chat */}
            <Card className="lg:col-span-2 p-0 flex flex-col h-[640px] bg-card/60 backdrop-blur border-border/60">
              <div className="h-28 shrink-0 border-b border-border/60 px-6 flex items-center gap-4 overflow-hidden bg-secondary/20">
                <img
                  src={drAria}
                  alt="Dr. Aria, Cyberellum collaboration intake AI"
                  className="w-24 h-28 object-contain object-bottom self-end drop-shadow-[0_0_16px_hsl(var(--primary)/0.25)]"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">Dr. Aria</p>
                  <p className="text-xs font-mono uppercase tracking-wider text-primary">{patientMode ? "Patient Education" : "Scientific Collaboration"} · GPT-4o</p>
                  <p className="text-xs text-muted-foreground mt-1">Online · Hazel voice available</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={voiceEnabled ? "default" : "outline"}
                  onClick={() => { if (voiceEnabled) stopVoice(); setVoiceEnabled(value => !value); }}
                  aria-pressed={voiceEnabled}
                  className="shrink-0"
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4 mr-1.5" /> : <VolumeX className="w-4 h-4 mr-1.5" />}
                  Hazel {voiceEnabled ? "on" : "off"}
                </Button>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <img
                        src={drAria}
                        alt=""
                        aria-hidden="true"
                        className="w-10 h-10 object-cover object-top rounded-full border border-primary/30 bg-secondary mr-3 shrink-0"
                      />
                    )}
                    <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}>
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                      {m.role === "assistant" && user && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 mt-2 text-xs"
                          onClick={() => speakingIndex === i ? stopVoice() : playVoice(m.content, i)}
                          aria-label={speakingIndex === i ? "Stop Dr. Aria voice" : "Play Dr. Aria with Hazel voice"}
                        >
                          {speakingIndex === i ? <Square className="w-3 h-3 mr-1.5" /> : <Volume2 className="w-3 h-3 mr-1.5" />}
                          {speakingIndex === i ? "Stop" : "Hear Hazel"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-secondary rounded-xl px-4 py-3 text-sm flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" /> Dr. Aria is thinking…
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-border/60 p-4 flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="Reply to Dr. Aria…"
                  disabled={sending || !!issued || !user}
                />
                {user ? (
                  <Button onClick={sendMessage} disabled={sending || !input.trim() || !!issued} aria-label="Send message to Dr. Aria">
                    <Send className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button onClick={() => { window.location.href = "/auth"; }}>Sign in</Button>
                )}
              </div>
            </Card>

            {/* Side panel */}
            <div className="space-y-4">
              <Card className="p-4 bg-card/60 backdrop-blur border-border/60">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Documents
                  </h3>
                  <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={!!issued}>
                    <Upload className="w-3 h-3 mr-1" /> Upload
                  </Button>
                  <input ref={fileRef} type="file" multiple hidden onChange={handleUpload}
                    accept=".pdf,.doc,.docx,.md,.txt,.json,.csv" />
                </div>
                {docs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No documents uploaded yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {docs.map((d, i) => (
                      <li key={i} className="text-xs flex items-center gap-2 text-muted-foreground">
                        <FileText className="w-3 h-3 shrink-0" />
                        <span className="truncate">{d.filename}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {contract && !issued && (
                <Card className="p-4 bg-primary/5 border-primary/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm">Contract draft ready</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong>{String(contract.organization_name)}</strong>
                    {" — "}
                    <Badge variant="outline" className="text-[10px]">{String(contract.partner_type)}</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-4">{String(contract.summary)}</p>
                  <Button onClick={finalize} disabled={issuing} className="w-full" size="sm">
                    {issuing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Key className="w-3 h-3 mr-1" />}
                    Activate & Issue Key
                  </Button>
                </Card>
              )}

              {issued && (
                <Card className="p-4 bg-primary/5 border-primary/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm">Your Partner Key</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Save this now — it will only be shown once.
                  </p>
                  <div className="flex items-center gap-1 mb-3">
                    <code className="flex-1 text-[11px] font-mono bg-background border border-border rounded px-2 py-1.5 break-all">
                      {issued.api_key}
                    </code>
                    <Button size="icon" variant="ghost" onClick={() => {
                      navigator.clipboard.writeText(issued.api_key);
                      toast.success("Copied");
                    }}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{issued.message}</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Collaborate;
