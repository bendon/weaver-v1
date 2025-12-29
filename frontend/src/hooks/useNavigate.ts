'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Compatibility hook that mimics react-router-dom's useNavigate
 * for easier migration to Next.js
 */
export function useNavigate() {
  const router = useRouter();

  return useCallback(
    (to: string | number, options?: { replace?: boolean }) => {
      if (typeof to === 'number') {
        // Handle back/forward navigation
        if (to === -1) {
          router.back();
        } else if (to === 1) {
          router.forward();
        }
      } else {
        // Handle path navigation
        if (options?.replace) {
          router.replace(to);
        } else {
          router.push(to);
        }
      }
    },
    [router]
  );
}
