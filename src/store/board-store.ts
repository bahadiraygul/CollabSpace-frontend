import { create } from 'zustand';
import { Board, Task, Label, Column, getErrorMessage } from '@/types';
import {
  boardApi,
  columnApi,
  taskApi,
  labelApi,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '@/lib/board-api';

interface BoardState {
  board: Board | null;
  labels: Label[];
  isLoading: boolean;
  error: string | null;
  selectedTask: Task | null;
  isTaskModalOpen: boolean;

  // Board actions
  fetchBoard: (boardId: string) => Promise<void>;
  fetchBoardByShareToken: (token: string) => Promise<void>;
  setBoard: (board: Board) => void;
  generateShareLink: () => Promise<void>;
  disableSharing: () => Promise<void>;

  // Task actions
  addTask: (columnId: string, task: CreateTaskRequest) => Promise<void>;
  updateTask: (taskId: string, updates: UpdateTaskRequest) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (
    taskId: string,
    sourceColumnId: string,
    targetColumnId: string,
    newIndex: number
  ) => Promise<void>;

  // Column actions
  addColumn: (title: string) => Promise<void>;
  updateColumn: (columnId: string, title: string) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;

  // Label actions
  fetchLabels: () => Promise<void>;

  // Local state updates (for optimistic updates and WebSocket)
  addTaskLocal: (task: Task) => void;
  updateTaskLocal: (taskId: string, updates: Partial<Task>) => void;
  deleteTaskLocal: (taskId: string) => void;
  moveTaskLocal: (
    taskId: string,
    sourceColumnId: string,
    targetColumnId: string,
    newIndex: number
  ) => void;
  addColumnLocal: (column: Column) => void;
  updateColumnLocal: (columnId: string, title: string) => void;
  deleteColumnLocal: (columnId: string) => void;

  // Modal actions
  setSelectedTask: (task: Task | null) => void;
  openTaskModal: (task: Task) => void;
  closeTaskModal: () => void;
  clearError: () => void;
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
      const board = response.data;
      // Ensure columns is always an array
      if (!Array.isArray(board.columns)) {
        board.columns = [];
      }
      set({ board, isLoading: false });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Board yüklenemedi'), isLoading: false });
    }
  },

  fetchBoardByShareToken: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await boardApi.getByShareToken(token);
      const board = response.data;
      // Ensure columns is always an array
      if (!Array.isArray(board.columns)) {
        board.columns = [];
      }
      set({ board, isLoading: false });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Paylaşılan board yüklenemedi'), isLoading: false });
    }
  },

  setBoard: (board: Board) => set({ board }),

  generateShareLink: async () => {
    const boardId = get().board?.id;
    if (!boardId) return;

    try {
      const response = await boardApi.generateShareToken(boardId);
      set({ board: response.data });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Paylaşım linki oluşturulamadı') });
      throw error;
    }
  },

  disableSharing: async () => {
    const boardId = get().board?.id;
    if (!boardId) return;

    try {
      const response = await boardApi.disableSharing(boardId);
      set({ board: response.data });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Paylaşım devre dışı bırakılamadı') });
      throw error;
    }
  },

  fetchLabels: async () => {
    try {
      const response = await labelApi.getAll();
      set({ labels: response.data });
    } catch (error: unknown) {
      console.error('Etiketler yüklenemedi:', error);
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
              col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
            ),
          },
        };
      });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Görev eklenemedi') });
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
              tasks: col.tasks.map((task) => (task.id === taskId ? updatedTask : task)),
            })),
          },
          selectedTask: state.selectedTask?.id === taskId ? updatedTask : state.selectedTask,
        };
      });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Görev güncellenemedi') });
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
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Görev silinemedi') });
      throw error;
    }
  },

  moveTask: async (taskId, sourceColumnId, targetColumnId, newIndex) => {
    // Optimistic update
    get().moveTaskLocal(taskId, sourceColumnId, targetColumnId, newIndex);

    try {
      await taskApi.move(taskId, { targetColumnId, newIndex });
    } catch (error: unknown) {
      console.error('Görev taşıma hatası:', error);
      // Revert on error - refetch board
      const boardId = get().board?.id;
      if (boardId) {
        get().fetchBoard(boardId);
      }
      set({ error: getErrorMessage(error, 'Görev taşınamadı') });
      throw error;
    }
  },

  addColumn: async (title) => {
    const boardId = get().board?.id;
    if (!boardId) return;

    try {
      const currentColumns = get().board?.columns || [];
      const order = currentColumns.length;
      const response = await columnApi.create(boardId, { title, order });
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
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Sütun eklenemedi') });
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
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Sütun güncellenemedi') });
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
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Sütun silinemedi') });
      throw error;
    }
  },

  moveTaskLocal: (
    taskId: string,
    sourceColumnId: string,
    targetColumnId: string,
    newIndex: number
  ) => {
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
          newTasks.splice(newIndex, 0, movedTask!);
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

  addTaskLocal: (task: Task) => {
    set((state) => {
      if (!state.board) return state;

      // Find the column that contains this task based on task's columnId or add to first column
      const columnId = task.columnId || state.board.columns[0]?.id;
      if (!columnId) return state;

      return {
        board: {
          ...state.board,
          columns: state.board.columns.map((col) =>
            col.id === columnId ? { ...col, tasks: [...col.tasks, task] } : col
          ),
        },
      };
    });
  },

  updateTaskLocal: (taskId: string, updates: Partial<Task>) => {
    set((state) => {
      if (!state.board) return state;

      return {
        board: {
          ...state.board,
          columns: state.board.columns.map((col) => ({
            ...col,
            tasks: col.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
          })),
        },
        selectedTask:
          state.selectedTask?.id === taskId
            ? { ...state.selectedTask, ...updates }
            : state.selectedTask,
      };
    });
  },

  deleteTaskLocal: (taskId: string) => {
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
  },

  addColumnLocal: (column: Column) => {
    set((state) => {
      if (!state.board) return state;

      return {
        board: {
          ...state.board,
          columns: [...state.board.columns, { ...column, tasks: column.tasks || [] }],
        },
      };
    });
  },

  updateColumnLocal: (columnId: string, title: string) => {
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
  },

  deleteColumnLocal: (columnId: string) => {
    set((state) => {
      if (!state.board) return state;

      return {
        board: {
          ...state.board,
          columns: state.board.columns.filter((col) => col.id !== columnId),
        },
      };
    });
  },

  setSelectedTask: (task) => set({ selectedTask: task }),
  openTaskModal: (task) => set({ selectedTask: task, isTaskModalOpen: true }),
  closeTaskModal: () => set({ isTaskModalOpen: false, selectedTask: null }),
  clearError: () => set({ error: null }),
}));
