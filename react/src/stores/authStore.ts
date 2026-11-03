import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../types/auth';

type AuthSession = {
  token: string;
  user: AuthUser;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  tenantId: string | null;
  hydrated: boolean;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  setHydrated: (value: boolean) => void;
  isAuthenticated: () => boolean;
};

function resolveTenantId(user: AuthUser | null): string | null {
  if (user?.tenant_id === null || user?.tenant_id === undefined) {
    return null;
  }

  return String(user.tenant_id);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      tenantId: null,
      hydrated: false,
      setSession: ({ token, user }) => {
        set({
          token,
          user,
          tenantId: resolveTenantId(user),
        });
      },
      clearSession: () => {
        set({
          token: null,
          user: null,
          tenantId: null,
        });
      },
      setHydrated: (value) => {
        set({ hydrated: value });
      },
      isAuthenticated: () => {
        const { token, user } = get();
        return Boolean(token && user);
      },
    }),
    {
      name: 'tracesync-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        tenantId: state.tenantId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
