// Tableau standard piloté par des colonnes : [{ key, label, align, render, tdClass }]
export default function Table({ columns, data, rowKey, onRowClick, emptyLabel = "Aucun résultat." }) {
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full text-left border-collapse min-w-[640px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50/60">
            {columns.map((c) => (
              <th key={c.key} className={`px-5 py-2.5 font-medium ${c.align === "right" ? "text-right" : ""}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={rowKey ? rowKey(row) : i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-t border-slate-100 hover:bg-slate-50/60 transition-colors ${
                onRowClick ? "cursor-pointer" : ""
              }`}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-5 py-3 text-sm text-slate-600 ${c.align === "right" ? "text-right" : ""} ${c.tdClass || ""}`}
                >
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && <div className="py-14 text-center text-sm text-slate-400">{emptyLabel}</div>}
    </div>
  );
}
