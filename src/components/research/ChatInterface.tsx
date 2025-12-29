import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: string[];
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Welcome to the Research Assistant. I'm your AI-powered concierge for genomics research. I can help you query multiple AI providers, search scientific databases, and synthesize research findings. How can I assist your research today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (will be replaced with actual API calls)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I've analyzed your query across multiple AI providers. Your research question regarding "${input.substring(0, 50)}..." has been processed. To enable full functionality, please configure your API keys in the settings panel below. Once configured, I'll route your queries to: Lovable AI, OpenAI, Gemini, Vertex AI, DeepAgent, and Abacus AI for comprehensive research synthesis.`,
        timestamp: new Date(),
        sources: ["Lovable AI", "OpenAI", "Gemini"],
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-[600px] glass-panel glow-border">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="relative">
          <Bot className="w-6 h-6 text-primary" />
          <div className="absolute -top-1 -right-1 pulse-dot" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Research Assistant</h3>
          <p className="text-xs text-muted-foreground font-mono">Multi-AI Agent • Active</p>
        </div>
      </div>

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
