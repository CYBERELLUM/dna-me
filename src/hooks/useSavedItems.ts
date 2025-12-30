import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { PubMedArticle, GeneInfo, SequenceInfo } from "@/lib/api/ncbi";

export type SavedItemType = "publication" | "gene" | "sequence";

export interface SavedItem {
  id: string;
  itemType: SavedItemType;
  itemId: string;
  itemData: PubMedArticle | GeneInfo | SequenceInfo;
  createdAt: Date;
}

export const useSavedItems = () => {
  const { user } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch saved items from database
  const fetchSavedItems = useCallback(async () => {
    if (!user) {
      setSavedItems([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("saved_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSavedItems(
        data.map((item) => ({
          id: item.id,
          itemType: item.item_type as SavedItemType,
          itemId: item.item_id,
          itemData: item.item_data as unknown as PubMedArticle | GeneInfo | SequenceInfo,
          createdAt: new Date(item.created_at),
        }))
      );
    } catch (error) {
      console.error("Error fetching saved items:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedItems();
  }, [fetchSavedItems]);

  // Check if an item is saved
  const isItemSaved = (itemType: SavedItemType, itemId: string): boolean => {
    return savedItems.some(
      (item) => item.itemType === itemType && item.itemId === itemId
    );
  };

  // Save an item
  const saveItem = async (
    itemType: SavedItemType,
    itemId: string,
    itemData: PubMedArticle | GeneInfo | SequenceInfo
  ) => {
    if (!user) {
      toast.error("Please sign in to save items");
      return;
    }

    // Check if already saved
    if (isItemSaved(itemType, itemId)) {
      toast.info("Item already saved");
      return;
    }

    try {
      const insertData = {
        user_id: user.id,
        item_type: itemType,
        item_id: itemId,
        item_data: JSON.parse(JSON.stringify(itemData)),
      };
      
      const { data, error } = await supabase
        .from("saved_items")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newItem: SavedItem = {
        id: data.id,
        itemType: data.item_type as SavedItemType,
        itemId: data.item_id,
        itemData: data.item_data as unknown as PubMedArticle | GeneInfo | SequenceInfo,
        createdAt: new Date(data.created_at),
      };

      setSavedItems((prev) => [newItem, ...prev]);
      toast.success("Saved to library");
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Failed to save item");
    }
  };

  // Remove a saved item
  const removeItem = async (itemType: SavedItemType, itemId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("saved_items")
        .delete()
        .eq("user_id", user.id)
        .eq("item_type", itemType)
        .eq("item_id", itemId);

      if (error) throw error;

      setSavedItems((prev) =>
        prev.filter(
          (item) => !(item.itemType === itemType && item.itemId === itemId)
        )
      );
      toast.success("Removed from library");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  // Toggle save status
  const toggleSave = async (
    itemType: SavedItemType,
    itemId: string,
    itemData: PubMedArticle | GeneInfo | SequenceInfo
  ) => {
    if (isItemSaved(itemType, itemId)) {
      await removeItem(itemType, itemId);
    } else {
      await saveItem(itemType, itemId, itemData);
    }
  };

  return {
    savedItems,
    isLoading,
    isItemSaved,
    saveItem,
    removeItem,
    toggleSave,
    refetch: fetchSavedItems,
  };
};
