import { create } from 'zustand';
import Cookies from 'js-cookie';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  
  setAuth: (user, token) => {
    Cookies.set('token', token, { expires: 7 });
    set({ user, token, isLoading: false });
  },
  
  logout: () => {
    Cookies.remove('token');
    set({ user: null, token: null });
    window.location.href = '/login';
  },
  
  checkAuth: () => {
    const token = Cookies.get('token');
    if (token) {
      set({ token, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
}));