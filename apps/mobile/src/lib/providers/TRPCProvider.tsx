// =============================================================================
// tRPC PROVIDER
// =============================================================================
// Wraps the app with tRPC and QueryClient providers.
// =============================================================================

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { queryClient, trpc } from "../api";
import { createTRPCClient } from "../api/trpc";

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

