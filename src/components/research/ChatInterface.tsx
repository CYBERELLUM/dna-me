import { useRef, useEffect, useState } from "react";
import { Send, Bot, User, Loader2, Mic, MicOff } from "lucide-react";
import { useResearchChat } from "@/hooks/useResearchChat";
import { toast } from "sonner";

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
  const { messages, isLoading, sendMessage } = useResearchChat();
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI() as SpeechRecognitionInstance;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        console.error('Speech recognition error');
        toast.error('Voice input error. Please try again.');
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
      toast.error('Voice input is not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast.info('Listening... Speak now');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput("");
    await sendMessage(message);
  };

  return (
    <div className="flex flex-col h-[600px] glass-panel glow-border">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === "user"
                  ? "bg-accent/20 text-accent"
                  : "bg-primary/20 text-primary"
              }`}
            >
              {message.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={`max-w-[80%] ${
                message.role === "user" ? "text-right" : ""
              }`}
            >
              <div
                className={`inline-block p-4 rounded-lg ${
                  message.role === "user"
                    ? "bg-accent/10 border border-accent/30"
                    : "bg-secondary border border-border"
                }`}
              >
                <p className="text-sm text-foreground leading-relaxed">{message.content}</p>
                {message.sources && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">Sources queried:</p>
                    <div className="flex flex-wrap gap-1">
                      {message.sources.map((source) => (
                        <span
                          key={source}
                          className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-mono"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            </div>
            <div className="bg-secondary border border-border p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Processing query across AI providers...</p>
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
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
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
  );
};
