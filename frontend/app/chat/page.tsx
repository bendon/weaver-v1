'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const AIBookingAssistantView = dynamic(() => import('@/views/AIBookingAssistantView'), { ssr: false });

function ChatPageContent() {
  const searchParams = useSearchParams();
  const intent = searchParams.get('intent');
  const travelerId = searchParams.get('traveler');

  return <AIBookingAssistantView />;
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}

