import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import { useUI } from "../components/ui/UIProvider.jsx";

/* ============================================================================
   MADMEN — Enrôlement biométrique (écran « vitrine », brief premium).
   Palette locale : crème + teal profond + or discret.
   Fond crème #EFEBE0 · carte #FFFFFF · texte #2B2A27 / #6F6B60 / #8C8678
   filets #E6E1D4 · bord champ #DAD4C5 · champ inactif #FBF9F4
   teal hero #16463D · marque #1C5C50 · accent #1E7D67 · soft #E7F0EC
   or #C49A4A (clair) / #E7C173 (foncé)
   ========================================================================== */

const champClass =
  "w-full h-10 rounded-[9px] bg-[#FBF9F4] border border-[#DAD4C5] px-3 text-[13.5px] text-[#2B2A27] placeholder:text-[#A39E90] outline-none transition focus:border-[#1E7D67] focus:ring-[3px] focus:ring-[#1E7D67]/20";

const etapes = [
  { id: 0, label: "Identité", sub: "Infos employé", icon: "person" },
  { id: 1, label: "Empreinte", sub: "Biométrie", icon: "fingerprint" },
  { id: 2, label: "Badge & PIN", sub: "Accès & code", icon: "badge" },
  { id: 3, label: "Validation", sub: "Confirmation", icon: "verified" },
];

const aide = {
  0: "Renseignez le nom complet et la fonction. Le matricule MADMEN est généré automatiquement.",
  1: "Nettoyez le capteur, posez le doigt à plat et maintenez ~2 s. Trois passages améliorent la fiabilité.",
  2: "Associez le badge RFID physique remis à l'employé et définissez un code PIN à 4 chiffres.",
  3: "Vérifiez le récapitulatif. Une fois confirmé, l'employé pourra pointer immédiatement.",
};

// Motif de code-barres fixe (déterministe) — largeurs en px, alternance barre/espace.
const BARRES = [3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 1, 2, 1, 2, 1, 3, 1, 2, 1, 1, 2];

function initialesDe(nom) {
  return nom.trim().split(/\s+/).map((m) => m[0]).slice(0, 2).join("").toUpperCase();
}

// Champ de formulaire (label au-dessus, grille régulière).
function Champ({ label, full, children }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-[11.5px] font-medium text-[#6F6B60] mb-1.5">{label}</span>
      {children}
    </label>
  );
}

