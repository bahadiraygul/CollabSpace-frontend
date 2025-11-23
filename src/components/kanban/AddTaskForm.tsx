'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useBoardStore } from '@/store/board-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Priority } from '@/types';

interface AddTaskFormProps {
  columnId: string;
  onClose: () => void;
}

export function AddTaskForm({ columnId, onClose }: AddTaskFormProps) {
  const { addTask } = useBoardStore();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await addTask(columnId, {
        title: title.trim(),
        description: '',
        priority,
      });
      setTitle('');
      setPriority('MEDIUM');
      onClose();
    } catch {
      // Error handled by store
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
      <form onSubmit={handleSubmit}>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title..."
          className="mb-2"
          autoFocus
        />

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500">Priority:</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Task'}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onClose} disabled={isLoading}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
