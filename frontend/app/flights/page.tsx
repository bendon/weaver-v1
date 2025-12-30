'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Plane } from 'lucide-react';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

function FlightsPageContent() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['flightsToMonitor'],
    queryFn: () => api.getFlightsToMonitor(),
    refetchInterval: 300000, // 5 minutes
  });

  const flights = data?.flights || [];

  return (
    <DashboardLayout
      title="Flight Monitor"
      actions={
        <button className="btn-secondary" onClick={() => refetch()}>
          <RefreshCw size={20} />
          Refresh All
        </button>
      }
    >
      <div>
        {isLoading ? (
          <div>Loading flights...</div>
        ) : flights.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <Plane size={48} style={{ color: '#9ca3af', margin: '0 auto 1rem' }} />
            <p>No flights to monitor</p>
          </div>
        ) : (
          <div>
            {flights.map((flight: any) => (
              <div key={flight.id || flight.flight_id} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                <h3>{flight.carrier_code}{flight.flight_number}</h3>
                <p>Status: {flight.status || 'Unknown'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function FlightsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FlightsPageContent />
    </Suspense>
  );
}

