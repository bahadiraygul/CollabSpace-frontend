'use client';

import { create } from 'zustand';
import { BoardDTO, CreateBoardRequest } from '@/types';
import { boardApi } from '@/lib/board-api';

interface BoardsState {
  boards: BoardDTO[];
  isLoading: boolean;
  error: string | null;

  fetchBoards: () => Promise<void>;
  createBoard: (data: CreateBoardRequest) => Promise<BoardDTO | null>;
  deleteBoard: (id: string) => Promise<void>;
  updateBoard: (id: string, title: string) => Promise<void>;
}

export const useBoardsStore = create<BoardsState>((set, get) => ({
  boards: [],
  isLoading: false,
  error: null,

  fetchBoards: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await boardApi.getAll();
      set({ boards: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Board\'lar yüklenemedi',
        isLoading: false,
      });
    }
  },

  createBoard: async (data: CreateBoardRequest) => {
    try {
      const response = await boardApi.create(data);
      const newBoard = response.data;
      set((state) => ({
        boards: [...state.boards, newBoard],
      }));
      return newBoard;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Board oluşturulamadı',
      });
      throw error;
    }
  },

  deleteBoard: async (id: string) => {
    try {
      await boardApi.delete(id);
      set((state) => ({
        boards: state.boards.filter((board) => board.id !== id),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Board silinemedi',
      });
      throw error;
    }
  },

  updateBoard: async (id: string, title: string) => {
    try {
      const response = await boardApi.update(id, { title });
      set((state) => ({
        boards: state.boards.map((board) =>
          board.id === id ? response.data : board
        ),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Board güncellenemedi',
      });
      throw error;
    }
  },
}));
