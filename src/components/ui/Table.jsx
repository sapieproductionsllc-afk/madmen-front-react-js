import { useMemo, useState } from "react";
import Icon from "./Icon.jsx";
import Button from "./Button.jsx";

// Tableau standard piloté par des colonnes : [{ key, label, align, render, tdClass, sortable, sortAccessor }]
// Affordances B2B optionnelles : tri par colonne, sélection de lignes + actions groupées,
// en-tête collant et pagination. Un seul gris de surface imbriquée (bg-surface-2) partout.
export default function Table({
  columns,
  data,
  rowKey,
  onRowClick,
  emptyLabel = "Aucun résultat.",
  minWidth = 640,
  sortable = false,
  selectable = false,
  stickyHeader = false,
  bulkActions,
  pageSize,
}) {
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [selected, setSelected] = useState(() => new Set());
  const [page, setPage] = useState(0);

  const getKey = (row, i) => (rowKey ? rowKey(row) : i);

  // Tri
  const sortedData = useMemo(() => {
    if (!sortable || !sort.key) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return data;
    const accessor = col.sortAccessor || ((row) => row[col.key]);
    const copie = [...data].sort((a, b) => {
      const va = accessor(a);
      const vb = accessor(b);
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return va - vb;
      return String(va).localeCompare(String(vb), "fr", { numeric: true });
    });
    return sort.dir === "desc" ? copie.reverse() : copie;
  }, [data, columns, sort, sortable]);

  // Pagination
  const totalPages = pageSize ? Math.max(1, Math.ceil(sortedData.length / pageSize)) : 1;
  const pageClamped = Math.min(page, totalPages - 1);
  const pageData = pageSize
    ? sortedData.slice(pageClamped * pageSize, pageClamped * pageSize + pageSize)
    : sortedData;

  const toggleSort = (c) => {
    if (!sortable || c.sortable === false) return;
    setSort((s) =>
      s.key === c.key ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" } : { key: c.key, dir: "asc" }
    );
  };

  const pageKeys = pageData.map((row, i) => getKey(row, i));
  const allSelected = pageData.length > 0 && pageKeys.every((k) => selected.has(k));
  const someSelected = pageKeys.some((k) => selected.has(k));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) pageKeys.forEach((k) => next.delete(k));
      else pageKeys.forEach((k) => next.add(k));
      return next;
    });
  };
  const toggleOne = (k) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };

  const sortIcon = (c) => {
    if (sort.key !== c.key) return "unfold_more";
    return sort.dir === "asc" ? "arrow_upward" : "arrow_downward";
  };

  const theadBg = stickyHeader ? "sticky top-0 z-10 bg-surface-2" : "bg-surface-2";

  return (
    <div>
      {selectable && selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-brand-50 border-b border-border">
          <span className="text-sm font-medium text-brand-700 tabular-nums">
            {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            {bulkActions}
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto scroll-thin">
        <table className="w-full text-left border-collapse" style={{ minWidth }}>
          <thead>
            <tr className={`kicker border-b border-border ${theadBg}`}>
              {selectable && (
                <th className="w-10 px-5 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Tout sélectionner"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allSelected && someSelected;
                    }}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded accent-brand-600 align-middle"
                  />
                </th>
              )}
              {columns.map((c) => {
                const isSortable = sortable && c.sortable !== false;
                const ariaSort =
                  sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
                return (
                  <th
                    key={c.key}
                    aria-sort={isSortable ? ariaSort : undefined}
                    className={`px-5 py-2.5 font-semibold ${c.align === "right" ? "text-right" : "text-left"}`}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c)}
                        className={`inline-flex items-center gap-1 hover:text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 rounded ${
                          c.align === "right" ? "flex-row-reverse" : ""
                        }`}
                      >
                        {c.label}
                        <Icon name={sortIcon(c)} className="text-[16px]" />
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => {
              const k = getKey(row, i);
              const isSel = selected.has(k);
              return (
                <tr
                  key={k}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-t border-border transition-colors duration-150 hover:bg-surface-2 ${
                    isSel ? "bg-brand-50/60" : ""
                  } ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {selectable && (
                    <td className="w-10 px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label="Sélectionner la ligne"
                        checked={isSel}
                        onChange={() => toggleOne(k)}
                        className="w-4 h-4 rounded accent-brand-600 align-middle"
                      />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-5 py-3 text-sm text-muted tabular-nums ${
                        c.align === "right" ? "text-right" : ""
                      } ${c.tdClass || ""}`}
                    >
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {data.length === 0 && <div className="py-14 text-center text-sm text-subtle">{emptyLabel}</div>}
      </div>

      {pageSize && data.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border">
          <span className="text-sm text-muted tabular-nums">
            {pageClamped * pageSize + 1}–{Math.min((pageClamped + 1) * pageSize, sortedData.length)} sur{" "}
            {sortedData.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon="chevron_left"
              disabled={pageClamped === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Précédent
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconRight="chevron_right"
              disabled={pageClamped >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
