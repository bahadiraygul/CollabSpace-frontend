'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, GripVertical } from 'lucide-react';
import { Task } from '@/types';
import { cn } from '@/lib/utils';
import { useBoardStore } from '@/store/board-store';

interface TaskCardProps {
  task: Task;
}

const priorityColors = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700',
};

export function TaskCard({ task }: TaskCardProps) {
  const { openTaskModal } = useBoardStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer',
        isDragging && 'opacity-50 shadow-lg'
      )}
      onClick={() => openTaskModal(task)}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1 min-w-0">
          {/* Labels */}
          {task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {task.labels.map((label) => (
                <span
                  key={label.id}
                  className="px-2 py-0.5 text-xs rounded-full text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h4 className="text-sm font-medium text-gray-900 mb-2">{task.title}</h4>

          {/* Meta info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Priority */}
              <span
                className={cn(
                  'px-2 py-0.5 text-xs rounded font-medium',
                  priorityColors[task.priority]
                )}
              >
                {task.priority}
              </span>

              {/* Due date */}
              {task.dueDate && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.dueDate)}
                </span>
              )}

              {/* Assignee username */}
              {task.assigneeUsername && (
                <span className="text-xs text-gray-500">
                  {task.assigneeUsername}
                </span>
              )}
            </div>

            {/* Assignee avatar */}
            {task.assigneeUsername && (
              <div
                className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                title={task.assigneeUsername}
              >
                {task.assigneeUsername[0].toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
