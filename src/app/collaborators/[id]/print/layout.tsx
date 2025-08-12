
'use client';

// This layout is intentionally minimal. It provides the necessary structure
// for the print page to render correctly as a standalone page, solving
// potential hydration and data fetching issues.
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
