import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { TaskCard } from './TaskCard';
import type { Task } from '@/types';

// Mock dnd-kit
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => null,
    },
  },
}));

// Mock board store
const mockOpenTaskModal = vi.fn();
vi.mock('@/store/board-store', () => ({
  useBoardStore: () => ({
    openTaskModal: mockOpenTaskModal,
  }),
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

describe('TaskCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render task title', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('should render task priority', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('should render HIGH priority with red color', () => {
    const highPriorityTask: Task = { ...mockTask, priority: 'HIGH' };
    render(<TaskCard task={highPriorityTask} />);

    const priorityBadge = screen.getByText('HIGH');
    expect(priorityBadge).toHaveClass('bg-red-100', 'text-red-700');
  });

  it('should render LOW priority with green color', () => {
    const lowPriorityTask: Task = { ...mockTask, priority: 'LOW' };
    render(<TaskCard task={lowPriorityTask} />);

    const priorityBadge = screen.getByText('LOW');
    expect(priorityBadge).toHaveClass('bg-green-100', 'text-green-700');
  });

  it('should render labels when present', () => {
    const taskWithLabels: Task = {
      ...mockTask,
      labels: [
        { id: 'label-1', name: 'Bug', color: '#ff0000' },
        { id: 'label-2', name: 'Feature', color: '#00ff00' },
      ],
    };
    render(<TaskCard task={taskWithLabels} />);

    expect(screen.getByText('Bug')).toBeInTheDocument();
    expect(screen.getByText('Feature')).toBeInTheDocument();
  });

  it('should render due date when present', () => {
    const taskWithDueDate: Task = {
      ...mockTask,
      dueDate: '2024-12-25T00:00:00Z',
    };
    render(<TaskCard task={taskWithDueDate} />);

    // Check that a date is rendered (format depends on locale)
    expect(screen.getByText(/25/)).toBeInTheDocument();
  });

  it('should render assignee username when present', () => {
    const taskWithAssignee: Task = {
      ...mockTask,
      assigneeId: 1,
      assigneeUsername: 'johndoe',
    };
    render(<TaskCard task={taskWithAssignee} />);

    expect(screen.getByText('johndoe')).toBeInTheDocument();
  });

  it('should render assignee avatar with first letter', () => {
    const taskWithAssignee: Task = {
      ...mockTask,
      assigneeId: 1,
      assigneeUsername: 'johndoe',
    };
    render(<TaskCard task={taskWithAssignee} />);

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('should call openTaskModal when clicked', async () => {
    const { user } = render(<TaskCard task={mockTask} />);

    const card = screen.getByText('Test Task').closest('div[class*="bg-white"]');
    if (card) {
      await user.click(card);
      expect(mockOpenTaskModal).toHaveBeenCalledWith(mockTask);
    }
  });

  it('should not render labels section when no labels', () => {
    render(<TaskCard task={mockTask} />);

    // The labels section should not exist
    const labelsContainer = screen.queryByRole('list');
    expect(labelsContainer).not.toBeInTheDocument();
  });

  it('should not render due date when not present', () => {
    render(<TaskCard task={mockTask} />);

    // Calendar icon should not be present
    const calendarElements = document.querySelectorAll('.lucide-calendar');
    expect(calendarElements.length).toBe(0);
  });
});
