'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/lib/error-emitter';

// This is a client-side component that should be placed high in the component tree.
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: Error) => {
      // The Next.js development overlay will pick up this uncaught error and display it.
      // We throw it in a timeout to break out of the current React render cycle.
      setTimeout(() => {
        throw error;
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null; // This component does not render anything.
}
