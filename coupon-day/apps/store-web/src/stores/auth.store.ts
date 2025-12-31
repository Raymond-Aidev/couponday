import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, setAccessToken, Store } from '@/lib/api';

interface AuthState {
  isAuthenticated: boolean;
  store: Store | null;
  account: { id: string; ownerName: string; phone: string } | null;
  isLoading: boolean;

  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  setStore: (store: Store) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      store: null,
      account: null,
      isLoading: false,

      login: async (phone: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(phone, password);
          if (response.success) {
            const { accessToken, refreshToken, store, account } = response.data;
            setAccessToken(accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            set({
              isAuthenticated: true,
              store: store as Store,
              account: account as { id: string; ownerName: string; phone: string },
              isLoading: false,
            });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        setAccessToken(null);
        localStorage.removeItem('refreshToken');
        set({
          isAuthenticated: false,
          store: null,
          account: null,
        });
      },

      setStore: (store: Store) => {
        set({ store });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        store: state.store,
        account: state.account,
      }),
    }
  )
);
