'use client';

import dynamic from 'next/dynamic';

const AIBookingAssistantView = dynamic(() => import('@/views/AIBookingAssistantView'), { ssr: false });

export default function AIAssistantPage() {
  return <AIBookingAssistantView />;
}
