import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, Leaf, Sparkles, TrendingUp, Clock, Dna, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { NUTRIGENOMIC_COMPOUNDS, LONGEVITY_GENE_CLUSTERS } from "@/lib/api/ncbi";

interface Message {
  role: "user" | "assistant";
  content: string;
  visualization?: VisualizationData;
}

interface VisualizationData {
  type: "methylation" | "gene_expression" | "cellular_age" | "nutrient_impact";
  data: any;
}

interface NutrigenomicsChatProps {
  onVisualizationUpdate?: (data: VisualizationData) => void;
}

const NutrigenomicsChat = ({ onVisualizationUpdate }: NutrigenomicsChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Welcome to the Nutrigenomics Forecasting Lab! I can help you analyze gene-nutrient interactions, predict epigenetic changes, and forecast cellular aging effects. Try asking about:\n\n• How specific nutrients affect longevity genes\n• Methylation patterns and biological age\n• Cellular senescence markers\n• Personalized nutrition recommendations based on genetic pathways",
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildSystemPrompt = () => {
    const compoundsContext = NUTRIGENOMIC_COMPOUNDS.map(c => 
      `${c.name}: targets ${c.target}, effect: ${c.effect}, sources: ${c.sources}`
    ).join("\n");

    const genesContext = LONGEVITY_GENE_CLUSTERS.map(cluster =>
      `${cluster.cluster}: ${cluster.genes.join(", ")} - ${cluster.description}`
    ).join("\n");

    return `You are an expert nutrigenomics and longevity research AI assistant for Culminate H Labs. Your role is to help researchers understand gene-nutrient interactions, epigenetic modifications, and cellular aging.

KEY NUTRIGENOMIC COMPOUNDS:
${compoundsContext}

LONGEVITY GENE CLUSTERS:
${genesContext}

When responding:
1. Provide scientifically accurate information about nutrigenomics
2. Explain how specific nutrients affect gene expression and epigenetic markers
3. Discuss methylation patterns and their relationship to biological age
4. Include specific genes, pathways, and mechanisms when relevant
5. When discussing forecasts, use language like "research suggests" or "studies indicate"
6. Format key terms in **bold** and use bullet points for clarity
7. Always mention relevant gene symbols (e.g., SIRT1, FOXO3, mTOR)
8. Include actionable recommendations when appropriate

If asked to visualize data, describe what the visualization would show and include a JSON block with visualization parameters like:
\`\`\`json
{"type": "methylation", "genes": ["ELOVL2", "FHL2"], "levels": [0.3, 0.7], "projection_years": 10}
\`\`\``;
  };

  const parseVisualization = (content: string): VisualizationData | undefined => {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        return {
          type: data.type || "gene_expression",
          data
        };
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("nutrigenomics-forecast", {
        body: {
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          systemPrompt: buildSystemPrompt()
        }
      });

      if (error) throw error;

      const assistantContent = data?.content || data?.response || "I apologize, but I could not generate a response.";
      const visualization = parseVisualization(assistantContent);
      
      const assistantMessage: Message = {
        role: "assistant",
        content: assistantContent.replace(/```json\n?[\s\S]*?\n?```/g, "").trim(),
        visualization
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (visualization && onVisualizationUpdate) {
        onVisualizationUpdate(visualization);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get AI response. Please try again."
      });
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "I encountered an error processing your request. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickPrompts = [
    "How does resveratrol affect SIRT1 and longevity?",
    "Predict my methylation changes over 10 years",
    "What nutrients target the mTOR pathway?",
    "Explain NAD+ and cellular energy metabolism"
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-lg ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 border border-border text-foreground"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex items-center gap-2 mb-2 text-xs text-science">
                  <FlaskConical className="w-3 h-3" />
                  NUTRIGENOMICS AI
                </div>
              )}
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.content}
              </div>
              {message.visualization && (
                <div className="mt-3 p-3 bg-accent/10 rounded border border-accent/30">
                  <div className="flex items-center gap-2 text-xs text-accent mb-1">
                    <TrendingUp className="w-3 h-3" />
                    Visualization Generated
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Type: {message.visualization.type}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary/50 border border-border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-science" />
                <span className="text-sm text-muted-foreground">Analyzing nutrigenomic data...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => setInput(prompt)}
                className="text-xs px-3 py-1.5 bg-secondary/50 border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-science/50 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about gene-nutrient interactions, methylation, cellular aging..."
            className="min-h-[60px] max-h-[120px] bg-secondary/30 border-border resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="h-auto"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NutrigenomicsChat;