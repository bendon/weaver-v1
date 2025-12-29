import { TravelerViewClient } from '@/components/views/TravelerViewClient';

export default async function TravelerDetailPage({
  params,
}: {
  params: Promise<{ itineraryId: string }>;
}) {
  const { itineraryId } = await params;
  return <TravelerViewClient itineraryId={itineraryId} />;
}
