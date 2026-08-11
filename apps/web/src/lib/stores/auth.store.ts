import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserProfile } from '@gms/types';
import Cookies from 'js-cookie';

/** Cookie options — secure in production, strict same-site always. */
const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 1, // 1 day
  path: '/',
  sameSite: 'strict',
  ...(typeof window !== 'undefined' && window.location.protocol === 'https:' ? { secure: true } : {}),
};

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserProfile, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        // Set cookie for middleware access (not httpOnly since middleware reads it client-side)
        Cookies.set('auth_token', accessToken, COOKIE_OPTIONS);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      setTokens: (accessToken, refreshToken) => {
        Cookies.set('auth_token', accessToken, COOKIE_OPTIONS);
        set({ accessToken, refreshToken });
      },

      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),

      logout: () => {
        Cookies.remove('auth_token', { path: '/' });
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'gms-auth-storage',
      // Only persist user profile and auth flag — NOT raw tokens.
      // Tokens stay in memory (zustand state) + cookie only.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration from localStorage, restore accessToken from cookie
        if (state?.isAuthenticated) {
          const cookieToken = Cookies.get('auth_token');
          if (cookieToken) {
            state.accessToken = cookieToken;
          } else {
            // Cookie expired or was cleared — force logout
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
          }
        }
      },
    }
  )
);
