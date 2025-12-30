'use client';

import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

function InviteMemberContent() {
  return (
    <DashboardLayout
      title="Invite Team Member"
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: 'Team', href: '/settings/team' },
        { label: 'Invite' },
      ]}
      backButton={{
        label: 'Back',
        href: '/settings/team',
      }}
    >
      <div>
        <p>Invite team member form - to be implemented</p>
      </div>
    </DashboardLayout>
  );
}

export default function InviteMemberPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InviteMemberContent />
    </Suspense>
  );
}

