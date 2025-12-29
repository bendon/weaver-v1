'use client';

import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import dynamic from 'next/dynamic';

const MessageCenter = dynamic(() => import('@/components/messages/MessageCenter'), { ssr: false });

function MessagesPageContent() {
  return (
    <DashboardLayout title="Messages">
      <MessageCenter />
    </DashboardLayout>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MessagesPageContent />
    </Suspense>
  );
}

