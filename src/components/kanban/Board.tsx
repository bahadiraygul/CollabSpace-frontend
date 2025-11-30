'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core';
import { Plus, Loader2 } from 'lucide-react';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { AddTaskForm } from './AddTaskForm';
import { TaskModal } from './TaskModal';
import { ShareButton } from './ShareButton';
import { useBoardStore } from '@/store/board-store';
import { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BoardProps {
  boardId: string;
}

export function Board({ boardId }: BoardProps) {
  const { board, isLoading, error, moveTask, addColumn, fetchBoard, fetchLabels } = useBoardStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [addingTaskToColumn, setAddingTaskToColumn] = useState<string | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  useEffect(() => {
    fetchBoard(boardId);
    fetchLabels();
  }, [boardId, fetchBoard, fetchLabels]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (!board || !board.columns) return;
    const { active } = event;
    const taskId = active.id as string;

    // Find task in columns
    for (const column of board.columns) {
      const task = column.tasks.find((t) => t.id === taskId);
      if (task) {
        setActiveTask(task);
        break;
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!board || !board.columns) return;
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active task and its column
    let activeTask: Task | null = null;
    let sourceColumnId: string | null = null;

    for (const column of board.columns) {
      const task = column.tasks.find((t) => t.id === activeId);
      if (task) {
        activeTask = task;
        sourceColumnId = column.id;
        break;
      }
    }

    if (!activeTask || !sourceColumnId) return;

    // Find target column
    let overColumnId: string | null = null;

    const overColumn = board.columns.find((col) => col.id === overId);
    if (overColumn) {
      overColumnId = overColumn.id;
    } else {
      // Check if over a task
      for (const column of board.columns) {
        const task = column.tasks.find((t) => t.id === overId);
        if (task) {
          overColumnId = column.id;
          break;
        }
      }
    }

    if (!overColumnId || sourceColumnId === overColumnId) return;

    const targetColumn = board.columns.find((col) => col.id === overColumnId);
    if (targetColumn) {
      const overTaskIndex = targetColumn.tasks.findIndex((t) => t.id === overId);
      const newIndex = overTaskIndex >= 0 ? overTaskIndex : targetColumn.tasks.length;
      moveTask(activeId, sourceColumnId, overColumnId, newIndex);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!board || !board.columns) return;
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Find the active task and its column
    let sourceColumnId: string | null = null;

    for (const column of board.columns) {
      const task = column.tasks.find((t) => t.id === activeId);
      if (task) {
        sourceColumnId = column.id;
        break;
      }
    }

    if (!sourceColumnId) return;

    const column = board.columns.find((col) => col.id === sourceColumnId);
    if (!column) return;

    const oldIndex = column.tasks.findIndex((t) => t.id === activeId);
    const newIndex = column.tasks.findIndex((t) => t.id === overId);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      moveTask(activeId, column.id, column.id, newIndex);
    }
  };

  const handleAddColumn = async () => {
    if (newColumnTitle.trim()) {
      await addColumn(newColumnTitle.trim());
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

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
          <p className="text-red-500 mb-2">{error}</p>
          <Button onClick={() => fetchBoard(boardId)}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Board not found</p>
      </div>
    );
  }

  // Ensure columns is an array
  const columns = Array.isArray(board.columns) ? board.columns : [];

  if (!Array.isArray(board.columns)) {
    console.error('Board columns is not an array:', board);
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with board title and share button */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h1 className="text-2xl font-bold">{board.title}</h1>
        <ShareButton />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 p-6 overflow-x-auto flex-1">
          {columns.map((column) => (
            <div key={column.id}>
              {addingTaskToColumn === column.id ? (
                <div className="w-72 min-w-72">
                  <Column
                    column={column}
                    tasks={column.tasks}
                    onAddTask={() => setAddingTaskToColumn(column.id)}
                  />
                  <div className="mt-2">
                    <AddTaskForm
                      columnId={column.id}
                      onClose={() => setAddingTaskToColumn(null)}
                    />
                  </div>
                </div>
              ) : (
                <Column
                  column={column}
                  tasks={column.tasks}
                  onAddTask={() => setAddingTaskToColumn(column.id)}
                />
              )}
            </div>
          ))}

          {/* Add Column Button */}
          <div className="w-72 min-w-72">
            {isAddingColumn ? (
              <div className="bg-gray-100 rounded-lg p-3">
                <Input
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  placeholder="Enter column title..."
                  className="mb-2"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddColumn();
                    if (e.key === 'Escape') {
                      setIsAddingColumn(false);
                      setNewColumnTitle('');
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddColumn}>
                    Add Column
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingColumn(false);
                      setNewColumnTitle('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start text-gray-500 hover:text-gray-700 h-12"
                onClick={() => setIsAddingColumn(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add another column
              </Button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskModal />
    </div>
  );
}
