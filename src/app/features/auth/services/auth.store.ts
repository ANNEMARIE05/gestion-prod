import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';

export interface AuthState {
  token: string | null;
  userInfos: any | null;
  setToken: (token: string | null) => void;
  setUserInfos: (userInfos: any | null) => void;
  clearAuth: () => void;
}

export const authStore = createStore<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userInfos: null,
      setToken: (token) => set({ token }),
      setUserInfos: (userInfos) => set({ userInfos }),
      clearAuth: () => set({ token: null, userInfos: null }),
    }),
    {
      name: 'auth-storage', // Nom de la clé dans le localStorage
    }
  )
);
