
import Link from 'next/link';
import {
  Home,
  CalendarDays,
  Users,
  User,
  ChevronRight,
} from 'lucide-react';

import {
  getRooms,
  getTenancies,
  getWaitlist,
} from '@/lib/data';

import { todayWIB, fmtShort } from '@/lib/avail';
import { PAY, TYPE_PILL } from '@/lib/ui';

import {
  TenantTable,
  WaitTable,
  AddTenantButton,
} from '@/components/TenantTable';

import RoomPhoto from '@/components/RoomPhoto';
import SectionHead from '@/components/SectionHead';

function RoomCard({ room, current, next, survey }) {
  const payment = PAY[current ? current.payment_status : 'none'];
  const [paymentLabel, paymentClass] = payment;

  const tenant = current || next || survey;

  const roomStatus = current
    ? {
        label: `Terisi (${current.period_type})`,
        className: TYPE_PILL[current.period_type],
      }
    : next
      ? {
          label: 'Booking',
          className: 'bg-rose-100 text-rose-700',
        }
      : survey
        ? {
            label: 'Survei',
            className: 'bg-sky-100 text-sky-700',
          }
        : {
            label: 'Kosong',
            className: 'bg-stone-100 text-stone-700',
          };

  const dateLabel = current
    ? current.check_out
      ? `${fmtShort(current.check_in)} – ${fmtShort(current.check_out)}`
      : `Sejak ${fmtShort(current.check_in)}`
    : next
      ? `${fmtShort(next.check_in)} – ${fmtShort(next.check_out)}`
      : survey
        ? fmtShort(survey.survey_date)
        : null;

  return (
    <Link
      href={`/owner/kamar/${room.code}`}
      className="
        group flex h-36 min-w-0 overflow-hidden
        rounded-2xl border border-pandan-100
        bg-white shadow-card
        transition-all duration-200
        hover:-translate-y-0.5
        hover:border-pandan-500
        hover:shadow-md
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-pandan-500
      "
    >
      <RoomPhoto
        url={room.photo_url}
        className="h-full w-24 shrink-0"
      />

      <div className="flex min-w-0 flex-1 items-center gap-1.5 p-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="
                flex h-8 w-8 shrink-0 items-center justify-center
                rounded-lg bg-pandan-100
                text-lg font-extrabold text-pandan-900
              "
            >
              {room.code}
            </span>

            <span className={`badge ${roomStatus.className}`}>
              {roomStatus.label}
            </span>
          </div>

          {current && (
            <span className={`badge ${paymentClass}`}>
              {paymentLabel}
            </span>
          )}

          <p className="flex min-w-0 items-center gap-1.5 text-xs text-pandan-800">
            <User
              size={13}
              className="shrink-0 text-pandan-500"
            />

            <span className="truncate">
              {tenant?.tenant_name || 'Belum ada penyewa'}
            </span>
          </p>

          {dateLabel && (
            <p className="flex min-w-0 items-center gap-1.5 text-xs text-pandan-700">
              <CalendarDays
                size={13}
                className="shrink-0 text-pandan-500"
              />

              <span className="truncate">
                {dateLabel}
              </span>
            </p>
          )}
        </div>

        <ChevronRight
          size={17}
          className="
            shrink-0 text-pandan-400
            transition-transform
            group-hover:translate-x-0.5
            group-hover:text-pandan-700
          "
        />
      </div>
    </Link>
  );
}

export default async function Dashboard() {
  const [rooms, tenancies, waitlist] = await Promise.all([
    getRooms(),
    getTenancies(),
    getWaitlist(),
  ]);

  const today = todayWIB();

  const cards = rooms.map((room) => {
    const mine = tenancies.filter(
      (item) => item.room_code === room.code
    );

    const active = mine.filter((item) =>
      ['aktif', 'booking'].includes(item.status)
    );

    const current = active.find((item) =>
      item.period_type === 'harian'
        ? item.check_in &&
          item.check_out &&
          item.check_in <= today &&
          item.check_out >= today
        : !item.check_out || item.check_out >= today
    );

    const next = current
      ? null
      : active
          .filter(
            (item) =>
              item.period_type === 'harian' &&
              item.check_in > today
          )
          .sort((a, b) =>
            a.check_in.localeCompare(b.check_in)
          )[0];

    const survey = mine
      .filter(
        (item) =>
          item.status === 'survei' &&
          item.survey_date >= today
      )
      .sort((a, b) =>
        a.survey_date.localeCompare(b.survey_date)
      )[0];

    return {
      room,
      current,
      next,
      survey,
    };
  });

  const longTerm = tenancies.filter(
    (item) =>
      item.period_type !== 'harian' &&
      item.status !== 'selesai'
  );

  const daily = tenancies.filter(
    (item) =>
      item.period_type === 'harian' &&
      item.status !== 'selesai'
  );

  return (
    <main className="space-y-6">
      {/* AKTIVITAS KAMAR */}
      <section>
        <SectionHead
          icon={Home}
          title="Aktivitas Kamar"
          sub="Pantau status dan aktivitas setiap kamar."
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ room, current, next, survey }) => (
            <RoomCard
              key={room.code}
              room={room}
              current={current}
              next={next}
              survey={survey}
            />
          ))}
        </div>
      </section>

      {/* SEWA MINGGUAN DAN BULANAN */}
      <section className="card !p-5">
        <SectionHead
          icon={Home}
          title="Sewa Mingguan & Bulanan"
          sub="Penyewa jangka panjang yang masih berjalan."
        />

        <TenantTable rows={longTerm} />
      </section>

      {/* SEWA HARIAN DAN WAITING LIST */}
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section className="card !p-5 min-w-0">
          <SectionHead
            icon={CalendarDays}
            title="Sewa Harian (Terbaru)"
          >
            <AddTenantButton />
          </SectionHead>

          <TenantTable rows={daily.slice(0, 8)} />
        </section>

        <section className="card !p-5 min-w-0">
          <SectionHead
            icon={Users}
            title="Waiting List"
          >
            <Link
              href="/owner/waiting"
              className="btn-soft text-sm"
            >
              Lihat Semua →
            </Link>
          </SectionHead>

          <WaitTable rows={waitlist.slice(0, 5)} />
        </section>
      </div>
    </main>
  );
}
