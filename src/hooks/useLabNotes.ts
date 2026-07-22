import { useState, useEffect, useCallback } from "react";
import { api } from "@/integrations/api/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";

export interface LabNote {
  id: string;
  title: string;
  content: string;
  template: string | null;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const useLabNotes = () => {
  const { user } = useAuthContext();
  const [notes, setNotes] = useState<LabNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch notes from database
  const fetchNotes = useCallback(async () => {
    if (!user) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await api.notes.list();

      if (error) throw error;

      setNotes(
        (data || []).map((note) => ({
          id: note.id,
          title: note.title,
          content: note.content || "",
          template: note.template,
          pinned: Boolean(note.pinned),
          createdAt: new Date(note.created_at),
          updatedAt: new Date(note.updated_at),
        }))
      );
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Create a new note
  const createNote = async (title: string, content: string, template: string) => {
    if (!user) {
      toast.error("Please sign in to create notes");
      return null;
    }

    try {
      const { data, error } = await api.notes.create({ title, content, template });

      if (error) throw error;
      if (!data) throw new Error("Note was not returned");

      const newNote: LabNote = {
        id: data.id,
        title: data.title,
        content: data.content || "",
        template: data.template,
        pinned: Boolean(data.pinned),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setNotes((prev) => [newNote, ...prev]);
      toast.success("Note created");
      return newNote;
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
      return null;
    }
  };

  // Update an existing note
  const updateNote = async (id: string, updates: Partial<Pick<LabNote, "title" | "content" | "pinned">>) => {
    if (!user) return;

    try {
      const { data, error } = await api.notes.update(id, updates);

      if (error) throw error;

      setNotes((prev) =>
        prev.map((note) =>
          note.id === id
            ? { ...note, ...updates, updatedAt: new Date(data?.updated_at || Date.now()) }
            : note
        )
      );
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to save note");
    }
  };

  // Delete a note
  const deleteNote = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await api.notes.remove(id);

      if (error) throw error;

      setNotes((prev) => prev.filter((note) => note.id !== id));
      toast.success("Note deleted");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  return {
    notes,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    refetch: fetchNotes,
  };
};
