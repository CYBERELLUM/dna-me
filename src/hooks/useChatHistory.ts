import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: string[];
}

export const useChatHistory = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load chat history from database
  const loadHistory = useCallback(async () => {
    if (!user) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Welcome to the Research Assistant. I'm your AI-powered concierge for genomics research. I can help you query multiple AI providers, search scientific databases, and synthesize research findings. How can I assist your research today?",
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("chat_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data.length === 0) {
        // No history, show welcome message
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content:
              "Welcome to the Research Assistant. I'm your AI-powered concierge for genomics research. I can help you query multiple AI providers, search scientific databases, and synthesize research findings. How can I assist your research today?",
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages(
          data.map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            timestamp: new Date(msg.created_at),
            sources: msg.sources || undefined,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Save a message to the database
  const saveMessage = async (
    role: "user" | "assistant",
    content: string,
    sources?: string[]
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("chat_history")
        .insert({
          user_id: user.id,
          role,
          content,
          sources: sources || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error("Error saving message:", error);
      return null;
    }
  };

  // Add message to local state
  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  // Update a message in local state (for streaming)
  const updateMessage = (id: string, updates: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  };

  // Clear chat history
  const clearHistory = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("chat_history")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Chat history cleared. How can I assist your research today?",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  };

  return {
    messages,
    isLoading,
    saveMessage,
    addMessage,
    updateMessage,
    clearHistory,
    setMessages,
  };
};
