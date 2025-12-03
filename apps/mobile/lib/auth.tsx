// =============================================================================
// AUTHENTICATION CONTEXT
// =============================================================================
// Manages auth state using React Query's auth.me as source of truth.
// Provides login/logout functions and current user state.
// Uses SecureStore for token persistence and optimistic loading.
// =============================================================================

import { TRPCError } from "@trpc/server";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { queryClient } from "./query-client";
import * as storage from "./storage";
import { getToken } from "./storage";
import { trpc } from "./trpc";

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
// Uses SecureStore for encrypted device storage on mobile platforms.
// -----------------------------------------------------------------------------

/**
 * Store auth token securely.
 */
async function setToken(token: string): Promise<void> {
  await storage.setItem(TOKEN_KEY, token);
}

/**
 * Remove stored auth token.
 */
async function removeToken(): Promise<void> {
  await storage.deleteItem(TOKEN_KEY);
}

/**
 * Get stored user data.
 */
async function getStoredUser(): Promise<User | null> {
  try {
    const data = await storage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Store user data.
 */
async function setStoredUser(user: User): Promise<void> {
  await storage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Remove stored user data.
 */
async function removeStoredUser(): Promise<void> {
  await storage.deleteItem(USER_KEY);
}

// -----------------------------------------------------------------------------
// Provider Component
// -----------------------------------------------------------------------------

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Get tRPC utils for query invalidation
  const utils = trpc.useUtils();

  // Optimistic user state from local storage for instant UI
  const [optimisticUser, setOptimisticUser] = useState<User | null>(null);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  // Check if token exists in storage to enable the query
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  // Load optimistic state from storage on mount
  useEffect(() => {
    async function loadOptimisticState() {
      try {
        const [token, storedUser] = await Promise.all([
          getToken(),
          getStoredUser(),
        ]);

        // Enable query if token exists (storedUser is optional for query enablement)
        if (token) {
          // Load optimistic state if available, but don't require it
          if (storedUser) {
            setOptimisticUser(storedUser);
          }
          setHasToken(true);
        } else {
          setHasToken(false);
        }
      } catch (error) {
        console.error("Failed to load optimistic auth state:", error);
        // On error, default to no token
        setHasToken(false);
      } finally {
        setHasCheckedStorage(true);
      }
    }

    loadOptimisticState();
  }, []);

  // Use React Query's auth.me as the source of truth
  // Only enabled when we've checked storage and found a token
  const {
    data: serverUser,
    isLoading: isQueryLoading,
    error: queryError,
  } = trpc.auth.me.useQuery(undefined, {
    enabled: hasCheckedStorage && hasToken === true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes - persists across hot reloads (was cacheTime in v4)
    refetchOnMount: false, // Use cached data on hot reload
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on UNAUTHORIZED errors (expired/invalid token)
      if (error instanceof TRPCError && error.code === "UNAUTHORIZED") {
        return false;
      }
      // Retry network errors once (keeps optimistic state if retry fails)
      return failureCount < 1;
    },
  });

  // Handle successful server response - sync to local storage
  useEffect(() => {
    if (serverUser) {
      // Sync server response to local storage
      setStoredUser({
        id: serverUser.id,
        email: serverUser.email,
        name: serverUser.name,
      }).catch((err) => {
        console.error("Failed to sync user to storage:", err);
      });
      setOptimisticUser({
        id: serverUser.id,
        email: serverUser.email,
        name: serverUser.name,
      });
    }
  }, [serverUser]);

  // Handle query errors - UNAUTHORIZED means expired/invalid token
  useEffect(() => {
    if (queryError instanceof TRPCError && queryError.code === "UNAUTHORIZED") {
      // Clear storage and optimistic state
      Promise.all([removeToken(), removeStoredUser()]).catch((err) => {
        console.error("Failed to clear auth storage:", err);
      });
      setOptimisticUser(null);
      setHasToken(false);
      // Remove auth.me from cache using tRPC utils
      utils.auth.me.setData(undefined, undefined);
    }
    // Network errors: Keep optimistic state from storage
    // User can continue using app offline, query will retry on next mount
  }, [queryError, utils]);

  // Determine the actual user (server response takes precedence)
  const user = serverUser
    ? {
        id: serverUser.id,
        email: serverUser.email,
        name: serverUser.name,
      }
    : optimisticUser;

  // Loading state: still checking storage OR query is loading
  const isLoading = !hasCheckedStorage || (hasToken === true && isQueryLoading);

  // Save auth data after login/register
  const setAuth = useCallback(
    async (token: string, newUser: User) => {
      // Store token and user in local storage
      await Promise.all([setToken(token), setStoredUser(newUser)]);
      setOptimisticUser(newUser);
      setHasToken(true);

      // Invalidate auth.me query to trigger refetch with new token
      await utils.auth.me.invalidate();
    },
    [utils]
  );

  // Clear auth data on logout
  const clearAuth = useCallback(async () => {
    // Clear local storage
    await Promise.all([removeToken(), removeStoredUser()]);
    setOptimisticUser(null);
    setHasToken(false);

    // Remove auth.me from cache using tRPC utils
    utils.auth.me.setData(undefined, undefined);

    // Clear all other cached queries on logout
    queryClient.clear();
  }, [utils]);

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
