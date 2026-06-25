'use client';

// Authentication context and provider
// Manages user authentication state across the application

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback, useMemo } from 'react';
import { loginAction, registerAction, logoutAction, getCurrentUser } from '@/app/actions/auth';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export interface User {
    id: string;
    email: string;
    name: string;
    displayName?: string;
    didPublicKey?: string;
    archetypes?: string[];

    changemakeLevel?: string;
    profileType?: string;
    isAdmin?: boolean;
    profilePhoto?: string;
    isEmailVerified: boolean;
    verificationLevel: string;
    uiLanguage?: string;
    cmapLevel?: number | null;
    featureVisibilityPreferences?: Record<string, boolean> | null;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; mfaRequired?: boolean }>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register: (data: any) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser = null
}: Readonly<{
  children: ReactNode,
  initialUser?: User | null
}>) {
  const { t } = useTranslation('common');
  // `t` from react-i18next is NOT guaranteed to keep a stable identity across
  // renders. Depending on it in effects/callbacks below re-armed the mount session
  // check on every render, which storm-fired getCurrentUser → setUser → re-render in
  // a ~19Hz loop. That loop also churned `user` identity, cascading the same storm
  // into NotificationProvider (messages + proximity) and NotificationList. The storm
  // saturated Next's serialized server-action queue and starved unrelated actions
  // (e.g. feed comment creation never reached the server). Read `t` through a ref so
  // none of these effects/callbacks take it as a dependency.
  const tRef = useRef(t);
  tRef.current = t;
  const [user, setUser] = useState<User | null>(initialUser);
    const [isLoading, setIsLoading] = useState(!initialUser);

    const isAuthenticated = !!user;

    // Load/Refresh user once on mount. MUST NOT depend on `t` (see note above).
    useEffect(() => {
        const loadUser = async () => {
            // Even if we have an initialUser, we might want to refresh it
            // to catch any state changes that happened between SSR and mount,
            // or just to verify the session is still valid.
            try {
                const result = await getCurrentUser();
                if (result.success && result.data) {
                    setUser(result.data.user);
                } else {
                    // Server explicitly rejected the session (no/invalid token) - log out.
                    setUser(null);
                }
            } catch (error) {
                // Transient error (network/server) - keep any existing/SSR-provided
                // session instead of silently logging the user out.
                console.warn('[AuthProvider] Session check failed, keeping existing session:', error);
                toast.error(tRef.current('errors.networkError'));
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const result = await loginAction({ email, password });

            // 2FA enabled: the first factor passed but NO access token was issued —
            // only an MFA-challenge cookie. Do NOT set the user or call getCurrentUser
            // (it would fail); signal the caller to route to /verify-2fa.
            if (result.success && result.mfaRequired) {
                return { success: true, mfaRequired: true };
            }

            if (result.success && result.data) {
                const userRes = await getCurrentUser();
                if (userRes.success && userRes.data) {
                    setUser(userRes.data.user);
                } else {
                    setUser(result.data.user as User);
                }
                return { success: true };
            } else {
        return { success: false, error: result.error || tRef.current('errors.loginFailed') };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: tRef.current('errors.networkError') };
    }
  }, []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const register = useCallback(async (data: any) => {
        try {
            const result = await registerAction(data);

            if (result.success) {
                // Fetch full user after register if needed, or use data from action
                // loginAction returns full user, register returns minimal
                // Let's refresh user to be safe
                const userRes = await getCurrentUser();
                if (userRes.success && userRes.data) {
                    setUser(userRes.data.user);
                }
                return { success: true };
            } else {
        return { success: false, error: result.error || tRef.current('errors.registrationFailed') };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: tRef.current('errors.networkError') };
    }
  }, []);

    const logout = useCallback(async () => {
        try {
            await logoutAction();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
        }
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const result = await getCurrentUser();
            if (result.success && result.data) {
                setUser(result.data.user);
            } else {
                // Server explicitly rejected the session (no/invalid token) - log out.
                setUser(null);
            }
        } catch (error) {
            // Transient error (network/server) - keep the current session instead
            // of silently logging the user out.
            console.warn('[AuthProvider] refreshUser failed, keeping current session:', error);
            toast.error(tRef.current('errors.networkError'));
        }
    }, []);

    const contextValue = useMemo(
        () => ({ user, isLoading, isAuthenticated, login, register, logout, refreshUser }),
        [user, isLoading, isAuthenticated, login, register, logout, refreshUser],
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
