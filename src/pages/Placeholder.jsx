import Icon from "../components/ui/Icon.jsx";

// Page "à venir" professionnelle : annonce le pôle, le rôle et le contenu prévu.
export default function PagePlaceholder({
  pole,
  icon,
  title,
  subtitle,
  role,
  sensible = false,
  sections = [],
}) {
  return (
    <div className="space-y-6 pb-12">
      <header className="reveal flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
          <Icon name={icon} className="text-[24px]" filled />
        </div>
        <div>
          <p className="kicker mb-1">{pole}</p>
          <h1 className="text-2xl font-semibold text-ink tracking-tight leading-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-muted max-w-xl">{subtitle}</p>}
        </div>
      </header>

      <div className="card p-6 md:p-7 reveal" style={{ animationDelay: "80ms" }}>
        <div className="flex flex-wrap items-center gap-2.5 mb-6">
          <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-medium">
            Bientôt disponible
          </span>
          {role && (
            <span className="px-2.5 py-1 rounded-full bg-slate-500/15 text-slate-400 text-xs font-medium">
              Accès : {role}
            </span>
          )}
          {sensible && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 text-xs font-medium">
              <Icon name="lock" className="text-[14px]" /> Données sensibles
            </span>
          )}
        </div>

        <p className="text-sm font-medium text-texte mb-4">Cette page regroupera :</p>
        <ul className="grid sm:grid-cols-2 gap-3">
          {sections.map((s) => (
            <li key={s} className="flex items-start gap-2.5 text-sm text-texte">
              <Icon name="check_circle" className="text-emerald-400 text-[18px] mt-0.5 shrink-0" filled />
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
