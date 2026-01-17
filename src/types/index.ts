export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

// Board Types
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

// Board List DTO (for /api/boards endpoint)
export interface BoardDTO {
  id: string;
  title: string;
  description?: string;
  ownerId: number;
  ownerUsername: string;
  isPublic: boolean;
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardRequest {
  title: string;
  description?: string;
}

export interface UpdateBoardRequest {
  title?: string;
  description?: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  labels: Label[];
  assigneeId?: number;
  assigneeUsername?: string;
  dueDate?: string;
  order: number;
  columnId: string;
  commentsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  boardId: string;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  title: string;
  ownerId: number;
  ownerUsername: string;
  columns: Column[];
  isPublic: boolean;
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
}

// API Error Types
export interface ApiErrorResponse {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
  timestamp?: string;
  path?: string;
}

export interface ApiError {
  response?: {
    data?: ApiErrorResponse;
    status?: number;
  };
  message: string;
  code?: string;
}

// Type guard for API errors
export function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'message' in error;
}

// Helper to extract error message from API errors
export function getErrorMessage(error: unknown, fallbackMessage = 'Bir hata oluştu'): string {
  if (isApiError(error)) {
    return error.response?.data?.message || error.message || fallbackMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallbackMessage;
}
