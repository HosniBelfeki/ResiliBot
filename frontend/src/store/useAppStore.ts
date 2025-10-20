import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User, Notification } from '@/types';

interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;

  // UI state
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;

  // Notifications state
  notifications: Notification[];

  // Loading states
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        theme: 'light',
        sidebarOpen: false,
        notifications: [],
        isLoading: false,

        // Actions
        setUser: (user) => set({ user, isAuthenticated: !!user }),

        setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),

        toggleTheme: () => {
          const currentTheme = get().theme;
          const newTheme = currentTheme === 'light' ? 'dark' : 'light';
          set({ theme: newTheme });

          // Apply theme to document
          if (typeof window !== 'undefined') {
            const root = window.document.documentElement;
            if (newTheme === 'dark') {
              root.classList.add('dark');
            } else {
              root.classList.remove('dark');
            }
          }
        },

        setTheme: (theme) => {
          set({ theme });

          // Apply theme to document
          if (typeof window !== 'undefined') {
            const root = window.document.documentElement;
            if (theme === 'dark') {
              root.classList.add('dark');
            } else if (theme === 'light') {
              root.classList.remove('dark');
            } else {
              // System theme - check system preference
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (prefersDark) {
                root.classList.add('dark');
              } else {
                root.classList.remove('dark');
              }
            }
          }
        },

        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

        setSidebarOpen: (open) => set({ sidebarOpen: open }),

        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
          };

          set((state) => ({
            notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep only latest 50
          }));
        },

        markNotificationAsRead: (id) => {
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
          }));
        },

        clearNotifications: () => set({ notifications: [] }),

        setLoading: (loading) => set({ isLoading: loading }),
      }),
      {
        name: 'resilibot-storage',
        partialize: (state) => ({
          user: state.user,
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
        }),
      }
    ),
    { name: 'AppStore' }
  )
);