// =============================================================================
// AUTH HOOK
// =============================================================================

import { AuthContext } from "@/lib/providers/AuthProvider";
import { useContext } from "react";
import type { AuthContextValue } from "../types";

export type { AuthContextValue, User } from "../types";

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

