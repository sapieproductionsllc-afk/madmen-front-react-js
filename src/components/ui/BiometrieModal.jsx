import { useState, useEffect, useCallback, useRef } from "react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";
import Icon from "./Icon.jsx";
import { useUI } from "./UIProvider.jsx";
import { apiGet, apiPost, apiDelete } from "../../lib/api.js";

// Agent d'empreintes local (Live20R) — voir madmen-agent/zkagent.exe.
const AGENT_URL = "http://127.0.0.1:8080";
const PASSES = 3;

// Doigts par main (valeur API alignée sur K40Template::FINGER_MAP).
const MAIN_DROITE = [
  { v: "pouce_droit", l: "Pouce" },
  { v: "index_droit", l: "Index" },
  { v: "majeur_droit", l: "Majeur" },
  { v: "annulaire_droit", l: "Annul." },
  { v: "auriculaire_droit", l: "Auric." },
];
const MAIN_GAUCHE = [
  { v: "pouce_gauche", l: "Pouce" },
  { v: "index_gauche", l: "Index" },
  { v: "majeur_gauche", l: "Majeur" },
  { v: "annulaire_gauche", l: "Annul." },
  { v: "auriculaire_gauche", l: "Auric." },
];
const TOUS = [...MAIN_DROITE, ...MAIN_GAUCHE];
const labelDoigt = (v) => TOUS.find((d) => d.v === v)?.l ?? v ?? "—";
const slug = (n) =>
  (n || "employe").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "employe";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Animation du scanner — laser + révélation du gabarit + anneau de progression.
const SCANNER_CSS = `
@property --scan{syntax:"<number>";inherits:true;initial-value:0}
.bio-scanner{position:relative;width:200px;height:200px;display:grid;place-items:center;margin:0 auto}
.bio-ring{position:absolute;inset:0;transform:rotate(-90deg)}
.bio-ring circle{fill:none;stroke-linecap:round}
.bio-track{stroke:rgba(11,20,17,.08);stroke-width:5}
.bio-prog{stroke:#10b981;stroke-width:5;stroke-dasharray:540;filter:drop-shadow(0 0 4px rgba(52,211,153,.5));transition:stroke-dashoffset .6s cubic-bezier(.45,0,.15,1)}
.bio-well{position:relative;width:158px;height:158px;border-radius:50%;overflow:hidden;background:radial-gradient(120% 120% at 50% 30%,#0a2620,#04130e);box-shadow:inset 0 2px 14px rgba(0,0,0,.55),inset 0 0 0 1px rgba(52,211,153,.10)}
.bio-well::before{content:"";position:absolute;inset:0;opacity:.5;background-image:linear-gradient(rgba(52,211,153,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(52,211,153,.05) 1px,transparent 1px);background-size:12px 12px}
.bio-fp{position:absolute;inset:0;display:grid;place-items:center}
.bio-fp .material-symbols-rounded{font-size:96px;line-height:1}
.bio-fp.base .material-symbols-rounded{color:rgba(52,211,153,.16)}
.bio-well.scanning .bio-fp.base{animation:bioGlow 1.3s ease-in-out infinite}
.bio-fp.bright{clip-path:inset(0 0 calc((1 - var(--scan)) * 100%) 0)}
.bio-fp.bright .material-symbols-rounded{color:#34d399;filter:drop-shadow(0 0 6px rgba(52,211,153,.6))}
.bio-well.captured .bio-fp.bright{animation:bioReveal .55s ease-out forwards}
.bio-well.done .bio-fp.bright{clip-path:inset(0)}
.bio-well.done .bio-fp.bright .material-symbols-rounded{filter:drop-shadow(0 0 10px rgba(52,211,153,.9))}
.bio-laser{position:absolute;left:0;right:0;height:2px;top:6%;opacity:0;background:linear-gradient(90deg,transparent,#34d399,#eafff6,#34d399,transparent);box-shadow:0 0 14px 3px rgba(52,211,153,.8)}
.bio-well.scanning .bio-laser{opacity:1;animation:bioSweep 1.3s ease-in-out infinite}
.bio-pulse{position:absolute;width:158px;height:158px;border-radius:50%;border:2px solid #34d399;pointer-events:none;animation:bioPing .7s ease-out forwards}
.bio-check{position:absolute;width:44px;height:44px;border-radius:50%;background:#34d399;color:#04130e;display:grid;place-items:center;box-shadow:0 6px 18px rgba(15,157,110,.5);animation:bioPop .35s cubic-bezier(.34,1.56,.64,1)}
.bio-check .material-symbols-rounded{font-size:28px}
@keyframes bioSweep{0%{top:6%}50%{top:94%}100%{top:6%}}
@keyframes bioReveal{from{--scan:0}to{--scan:1}}
@keyframes bioGlow{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes bioPing{0%{transform:scale(.85);opacity:.7}100%{transform:scale(1.4);opacity:0}}
@keyframes bioPop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
`;

