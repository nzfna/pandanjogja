export default function SectionHead({ icon: Icon, title, sub, children }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pandan-500 text-white"><Icon size={24} /></span>
      <div className="min-w-0 flex-1"><h2 className="text-2xl font-extrabold">{title}</h2>{sub && <p className="text-sm text-pandan-700">{sub}</p>}</div>
      {children}
    </div>
  );
}
