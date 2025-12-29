'use client';

import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const PNRImportView = dynamic(() => import('@/views/PNRImportView'), { ssr: false });

export default function PNRImportPage() {
  return (
    <DashboardLayout title="PNR Import">
      <PNRImportView />
    </DashboardLayout>
  );
}
