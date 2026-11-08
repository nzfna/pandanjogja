
import OwnerShell from '@/components/OwnerShell';

import { getRooms } from '@/lib/data';
import { todayWIB, fmtLong } from '@/lib/avail';

export const dynamic = 'force-dynamic';

export default async function OwnerLayout({ children }) {
  const rooms = await getRooms();

  const roomList = rooms.map((room) => ({
    code: room.code,
    name: room.name,
  }));

  const dateLabel = fmtLong(todayWIB());

  return (
    <OwnerShell
      dateLabel={dateLabel}
      rooms={roomList}
    >
      {children}
    </OwnerShell>
  );
}
