// =============================================================================
// API ROOT PAGE
// =============================================================================
// Simple landing page for the API server.
// Main functionality is via /api/trpc routes.
// =============================================================================

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Smart Session Planner API</h1>
      <p>API server is running. Use /api/trpc for tRPC endpoints.</p>
      <p style={{ color: "#666", marginTop: "1rem" }}>
        Connect your mobile app to this server.
      </p>
    </main>
  );
}

