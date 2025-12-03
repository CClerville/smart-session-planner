// =============================================================================
// tRPC CLIENT SETUP
// =============================================================================
// Configures tRPC client with TanStack Query for the mobile app.
// Includes auth token injection and error handling.
// =============================================================================

import type { AppRouter } from "@repo/api";
import { QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import superjson from "superjson";
import { queryClient } from "./query-client";
import { getToken } from "./storage";

// -----------------------------------------------------------------------------
// tRPC React Hooks
// -----------------------------------------------------------------------------

export const trpc = createTRPCReact<AppRouter>();

// Re-export queryClient for convenience
export { queryClient };

// -----------------------------------------------------------------------------
// tRPC Client
// -----------------------------------------------------------------------------

/**
 * Creates the tRPC client with the API URL.
 * Call this after determining the API URL from environment.
 *
 * Uses Authorization header with token from SecureStore for authentication.
 */
export function createTRPCClient(apiUrl: string) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${apiUrl}/api/trpc`,
        // Use superjson for date serialization
        transformer: superjson,
        // Inject auth token into requests via Authorization header
        async headers() {
          const token = await getToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}

// -----------------------------------------------------------------------------
// Provider Component
// -----------------------------------------------------------------------------

interface TRPCProviderProps {
  children: React.ReactNode;
  apiUrl: string;
}

/**
 * Wraps the app with tRPC and QueryClient providers.
 */
export function TRPCProvider({ children, apiUrl }: TRPCProviderProps) {
  const [trpcClient] = useState(() => createTRPCClient(apiUrl));

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
