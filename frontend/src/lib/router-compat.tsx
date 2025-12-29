'use client';

import { useRouter as useNextRouter, useParams as useNextParams, useSearchParams as useNextSearchParams, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

/**
 * Compatibility layer for react-router-dom to work with Next.js App Router
 */

export function useNavigate() {
  const router = useNextRouter();

  return useCallback(
    (to: string | number, options?: { replace?: boolean; state?: any }) => {
      if (typeof to === 'number') {
        if (to === -1) {
          router.back();
        } else if (to === 1) {
          router.forward();
        }
      } else {
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

export function useParams<T = any>(): Partial<T> {
  const params = useNextParams();
  return (params || {}) as Partial<T>;
}

export function useSearchParams() {
  const searchParams = useNextSearchParams();
  const router = useNextRouter();
  const pathname = usePathname();

  const setSearchParams = useCallback(
    (newParams: Record<string, string> | ((prev: URLSearchParams) => URLSearchParams)) => {
      const current = new URLSearchParams(searchParams?.toString());
      const updated = typeof newParams === 'function' ? newParams(current) : new URLSearchParams(newParams);
      router.push(`${pathname}?${updated.toString()}`);
    },
    [searchParams, router, pathname]
  );

  return [searchParams, setSearchParams] as const;
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useNextSearchParams();

  return useMemo(
    () => ({
      pathname: pathname || '',
      search: searchParams ? `?${searchParams.toString()}` : '',
      hash: '',
      state: null,
      key: 'default',
    }),
    [pathname, searchParams]
  );
}

// BrowserRouter is not needed in Next.js, but we provide a no-op for compatibility
export function BrowserRouter({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// Routes and Route components for compatibility (mostly unused in Next.js App Router)
export function Routes({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Route({ element }: { path?: string; element?: ReactNode }) {
  return <>{element}</>;
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const router = useNextRouter();

  if (replace) {
    router.replace(to);
  } else {
    router.push(to);
  }

  return null;
}
