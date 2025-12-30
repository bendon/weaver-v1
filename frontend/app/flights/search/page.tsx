'use client';

import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import '@/views/FlightSearchView.css';

const FlightSearchView = dynamic(() => import('@/views/FlightSearchView'), { ssr: false });

export default function FlightSearchPage() {
  return (
    <DashboardLayout title="Flight Search">
      <FlightSearchView />
    </DashboardLayout>
  );
}
