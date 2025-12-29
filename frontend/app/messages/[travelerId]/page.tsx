'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

function MessageThreadContent() {
  const params = useParams();
  const travelerId = params.travelerId as string;

  return (
    <DashboardLayout
      title="Conversation"
      breadcrumbs={[
        { label: 'Messages', href: '/messages' },
        { label: travelerId },
      ]}
    >
      <div>
        <p>Message thread with traveler {travelerId} - to be implemented</p>
      </div>
    </DashboardLayout>
  );
}

export default function MessageThreadPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MessageThreadContent />
    </Suspense>
  );
}

