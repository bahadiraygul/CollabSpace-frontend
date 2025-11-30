"use client";

import { useEffect, useState } from "react";
import { Board } from "@/components/kanban/Board";
import { boardApi } from "@/lib/board-api";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function BoardPage() {
  const [boardId, setBoardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrCreateBoard = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to get user's boards
        const response = await boardApi.getAll();

        if (response.data.length > 0) {
          // Use the first board
          setBoardId(response.data[0].id);
        } else {
          // No boards exist, create a default one
          const newBoard = await boardApi.create("My Board");
          setBoardId(newBoard.data.id);
          toast.success("Yeni board oluşturuldu!");
        }
      } catch (err: any) {
        console.error("Failed to fetch or create board:", err);
        setError(err.response?.data?.message || "Board yüklenemedi");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrCreateBoard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Tekrar Dene
          </Button>
        </div>
      </div>
    );
  }

  if (!boardId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-gray-500">Board bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <Board boardId={boardId} />
    </div>
  );
}
