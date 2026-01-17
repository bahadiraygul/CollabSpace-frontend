import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { useBoardStore } from '@/store/board-store';
import { Task, Column } from '@/types';

let stompClient: Client | null = null;
let currentSubscription: StompSubscription | null = null;
let reconnectAttempts = 0;
let currentBoardId: string | null = null;
let currentToken: string | null = null;

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000;

// Connection state management
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
let connectionState: ConnectionState = 'disconnected';
const connectionListeners: Set<(state: ConnectionState) => void> = new Set();

export const getConnectionState = (): ConnectionState => connectionState;

export const onConnectionStateChange = (
  listener: (state: ConnectionState) => void
): (() => void) => {
  connectionListeners.add(listener);
  // Immediately call with current state
  listener(connectionState);
  return () => connectionListeners.delete(listener);
};

const setConnectionState = (state: ConnectionState): void => {
  connectionState = state;
  connectionListeners.forEach((listener) => listener(state));
};

// Exponential backoff for reconnection
const getReconnectDelay = (): number => {
  const delay = Math.min(
    BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
    30000 // Max 30 seconds
  );
  return delay;
};

const attemptReconnect = (): void => {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Max reconnection attempts reached. Please refresh the page.');
    setConnectionState('error');
    return;
  }

  const delay = getReconnectDelay();
  console.log(
    `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`
  );

  setTimeout(() => {
    reconnectAttempts++;
    if (stompClient && !stompClient.active && currentToken && currentBoardId) {
      setConnectionState('connecting');
      stompClient.activate();
    }
  }, delay);
};

export const initializeSocket = (token: string, boardId: string): Client | null => {
  // If already connected to the same board, return existing client
  if (stompClient?.active && currentBoardId === boardId) {
    return stompClient;
  }

  // Disconnect from previous board if connected
  if (stompClient?.active) {
    disconnectSocket();
  }

  currentToken = token;
  currentBoardId = boardId;
  reconnectAttempts = 0;
  setConnectionState('connecting');

  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:8080/ws';

  stompClient = new Client({
    brokerURL: SOCKET_URL,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 0, // We handle reconnection manually with exponential backoff
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  stompClient.onConnect = () => {
    console.log('STOMP connected');
    setConnectionState('connected');
    reconnectAttempts = 0; // Reset reconnect attempts on successful connection

    // Subscribe to board updates
    if (stompClient && currentBoardId) {
      currentSubscription = stompClient.subscribe(
        `/topic/board/${currentBoardId}`,
        (message: IMessage) => {
          try {
            const data = JSON.parse(message.body);
            handleBoardEvent(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        }
      );
    }
  };

  stompClient.onDisconnect = () => {
    console.log('STOMP disconnected');
    setConnectionState('disconnected');
    currentSubscription = null;
  };

  stompClient.onStompError = (frame) => {
    console.error('STOMP error:', frame.headers['message']);
    setConnectionState('error');
    attemptReconnect();
  };

  stompClient.onWebSocketClose = (event) => {
    console.log('WebSocket closed:', event);
    if (connectionState === 'connected') {
      setConnectionState('disconnected');
      attemptReconnect();
    }
  };

  stompClient.onWebSocketError = (event) => {
    console.error('WebSocket error:', event);
    setConnectionState('error');
  };

  stompClient.activate();

  return stompClient;
};

interface BoardEventPayload {
  type: string;
  payload:
    | Task
    | Column
    | { taskId: string }
    | { columnId: string; title?: string }
    | {
        taskId: string;
        sourceColumnId: string;
        targetColumnId: string;
        newIndex: number;
      };
}

const handleBoardEvent = (data: BoardEventPayload): void => {
  const store = useBoardStore.getState();

  switch (data.type) {
    case 'task:created':
      store.addTaskLocal(data.payload as Task);
      break;
    case 'task:updated':
      store.updateTaskLocal((data.payload as Task).id, data.payload as Partial<Task>);
      break;
    case 'task:deleted':
      store.deleteTaskLocal((data.payload as { taskId: string }).taskId);
      break;
    case 'task:moved': {
      const movePayload = data.payload as {
        taskId: string;
        sourceColumnId: string;
        targetColumnId: string;
        newIndex: number;
      };
      store.moveTaskLocal(
        movePayload.taskId,
        movePayload.sourceColumnId,
        movePayload.targetColumnId,
        movePayload.newIndex
      );
      break;
    }
    case 'column:created':
      store.addColumnLocal(data.payload as Column);
      break;
    case 'column:updated': {
      const updatePayload = data.payload as { columnId: string; title: string };
      store.updateColumnLocal(updatePayload.columnId, updatePayload.title);
      break;
    }
    case 'column:deleted':
      store.deleteColumnLocal((data.payload as { columnId: string }).columnId);
      break;
  }
};

export const getSocket = (): Client | null => stompClient;

export const isConnected = (): boolean => connectionState === 'connected';

export const disconnectSocket = (): void => {
  if (currentSubscription) {
    currentSubscription.unsubscribe();
    currentSubscription = null;
  }
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
  currentBoardId = null;
  currentToken = null;
  reconnectAttempts = 0;
  setConnectionState('disconnected');
};

// Emit events via STOMP with connection check
const safePublish = (destination: string, body: string): boolean => {
  if (!stompClient?.active) {
    console.warn('Cannot publish: WebSocket not connected');
    return false;
  }
  stompClient.publish({ destination, body });
  return true;
};

export const emitTaskCreated = (boardId: string, task: Task): boolean => {
  return safePublish(`/app/board/${boardId}/task/create`, JSON.stringify(task));
};

export const emitTaskUpdated = (boardId: string, task: Task): boolean => {
  return safePublish(`/app/board/${boardId}/task/update`, JSON.stringify(task));
};

export const emitTaskDeleted = (boardId: string, taskId: string): boolean => {
  return safePublish(`/app/board/${boardId}/task/delete`, JSON.stringify({ taskId }));
};

export const emitTaskMoved = (
  boardId: string,
  taskId: string,
  sourceColumnId: string,
  targetColumnId: string,
  newIndex: number
): boolean => {
  return safePublish(
    `/app/board/${boardId}/task/move`,
    JSON.stringify({ taskId, sourceColumnId, targetColumnId, newIndex })
  );
};

export const emitColumnCreated = (boardId: string, column: Column): boolean => {
  return safePublish(`/app/board/${boardId}/column/create`, JSON.stringify(column));
};

export const emitColumnUpdated = (boardId: string, columnId: string, title: string): boolean => {
  return safePublish(`/app/board/${boardId}/column/update`, JSON.stringify({ columnId, title }));
};

export const emitColumnDeleted = (boardId: string, columnId: string): boolean => {
  return safePublish(`/app/board/${boardId}/column/delete`, JSON.stringify({ columnId }));
};
