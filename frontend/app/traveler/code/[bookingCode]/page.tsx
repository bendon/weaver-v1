import { TravelerViewClient } from '@/components/views/TravelerViewClient';

export default async function TravelerBookingPage({
  params,
}: {
  params: Promise<{ bookingCode: string }>;
}) {
  const { bookingCode } = await params;
  return <TravelerViewClient bookingCode={bookingCode} />;
}
