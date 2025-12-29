'use client';

import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const DMCView = dynamic(() => import('@/views/DMCView'), { ssr: false });

export default function DMCPage() {
  return (
    <DashboardLayout title="DMC Dashboard">
      <DMCView />
    </DashboardLayout>
  );
}
