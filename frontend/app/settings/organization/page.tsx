'use client';

import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

function OrganizationSettingsContent() {
  return (
    <DashboardLayout
      title="Organization Settings"
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: 'Organization' },
      ]}
      backButton={{
        label: 'Back',
        href: '/settings',
      }}
    >
      <div>
        <p>Organization settings - to be implemented</p>
      </div>
    </DashboardLayout>
  );
}

export default function OrganizationSettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrganizationSettingsContent />
    </Suspense>
  );
}

