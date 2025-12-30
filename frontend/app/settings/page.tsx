'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Users, Plug, CreditCard } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

function SettingsPageContent() {
  const router = useRouter();

  const settingsSections = [
    { id: 'organization', label: 'Organization', icon: Building2, href: '/settings/organization' },
    { id: 'team', label: 'Team Members', icon: Users, href: '/settings/team' },
    { id: 'integrations', label: 'Integrations', icon: Plug, href: '/settings/integrations' },
    { id: 'billing', label: 'Billing', icon: CreditCard, href: '/settings/billing' },
  ];

  return (
    <DashboardLayout
      title="Settings"
      breadcrumbs={[{ label: 'Settings' }]}
    >
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.75rem', cursor: 'pointer' }}
                onClick={() => router.push(section.href)}
              >
                <Icon size={32} style={{ marginBottom: '1rem' }} />
                <h3>{section.label}</h3>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsPageContent />
    </Suspense>
  );
}

