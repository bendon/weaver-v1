'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { BookingFlowProvider } from '@/contexts/BookingFlowContext';
import { APIStatus } from '@/components/APIStatus';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
              // Don't retry on authentication errors
              if (
                error?.message?.toLowerCase().includes('session') ||
                error?.message?.toLowerCase().includes('expired') ||
                error?.message?.toLowerCase().includes('authentication')
              ) {
                return false;
              }
              return failureCount < 1;
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
          },
          mutations: {
            retry: false, // Don't retry mutations on error
          },
        },
      })
  );

  // Fix CSS hot reload in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      // Force CSS reload on HMR updates
      const reloadCSS = () => {
        const links = document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]');
        links.forEach((link) => {
          const href = link.href;
          if (href && !href.includes('fonts.googleapis.com')) {
            // Remove existing _hmr parameter if present
            const url = new URL(href);
            url.searchParams.delete('_hmr');
            // Add new cache-busting parameter
            url.searchParams.set('_hmr', Date.now().toString());
            link.href = url.toString();
          }
        });
      };

      // Listen for Next.js HMR events via custom event
      const handleHMR = () => {
        // Small delay to ensure CSS files are updated
        setTimeout(reloadCSS, 50);
      };

      // Listen for Next.js HMR custom events
      window.addEventListener('next-hmr', handleHMR);
      
      // Also reload CSS when the page becomes visible (after HMR)
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          setTimeout(reloadCSS, 100);
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Periodic check for CSS updates (fallback)
      const checkInterval = setInterval(() => {
        // Check if any stylesheet links have been updated
        const links = document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]');
        links.forEach((link) => {
          if (link.href && !link.href.includes('fonts.googleapis.com') && !link.href.includes('_hmr=')) {
            // CSS file without cache-busting, might need reload
            reloadCSS();
          }
        });
      }, 1000);

      return () => {
        window.removeEventListener('next-hmr', handleHMR);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearInterval(checkInterval);
      };
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BookingFlowProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                },
                success: {
                  iconTheme: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--bg-primary)',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: 'var(--bg-primary)',
                  },
                  duration: 5000,
                },
              }}
            />
            {/* Show API status indicator in development */}
            {process.env.NODE_ENV === 'development' && <APIStatus />}
          </BookingFlowProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
