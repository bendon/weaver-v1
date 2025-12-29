'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

function FlightDetailContent() {
  const params = useParams();
  const flightId = params.flightId as string;

  const { data: flight, isLoading } = useQuery({
    queryKey: ['flight', flightId],
    queryFn: () => api.getFlight(flightId),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!flight) return <div>Flight not found</div>;

  return (
    <DashboardLayout
      title={`Flight ${flight.carrier_code || ''}${flight.flight_number || ''}`}
      breadcrumbs={[
        { label: 'Flights', href: '/flights' },
        { label: `${flight.carrier_code || ''}${flight.flight_number || ''}` },
      ]}
    >
      <div>
        <h2>Flight Details</h2>
        <p>Status: {flight.status || 'Unknown'}</p>
      </div>
    </DashboardLayout>
  );
}

export default function FlightDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FlightDetailContent />
    </Suspense>
  );
}

