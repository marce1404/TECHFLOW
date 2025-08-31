
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This component now acts as a redirect to the main orders page.
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/orders');
  }, [router]);

  return null; // Render nothing while redirecting
}