// Aperçu live du badge employé (carte blanche, en-tête teal, puce RFID, code-barres).
function BadgeEmploye({ form, photo, empreinteOk, matricule, pin }) {
  const lignes = [
    ["Matricule", matricule, true, false],
    ["Département", form.departement.trim() || "—", false, false],
    ["Badge RFID", form.badge.trim() || "—", true, false],
    ["Empreinte", empreinteOk ? "Enregistrée" : "—", false, empreinteOk],
    ["Code PIN", pin ? "••••" : "—", true, false],
  ];
  return (
    <div className="bg-white rounded-[14px] border border-[#E6E1D4] overflow-hidden shadow-[0_8px_24px_-12px_rgba(22,70,61,0.22)]">
      {/* En-tête teal */}
      <div className="relative bg-[#16463D] px-4 pt-3.5 pb-9 overflow-hidden">
        <Icon name="fingerprint" filled aria-hidden="true" className="pointer-events-none absolute -right-3 -bottom-6 text-white/[0.07] text-[90px] leading-none" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center">
              <Icon name="fingerprint" filled className="text-[#E7C173] text-[12px]" />
            </span>
            <span className="text-[11px] font-medium text-white tracking-wide">MADMEN</span>
          </div>
          <span className="self-center text-[9.5px] font-medium uppercase tracking-[0.16em] text-white/70">Carte d'accès</span>
        </div>
      </div>

      <div className="px-4 pb-4">
        {/* Photo (chevauche l'en-tête) + identité */}
        <div className="-mt-6 flex items-center gap-3">
          {photo ? (
            <img src={photo} alt="" className="w-16 h-16 rounded-xl object-cover ring-4 ring-white shrink-0" />
          ) : form.nom.trim() ? (
            <div className="w-16 h-16 rounded-xl ring-4 ring-white bg-[#E7F0EC] text-[#1C5C50] flex items-center justify-center text-lg font-medium shrink-0">
              {initialesDe(form.nom)}
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl ring-4 ring-white bg-[#FBF9F4] border border-[#E6E1D4] flex items-center justify-center shrink-0">
              <Icon name="person" className="text-[#A39E90] text-[28px]" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-[#2B2A27] truncate leading-tight">{form.nom.trim() || "Nouvel employé"}</p>
            <p className="text-[12px] text-[#6F6B60] truncate">{form.fonction.trim() || "Fonction à définir"}</p>
          </div>
        </div>

        {/* Puce RFID dorée */}
        <div className="mt-4 w-9 h-7 rounded-[5px] bg-gradient-to-br from-[#E7C173] to-[#C49A4A] ring-1 ring-[#C49A4A]/40 relative" aria-hidden="true">
          <span className="absolute inset-x-1.5 top-1/2 -translate-y-1/2 h-px bg-[#16463D]/25" />
          <span className="absolute inset-y-1.5 left-1/2 -translate-x-1/2 w-px bg-[#16463D]/25" />
        </div>

        {/* Champs du badge — grille label/valeur alignée */}
        <dl className="mt-4 space-y-2 text-[12px]">
          {lignes.map(([k, v, mono, ok]) => (
            <div key={k} className="flex items-baseline justify-between gap-3">
              <dt className="text-[#A39E90]">{k}</dt>
              <dd className={`text-right ${ok ? "text-[#1E7D67] font-medium" : "text-[#2B2A27]"} ${mono ? "font-mono tabular-nums" : ""}`}>{v}</dd>
            </div>
          ))}
        </dl>

        {/* Code-barres */}
        <div className="mt-4 pt-3 border-t border-[#E6E1D4]">
          <div className="flex items-stretch justify-center h-9" aria-hidden="true">
            {BARRES.map((w, i) => (
              <span key={i} className={i % 2 ? "bg-transparent" : "bg-[#2B2A27]"} style={{ width: `${w}px` }} />
            ))}
          </div>
          <p className="mt-1.5 text-[10px] font-mono tracking-[0.2em] text-[#A39E90] text-center">{matricule}</p>
        </div>
      </div>
    </div>
  );
}

export default function Enrolement() {
  const { toast } = useUI();
  const navigate = useNavigate();
  const [etape, setEtape] = useState(0);
  const [form, setForm] = useState({ nom: "", fonction: "", departement: "", agence: "", email: "", badge: "", pin: "" });
  const [photo, setPhoto] = useState(null);
  const [captures, setCaptures] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [atteste, setAtteste] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const empreinteOk = captures >= 3;
  const pct = Math.round(((etape + 1) / 4) * 100);
  const pinValide = /^\d{4}$/.test(form.pin);
  const matricule = form.nom.trim()
    ? `AUR-${String(1000 + ((form.nom.length * 31 + form.fonction.length * 7) % 9000))}`
    : "AUR-————";

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const scanner = () => {
    if (scanning || empreinteOk) return;
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setCaptures((c) => Math.min(c + 1, 3));
    }, 1200);
  };

  const etapeValide =
    etape === 0 ? form.nom.trim() && form.fonction.trim() : etape === 1 ? empreinteOk : etape === 2 ? form.badge.trim() && pinValide : atteste;

  const suivant = () => etapeValide && setEtape((e) => Math.min(e + 1, 3));
  const precedent = () => setEtape((e) => Math.max(e - 1, 0));
  const terminer = () => {
    setDone(true);
    toast(`${form.nom} a été enrôlé avec succès`);
  };
  const recommencer = () => {
    setDone(false);
    setEtape(0);
    setForm({ nom: "", fonction: "", departement: "", agence: "", email: "", badge: "", pin: "" });
    setPhoto(null);
    setCaptures(0);
    setAtteste(false);
  };

  const Ambiance = (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="absolute -top-24 right-10 w-[30rem] h-[30rem] rounded-full bg-[#1E7D67]/[0.07] blur-3xl" />
      <span className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-[#C49A4A]/10 blur-3xl" />
    </div>
  );

  // Puce kicker dorée (accent réutilisé).
  const PuceOr = <span className="w-1.5 h-1.5 rounded-full bg-[#E7C173] shadow-[0_0_6px_0_rgba(231,193,115,0.7)]" />;

  // ---------- Écran de succès ----------
  if (done) {
    return (
      <div className="max-w-3xl mx-auto reveal">
        <div className="relative overflow-hidden rounded-[18px] bg-[#16463D] px-8 py-10 text-center">
          <Icon name="verified" filled aria-hidden="true" className="pointer-events-none absolute -right-8 -bottom-12 text-white/[0.06] text-[240px] leading-none" />
          <div className="relative flex flex-col items-center">
            <span className="w-16 h-16 rounded-full bg-white/10 ring-4 ring-white/10 flex items-center justify-center mb-4">
              <Icon name="verified" filled className="text-[#E7C173] text-[38px]" />
            </span>
            <div className="flex items-center gap-1.5 mb-2">
              {PuceOr}
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#E7C173]">Enrôlement terminé</span>
            </div>
            <h2 className="text-[24px] font-medium text-white tracking-tight">{form.nom} est enrôlé</h2>
            <p className="text-[13px] text-white/[0.68] mt-1.5">
              Matricule <span className="font-mono text-white">{matricule}</span> · l'employé peut désormais pointer.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-xs -mt-8 relative">
          <BadgeEmploye form={form} photo={photo} empreinteOk={empreinteOk} matricule={matricule} pin={form.pin} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
          <button
            onClick={recommencer}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[9px] bg-white border border-[#DAD4C5] text-[13.5px] font-medium text-[#2B2A27] hover:bg-[#FBF9F4] transition"
          >
            <Icon name="person_add" className="text-[16px]" aria-hidden="true" />
            Enrôler un autre
          </button>
          <button
            onClick={() => navigate("/employes")}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[9px] bg-[#1E7D67] text-white text-[13.5px] font-medium shadow-[0_6px_16px_-6px_rgba(30,125,103,0.5)] hover:bg-[#1C5C50] transition"
          >
            <Icon name="groups" className="text-[16px]" aria-hidden="true" />
            Voir les employés
          </button>
        </div>
      </div>
    );
  }

  // ---------- Wizard ----------
  return (
    <div className="min-h-[calc(100vh-7rem)] flex flex-col justify-center">
      {/* Bandeau hero */}
      <div className="relative overflow-hidden rounded-[18px] bg-[#16463D] px-8 py-9 sm:px-10 sm:py-11">
        <Icon name="fingerprint" filled aria-hidden="true" className="pointer-events-none absolute -right-8 -bottom-16 text-white/[0.06] text-[300px] leading-none" />
        <span aria-hidden="true" className="pointer-events-none absolute -top-16 right-1/3 w-72 h-72 rounded-full bg-[#1E7D67]/25 blur-3xl" />
        <div className="absolute top-6 right-6 flex items-center gap-1.5 rounded-full bg-white/[0.14] ring-1 ring-white/25 px-2.5 py-1">
          <Icon name="fingerprint" filled className="text-[#E7C173] text-[14px]" aria-hidden="true" />
          <span className="text-[11px] font-medium text-white tracking-wide">MADMEN</span>
        </div>
        <div className="relative">
          <div className="flex items-center gap-1.5 mb-3">
            {PuceOr}
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#E7C173]">Enrôlement biométrique</span>
          </div>
          <h1 className="text-[28px] sm:text-[32px] font-medium text-white tracking-tight leading-tight">Nouvel employé</h1>
          <p className="text-[14px] text-white/[0.68] mt-2 max-w-md">
            Enregistrez l'identité, l'empreinte et les accès en quatre étapes guidées.
          </p>
        </div>
      </div>

      {/* Stepper (chevauche le bas du hero, connecteurs segmentés) */}
      <div className="relative -mt-6 px-2 sm:px-6">
        <div className="absolute top-[22px] left-[12%] right-[12%] h-[2px] bg-[#E6E1D4]" />
        <div className="absolute top-[22px] left-[12%] h-[2px] bg-[#1C5C50] transition-all duration-500" style={{ width: `${(etape / 3) * 76}%` }} />
        <div className="relative flex items-start justify-between gap-2">
          {etapes.map((e, i) => {
            const etat = i < etape ? "done" : i === etape ? "actif" : "avenir";
            return (
              <div key={e.id} className="flex flex-col items-center text-center flex-1 min-w-0">
                <span
                  className={`w-11 h-11 rounded-full flex items-center justify-center ring-4 ring-canvas transition-colors ${
                    etat === "actif"
                      ? "bg-[#1E7D67] text-white shadow-[0_0_0_4px_rgba(30,125,103,0.22),0_6px_14px_-4px_rgba(30,125,103,0.45)]"
                      : etat === "done"
                        ? "bg-[#1C5C50] text-white"
                        : "bg-white text-[#A39E90] border-[1.5px] border-[#E6E1D4]"
                  }`}
                >
                  <Icon name={etat === "done" ? "check" : e.icon} filled={etat === "actif"} className="text-[20px]" aria-hidden="true" />
                </span>
                <span className={`mt-2 text-[12px] font-medium ${i <= etape ? "text-[#2B2A27]" : "text-[#8C8678]"}`}>{e.label}</span>
                <span className="text-[11px] text-[#8C8678] hidden sm:block">{e.sub}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progression explicite */}
      <div className="flex items-center gap-3 px-2 sm:px-6 mt-5">
        <div className="flex-1 h-1.5 rounded-full bg-[#E6E1D4] overflow-hidden">
          <div className="h-full rounded-full bg-[#1E7D67] transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[11px] font-semibold text-[#1E7D67] bg-[#E7F0EC] rounded-full px-2.5 py-1 leading-none tabular-nums min-w-[44px] text-center">{`${pct} %`}</span>
      </div>

      {/* Contenu : formulaire (héros) + aperçu badge */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6 items-start">
        {/* Carte formulaire (ombre héros) */}
        <div className="lg:col-span-3 bg-white rounded-[14px] border border-[#E6E1D4] shadow-[0_18px_40px_-18px_rgba(22,70,61,0.25)] p-6 sm:p-7 flex flex-col">
          <div key={etape} className="modal-in min-h-[280px] flex flex-col justify-center">
            {/* Étape 0 — Identité */}
            {etape === 0 && (
              <div className="space-y-[22px]">
                <div className="flex items-center gap-4">
                  <label className="relative w-16 h-16 rounded-xl overflow-hidden cursor-pointer shrink-0 ring-1 ring-[#DAD4C5]">
                    {photo ? (
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full bg-[#FBF9F4] flex items-center justify-center">
                        <Icon name="add_a_photo" className="text-[#A39E90] text-[22px]" aria-hidden="true" />
                      </span>
                    )}
                    <input type="file" accept="image/*" onChange={onPhoto} className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Ajouter une photo d'identité" />
                  </label>
                  <div>
                    <p className="text-[13.5px] font-medium text-[#2B2A27]">Photo d'identité</p>
                    <p className="text-[12px] text-[#8C8678]">Optionnelle — elle apparaîtra sur le badge.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-[14px]">
                  <Champ label="Nom et prénom" full>
                    <input className={champClass} value={form.nom} onChange={set("nom")} placeholder="Ex. Jean Dupont" autoFocus />
                  </Champ>
                  <Champ label="Fonction">
                    <input className={champClass} value={form.fonction} onChange={set("fonction")} placeholder="Ex. Comptable" />
                  </Champ>
                  <Champ label="Département">
                    <input className={champClass} value={form.departement} onChange={set("departement")} placeholder="Ex. Finance" />
                  </Champ>
                  <Champ label="Agence">
                    <input className={champClass} value={form.agence} onChange={set("agence")} placeholder="Ex. Siège Social" />
                  </Champ>
                  <Champ label="Email professionnel">
                    <input className={champClass} value={form.email} onChange={set("email")} placeholder="prenom.nom@madmen.io" />
                  </Champ>
                </div>
              </div>
            )}

            {/* Étape 1 — Empreinte */}
            {etape === 1 && (
              <div className="flex flex-col items-center justify-center py-3">
                <div className="flex items-center gap-2 mb-6 text-[12px] font-medium text-[#6F6B60]">
                  <span className="relative flex w-2 h-2">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-[#1E7D67]/40 animate-ping" />
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-[#1E7D67]" />
                  </span>
                  Lecteur connecté · ZK-9500
                </div>
                <button
                  onClick={scanner}
                  disabled={scanning || empreinteOk}
                  aria-label="Lancer la capture d'empreinte"
                  className={`relative w-40 h-40 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
                    empreinteOk ? "bg-[#E7F0EC] ring-4 ring-[#E7F0EC]" : "bg-[#E7F0EC] hover:brightness-[0.97] ring-1 ring-[#DAD4C5] cursor-pointer"
                  } ${scanning ? "ring-2 ring-[#1E7D67]/40" : ""}`}
                >
                  <Icon
                    name={empreinteOk ? "check_circle" : "fingerprint"}
                    filled
                    className={`text-[78px] transition-colors duration-300 ${empreinteOk ? "text-[#1E7D67]" : "text-[#1C5C50]/70"}`}
                    aria-hidden="true"
                  />
                  {scanning && (
                    <>
                      <span className="pointer-events-none absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-[#1E7D67]/45 to-transparent animate-scanline" />
                      <span className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-[#1E7D67]/30 animate-pulse" />
                    </>
                  )}
                </button>
                <p className="mt-5 text-[13.5px] font-medium text-[#2B2A27]">
                  {empreinteOk ? "Empreinte enregistrée" : scanning ? "Capture en cours…" : "Posez le doigt sur le lecteur"}
                </p>
                <p className="text-[12px] text-[#8C8678] mt-1">
                  {empreinteOk
                    ? "Les 3 passages ont été capturés avec succès."
                    : scanning
                      ? "Maintenez le doigt immobile…"
                      : `Passage ${Math.min(captures + 1, 3)} sur 3 — cliquez pour scanner`}
                </p>
                <div className="flex items-center gap-2 mt-5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${
                        i < captures ? "bg-[#1E7D67]" : i === captures && scanning ? "bg-[#1E7D67]/40 animate-pulse" : "bg-[#DAD4C5]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Étape 2 — Badge & PIN */}
            {etape === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-[14px]">
                <Champ label="Numéro de badge RFID" full>
                  <input className={champClass} value={form.badge} onChange={set("badge")} placeholder="Ex. RFID-00482" />
                </Champ>
                <Champ label="Code PIN (4 chiffres)">
                  <input
                    className={champClass}
                    type="password"
                    value={form.pin}
                    onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    placeholder="••••"
                    inputMode="numeric"
                  />
                </Champ>
                <Champ label="Confirmation">
                  <div
                    className={`flex items-center gap-1.5 h-10 px-3 rounded-[9px] border text-[13px] ${
                      pinValide ? "border-[#1E7D67]/30 bg-[#E7F0EC] text-[#1E7D67] font-medium" : "border-[#DAD4C5] bg-[#FBF9F4] text-[#A39E90]"
                    }`}
                  >
                    {pinValide ? (
                      <>
                        <Icon name="check_circle" className="text-[18px]" filled aria-hidden="true" />
                        Code valide
                      </>
                    ) : (
                      "4 chiffres requis"
                    )}
                  </div>
                </Champ>
              </div>
            )}

            {/* Étape 3 — Validation */}
            {etape === 3 && (
              <div>
                <div className="flex flex-col items-center text-center mb-5">
                  <span className="w-12 h-12 rounded-full bg-[#E7F0EC] text-[#1E7D67] flex items-center justify-center">
                    <Icon name="fact_check" filled className="text-[26px]" aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-[15px] font-medium text-[#2B2A27]">Vérifiez les informations</p>
                  <p className="text-[13px] text-[#6F6B60]">Relisez le récapitulatif avant de finaliser.</p>
                </div>
                <div className="rounded-[12px] border border-[#E6E1D4] divide-y divide-[#E6E1D4] overflow-hidden">
                  {[
                    ["Nom et prénom", form.nom, false, false],
                    ["Fonction", form.fonction, false, false],
                    ["Département", form.departement, false, false],
                    ["Agence", form.agence, false, false],
                    ["Empreinte", empreinteOk ? "Enregistrée (3 passages)" : "Non capturée", false, empreinteOk],
                    ["Badge RFID", form.badge, true, false],
                    ["Code PIN", form.pin ? "••••" : "", true, false],
                  ].map(([k, v, mono, ok]) => (
                    <div key={k} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                      <span className="text-[13px] text-[#6F6B60]">{k}</span>
                      <span className={`text-[13px] text-right ${ok ? "text-[#1E7D67] font-medium" : "text-[#2B2A27]"} ${mono ? "font-mono tabular-nums" : ""}`}>{v || "—"}</span>
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2.5 mt-4 text-[13px] text-[#2B2A27] cursor-pointer select-none">
                  <input type="checkbox" checked={atteste} onChange={(e) => setAtteste(e.target.checked)} className="w-4 h-4 rounded accent-[#1E7D67]" />
                  J'atteste l'exactitude des informations saisies.
                </label>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-7 pt-5 border-t border-[#E6E1D4]">
            <button
              onClick={precedent}
              disabled={etape === 0}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[9px] border border-[#DAD4C5] text-[13.5px] font-medium text-[#2B2A27] transition hover:bg-[#FBF9F4] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <Icon name="arrow_back" className="text-[16px]" aria-hidden="true" />
              Précédent
            </button>
            {etape < 3 ? (
              <button
                onClick={suivant}
                disabled={!etapeValide}
                className="inline-flex items-center gap-1.5 h-10 px-5 rounded-[9px] bg-[#1E7D67] text-white text-[13.5px] font-medium shadow-[0_6px_16px_-6px_rgba(30,125,103,0.5)] transition hover:bg-[#1C5C50] active:translate-y-px disabled:bg-[#A39E90] disabled:shadow-none disabled:cursor-not-allowed"
              >
                Continuer
                <Icon name="arrow_forward" className="text-[16px]" aria-hidden="true" />
              </button>
            ) : (
              <button
                onClick={terminer}
                disabled={!atteste}
                className="inline-flex items-center gap-1.5 h-10 px-5 rounded-[9px] bg-[#1E7D67] text-white text-[13.5px] font-medium shadow-[0_6px_16px_-6px_rgba(30,125,103,0.5)] transition hover:bg-[#1C5C50] active:translate-y-px disabled:bg-[#A39E90] disabled:shadow-none disabled:cursor-not-allowed"
              >
                <Icon name="check" className="text-[16px]" aria-hidden="true" />
                Terminer l'enrôlement
              </button>
            )}
          </div>
        </div>

        {/* Aperçu : badge + aide */}
        <aside className="lg:col-span-2 space-y-4">
          <BadgeEmploye form={form} photo={photo} empreinteOk={empreinteOk} matricule={matricule} pin={form.pin} />
          <div className="rounded-[14px] bg-[#E7F0EC] border border-[#1E7D67]/15 p-4 shadow-[0_4px_14px_-10px_rgba(22,70,61,0.2)]">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name={etapes[etape].icon} className="text-[#1C5C50] text-[18px]" filled aria-hidden="true" />
              <span className="text-[13px] font-medium text-[#1C5C50]">{etapes[etape].label}</span>
            </div>
            <p className="text-[12px] text-[#1C5C50]/80 leading-relaxed">{aide[etape]}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
