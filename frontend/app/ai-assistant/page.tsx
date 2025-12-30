'use client';

import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const AIBookingAssistantView = dynamic(() => import('@/views/AIBookingAssistantView'), { ssr: false });

export default function AIAssistantPage() {
  return (
    <DashboardLayout title="AI Booking Assistant">
      <AIBookingAssistantView />
    </DashboardLayout>
  );
}
