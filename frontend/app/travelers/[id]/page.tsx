'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

function TravelerDetailContent() {
  const params = useParams();
  const travelerId = params.id as string;

  const { data: traveler, isLoading } = useQuery({
    queryKey: ['traveler', travelerId],
    queryFn: () => api.getTraveler(travelerId),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!traveler) return <div>Traveler not found</div>;

  return (
    <DashboardLayout
      title={`${traveler.first_name} ${traveler.last_name}`}
      breadcrumbs={[
        { label: 'Travelers', href: '/travelers' },
        { label: `${traveler.first_name} ${traveler.last_name}` },
      ]}
    >
      <div>
        <h2>Traveler Profile</h2>
        <p>Phone: {traveler.phone || 'N/A'}</p>
        <p>Email: {traveler.email || 'N/A'}</p>
      </div>
    </DashboardLayout>
  );
}

export default function TravelerDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TravelerDetailContent />
    </Suspense>
  );
}

