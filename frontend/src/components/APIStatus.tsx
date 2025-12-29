'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * API Status Component
 * Shows connection status to backend API
 * Use this to verify API integration is working
 */
export function APIStatus() {
  const [isVisible, setIsVisible] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['api-health'],
    queryFn: async () => {
      const response = await fetch('/api/docs');
      if (!response.ok) throw new Error('API not responding');
      return { status: 'connected', url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000' };
    },
    refetchInterval: 10000, // Check every 10 seconds
    retry: 3,
  });

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '8px 16px',
          backgroundColor: error ? '#ef4444' : isLoading ? '#f59e0b' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          zIndex: 9999,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
      >
        {error ? '🔴 API' : isLoading ? '🟡 API' : '🟢 API'}
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '16px',
        backgroundColor: 'white',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        minWidth: '300px',
        zIndex: 9999,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>API Status</h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            color: '#666',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
        <div style={{ marginBottom: '8px' }}>
          <strong>Status:</strong>{' '}
          <span style={{ color: error ? '#ef4444' : isLoading ? '#f59e0b' : '#10b981' }}>
            {error ? 'Disconnected' : isLoading ? 'Checking...' : 'Connected'}
          </span>
        </div>

        {data && (
          <div style={{ marginBottom: '8px' }}>
            <strong>Backend URL:</strong>
            <br />
            <code style={{ fontSize: '11px', backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>
              {data.url}
            </code>
          </div>
        )}

        {error && (
          <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fef2f2', borderRadius: '6px' }}>
            <strong style={{ color: '#dc2626' }}>Error:</strong>
            <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>
              Cannot reach backend API. Make sure it's running on port 8000.
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px' }}>
              <strong>Quick fix:</strong>
              <pre style={{ fontSize: '10px', backgroundColor: '#f9fafb', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
                cd ../
                {'\n'}uvicorn app.api:app --reload
              </pre>
            </div>
          </div>
        )}

        {data && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <a
              href={`${data.url}/api/docs`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '11px', color: '#2563eb', textDecoration: 'none' }}
            >
              Open API Docs →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
