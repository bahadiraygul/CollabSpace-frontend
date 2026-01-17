import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBoardStore } from './board-store';
import type { Board, Task, Column } from '@/types';

// Mock the API modules
vi.mock('@/lib/board-api', () => ({
  boardApi: {
    getById: vi.fn(),
    getByShareToken: vi.fn(),
    generateShareToken: vi.fn(),
    disableSharing: vi.fn(),
  },
  columnApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  taskApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    move: vi.fn(),
  },
  labelApi: {
    getAll: vi.fn(),
  },
}));

const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'Test description',
  priority: 'MEDIUM',
  labels: [],
  order: 0,
  columnId: 'col-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockColumn: Column = {
  id: 'col-1',
  title: 'To Do',
  order: 0,
  boardId: 'board-1',
  tasks: [mockTask],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockBoard: Board = {
  id: 'board-1',
  title: 'Test Board',
  ownerId: 1,
  ownerUsername: 'testuser',
  columns: [mockColumn],
  isPublic: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('board-store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useBoardStore.setState({
      board: null,
      labels: [],
      isLoading: false,
      error: null,
      selectedTask: null,
      isTaskModalOpen: false,
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have null board by default', () => {
      const state = useBoardStore.getState();
      expect(state.board).toBeNull();
    });

    it('should have empty labels by default', () => {
      const state = useBoardStore.getState();
      expect(state.labels).toEqual([]);
    });

    it('should not be loading by default', () => {
      const state = useBoardStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('should have no error by default', () => {
      const state = useBoardStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('setBoard', () => {
    it('should set the board', () => {
      const { setBoard } = useBoardStore.getState();
      setBoard(mockBoard);

      const state = useBoardStore.getState();
      expect(state.board).toEqual(mockBoard);
    });
  });

  describe('local task operations', () => {
    beforeEach(() => {
      useBoardStore.setState({ board: mockBoard });
    });

    describe('addTaskLocal', () => {
      it('should add a task to the correct column', () => {
        const newTask: Task = {
          ...mockTask,
          id: 'task-2',
          title: 'New Task',
        };

        const { addTaskLocal } = useBoardStore.getState();
        addTaskLocal(newTask);

        const state = useBoardStore.getState();
        const column = state.board?.columns.find((c) => c.id === 'col-1');
        expect(column?.tasks).toHaveLength(2);
        expect(column?.tasks[1]).toEqual(newTask);
      });
    });

    describe('updateTaskLocal', () => {
      it('should update a task in the board', () => {
        const { updateTaskLocal } = useBoardStore.getState();
        updateTaskLocal('task-1', { title: 'Updated Title' });

        const state = useBoardStore.getState();
        const column = state.board?.columns.find((c) => c.id === 'col-1');
        const task = column?.tasks.find((t) => t.id === 'task-1');
        expect(task?.title).toBe('Updated Title');
      });

      it('should update selectedTask if it matches', () => {
        useBoardStore.setState({ selectedTask: mockTask });

        const { updateTaskLocal } = useBoardStore.getState();
        updateTaskLocal('task-1', { title: 'Updated Title' });

        const state = useBoardStore.getState();
        expect(state.selectedTask?.title).toBe('Updated Title');
      });
    });

    describe('deleteTaskLocal', () => {
      it('should remove a task from the board', () => {
        const { deleteTaskLocal } = useBoardStore.getState();
        deleteTaskLocal('task-1');

        const state = useBoardStore.getState();
        const column = state.board?.columns.find((c) => c.id === 'col-1');
        expect(column?.tasks).toHaveLength(0);
      });

      it('should clear selectedTask and close modal if deleted task was selected', () => {
        useBoardStore.setState({
          selectedTask: mockTask,
          isTaskModalOpen: true,
        });

        const { deleteTaskLocal } = useBoardStore.getState();
        deleteTaskLocal('task-1');

        const state = useBoardStore.getState();
        expect(state.selectedTask).toBeNull();
        expect(state.isTaskModalOpen).toBe(false);
      });
    });

    describe('moveTaskLocal', () => {
      it('should move a task within the same column', () => {
        // Add another task to test reordering
        const secondTask: Task = {
          ...mockTask,
          id: 'task-2',
          title: 'Second Task',
          order: 1,
        };

        useBoardStore.setState({
          board: {
            ...mockBoard,
            columns: [
              {
                ...mockColumn,
                tasks: [mockTask, secondTask],
              },
            ],
          },
        });

        const { moveTaskLocal } = useBoardStore.getState();
        moveTaskLocal('task-2', 'col-1', 'col-1', 0);

        const state = useBoardStore.getState();
        const column = state.board?.columns.find((c) => c.id === 'col-1');
        expect(column?.tasks[0].id).toBe('task-2');
        expect(column?.tasks[1].id).toBe('task-1');
      });

      it('should move a task to a different column', () => {
        const secondColumn: Column = {
          ...mockColumn,
          id: 'col-2',
          title: 'Done',
          tasks: [],
        };

        useBoardStore.setState({
          board: {
            ...mockBoard,
            columns: [mockColumn, secondColumn],
          },
        });

        const { moveTaskLocal } = useBoardStore.getState();
        moveTaskLocal('task-1', 'col-1', 'col-2', 0);

        const state = useBoardStore.getState();
        const sourceColumn = state.board?.columns.find((c) => c.id === 'col-1');
        const targetColumn = state.board?.columns.find((c) => c.id === 'col-2');
        expect(sourceColumn?.tasks).toHaveLength(0);
        expect(targetColumn?.tasks).toHaveLength(1);
        expect(targetColumn?.tasks[0].id).toBe('task-1');
      });
    });
  });

  describe('local column operations', () => {
    beforeEach(() => {
      useBoardStore.setState({ board: mockBoard });
    });

    describe('addColumnLocal', () => {
      it('should add a column to the board', () => {
        const newColumn: Column = {
          ...mockColumn,
          id: 'col-2',
          title: 'In Progress',
          tasks: [],
        };

        const { addColumnLocal } = useBoardStore.getState();
        addColumnLocal(newColumn);

        const state = useBoardStore.getState();
        expect(state.board?.columns).toHaveLength(2);
        expect(state.board?.columns[1].id).toBe('col-2');
      });
    });

    describe('updateColumnLocal', () => {
      it('should update a column title', () => {
        const { updateColumnLocal } = useBoardStore.getState();
        updateColumnLocal('col-1', 'Updated Title');

        const state = useBoardStore.getState();
        const column = state.board?.columns.find((c) => c.id === 'col-1');
        expect(column?.title).toBe('Updated Title');
      });
    });

    describe('deleteColumnLocal', () => {
      it('should remove a column from the board', () => {
        const { deleteColumnLocal } = useBoardStore.getState();
        deleteColumnLocal('col-1');

        const state = useBoardStore.getState();
        expect(state.board?.columns).toHaveLength(0);
      });
    });
  });

  describe('modal operations', () => {
    it('should open task modal with selected task', () => {
      const { openTaskModal } = useBoardStore.getState();
      openTaskModal(mockTask);

      const state = useBoardStore.getState();
      expect(state.isTaskModalOpen).toBe(true);
      expect(state.selectedTask).toEqual(mockTask);
    });

    it('should close task modal and clear selected task', () => {
      useBoardStore.setState({
        selectedTask: mockTask,
        isTaskModalOpen: true,
      });

      const { closeTaskModal } = useBoardStore.getState();
      closeTaskModal();

      const state = useBoardStore.getState();
      expect(state.isTaskModalOpen).toBe(false);
      expect(state.selectedTask).toBeNull();
    });

    it('should set selected task', () => {
      const { setSelectedTask } = useBoardStore.getState();
      setSelectedTask(mockTask);

      const state = useBoardStore.getState();
      expect(state.selectedTask).toEqual(mockTask);
    });
  });
});
