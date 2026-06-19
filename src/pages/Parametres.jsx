import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";

const champ =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition";

function Section({ icon, title, desc, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3 mb-5">
        <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
          <Icon name={icon} className="text-[22px]" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Champ({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-500 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export default function Parametres() {
  const { toast } = useUI();

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Configuration générale de l'entreprise.">
        <Button icon="save" onClick={() => toast("Paramètres enregistrés")}>
          Enregistrer
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl">
        <Section icon="business" title="Entreprise" desc="Informations générales de l'organisation.">
          <div className="space-y-4">
            <Champ label="Nom de l'entreprise">
              <input className={champ} defaultValue="MADMEN Group" />
            </Champ>
            <Champ label="Fuseau horaire">
              <select className={champ} defaultValue="Europe/Paris">
                <option>Europe/Paris</option>
                <option>Afrique/Abidjan</option>
                <option>Afrique/Dakar</option>
              </select>
            </Champ>
            <Champ label="Langue">
              <select className={champ} defaultValue="Français">
                <option>Français</option>
                <option>English</option>
              </select>
            </Champ>
          </div>
        </Section>

        <Section icon="timer" title="Activité & inactivité" desc="Règles de surveillance des postes.">
          <div className="space-y-4">
            <Champ label="Seuil d'inactivité (minutes)">
              <input className={champ} type="number" defaultValue={5} />
            </Champ>
            <Champ label="Heure de début de journée">
              <input className={champ} type="time" defaultValue="08:30" />
            </Champ>
            <Champ label="Heure de fin de journée">
              <input className={champ} type="time" defaultValue="17:30" />
            </Champ>
          </div>
        </Section>

        <Section icon="notifications" title="Notifications" desc="Alertes envoyées aux superviseurs.">
          <div className="space-y-3">
            {["Retards et absences", "Tentatives de connexion refusées", "Incidents d'inactivité"].map((n) => (
              <label key={n} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{n}</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600" />
              </label>
            ))}
          </div>
        </Section>

        <Section icon="shield" title="Sécurité" desc="Protection des accès et des données.">
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Double authentification (2FA)</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Masquer les salaires par défaut</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Journal d'audit des actions</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600" />
            </label>
          </div>
        </Section>
      </div>
    </div>
  );
}
