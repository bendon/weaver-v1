'use client';

import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

function TemplatesPageContent() {
  return (
    <DashboardLayout
      title="Message Templates"
      breadcrumbs={[
        { label: 'Automation', href: '/automation' },
        { label: 'Templates' },
      ]}
      backButton={{
        label: 'Back',
        href: '/automation',
      }}
    >
      <div>
        <p>Message templates management - to be implemented</p>
      </div>
    </DashboardLayout>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TemplatesPageContent />
    </Suspense>
  );
}

