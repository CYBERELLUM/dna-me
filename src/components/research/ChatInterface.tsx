import { useRef, useEffect, useState } from "react";
import {
  Send,
  Bot,
  Loader2,
  Mic,
  MicOff,
  Download,
  Trash2,
  Paperclip,
  FileText,
  X,
} from "lucide-react";
import { useResearchChat } from "@/hooks/useResearchChat";
import { toast } from "sonner";
import { ChatMessage } from "./ChatMessage";
import { SourcesSheet } from "./SourcesSheet";
import { QuickPrompts } from "./QuickPrompts";
import { ResearchModeSelector } from "./ResearchModeSelector";
import {
  parseFile,
  buildContextBlock,
  ACCEPT_ATTR,
  type ParsedFile,
} from "@/lib/fileParser";
import { consumePendingMissionPrompt } from "@/components/wizard/MissionWizard";
import jsPDF from "jspdf";

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export const ChatInterface = () => {
  const { messages, isLoading, sendMessage, clearMessages, researchMode, setResearchMode } = useResearchChat();
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<ParsedFile[]>([]);
  const [parsingFiles, setParsingFiles] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      recognitionRef.current =
        new SpeechRecognitionAPI() as SpeechRecognitionInstance;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        console.error("Speech recognition error");
        toast.error("Voice input error. Please try again.");
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error("Voice input is not supported in this browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast.info("Listening... Speak now");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const contextBlock = buildContextBlock(attachments);
    const message = (input.trim() || "Please analyze the attached document(s).") + contextBlock;
    setInput("");
    setAttachments([]);
    await sendMessage(message);
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setParsingFiles(true);
    try {
      const parsed: ParsedFile[] = [];
      for (const file of Array.from(files)) {
        try {
          const result = await parseFile(file);
          parsed.push(result);
          toast.success(`Parsed ${file.name}`);
        } catch (err) {
          console.error("Parse error:", err);
          toast.error(`${file.name}: ${err instanceof Error ? err.message : "parse failed"}`);
        }
      }
      setAttachments((prev) => [...prev, ...parsed]);
    } finally {
      setParsingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const openSources = (sources: string[]) => {
    setActiveSources(sources);
    setSourcesOpen(true);
  };

  const exportPDF = () => {
    if (messages.length === 0) {
      toast.error("No messages to export");
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Genomics Oracle & Collaboration Lab Conversation", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Exported: ${new Date().toLocaleString()}`, 14, 25);

    let y = 35;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;
    const maxWidth = 180;

    messages.forEach((msg) => {
      const prefix = msg.role === "user" ? "You: " : "Assistant: ";
      const lines = doc.splitTextToSize(prefix + msg.content, maxWidth);

      if (y + lines.length * 5 > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      doc.setTextColor(msg.role === "user" ? 60 : 30);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 6;
    });

    doc.save("research-conversation.pdf");
    toast.success("PDF exported");
  };

  return (
    <>
      <SourcesSheet
        open={sourcesOpen}
        onOpenChange={setSourcesOpen}
        sources={activeSources}
      />

      <div className="flex flex-col h-[720px] glass-panel glow-border rounded-xl overflow-hidden">
        {/* Top toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-secondary/30">
          <ResearchModeSelector
            value={researchMode}
            onChange={setResearchMode}
            disabled={isLoading}
          />
          <div className="flex items-center gap-1">
            <button
              onClick={exportPDF}
              disabled={messages.length === 0}
              className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              aria-label="Export PDF"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={clearMessages}
              disabled={messages.length === 0}
              className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
              aria-label="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick prompts */}
        <QuickPrompts
          onSelect={(prompt) => {
            setInput(prompt);
          }}
          disabled={isLoading}
        />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">
                Ask a question about genomics, CRISPR, or any research topic.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              {...message}
              onOpenSources={openSources}
            />
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
              <div className="bg-secondary border border-border p-4 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  Processing with multi-AI synthesis…
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border space-y-2">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-1 rounded-md bg-secondary border border-border text-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span className="max-w-[180px] truncate">{f.filename}</span>
                  {f.truncated && <span className="text-muted-foreground">(truncated)</span>}
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPT_ATTR}
              onChange={handleFilesSelected}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || parsingFiles}
              className="p-3 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Attach files"
              title="Attach PDF, Word, Excel, CSV, or text files"
            >
              {parsingFiles ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Paperclip className="w-5 h-5" />
              )}
            </button>
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={isLoading}
              className={`p-3 rounded-lg transition-all duration-200 ${
                isListening
                  ? "bg-primary text-primary-foreground animate-pulse"
                  : "bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                attachments.length
                  ? "Ask about the attached document(s)..."
                  : "Enter your research query..."
              }
              className="flex-1 input-scientific"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && attachments.length === 0)}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
