import Icon from "../ui/Icon.jsx";
import Avatar from "../ui/Avatar.jsx";
import { presence } from "../../data/mockData.js";

function BadgeStatut({ status }) {
  const map = {
    Présent: { dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700" },
    "En congé": { dot: "bg-slate-400", cls: "bg-slate-100 text-slate-600" },
    Absent: { dot: "bg-rose-500", cls: "bg-rose-50 text-rose-700" },
  };
  const c = map[status] ?? map["En congé"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.cls}`}>
      <span className={`status-dot ${c.dot}`} />
      {status}
    </span>
  );
}

export default function PresenceTable() {
  return (
    <div className="card overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <Icon name="co_present" className="text-brand-600 text-[22px]" />
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Présence en temps réel</h2>
        </div>
        <button className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 shrink-0">
          Tout voir
          <Icon name="arrow_forward" className="text-[18px]" />
        </button>
      </div>

      <div className="overflow-x-auto scroll-thin">
        <table className="w-full text-left border-collapse min-w-[560px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50/60">
              <th className="px-5 py-2.5 font-medium">Employé</th>
              <th className="px-5 py-2.5 font-medium">Agence</th>
              <th className="px-5 py-2.5 font-medium">Statut</th>
              <th className="px-5 py-2.5 font-medium">Arrivée</th>
              <th className="px-5 py-2.5 font-medium">Poste</th>
            </tr>
          </thead>
          <tbody>
            {presence.map((emp) => (
              <tr key={emp.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={emp.photo} name={emp.name} size="w-8 h-8" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 whitespace-nowrap">{emp.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{emp.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap">{emp.agence}</td>
                <td className="px-5 py-3">
                  <BadgeStatut status={emp.status} />
                </td>
                <td className="px-5 py-3 text-sm font-mono text-slate-600">{emp.checkIn}</td>
                <td className="px-5 py-3 text-sm font-mono text-slate-500 whitespace-nowrap">{emp.workstation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
