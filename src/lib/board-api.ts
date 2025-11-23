import { api } from './api';
import { Board, Column, Task, Label, Priority } from '@/types';

// Board APIs
export const boardApi = {
  getAll: () => api.get<Board[]>('/api/boards'),

  getById: (id: string) => api.get<Board>(`/api/boards/${id}`),

  create: (title: string) => api.post<Board>('/api/boards', { title }),

  update: (id: string, title: string) => api.put<Board>(`/api/boards/${id}`, { title }),

  delete: (id: string) => api.delete(`/api/boards/${id}`),
};

// Column APIs
export interface CreateColumnRequest {
  title: string;
  order: number;
}

export interface ReorderColumnsRequest {
  boardId: string;
  columnIds: string[];
}

export const columnApi = {
  create: (boardId: string, data: CreateColumnRequest) =>
    api.post<Column>(`/api/boards/${boardId}/columns`, data),

  update: (id: string, title: string) =>
    api.put<Column>(`/api/columns/${id}`, { title }),

  delete: (id: string) => api.delete(`/api/columns/${id}`),

  reorder: (data: ReorderColumnsRequest) =>
    api.put('/api/columns/reorder', data),
};

// Task APIs
export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string;
  assigneeId?: number;
  labelIds?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  assigneeId?: number;
  labelIds?: string[];
}

export interface MoveTaskRequest {
  targetColumnId: string;
  newOrder: number;
}

export const taskApi = {
  create: (columnId: string, data: CreateTaskRequest) =>
    api.post<Task>(`/api/columns/${columnId}/tasks`, data),

  update: (id: string, data: UpdateTaskRequest) =>
    api.put<Task>(`/api/tasks/${id}`, data),

  delete: (id: string) => api.delete(`/api/tasks/${id}`),

  move: (id: string, data: MoveTaskRequest) =>
    api.put<Task>(`/api/tasks/${id}/move`, data),
};

// Label APIs
export interface CreateLabelRequest {
  name: string;
  color: string;
}

export const labelApi = {
  getAll: () => api.get<Label[]>('/api/labels'),

  create: (data: CreateLabelRequest) => api.post<Label>('/api/labels', data),
};
