// =============================================================================
// AUTHENTICATION CONTEXT
// =============================================================================
// Manages auth state with SecureStore for token persistence.
// Provides login/logout functions and current user state.
// =============================================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { queryClient } from "./query-client";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthContextValue {
  /** Current authenticated user (null if not logged in) */
  user: User | null;
  /** Whether auth state is still loading */
  isLoading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Save auth data after login/register */
  setAuth: (token: string, user: User) => Promise<void>;
  /** Clear auth data on logout */
  clearAuth: () => Promise<void>;
}

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

// -----------------------------------------------------------------------------
// Token Storage Functions
// -----------------------------------------------------------------------------

/**
 * Get stored auth token. Used by tRPC client for auth headers.
 */
export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Store auth token securely.
 */
async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

/**
 * Remove stored auth token.
 */
async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/**
 * Get stored user data.
 */
async function getStoredUser(): Promise<User | null> {
  try {
    const data = await SecureStore.getItemAsync(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Store user data.
 */
async function setStoredUser(user: User): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

/**
 * Remove stored user data.
 */
async function removeStoredUser(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_KEY);
}

// -----------------------------------------------------------------------------
// Provider Component
// -----------------------------------------------------------------------------

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth on mount
  useEffect(() => {
    async function loadAuth() {
      try {
        const [token, storedUser] = await Promise.all([
          getToken(),
          getStoredUser(),
        ]);

        if (token && storedUser) {
          setUser(storedUser);
        }
      } catch (error) {
        console.error("Failed to load auth:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAuth();
  }, []);

  // Save auth data
  const setAuth = useCallback(async (token: string, newUser: User) => {
    await Promise.all([setToken(token), setStoredUser(newUser)]);
    setUser(newUser);
  }, []);

  // Clear auth data
  const clearAuth = useCallback(async () => {
    await Promise.all([removeToken(), removeStoredUser()]);
    setUser(null);
    // Clear all cached queries on logout
    queryClient.clear();
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    setAuth,
    clearAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

/**
 * Hook to access auth context.
 * Must be used within AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

