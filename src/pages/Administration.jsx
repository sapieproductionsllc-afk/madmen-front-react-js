import { useState } from "react";
import { useLocation } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader.jsx";
import Icon from "../components/ui/Icon.jsx";
import Appareils from "./Appareils.jsx";
import Utilisateurs from "./Utilisateurs.jsx";
import Parametres from "./Parametres.jsx";
import Identifiants from "./Identifiants.jsx";

const SECTIONS = [
  { key: "appareils", label: "Appareils", icon: "sensors" },
  { key: "identifiants", label: "Identifiants", icon: "key" },
  { key: "utilisateurs", label: "Utilisateurs", icon: "admin_panel_settings" },
  { key: "parametres", label: "Paramètres", icon: "settings" },
];

// Espace combiné : appareils biométriques + utilisateurs/rôles + paramètres.
export default function Administration() {
  const location = useLocation();
  const [sec, setSec] = useState(SECTIONS.some((s) => s.key === location.state?.section) ? location.state.section : "appareils");
  const [paramsDirty, setParamsDirty] = useState(false);

  const changerSection = (key, el) => {
    if (key === sec) return;
    if (sec === "parametres" && paramsDirty && !window.confirm("Abandonner les modifications non enregistrées ?")) return;
    setSec(key);
    el?.scrollIntoView({ inline: "nearest", block: "nearest" });
  };

  return (
    <div className="pb-12">
      <PageHeader title="Administration" subtitle="Appareils, accès et configuration de la plateforme." />

      {/* Onglets segmentés */}
      <div className="inline-flex p-1 rounded-xl bg-surface-2 border border-border gap-1 max-w-full overflow-x-auto scroll-thin mb-5">
        {SECTIONS.map((s) => {
          const actif = sec === s.key;
          return (
            <button
              key={s.key}
              onClick={(e) => changerSection(s.key, e.currentTarget)}
              aria-current={actif ? "true" : undefined}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:shadow-focus ${actif ? "bg-surface text-brand-700 shadow-sm" : "text-muted hover:text-texte"}`}
            >
              <Icon name={s.icon} className="text-[18px]" filled={actif} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Contenu */}
      {sec === "appareils" && <Appareils embedded />}
      {sec === "identifiants" && <Identifiants embedded />}
      {sec === "utilisateurs" && <Utilisateurs embedded />}
      {sec === "parametres" && <Parametres embedded onDirty={setParamsDirty} />}
    </div>
  );
}
