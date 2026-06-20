import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import { Input, Select, Field as Champ } from "../components/ui/Input.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";

function Section({ icon, title, desc, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3 mb-5">
        <span className="w-10 h-10 rounded-xl bg-surface-2 text-muted flex items-center justify-center shrink-0 ring-1 ring-inset ring-black/[0.03]">
          <Icon name={icon} className="text-[22px]" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-texte tracking-tight">{title}</h2>
          <p className="text-sm text-muted">{desc}</p>
        </div>
      </div>
      {children}
    </div>
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
              <Input defaultValue="MADMEN Group" />
            </Champ>
            <Champ label="Fuseau horaire">
              <Select defaultValue="Europe/Paris">
                <option>Europe/Paris</option>
                <option>Afrique/Abidjan</option>
                <option>Afrique/Dakar</option>
              </Select>
            </Champ>
            <Champ label="Langue">
              <Select defaultValue="Français">
                <option>Français</option>
                <option>English</option>
              </Select>
            </Champ>
          </div>
        </Section>

        <Section icon="timer" title="Activité & inactivité" desc="Règles de surveillance des postes.">
          <div className="space-y-4">
            <Champ label="Seuil d'inactivité (minutes)">
              <Input type="number" defaultValue={5} />
            </Champ>
            <Champ label="Heure de début de journée">
              <Input type="time" defaultValue="08:30" />
            </Champ>
            <Champ label="Heure de fin de journée">
              <Input type="time" defaultValue="17:30" />
            </Champ>
          </div>
        </Section>

        <Section icon="more_time" title="Pointage & retards" desc="Règles appliquées aux pointages ZKTeco (K40).">
          <div className="space-y-4">
            <Champ label="Tolérance de retard (minutes)">
              <Input type="number" defaultValue={5} />
            </Champ>
            <Champ label="Retenue par minute de retard (€)">
              <Input type="number" defaultValue={2} />
            </Champ>
            <label className="flex items-center justify-between">
              <span className="text-sm text-texte">Retenue automatique sur salaire</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-texte">Justification des absences via l'app employé</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600" />
            </label>
          </div>
        </Section>

        <Section icon="notifications" title="Notifications" desc="Alertes envoyées aux superviseurs.">
          <div className="space-y-3">
            {["Retards et absences", "Tentatives de connexion refusées", "Incidents d'inactivité"].map((n) => (
              <label key={n} className="flex items-center justify-between">
                <span className="text-sm text-texte">{n}</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600" />
              </label>
            ))}
          </div>
        </Section>

        <Section icon="shield" title="Sécurité" desc="Protection des accès et des données.">
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-texte">Double authentification (2FA)</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-texte">Masquer les salaires par défaut</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-texte">Journal d'audit des actions</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600" />
            </label>
          </div>
        </Section>
      </div>
    </div>
  );
}
