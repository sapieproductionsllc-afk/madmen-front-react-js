import { useEffect, useState } from "react";
import Icon from "../ui/Icon.jsx";
import { activity } from "../../data/mockData.js";

// Barres d'activité clavier/souris — animées pour les postes "Actif".
function BarresActivite({ status }) {
  const [hauteurs, setHauteurs] = useState([14, 22, 10, 18, 8]);

  useEffect(() => {
    if (status !== "Actif") return undefined;
    const id = setInterval(() => {
      setHauteurs(Array.from({ length: 5 }, () => Math.floor(Math.random() * 20) + 4));
    }, 1400);
    return () => clearInterval(id);
  }, [status]);

  const couleur =
    status === "Incident" ? "bg-rose-400" : status === "Inactif" ? "bg-slate-300" : "bg-brand-500";

  if (status === "Inactif") {
    return (
      <div className="flex gap-1 items-end h-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`w-1 h-1 rounded-full ${couleur}`} />
        ))}
      </div>
    );
  }

  if (status === "Incident") {
    return (
      <div className="flex gap-1 items-end h-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`w-1 h-6 rounded-full ${couleur}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1 items-end h-6">
      {hauteurs.map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-700 ${couleur}`}
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

function StatutActivite({ status }) {
  const config = {
    Actif: { color: "text-emerald-500", text: "text-slate-700", live: true },
    Inactif: { color: "text-amber-500", text: "text-slate-600", live: false },
    Incident: { color: "text-rose-500", text: "text-rose-600 font-medium", live: false },
  };
  const c = config[status] ?? config.Inactif;
  return (
    <div className="flex items-center gap-2">
      {c.live ? (
        <span className={`live-dot ${c.color}`} />
      ) : (
        <span className={`status-dot ${c.color.replace("text-", "bg-")}`} />
      )}
      <span className={`text-sm ${c.text}`}>{status}</span>
    </div>
  );
}

export default function ActivityStream() {
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <Icon name="desktop_windows" className="text-brand-600 text-[22px]" />
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Flux d'activité en direct</h2>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="status-dot bg-emerald-500" /> Actif
          </span>
          <span className="flex items-center gap-1.5">
            <span className="status-dot bg-amber-500" /> Inactif
          </span>
          <span className="flex items-center gap-1.5">
            <span className="status-dot bg-rose-500" /> Incident
          </span>
        </div>
      </div>

      <div className="overflow-x-auto scroll-thin">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50/60">
              <th className="px-5 py-2.5 font-medium">Employé</th>
              <th className="px-5 py-2.5 font-medium">Machine</th>
              <th className="px-5 py-2.5 font-medium">Statut</th>
              <th className="px-5 py-2.5 font-medium">Activité</th>
              <th className="px-5 py-2.5 font-medium">Applications</th>
              <th className="px-5 py-2.5 font-medium">Temps</th>
            </tr>
          </thead>
          <tbody>
            {activity.map((ligne) => (
              <tr key={ligne.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3 text-sm font-medium text-slate-800 whitespace-nowrap">{ligne.name}</td>
                <td className="px-5 py-3 text-sm font-mono text-slate-500 whitespace-nowrap">{ligne.machine}</td>
                <td className="px-5 py-3">
                  <StatutActivite status={ligne.status} />
                </td>
                <td className="px-5 py-3">
                  <BarresActivite status={ligne.status} />
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1.5">
                    {ligne.apps.map((app) => (
                      <span
                        key={app}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap border ${
                          ligne.status === "Incident"
                            ? "bg-rose-50 border-rose-100 text-rose-600"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                </td>
                <td
                  className={`px-5 py-3 text-sm font-mono whitespace-nowrap ${
                    ligne.status === "Incident" ? "text-rose-600 font-medium" : "text-slate-700"
                  }`}
                >
                  {ligne.worked}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
