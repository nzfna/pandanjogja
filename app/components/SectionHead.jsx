export default function SectionHead({ icon: Icon, title, sub, compact, children }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className={`flex shrink-0 items-center justify-center rounded-2xl bg-pandan-500 text-white ${compact ? 'h-9 w-9' : 'h-12 w-12'}`}><Icon size={compact ? 18 : 24} /></span>
      <div className="min-w-0 flex-1"><h2 className={`font-extrabold ${compact ? 'text-lg' : 'text-2xl'}`}>{title}</h2>{sub && <p className="text-sm text-pandan-700">{sub}</p>}</div>
      {children}
    </div>
  );
}
