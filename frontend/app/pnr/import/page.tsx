'use client';

import dynamic from 'next/dynamic';

const PNRImportView = dynamic(() => import('@/views/PNRImportView'), { ssr: false });

export default function PNRImportPage() {
  return <PNRImportView />;
}
