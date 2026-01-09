'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, LayoutGrid, Trash2, Calendar, User } from 'lucide-react';
import { useBoardsStore } from '@/store/boards-store';
import { Button } from '@/components/ui/button';
import { CreateBoardModal } from '@/components/board/CreateBoardModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function BoardsPage() {
  const router = useRouter();
  const { boards, isLoading, error, fetchBoards, deleteBoard } = useBoardsStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleBoardClick = (boardId: string) => {
    router.push(`/board/${boardId}`);
  };

  const handleDeleteBoard = async (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    if (!confirm('Bu board\'u silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    setDeletingId(boardId);
    try {
      await deleteBoard(boardId);
      toast.success('Board silindi');
    } catch {
      toast.error('Board silinemedi');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateSuccess = (boardId: string) => {
    router.push(`/board/${boardId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading && boards.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && boards.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => fetchBoards()}>Tekrar Dene</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Board'larım</h1>
          <p className="text-gray-500 mt-1">
            Tüm Kanban board'larınızı buradan yönetin
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Board
        </Button>
      </div>

      {/* Boards Grid */}
      {boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <LayoutGrid className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Henüz board yok
          </h3>
          <p className="text-gray-500 text-center mb-6 max-w-md">
            İlk board'unuzu oluşturarak görevlerinizi organize etmeye başlayın.
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            İlk Board'umu Oluştur
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boards.map((board) => (
            <div
              key={board.id}
              onClick={() => handleBoardClick(board.id)}
              className={cn(
                'group relative bg-white rounded-lg border border-gray-200 p-5 cursor-pointer',
                'hover:shadow-lg hover:border-blue-300 transition-all duration-200',
                'min-h-[140px] flex flex-col'
              )}
            >
              {/* Delete Button */}
              <button
                onClick={(e) => handleDeleteBoard(e, board.id)}
                disabled={deletingId === board.id}
                className={cn(
                  'absolute top-3 right-3 p-1.5 rounded-md',
                  'opacity-0 group-hover:opacity-100 transition-opacity',
                  'text-gray-400 hover:text-red-500 hover:bg-red-50',
                  deletingId === board.id && 'opacity-100'
                )}
              >
                {deletingId === board.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>

              {/* Board Icon */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-3">
                <LayoutGrid className="h-5 w-5 text-white" />
              </div>

              {/* Title */}
              <h3 className="font-semibold text-gray-900 mb-1 pr-8 line-clamp-1">
                {board.title}
              </h3>

              {/* Description */}
              {board.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2 flex-1">
                  {board.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-4 mt-auto pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <User className="h-3 w-3" />
                  {board.ownerUsername}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="h-3 w-3" />
                  {formatDate(board.createdAt)}
                </span>
              </div>

              {/* Share Badge */}
              {board.isPublic && (
                <div className="absolute bottom-3 right-3">
                  <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                    Paylaşıldı
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Create New Board Card */}
          <div
            onClick={() => setIsCreateModalOpen(true)}
            className={cn(
              'bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-5 cursor-pointer',
              'hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200',
              'min-h-[140px] flex flex-col items-center justify-center'
            )}
          >
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
              <Plus className="h-5 w-5 text-gray-500" />
            </div>
            <span className="text-sm font-medium text-gray-600">
              Yeni Board Ekle
            </span>
          </div>
        </div>
      )}

      {/* Create Board Modal */}
      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
