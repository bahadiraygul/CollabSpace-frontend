import { create } from 'zustand';
import { Board, Task, Label } from '@/types';
import { boardApi, columnApi, taskApi, labelApi, CreateTaskRequest, UpdateTaskRequest } from '@/lib/board-api';

interface BoardState {
  board: Board | null;
  labels: Label[];
  isLoading: boolean;
  error: string | null;
  selectedTask: Task | null;
  isTaskModalOpen: boolean;

  // Board actions
  fetchBoard: (boardId: string) => Promise<void>;
  setBoard: (board: Board) => void;

  // Task actions
  addTask: (columnId: string, task: CreateTaskRequest) => Promise<void>;
  updateTask: (taskId: string, updates: UpdateTaskRequest) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, sourceColumnId: string, targetColumnId: string, newIndex: number) => Promise<void>;

  // Column actions
  addColumn: (title: string) => Promise<void>;
  updateColumn: (columnId: string, title: string) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;

  // Label actions
  fetchLabels: () => Promise<void>;

  // Local state updates (for optimistic updates and WebSocket)
  moveTaskLocal: (taskId: string, sourceColumnId: string, targetColumnId: string, newIndex: number) => void;

  // Modal actions
  setSelectedTask: (task: Task | null) => void;
  openTaskModal: (task: Task) => void;
  closeTaskModal: () => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  board: null,
  labels: [],
  isLoading: false,
  error: null,
  selectedTask: null,
  isTaskModalOpen: false,

  fetchBoard: async (boardId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await boardApi.getById(boardId);
      set({ board: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || error.message || 'Failed to fetch board', isLoading: false });
    }
  },

  setBoard: (board: Board) => set({ board }),

  fetchLabels: async () => {
    try {
      const response = await labelApi.getAll();
      set({ labels: response.data });
    } catch (error: any) {
      console.error('Failed to fetch labels:', error);
    }
  },

  addTask: async (columnId, taskData) => {
    try {
      const response = await taskApi.create(columnId, taskData);
      const newTask = response.data;

      set((state) => {
        if (!state.board) return state;
        return {
          board: {
            ...state.board,
            columns: state.board.columns.map((col) =>
              col.id === columnId
                ? { ...col, tasks: [...col.tasks, newTask] }
                : col
            ),
          },
        };
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || error.message || 'Failed to add task' });
      throw error;
    }
  },

  updateTask: async (taskId, updates) => {
    try {
      const response = await taskApi.update(taskId, updates);
      const updatedTask = response.data;

      set((state) => {
        if (!state.board) return state;
        return {
          board: {
            ...state.board,
            columns: state.board.columns.map((col) => ({
              ...col,
              tasks: col.tasks.map((task) =>
                task.id === taskId ? updatedTask : task
              ),
            })),
          },
          selectedTask:
            state.selectedTask?.id === taskId ? updatedTask : state.selectedTask,
        };
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || error.message || 'Failed to update task' });
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    try {
      await taskApi.delete(taskId);

      set((state) => {
        if (!state.board) return state;
        return {
          board: {
            ...state.board,
            columns: state.board.columns.map((col) => ({
              ...col,
              tasks: col.tasks.filter((task) => task.id !== taskId),
            })),
          },
          selectedTask: state.selectedTask?.id === taskId ? null : state.selectedTask,
          isTaskModalOpen: state.selectedTask?.id === taskId ? false : state.isTaskModalOpen,
        };
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || error.message || 'Failed to delete task' });
      throw error;
    }
  },

  moveTask: async (taskId, sourceColumnId, targetColumnId, newIndex) => {
    // Optimistic update
    get().moveTaskLocal(taskId, sourceColumnId, targetColumnId, newIndex);

    try {
      await taskApi.move(taskId, { targetColumnId, newIndex });
    } catch (error: any) {
      // Revert on error - refetch board
      const boardId = get().board?.id;
      if (boardId) {
        get().fetchBoard(boardId);
      }
      set({ error: error.response?.data?.message || error.message || 'Failed to move task' });
      throw error;
    }
  },

  addColumn: async (title) => {
    const boardId = get().board?.id;
    if (!boardId) return;

    try {
      const response = await columnApi.create(boardId, { title });
      const newColumn = { ...response.data, tasks: [] };

      set((state) => {
        if (!state.board) return state;
        return {
          board: {
            ...state.board,
            columns: [...state.board.columns, newColumn],
          },
        };
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || error.message || 'Failed to add column' });
      throw error;
    }
  },

  updateColumn: async (columnId, title) => {
    try {
      await columnApi.update(columnId, title);

      set((state) => {
        if (!state.board) return state;
        return {
          board: {
            ...state.board,
            columns: state.board.columns.map((col) =>
              col.id === columnId ? { ...col, title } : col
            ),
          },
        };
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || error.message || 'Failed to update column' });
      throw error;
    }
  },

  deleteColumn: async (columnId) => {
    try {
      await columnApi.delete(columnId);

      set((state) => {
        if (!state.board) return state;
        return {
          board: {
            ...state.board,
            columns: state.board.columns
              .filter((col) => col.id !== columnId)
              .map((col, index) => ({ ...col, position: index })),
          },
        };
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || error.message || 'Failed to delete column' });
      throw error;
    }
  },

  moveTaskLocal: (taskId: string, sourceColumnId: string, targetColumnId: string, newIndex: number) => {
    set((state) => {
      if (!state.board) return state;

      let movedTask: Task | null = null;

      // Find and remove task from source column
      const newColumns = state.board.columns.map((col) => {
        if (col.id === sourceColumnId) {
          const taskIndex = col.tasks.findIndex((t) => t.id === taskId);
          if (taskIndex !== -1) {
            movedTask = col.tasks[taskIndex];
            return {
              ...col,
              tasks: col.tasks.filter((t) => t.id !== taskId),
            };
          }
        }
        return col;
      });

      if (!movedTask) return state;

      // Add task to target column
      const finalColumns = newColumns.map((col) => {
        if (col.id === targetColumnId) {
          const newTasks = [...col.tasks];
          newTasks.splice(newIndex, 0, { ...movedTask!, position: newIndex });
          return {
            ...col,
            tasks: newTasks,
          };
        }
        return col;
      });

      return {
        board: {
          ...state.board,
          columns: finalColumns,
        },
      };
    });
  },

  setSelectedTask: (task) => set({ selectedTask: task }),
  openTaskModal: (task) => set({ selectedTask: task, isTaskModalOpen: true }),
  closeTaskModal: () => set({ isTaskModalOpen: false, selectedTask: null }),
}));
