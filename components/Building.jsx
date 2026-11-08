import Link from 'next/link';

const Plant = ({ right }) => (
  <svg aria-hidden viewBox="0 0 80 90" className={`absolute bottom-0 z-20 h-14 w-12 sm:h-24 sm:w-20 ${right ? '-right-2 sm:-right-5' : '-left-2 sm:-left-5'}`}>
    <path d="M40 60C30 40 12 36 4 20c20 0 34 10 36 40Z" fill="#5E9A49" />
    <path d="M40 60C50 38 66 32 76 14c-22 2-36 14-36 46Z" fill="#4A8C3F" />
    <path d="M40 60C34 36 38 18 42 4c8 18 6 36-2 56Z" fill="#8DBB6E" />
    <rect x="24" y="58" width="32" height="6" rx="2" fill="#E4D5B8" /><path d="M27 64h26l-4 22H31Z" fill="#F1E6D0" />
  </svg>
);
const Lantern = ({ right }) => (
  <span aria-hidden className={`absolute top-0 z-20 flex flex-col items-center ${right ? 'right-2 sm:right-6' : 'left-2 sm:left-6'}`}>
    <span className="block h-3 w-px bg-[#5a3a22] sm:h-4" />
    <span className="block h-6 w-4 rounded-[4px] border-2 border-[#5a3a22] bg-amber-200 shadow-[0_0_14px_rgba(255,200,90,.7)] sm:h-9 sm:w-6" />
  </span>
);
const Vine = ({ right }) => (
  <svg aria-hidden viewBox="0 0 60 70" className={`absolute top-6 z-20 h-12 w-12 sm:top-14 sm:h-[72px] sm:w-[62px] ${right ? 'right-1 -scale-x-100 sm:right-10' : 'left-1 sm:left-10'}`}>
    <path d="M2 2C20 10 22 30 14 66" stroke="#4A8C3F" strokeWidth="2" fill="none" />
    {[[8, 12], [16, 22], [12, 34], [19, 44], [14, 56], [26, 16], [23, 30]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4.5" fill={i % 2 ? '#6FA35A' : '#8DBB6E'} />)}
  </svg>
);

export default function Building({ items }) {
  return (
    <div className="mx-auto mt-6 max-w-4xl">
      <div className="relative">
        <Vine /><Vine right />
        <div className="-mx-2 sm:-mx-3">
          <div className="h-11 sm:h-[68px]" style={{ background: 'radial-gradient(circle at 50% 0, #EBA982 0 58%, #C96F46 60%) 0 0/24px 14px', clipPath: 'polygon(2% 0,98% 0,100% 100%,0 100%)' }} />
          <div className="h-1.5 bg-[#7A4A2B] sm:h-2" />
        </div>
        <div className="relative bg-[#F3E9D0] px-7 pt-5 sm:px-16 sm:pt-7">
          <Lantern /><Lantern right />
          <div className="grid grid-cols-7 items-end gap-1.5 sm:gap-4">
            {items.map(({ r, st }, i) => {
              const free = st.state === 'tersedia';
              return (
                <Link key={r.code} href={`/kamar/${r.code}`} className="group flex flex-col items-center focus-visible:outline-none" aria-label={`Kamar ${r.code}, ${free ? 'tersedia' : 'sedang terisi'}`}>
                  <span className="mb-1.5 rounded-full bg-white px-2 py-0.5 text-xs font-extrabold shadow sm:px-3.5 sm:py-1 sm:text-sm">{r.code}</span>
                  <span style={{ animationDelay: `${i * 70}ms`, backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,.14) 0 2px, transparent 2px 12px)' }}
                    className={`door-in relative block aspect-[1/1.9] w-full rounded-t-full border-[3px] border-b-0 border-[#9A6A43] transition group-hover:-translate-y-1 group-focus-visible:ring-4 group-focus-visible:ring-kelinci-500 sm:border-4 ${free ? 'bg-[#2F6B34]' : 'bg-[#C9904F]'}`}>
                    <span className="absolute right-1.5 top-[58%] h-1.5 w-1.5 rounded-full bg-amber-100 sm:h-2 sm:w-2" />
                  </span>
                </Link>
              );
            })}
          </div>
          <Plant /><Plant right />
        </div>
        <div className="h-2.5 bg-[#E4DCC4] sm:h-3" />
        <div className="mx-auto -mt-0.5 h-3 w-[104%] -translate-x-[2%] rounded-full bg-pandan-100" />
      </div>
      <p className="mt-3 flex justify-center gap-5 text-xs text-pandan-700">
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-[#2F6B34]" />Tersedia</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-[#C9904F]" />Sedang terisi</span>
      </p>
    </div>
  );
}