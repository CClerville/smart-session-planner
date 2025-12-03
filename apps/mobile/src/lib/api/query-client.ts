// =============================================================================
// QUERY CLIENT
// =============================================================================
// Shared QueryClient instance for TanStack Query.
// Extracted to its own file to avoid circular dependencies.
// =============================================================================

import { QueryClient } from "@tanstack/react-query";

// -----------------------------------------------------------------------------
// Query Client
// -----------------------------------------------------------------------------

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed queries once
      retry: 1,
      // Stale time of 30 seconds
      staleTime: 30 * 1000,
      // Refetch on window focus
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Don't retry mutations by default
      retry: false,
    },
  },
});

