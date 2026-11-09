import { safeSrc } from '@/lib/sanitize';

export default function RoomPhoto({ url, className = '' }) {
  const src = safeSrc(url);
  if (src) return <img src={src} alt="" className={`object-cover ${className}`} />;
  return (
    <div aria-hidden className={`flex items-center justify-center bg-gradient-to-br from-kelinci-100 to-pandan-100 ${className}`}>
      <svg viewBox="0 0 64 48" className="w-3/5 opacity-80"><rect x="6" y="22" width="52" height="16" rx="3" fill="#fff" /><rect x="6" y="12" width="14" height="14" rx="3" fill="#EBBB83" /><rect x="24" y="16" width="32" height="8" rx="3" fill="#D3E2BE" /><rect x="5" y="38" width="4" height="6" fill="#9A5E27" /><rect x="55" y="38" width="4" height="6" fill="#9A5E27" /></svg>
    </div>
  );
}
