import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useChatHistory, ChatMessage } from "@/hooks/useChatHistory";
import { useAuth } from "@/hooks/useAuth";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/research-assistant`;

export type ResearchMode =
  | "general"
  | "literature"
  | "methodology"
  | "dataAnalysis"
  | "crisprDesign";

interface ResearchResponse {
  content: string;
  sources: string[];
  providersQueried: string[];
  error?: string;
}

export const useResearchChat = () => {
  const { user } = useAuth();
  const { 
    messages, 
    isLoading: historyLoading, 
    saveMessage, 
    addMessage, 
    setMessages,
    clearHistory,
  } = useChatHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [researchMode, setResearchMode] = useState<ResearchMode>("general");

  const clearMessages = () => {
    clearHistory();
  };

  const sendMessage = useCallback(async (input: string, mode?: ResearchMode, filters?: any) => {
    const currentMode = mode || researchMode;
    if (!input.trim() || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setIsLoading(true);

    // Save user message to database if logged in
    if (user) {
      saveMessage("user", input);
    }

    // Prepare messages for API (only role and content)
    const apiMessages = [...messages, userMessage].map(({ role, content }) => ({
      role,
      content,
    }));

    try {
      // Use the user's session token when available so the edge function can
      // derive identity from the JWT instead of trusting a client-supplied userId.
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      const bearer = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${bearer}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          mode: currentMode,
          filters: filters || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const data: ResearchResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
        sources: data.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Show which providers were queried
      if (data.providersQueried.length > 1) {
        toast.success(`Research synthesized from ${data.sources.length} AI providers`);
      }

      // Save assistant response to database if logged in
      if (user && data.content) {
        saveMessage("assistant", data.content, data.sources);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      
      // Remove the user message if there was an error
      setMessages((prev) => prev.filter((m) => m.id !== userMessageId));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, user, addMessage, saveMessage, setMessages, researchMode]);

  return { 
    messages, 
    isLoading: isLoading || historyLoading, 
    sendMessage, 
    clearMessages, 
    researchMode, 
    setResearchMode 
  };
};
