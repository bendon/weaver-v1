'use client';

import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

function IntegrationsSettingsContent() {
  return (
    <DashboardLayout
      title="Integrations"
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: 'Integrations' },
      ]}
    >
      <div>
        <p>Integrations settings - to be implemented</p>
      </div>
    </DashboardLayout>
  );
}

export default function IntegrationsSettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IntegrationsSettingsContent />
    </Suspense>
  );
}

