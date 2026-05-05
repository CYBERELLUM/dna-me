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
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput("");
    await sendMessage(message);
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
        <form onSubmit={handleSubmit} className="p-4 border-t border-border">
          <div className="flex gap-3">
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
              placeholder="Enter your research query..."
              className="flex-1 input-scientific"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
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
