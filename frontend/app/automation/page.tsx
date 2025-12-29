'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Settings } from 'lucide-react';

function AutomationPageContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['automationRules'],
    queryFn: () => api.getAutomationRules(),
  });

  const rules = data?.rules || [];

  return (
    <DashboardLayout
      title="Automation"
      breadcrumbs={[{ label: 'Automation' }]}
    >
      <div>
        <div style={{ marginBottom: '2rem' }}>
          <h2>Automation Rules</h2>
          <p>Configure automated messages for your bookings</p>
        </div>
        {isLoading ? (
          <div>Loading rules...</div>
        ) : (
          <div>
            {rules.map((rule: any) => (
              <div key={rule.id} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                <h3>{rule.name || rule.rule_name}</h3>
                <p>{rule.description || 'No description'}</p>
                <label>
                  <input type="checkbox" checked={rule.enabled} readOnly />
                  Enabled
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function AutomationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AutomationPageContent />
    </Suspense>
  );
}

