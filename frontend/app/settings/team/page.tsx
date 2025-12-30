'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

function TeamSettingsContent() {
  const router = useRouter();

  return (
    <DashboardLayout
      title="Team Members"
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: 'Team' },
      ]}
      backButton={{
        label: 'Back',
        href: '/settings',
      }}
      actions={
        <button className="btn-primary" onClick={() => router.push('/settings/team/invite')}>
          <Plus size={20} />
          Invite Member
        </button>
      }
    >
      <div>
        <p>Team management - to be implemented</p>
      </div>
    </DashboardLayout>
  );
}

export default function TeamSettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeamSettingsContent />
    </Suspense>
  );
}

