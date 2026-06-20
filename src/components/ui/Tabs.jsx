// Onglets segmentés.
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="inline-flex gap-1 p-1 bg-surface-2 border border-border rounded-xl">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          aria-pressed={active === t.value}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
            active === t.value
              ? "bg-surface-2 text-ink shadow-sm"
              : "text-muted hover:text-texte"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
