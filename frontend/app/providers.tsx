'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { BookingFlowProvider } from '@/contexts/BookingFlowContext';
import { APIStatus } from '@/components/APIStatus';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

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
