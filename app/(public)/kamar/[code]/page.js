import { notFound } from 'next/navigation';
import { getRooms, getPublicOcc } from '@/lib/data';
import { computeStatus, todayWIB } from '@/lib/avail';
import RoomBooking from '@/components/RoomBooking';

export default async function KamarPage({ params }) {
  const code = params.code.toUpperCase();
  const [rooms, occ] = await Promise.all([getRooms(), getPublicOcc()]);
  const room = rooms.find((r) => r.code === code);
  if (!room) notFound();
  return <RoomBooking room={room} status={computeStatus(code, occ, todayWIB())} wa={process.env.NEXT_PUBLIC_OWNER_WA || ''} />;
}
