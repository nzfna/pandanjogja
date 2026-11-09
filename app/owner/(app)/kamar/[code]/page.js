import { notFound } from 'next/navigation';
import { getRooms, getTenancies, getWaitlist } from '@/lib/data';
import { analyze } from '@/lib/analysis';
import { todayWIB } from '@/lib/avail';
import RoomOwner from '@/components/RoomOwner';

export default async function OwnerRoom({ params }) {
  const { code: rawCode } = await params;
  const code = String(rawCode || '').toUpperCase();
  const rooms = await getRooms();
  const room = rooms.find((r) => r.code === code);
  if (!room) notFound();
  const [tenancies, waitlist] = await Promise.all([getTenancies(code), getWaitlist(code)]);
  const analysis = analyze(tenancies, waitlist.length, todayWIB());
  return <RoomOwner room={room} tenancies={tenancies} waitlist={waitlist} analysis={analysis} />;
}
