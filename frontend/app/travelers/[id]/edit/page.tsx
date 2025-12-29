'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

function TravelerEditContent() {
  const params = useParams();
  const travelerId = params.id as string;

  return (
    <DashboardLayout
      title="Edit Traveler"
      breadcrumbs={[
        { label: 'Travelers', href: '/travelers' },
        { label: travelerId, href: `/travelers/${travelerId}` },
        { label: 'Edit' },
      ]}
    >
      <div>
        <p>Edit traveler form - to be implemented</p>
      </div>
    </DashboardLayout>
  );
}

export default function TravelerEditPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TravelerEditContent />
    </Suspense>
  );
}

