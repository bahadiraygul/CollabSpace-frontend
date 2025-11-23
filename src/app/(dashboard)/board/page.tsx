'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Board } from '@/components/kanban';
import { Loader2 } from 'lucide-react';
import { boardApi } from '@/lib/board-api';
import { Button } from '@/components/ui/button';

function BoardContent() {
  const searchParams = useSearchParams();
  const boardIdParam = searchParams.get('id');
  const [boardId, setBoardId] = useState<string | null>(boardIdParam);
  const [isLoading, setIsLoading] = useState(!boardIdParam);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardIdParam) {
      // Fetch first board if no ID provided
      const fetchFirstBoard = async () => {
        try {
          const response = await boardApi.getAll();
          if (response.data.length > 0) {
            setBoardId(response.data[0].id);
          } else {
            setError('No boards found. Create a board first.');
          }
        } catch (err: any) {
          setError(err.message || 'Failed to fetch boards');
        } finally {
          setIsLoading(false);
        }
      };
      fetchFirstBoard();
    }
  }, [boardIdParam]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!boardId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No board selected</p>
      </div>
    );
  }

  return <Board boardId={boardId} />;
}

export default function BoardPage() {
  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50">
      <div className="p-6 border-b bg-white">
        <h1 className="text-2xl font-bold text-gray-900">Project Board</h1>
        <p className="text-gray-500 mt-1">Drag and drop tasks between columns to update their status</p>
      </div>
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }>
        <BoardContent />
      </Suspense>
    </div>
  );
}
