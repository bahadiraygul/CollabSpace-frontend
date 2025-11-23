'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Calendar, Tag, Loader2 } from 'lucide-react';
import { useBoardStore } from '@/store/board-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Priority } from '@/types';
import { cn } from '@/lib/utils';

const priorityColors = {
  LOW: 'bg-green-100 text-green-700 border-green-300',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  HIGH: 'bg-red-100 text-red-700 border-red-300',
};

export function TaskModal() {
  const { selectedTask, isTaskModalOpen, closeTaskModal, updateTask, deleteTask } = useBoardStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setDescription(selectedTask.description || '');
      setPriority(selectedTask.priority);
      setDueDate(selectedTask.dueDate || '');
    }
  }, [selectedTask]);

  if (!isTaskModalOpen || !selectedTask) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTask(selectedTask.id, {
        title,
        description,
        priority,
        dueDate: dueDate || undefined,
      });
      closeTaskModal();
    } catch {
      // Error handled by store
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      setIsDeleting(true);
      try {
        await deleteTask(selectedTask.id);
      } catch {
        // Error handled by store
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Edit Task</h2>
          <Button variant="ghost" size="sm" onClick={closeTaskModal}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full min-h-24 px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a description..."
            />
          </div>

          {/* Priority */}
          <div>
            <Label>Priority</Label>
            <div className="flex gap-2 mt-1">
              {(['LOW', 'MEDIUM', 'HIGH'] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    'px-3 py-1 text-sm rounded border',
                    priority === p
                      ? priorityColors[p]
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  )}
                >
                  {p.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="dueDate" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Due Date
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Labels */}
          {selectedTask.labels.length > 0 && (
            <div>
              <Label className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                Labels
              </Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedTask.labels.map((label) => (
                  <span
                    key={label.id}
                    className="px-2 py-1 text-xs rounded-full text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Assignee */}
          {selectedTask.assigneeUsername && (
            <div>
              <Label>Assignee</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                  {selectedTask.assigneeUsername[0].toUpperCase()}
                </div>
                <span className="text-sm text-gray-700">
                  {selectedTask.assigneeUsername}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting || isSaving}>
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={closeTaskModal} disabled={isSaving || isDeleting}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isDeleting}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