/**
 * Enrôlement biométrique animé : scanner Live20R (3 passages), vue par doigt,
 * sauvegarde/chargement de fichier. La capture pousse le gabarit côté API ; le pont
 * reporter le synchronise au K40. (Le seuil de qualité 80 % réel = upgrade agent à venir.)
 */
export default function BiometrieModal({ open, onClose, employe }) {
  const { toast } = useUI();
  const id = employe?._id ?? employe?.id;

  const [items, setItems] = useState([]);
  const [doigt, setDoigt] = useState("index_droit");
  const [phase, setPhase] = useState("idle"); // idle | scanning | captured | between | saving | done | error
  const [pass, setPass] = useState(0); // passages validés
  const [statusT, setStatusT] = useState("Prêt");
  const [statusS, setStatusS] = useState("Choisissez un doigt, puis démarrez");
  const [pulseKey, setPulseKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const charger = useCallback(() => {
    if (!id) return;
    apiGet(`/api/employes/${id}/biometrie`).then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => setItems([]));
  }, [id]);

  const reset = useCallback(() => {
    setPhase("idle"); setPass(0); setStatusT("Prêt"); setStatusS("Choisissez un doigt, puis démarrez");
  }, []);

  useEffect(() => { if (open) { charger(); reset(); } }, [open, charger, reset]);

  const empreinteParDoigt = {};
  items.filter((b) => b.type === "empreinte").forEach((b) => { empreinteParDoigt[b.doigt] = b; });

  const ringDone = phase === "done" ? PASSES : pass;
  const dashoffset = 540 * (1 - ringDone / PASSES);

  async function captureOne() {
    const ctrl = new AbortController();
    const minuteur = setTimeout(() => ctrl.abort(), 25000);
    try {
      const r = await fetch(`${AGENT_URL}/capture`, { method: "POST", body: "", signal: ctrl.signal });
      if (!r.ok) throw new Error("Lecture échouée");
      const j = await r.json();
      if (!j.template) throw new Error("Doigt non détecté");
      return j.template;
    } finally {
      clearTimeout(minuteur);
    }
  }

  const demarrer = async () => {
    if (busy || !id) return;
    setBusy(true); setPass(0);
    let last = null;
    try {
      for (let n = 1; n <= PASSES; n++) {
        setPhase("scanning");
        setStatusT("Posez le doigt…");
        setStatusS(n < PASSES ? `Passage ${n} sur ${PASSES}` : "Dernier passage");
        last = await captureOne();
        setPhase("captured"); setPass(n); setPulseKey((k) => k + 1);
        setStatusT("Capturé"); setStatusS("");
        await wait(650);
        if (n < PASSES) {
          setPhase("between");
          setStatusT(`Passage ${n} validé`); setStatusS("Retirez le doigt, puis reposez");
          await wait(900);
        }
      }
      setPhase("saving"); setStatusT("Enregistrement…"); setStatusS("");
      await apiPost(`/api/employes/${id}/biometrie`, { type: "empreinte", template: last, doigt });
      setPhase("done"); setStatusT("Empreinte enregistrée"); setStatusS(`${labelDoigt(doigt)} · qualité —`);
      toast(`Empreinte « ${labelDoigt(doigt)} » enregistrée`, "success");
      charger();
      await wait(1600);
      reset();
    } catch (err) {
      setPhase("error"); setStatusT("Capture interrompue");
      setStatusS(
        err?.name === "AbortError" ? "Délai dépassé — aucun doigt détecté"
          : err?.message === "Doigt non détecté" ? "Reposez le doigt bien à plat"
          : "Lecteur indisponible — l'agent est-il lancé ?"
      );
      toast("Capture interrompue", "error");
      await wait(2000);
      reset();
    } finally {
      setBusy(false);
    }
  };

  const supprimer = async (b) => {
    try {
      await apiDelete(`/api/biometrie/${b.id}`);
      toast(`Empreinte « ${labelDoigt(b.doigt)} » supprimée`, "success");
      charger();
    } catch {
      toast("Suppression impossible", "error");
    }
  };

  const enregistrerFichier = async () => {
    if (!id) return;
    try {
      const data = await apiGet(`/api/employes/${id}/biometrie/export`);
      if (!data?.count) { toast("Aucune empreinte à enregistrer", "info"); return; }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${slug(employe?.name)}-biometrie.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast("Biométrie téléchargée", "success");
    } catch {
      toast("Export impossible", "error");
    }
  };

  const chargerFichier = async (ev) => {
    const f = ev.target.files?.[0];
    ev.target.value = "";
    if (!f || !id) return;
    try {
      const data = JSON.parse(await f.text());
      const list = Array.isArray(data?.biometries) ? data.biometries : [];
      let ok = 0;
      for (const b of list) {
        if (b.type === "empreinte" && b.template_b64) {
          await apiPost(`/api/employes/${id}/biometrie`, { type: "empreinte", template: b.template_b64, doigt: b.doigt });
          ok++;
        } else if (b.type === "rfid" && b.badge_rfid) {
          await apiPost(`/api/employes/${id}/biometrie`, { type: "rfid", badge_rfid: b.badge_rfid }).catch(() => {});
        }
      }
      toast(ok ? `${ok} empreinte(s) importée(s)` : "Aucune empreinte dans le fichier", ok ? "success" : "info");
      charger();
    } catch {
      toast("Fichier invalide", "error");
    }
  };

  const wellCls = `bio-well${phase === "scanning" ? " scanning" : ""}${phase === "captured" ? " captured" : ""}${phase === "done" ? " done" : ""}`;

  const FingerChip = ({ d }) => {
    const enrolled = empreinteParDoigt[d.v];
    const sel = doigt === d.v;
    return (
      <div className="relative w-[34px] text-center">
        <button
          onClick={() => setDoigt(d.v)}
          disabled={busy}
          title={enrolled ? `${d.l} — enrôlé` : `${d.l} — libre`}
          className={`w-full h-8 rounded-lg border grid place-items-center transition-colors disabled:opacity-60
            ${enrolled ? "bg-emerald-50 border-emerald-400 text-emerald-600" : "bg-surface border-border text-subtle hover:border-emerald-400"}
            ${sel ? "ring-2 ring-emerald-500 ring-offset-1" : ""}`}
        >
          <Icon name="fingerprint" className="text-[16px]" />
        </button>
        {enrolled && !busy && (
          <button
            onClick={(e) => { e.stopPropagation(); supprimer(enrolled); }}
            title="Supprimer"
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white grid place-items-center hover:bg-rose-600"
          >
            <Icon name="close" className="text-[10px]" />
          </button>
        )}
        <span className="text-[8.5px] text-subtle font-mono block mt-1">{d.l}</span>
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title="Biométrie"
      subtitle={employe?.name}
      icon="fingerprint"
      footer={
        <>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={chargerFichier} />
          <Button variant="ghost" icon="upload_file" onClick={() => fileRef.current?.click()} disabled={busy}>Charger</Button>
          <Button variant="secondary" icon="download" onClick={enregistrerFichier} disabled={busy}>Enregistrer</Button>
          <Button variant="primary" icon={busy ? "progress_activity" : "play_arrow"} onClick={demarrer} disabled={busy}>
            {busy ? "Capture…" : "Démarrer la capture"}
          </Button>
        </>
      }
    >
      <style>{SCANNER_CSS}</style>

      <p className="text-center text-xs text-muted mb-3">
        Doigt sélectionné : <span className="font-semibold text-ink">{labelDoigt(doigt)}</span>
      </p>

      {/* Scanner animé */}
      <div className="bio-scanner">
        <svg className="bio-ring" viewBox="0 0 200 200" aria-hidden="true">
          <circle className="bio-track" cx="100" cy="100" r="86" />
          <circle className="bio-prog" cx="100" cy="100" r="86" style={{ strokeDashoffset: dashoffset }} />
        </svg>
        <div className={wellCls}>
          <div className="bio-fp base"><Icon name="fingerprint" /></div>
          <div className="bio-fp bright"><Icon name="fingerprint" /></div>
          <div className="bio-laser" />
        </div>
        {phase === "captured" && <div key={pulseKey} className="bio-pulse" />}
        {phase === "done" && <div className="bio-check"><Icon name="check" /></div>}
      </div>

      {/* Statut */}
      <div className="text-center mt-4 mb-2 min-h-[44px]">
        <p className="text-[15px] font-semibold text-ink">{statusT}</p>
        <p className="text-xs text-muted font-mono mt-0.5">{statusS}</p>
      </div>

      {/* Progression des passages */}
      <div className="flex justify-center gap-2 mb-4">
        {Array.from({ length: PASSES }).map((_, i) => (
          <span key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i < ringDone ? "bg-emerald-500" : "bg-border"}`} />
        ))}
      </div>

      {/* Vue par doigt */}
      <div className="border-t border-border pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle text-center mb-3">Empreintes par doigt</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-muted text-center mb-1.5">Main droite</p>
            <div className="flex justify-center gap-1.5">{MAIN_DROITE.map((d) => <FingerChip key={d.v} d={d} />)}</div>
          </div>
          <div>
            <p className="text-[11px] text-muted text-center mb-1.5">Main gauche</p>
            <div className="flex justify-center gap-1.5">{MAIN_GAUCHE.map((d) => <FingerChip key={d.v} d={d} />)}</div>
          </div>
        </div>
        <p className="text-[11px] text-subtle text-center mt-3">Vert = enrôlé · touchez un doigt pour le choisir, ✕ pour le supprimer.</p>
      </div>
    </Modal>
  );
}
