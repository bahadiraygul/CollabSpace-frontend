"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Board } from "@/components/kanban/Board";
import { useBoardStore } from "@/store/board-store";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SharedBoardPage() {
  const params = useParams();
  const token = params.token as string;
  const { board, isLoading, error, fetchBoardByShareToken } = useBoardStore();
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    if (token && !hasAttempted) {
      fetchBoardByShareToken(token);
      setHasAttempted(true);
    }
  }, [token, fetchBoardByShareToken, hasAttempted]);

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
          <p className="text-gray-500 mb-4">
            Bu board paylaşılmamış olabilir veya link geçersiz olabilir.
          </p>
          <Button onClick={() => window.location.reload()}>
            Tekrar Dene
          </Button>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-gray-500">Board bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
        <p className="text-sm text-blue-800">
          Bu board sizinle paylaşıldı. Görüntüleme modundasınız.
        </p>
      </div>
      <Board boardId={board.id} />
    </div>
  );
}
