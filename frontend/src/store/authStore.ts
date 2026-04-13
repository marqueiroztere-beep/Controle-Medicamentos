import { create } from 'zustand';
import type { User } from '../types';

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

const STORAGE_KEY_TOKEN = 'medcontrol_token';
const STORAGE_KEY_USER  = 'medcontrol_user';

function loadFromStorage(): { user: User | null; token: string | null } {
  try {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const raw   = localStorage.getItem(STORAGE_KEY_USER);
    const user  = raw ? JSON.parse(raw) as User : null;
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
}

const { user, token } = loadFromStorage();

export const useAuthStore = create<AuthStore>((set, get) => ({
  user,
  token,

  setAuth(user, token) {
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    set({ user, token });
  },

  clearAuth() {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    set({ user: null, token: null });
  },

  isAuthenticated() {
    return !!get().token;
  },
}));
