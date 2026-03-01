import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@repo/types';

interface AuthState {
    user: User | null;
    token: string | null;
    login: (user: User, token: string) => void;
    logout: () => void;
    updateUser: (data: Partial<User>) => void;
    isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            login: (user, token) => set({ user, token, isAuthenticated: true }),
            logout: () => set({ user: null, token: null, isAuthenticated: false }),
            updateUser: (data) => set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
        }),
        {
            name: 'ecommerce-auth',
        }
    )
);
