'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

function PublicItineraryContent() {
  const params = useParams();
  const code = params.code as string;

  const { data: itinerary, isLoading } = useQuery({
    queryKey: ['publicItinerary', code],
    queryFn: () => api.getPublicItinerary(code),
  });

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading itinerary...
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Itinerary not found</h2>
        <p>The itinerary you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1>{itinerary.title || 'Travel Itinerary'}</h1>
      <p>Public itinerary view - to be fully implemented</p>
    </div>
  );
}

export default function PublicItineraryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PublicItineraryContent />
    </Suspense>
  );
}

