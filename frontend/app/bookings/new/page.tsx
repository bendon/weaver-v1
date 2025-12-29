'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to chat with new booking intent
    const intent = searchParams.get('intent') || 'new_booking';
    router.replace(`/chat?intent=${intent}`);
  }, [router, searchParams]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      Redirecting to AI Assistant...
    </div>
  );
}

