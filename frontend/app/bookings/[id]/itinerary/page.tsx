'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

function BookingItineraryContent() {
  const params = useParams();
  const bookingId = params.id as string;

  return (
    <DashboardLayout
      title="Itinerary Editor"
      breadcrumbs={[
        { label: 'Bookings', href: '/bookings' },
        { label: bookingId, href: `/bookings/${bookingId}` },
        { label: 'Itinerary' },
      ]}
    >
      <div>
        <p>Full itinerary editor - to be implemented</p>
      </div>
    </DashboardLayout>
  );
}

export default function BookingItineraryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingItineraryContent />
    </Suspense>
  );
}

