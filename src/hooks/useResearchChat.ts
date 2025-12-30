import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useChatHistory, ChatMessage } from "@/hooks/useChatHistory";
import { useAuth } from "@/hooks/useAuth";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/research-assistant`;

export const useResearchChat = () => {
  const { user } = useAuth();
  const { 
    messages, 
    isLoading: historyLoading, 
    saveMessage, 
    addMessage, 
    updateMessage,
    setMessages 
  } = useChatHistory();
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (input: string) => {
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

    let assistantContent = "";
    const streamMessageId = `stream-${Date.now()}`;

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const updateAssistantContent = (content: string) => {
        assistantContent = content;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id === streamMessageId) {
            return prev.map((m) =>
              m.id === streamMessageId
                ? { ...m, content, timestamp: new Date() }
                : m
            );
          }
          return [
            ...prev,
            {
              id: streamMessageId,
              role: "assistant" as const,
              content,
              timestamp: new Date(),
              sources: ["Lovable AI", "Gemini 2.5 Flash"],
            },
          ];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              updateAssistantContent(assistantContent);
            }
          } catch {
            // Incomplete JSON, put back and wait for more data
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              updateAssistantContent(assistantContent);
            }
          } catch {
            /* ignore partial leftovers */
          }
        }
      }

      // Save assistant response to database if logged in
      if (user && assistantContent) {
        saveMessage("assistant", assistantContent, ["Lovable AI", "Gemini 2.5 Flash"]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      
      // Remove the user message if there was an error
      setMessages((prev) => prev.filter((m) => m.id !== userMessageId));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, user, addMessage, saveMessage, setMessages]);

  return { messages, isLoading: isLoading || historyLoading, sendMessage };
};
