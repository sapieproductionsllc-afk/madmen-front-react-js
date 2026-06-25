# Profile Navigation & Layout — Design Spec

**Status:** Approved (design) — 2026-06-25
**Scope:** Sub-project 1 of 3 in the "profile experience" redesign. Covers ONLY the
profile navigation / information architecture. The animated biometric **capture flow**
(sub-project 2) and the **pointages manager** (sub-project 3) are separate specs.

## Goal

Make the employee profile easy to navigate — collapse redundant, overlapping, and broken
actions into **2 clear buttons + 1 burger menu**, so an admin never gets lost between
"Modifier", "Plus de détails", and a settings popup that silently does nothing.

## Problem (current state)

The profile header (`BandeauAgent`, shared by `ProfilEmploye` and `ProfilDetails`) plus the
`ProfilEmploye` top bar expose **five** entry points, two of them broken and two redundant:

- **"Modifier"** (top bar) → routes to the full Enrolement edit form (`/enrolement/:numericId`).
- **"Plus de détails"** → routes to `ProfilDetails`, which *already* edits every field inline.
  → overlaps "Modifier".
- **⚙ "Paramètres"** (gear) → opens a "Modifier l'agent" modal whose save handler only mutates
  local React state + toasts — **it never calls the API** (silent data loss).
- **"Message"** (mail) → no-op stub, toast only.
- **"Paiements"** → works (keep).

## Decisions (locked with user)

1. The merged button opens the **rich details page** (`ProfilDetails`, inline editing). The
   Enrolement wizard is reserved for **creating new hires** only.
2. The burger menu contains: **Biométrie · Badge RFID · Régénérer le PIN · Suspendre/Archiver.**
3. The burger opens as a **dropdown popover** anchored to the icon (not a slide-out drawer).
4. The "Message" stub, the broken Settings modal, and the duplicate "Modifier" are removed.

## Design

### New header action row (`BandeauAgent`)

```
(avatar)  Spireta KONBE                                   [ ≡ ]   ← burger (top-right)
          Gardien · Sécurité · EMP-0013
          ✉ email   ☎ phone                  Salaire ••••  👁

   [ 💳 Paiements ]        [ 📋 Détails & modification ]
```

- **Détails & modification** — single primary action replacing BOTH "Modifier" and
  "Plus de détails". Prop-driven per page:
  - On `ProfilEmploye` → label "Détails & modification", routes to `/employes/:id/details`.
  - On `ProfilDetails` → label "Retour à la présence", routes to `/employes/:id` (you are
    already on the details page, so it becomes the back action).
- **Paiements** — unchanged.
- **≡ Burger** — replaces the ⚙ gear; same on both pages.

### Burger dropdown (`MenuBurgerProfil`, new component)

```
┌─────────────────────────────┐
│ 👆  Biométrie               │
│ 🪪  Badge RFID              │
│ 🔑  Régénérer le PIN        │
│ ───────────────────────     │
│ ⏸  Suspendre / Archiver    │   ← danger (rose) styling
└─────────────────────────────┘
```

Behaviors:
- **Biométrie** → opens `BiometrieModal` (new): lists the employee's enrolled biometrics
  (`GET /api/employes/{numericId}/biometrie`), allows **delete**
  (`DELETE /api/biometrie/{id}`), and exposes a **"Capturer une empreinte"** entry point.
  The capture *internals* (animated Live20R, hand/finger picker, 80% quality, put/remove/
  replace) are **sub-project 2** — for this sub-project the modal renders the list/delete and
  a capture button that opens the existing capture path as a stopgap (clearly the seam where
  sub-project 2 plugs in).
- **Badge RFID** → opens the existing `BadgeModal` (already implemented).
- **Régénérer le PIN** → `POST /api/employes/{numericId}/regenerer-pin`; show the returned
  `code_pin_genere` in a confirmation toast/modal.
- **Suspendre / Archiver** → confirm dialog, then `PUT /api/employes/{numericId}` with the
  new `statut` (`suspendu` / `archive`). Danger styling.

### Behavior details

- Burger closes on outside-click and on Escape; only one menu open at a time.
- The burger is keyboard-accessible (button with `aria-haspopup`, menu items focusable).
- The masked-salary toggle, avatar, identity, and contact lines in `BandeauAgent` are
  unchanged.

## Components

| File | Change |
|---|---|
| `src/components/ui/BandeauAgent.jsx` | Remove "Message" button, the ⚙ settings button + its local-only `<Modal>`/`enregistrer`. Replace the `onPlus` button with the merged "Détails & modification" (prop-driven label/route). Add `<MenuBurgerProfil>` in the top-right. |
| `src/components/ui/MenuBurgerProfil.jsx` | **New.** Dropdown popover (icon button + menu). Props: `numericId`, `matricule`, `onBiometrie`, `onBadge` (open existing modals), and self-contained PIN-regen + suspend/archive calls. Outside-click + Escape close. |
| `src/components/ui/BiometrieModal.jsx` | **New (shell).** Lists enrolled biometrics + delete; "Capturer" button is the seam for sub-project 2. |
| `src/pages/ProfilEmploye.jsx` | Remove the top-bar "Modifier" button. Pass merged-button props + burger handlers to `BandeauAgent`. |
| `src/pages/ProfilDetails.jsx` | Merged button becomes "Retour à la présence". Pass burger handlers. Keep existing `BadgeModal` wiring (now triggered from the burger). |

## API endpoints (all already exist — no backend change)

- `GET /api/employes/{numericId}/biometrie` — list enrolled biometrics.
- `DELETE /api/biometrie/{id}` — delete one.
- `POST /api/employes/{numericId}/regenerer-pin` — returns `{ code_pin_genere }`.
- `PUT /api/employes/{numericId}` — update `statut` for suspend/archive.

> Note: confirm `PUT /api/employes/{numericId}` accepts a `statut` change during planning; if
> not, add a minimal `statut` handler (in-scope, backend). Everything else is pure frontend.

## Out of scope (separate specs)

- **Sub-project 2 — Biometric capture flow:** animated Live20R, hand/finger picker, 80%
  quality gate, put/remove/replace guidance, import. Requires C# agent upgrade (real quality +
  multi-sample). The `BiometrieModal` "Capturer" button is the integration seam.
- **Sub-project 3 — Pointages manager:** fixing the empty/unwired `Pointages.jsx`.

## Acceptance criteria

- Profile header shows exactly: Paiements, Détails & modification, ≡ burger. No "Message", no
  ⚙ settings modal, no separate "Modifier".
- "Détails & modification" opens `ProfilDetails`; on `ProfilDetails` the button is "Retour à la
  présence" → `ProfilEmploye`.
- Burger opens/closes correctly and each of the 4 items performs its action against the real
  API (biometrics list+delete, badge modal, PIN regen shows a PIN, suspend/archive flips
  `statut` and persists).
- No action is a silent no-op (the previous Settings-modal bug is gone).
