'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const AIBookingAssistantView = dynamic(() => import('@/views/AIBookingAssistantView'), { ssr: false });

function ConversationPageContent() {
  const params = useParams();
  const conversationId = params.conversationId as string;

  return <AIBookingAssistantView conversationId={conversationId} />;
}

export default function ConversationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConversationPageContent />
    </Suspense>
  );
}

