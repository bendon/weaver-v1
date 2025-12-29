'use client';

import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

function BillingSettingsContent() {
  return (
    <DashboardLayout
      title="Billing"
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: 'Billing' },
      ]}
    >
      <div>
        <p>Billing settings - to be implemented</p>
      </div>
    </DashboardLayout>
  );
}

export default function BillingSettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BillingSettingsContent />
    </Suspense>
  );
}

