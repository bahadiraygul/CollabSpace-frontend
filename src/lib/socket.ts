import { Client, IMessage } from '@stomp/stompjs';
import { useBoardStore } from '@/store/board-store';
import { Task, Column } from '@/types';

let stompClient: Client | null = null;

export const initializeSocket = (token: string, boardId: string) => {
  if (stompClient?.active) {
    return stompClient;
  }

  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:8080/ws';

  stompClient = new Client({
    brokerURL: SOCKET_URL,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  stompClient.onConnect = () => {
    console.log('STOMP connected');

    // Subscribe to board updates
    stompClient?.subscribe(`/topic/board/${boardId}`, (message: IMessage) => {
      const data = JSON.parse(message.body);
      handleBoardEvent(data);
    });
  };

  stompClient.onDisconnect = () => {
    console.log('STOMP disconnected');
  };

  stompClient.onStompError = (frame) => {
    console.error('STOMP error:', frame.headers['message']);
  };

  stompClient.activate();

  return stompClient;
};

const handleBoardEvent = (data: { type: string; payload: any }) => {
  const store = useBoardStore.getState();

  switch (data.type) {
    case 'task:created':
      store.addTaskLocal(data.payload as Task);
      break;
    case 'task:updated':
      store.updateTaskLocal(data.payload.id, data.payload);
      break;
    case 'task:deleted':
      store.deleteTaskLocal(data.payload.taskId);
      break;
    case 'task:moved':
      store.moveTaskLocal(
        data.payload.taskId,
        data.payload.sourceColumnId,
        data.payload.targetColumnId,
        data.payload.newIndex
      );
      break;
    case 'column:created':
      store.addColumnLocal(data.payload as Column);
      break;
    case 'column:updated':
      store.updateColumnLocal(data.payload.columnId, data.payload.title);
      break;
    case 'column:deleted':
      store.deleteColumnLocal(data.payload.columnId);
      break;
  }
};

export const getSocket = () => stompClient;

export const disconnectSocket = () => {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
};

// Emit events via STOMP
export const emitTaskCreated = (boardId: string, task: Task) => {
  stompClient?.publish({
    destination: `/app/board/${boardId}/task/create`,
    body: JSON.stringify(task),
  });
};

export const emitTaskUpdated = (boardId: string, task: Task) => {
  stompClient?.publish({
    destination: `/app/board/${boardId}/task/update`,
    body: JSON.stringify(task),
  });
};

export const emitTaskDeleted = (boardId: string, taskId: string) => {
  stompClient?.publish({
    destination: `/app/board/${boardId}/task/delete`,
    body: JSON.stringify({ taskId }),
  });
};

export const emitTaskMoved = (
  boardId: string,
  taskId: string,
  sourceColumnId: string,
  targetColumnId: string,
  newIndex: number
) => {
  stompClient?.publish({
    destination: `/app/board/${boardId}/task/move`,
    body: JSON.stringify({ taskId, sourceColumnId, targetColumnId, newIndex }),
  });
};

export const emitColumnCreated = (boardId: string, column: Column) => {
  stompClient?.publish({
    destination: `/app/board/${boardId}/column/create`,
    body: JSON.stringify(column),
  });
};

export const emitColumnUpdated = (boardId: string, columnId: string, title: string) => {
  stompClient?.publish({
    destination: `/app/board/${boardId}/column/update`,
    body: JSON.stringify({ columnId, title }),
  });
};

export const emitColumnDeleted = (boardId: string, columnId: string) => {
  stompClient?.publish({
    destination: `/app/board/${boardId}/column/delete`,
    body: JSON.stringify({ columnId }),
  });
};
