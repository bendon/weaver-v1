'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

function AutomationRuleEditContent() {
  const params = useParams();
  const ruleId = params.ruleId as string;

  return (
    <DashboardLayout
      title="Edit Automation Rule"
      breadcrumbs={[
        { label: 'Automation', href: '/automation' },
        { label: ruleId },
      ]}
    >
      <div>
        <p>Edit automation rule {ruleId} - to be implemented</p>
      </div>
    </DashboardLayout>
  );
}

export default function AutomationRuleEditPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AutomationRuleEditContent />
    </Suspense>
  );
}

