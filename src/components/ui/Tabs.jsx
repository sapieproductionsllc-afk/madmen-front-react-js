// Onglets segmentés.
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="inline-flex gap-1 p-1 bg-slate-100 rounded-xl">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            active === t.value
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
