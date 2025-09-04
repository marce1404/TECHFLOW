
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This component now acts as a redirect to the dashboard page.
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return null; // Render nothing while redirecting
}
