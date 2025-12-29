'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DMCPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard since DMCView is discontinued
    router.replace('/');
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div>Redirecting to dashboard...</div>
    </div>
  );
}
