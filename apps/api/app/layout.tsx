// =============================================================================
// ROOT LAYOUT - API Server
// =============================================================================
// Minimal layout for the API server. No UI needed - just API routes.
// =============================================================================

export const metadata = {
  title: "Smart Session Planner API",
  description: "Backend API for the Smart Session Planner application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
