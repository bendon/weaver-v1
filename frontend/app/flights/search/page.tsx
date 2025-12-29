'use client';

import dynamic from 'next/dynamic';

const FlightSearchView = dynamic(() => import('@/views/FlightSearchView'), { ssr: false });

export default function FlightSearchPage() {
  return <FlightSearchView />;
}
