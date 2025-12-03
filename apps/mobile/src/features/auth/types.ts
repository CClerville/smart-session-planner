// =============================================================================
// AUTH TYPES
// =============================================================================
// Type definitions for authentication feature
// =============================================================================

export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthContextValue {
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

