'use client';

import { useParams } from 'next/navigation';
import { Board } from '@/components/kanban/Board';

export default function BoardDetailPage() {
  const params = useParams();
  const boardId = params.id as string;

  return (
    <div className="h-[calc(100vh-4rem)]">
      <Board boardId={boardId} />
    </div>
  );
}
