'use client';

import dynamic from 'next/dynamic';

const DMCView = dynamic(() => import('@/views/DMCView'), { ssr: false });

export default function DMCPage() {
  return <DMCView />;
}
