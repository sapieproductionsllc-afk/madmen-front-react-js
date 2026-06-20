// En-tête de page standard : titre + sous-titre + actions à droite.
export default function PageHeader({ title, subtitle, children }) {
  return (
    <header className="reveal flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[1.75rem] leading-tight font-semibold text-ink tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </header>
  );
}
