# MadMen — App admin + matériel biométrique : configuration & déploiement

> **But de ce fichier** : permettre à une future session Claude (ou à un humain) de
> remettre en route l'**app admin desktop** (dashboard + lecteur d'empreintes **Live20**
> + terminal de pointage **K40**) sur **n'importe quelle machine du bureau**, et de
> savoir ce que l'**installeur unique** doit embarquer pour que tout marche sans
> installation manuelle.
>
> Validé en conditions réelles le 2026-06-23 (Live20 + K40 fonctionnels de bout en bout).

---

## 1. Vue d'ensemble (lire en premier)

Le système biométrique vit **au bureau, sur le réseau local** (LAN). Deux appareils :

| Appareil | Type | Rôle | Accès |
|---|---|---|---|
| **Live20** (ZKTeco Live20R/SLK20R) | Lecteur d'empreintes **USB** | **Enrôler** (capturer le gabarit d'un doigt) | DLL native `libzkfp.dll` + agent `zkagent.exe` sur `http://127.0.0.1:8080` |
| **K40** (ZKTeco, plateforme ZLM60_TFT) | Pointeuse **réseau** | **Pointer** (l'employé pose le doigt → présence) | TCP/IP `192.168.1.201:4370`, protocole ZKTeco (pyzk / rats-zkteco) |

**Flux complet** : on capture une empreinte sur le **Live20** → on la **pousse sur le K40**
→ l'employé peut **pointer au doigt** sur le K40 → les pointages **remontent** dans l'API → le **dashboard** les affiche.

> ⚠️ **Le K40 et le Live20 ne sont joignables que depuis une machine du bureau** (même
> réseau que le K40, Live20 branché en USB). L'**API cloud** (`api-madmen.ssmanager.uk`)
> **ne les voit pas**. → Sur la machine du bureau, le dashboard doit pointer sur l'**API
> LOCALE** (voir §4), en mode **passerelle** (`K40_ROLE=gateway`).

---

## 2. Architecture & composants

```
┌─────────────────────────── PC du bureau (sur le LAN du K40) ───────────────────────────┐
│                                                                                          │
│  Dashboard React (Vite :5210)  ──► API PHP LOCALE (:8000, K40_ROLE=gateway) ──► MySQL    │
│   (app « MadMen Admin », Tauri)        │                                                  │
│         │                              ├─► pyzk (Python) ──TCP 4370──►  K40 (192.168.1.201)│
│         │                              │     (pull pointages + push gabarits)             │
│         └─► fetch :8080  ──►  zkagent.exe (agent empreintes)  ──►  Live20 (USB)           │
│                                  (libzkfpcsharp.dll + libzkfp.dll System32)               │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

| Composant | Emplacement | Rôle |
|---|---|---|
| **Dashboard** | `C:\dev\madmen\madmen-front-react-js` (Vite :5210) | UI admin ; devient l'app Tauri « MadMen Admin » (branche `feat/app-admin-tauri`) |
| **Agent empreintes** | `C:\dev\madmen\madmen-agent\zkagent.exe` (+ `libzkfpcsharp.dll`) | Expose le Live20 sur `127.0.0.1:8080` (`GET /status`, `POST /capture`) |
| **API PHP** | `C:\dev\madmen\madmen-api-php` (`php -S 0.0.0.0:8000 -t public`) | Backend + **passerelle K40** (`/api/k40/*`) quand `K40_ROLE=gateway` |
| **Pont pyzk** | `madmen-api-php/scripts/k40_push_template.py` | Push/suppression de gabarits sur le K40 (la lib PHP `rats/zkteco` ne sait pas écrire les empreintes) |
| **MySQL** | local (:3306) | Données (employés, empreintes chiffrées, pointages) |

---

## 3. Le matériel — ce dont chaque appareil a besoin

### 3.1 Live20 (lecteur d'empreintes USB)
- **Pilote / SDK ZKTeco ZKFinger** : la DLL native **`libzkfp.dll` doit être dans `C:\Windows\System32`**.
  Vérifier : `Test-Path C:\Windows\System32\libzkfp.dll`. Si absent → **installer le SDK
  ZKTeco ZKFinger** (l'utilisateur a l'installeur). C'est **le seul vrai pilote** du projet.
- L'agent `zkagent.exe` (.NET Framework 4, présent par défaut sur Win10/11) + `libzkfpcsharp.dll`
  (wrapper C#) doivent être **dans le même dossier**.
- **Lancer l'agent** : `cd madmen-agent ; ./zkagent.exe`. Vérifier : `curl http://127.0.0.1:8080/status`
  → `{"device":"zkteco","connected":true,"count":1}`.

### 3.2 K40 (pointeuse réseau)
- **Aucun pilote Windows** — c'est purement réseau (TCP 4370).
- Doit être sur le **même réseau** que le PC. Vérifier : `Test-NetConnection 192.168.1.201 -Port 4370`
  → `TcpTestSucceeded : True` (le **ping ICMP est souvent bloqué** sur le K40, c'est normal —
  seul le port 4370 compte).
- Config par défaut : **IP `192.168.1.201`, port `4370`, mot de passe `0`**.
- Test de connexion (pyzk) :
  ```python
  from zk import ZK
  zk = ZK("192.168.1.201", port=4370, timeout=10, password=0, ommit_ping=True)
  conn = zk.connect(); print(conn.get_firmware_version(), len(conn.get_users())); conn.disconnect()
  ```

---

## 4. Configurer une NOUVELLE machine du bureau (pas à pas)

**Pré-requis à installer** : Node 22, PHP 8.4, MySQL 8.4, Python 3 + `pip install pyzk`, Rust+Tauri
(si on build l'app), et le **SDK ZKTeco ZKFinger** (pour le Live20).

1. **Cloner les repos** (GitHub `sapieproductionsllc-afk`) sous `C:\dev\madmen\` :
   `madmen-api-php`, `madmen-front-react-js`, `madmen-agent`.
2. **Live20** : installer le SDK ZKTeco (→ `libzkfp.dll` dans System32), brancher le lecteur,
   lancer `madmen-agent\zkagent.exe`, vérifier `/status`.
3. **MySQL** : démarrer, importer la base, appliquer les migrations
   (`php database/migrate.php migrate` dans `madmen-api-php`).
4. **API locale** : créer `madmen-api-php\.env` avec (valeurs clés) :
   ```
   APP_ENV=local
   AUTH_ENABLED=false          # local uniquement ; true en prod
   DB_HOST=127.0.0.1 DB_PORT=3306 DB_NAME=madmen DB_USER=... DB_PASS=...
   K40_ENABLED=true
   K40_IP=192.168.1.201  K40_PORT=4370  K40_PASSWORD=0
   K40_ROLE=gateway            # IMPORTANT : la machine du bureau parle au K40
   K40_MODE=pull
   K40_PYTHON_BIN=C:\Python314\python.exe   # interpréteur qui a pyzk
   ```
   Lancer : `php -S 0.0.0.0:8000 -t public public/index.php`. Vérifier :
   `curl http://127.0.0.1:8000/api/k40/status` → `{"connected":true,...}`.
5. **Dashboard** : créer `madmen-front-react-js\.env` avec **`VITE_API_URL=http://127.0.0.1:8000`**
   (l'API LOCALE, pas le cloud — sinon le K40/Live20 ne marchent pas). `npm install ; npm run dev`
   (ou `npm run tauri:dev` pour l'app desktop).
6. **Tester** : page Appareils → K40 « En ligne » ; Enrôlement → capture d'empreinte ; le doigt pointe sur le K40.

---

## 5. L'installeur unique — ce qu'il DOIT embarquer (objectif)

Cible : **un seul `.msi` Tauri** (« MadMen Admin ») qu'on installe sur le PC du bureau, et
**tout marche sans installation manuelle**. Spec : `madmen-front-react-js/docs/superpowers/specs/2026-06-23-dashboard-tauri-bundle-design.md`. Plan : `docs/superpowers/plans/2026-06-23-app-admin-tauri-bundle.md`.

| À embarquer | État | Note |
|---|---|---|
| Dashboard (React) + coque Tauri 2 | ✅ scaffold fait (`src-tauri/`) | `npm run tauri:build` → `.msi` |
| `zkagent.exe` + `libzkfpcsharp.dll` (agent empreintes) | ✅ en **sidecar** (`externalBin`) | ✅ auto-lancement corrigé (2026-06-26) : `fingerprint.rs` garde le `CommandChild` dans l'état managé Tauri → l'agent reste vivant sur :8080. Plus besoin de le lancer à la main après un rebuild. |
| **SDK ZKTeco** (`libzkfp.dll` + driver USB Live20) | ⛔ **à faire** (Task 7) | embarquer l'installeur SDK + post-install silencieuse (NSIS hook PowerShell) |
| Passerelle K40 (parle au K40, push gabarits) | ⛔ **dépend encore de PHP local + Python pyzk** | objectif : **réécrire en Rust** dans Tauri (plan Task 5/6) pour ne plus dépendre de PHP/Python. En attendant, il faut PHP+MySQL+Python sur la machine |
| Auto-start + tray | ✅ prévu (plugin autostart) | tray/hide-on-close = Task 2 à finir |

> **Honnêteté** : aujourd'hui l'app n'est PAS encore 100 % autonome. Pour qu'une autre
> machine marche **maintenant**, suivre le §4 (installer PHP+MySQL+Python+SDK). Le vrai
> « un seul installeur » nécessite de finir : (a) embarquer le SDK ZKTeco, (b) réécrire la
> passerelle K40 en Rust (supprimer la dépendance PHP/Python), (c) corriger l'auto-spawn du sidecar.

---

## 6. Le flux enrôlement → pointage K40 (comment ça marche vraiment)

1. **Capture** : le front appelle `POST http://127.0.0.1:8080/capture` (agent Live20).
   L'agent **bloque jusqu'à 15 s** en attendant un doigt ; renvoie `{template (base64), quality}`
   ou `HTTP 408 "aucun doigt détecté"`. **Viser quality ~100.**
2. **Sauvegarde** : `POST /api/employes/{id}/biometrie {type:"empreinte", template}` →
   le gabarit est **chiffré AES-256-GCM** (`Crypto::encrypt`, réversible à l'octet près) et stocké.
3. **Push K40** : `POST /api/k40/push-fingerprints` → lit les gabarits, déchiffre, et via
   `k40_push_template.py` (pyzk) fait `set_user` (si absent) + `save_user_template` +
   **`refresh_data()`**.
4. L'employé **pointe au doigt** sur le K40 → reconnu.

**Côté dashboard** : l'enrôlement fait 2+3 automatiquement (page Enrôlement). Bouton
**« Synchroniser le K40 »** (page Appareils) = re-push de toutes les empreintes. Bouton
**« Modifier »** (fiche employé) = rouvre le wizard pré-rempli (corriger / re-capturer).

---

## 7. ⚠️ PIÈGES RENCONTRÉS (à connaître absolument)

1. **Le format de gabarit Live20 ↔ K40 EST compatible** — ça marche (testé). Ne pas
   conclure trop vite à une incompatibilité de format : si le K40 ne reconnaît pas, voir les points suivants.
2. **`refresh_data()` après le push est OBLIGATOIRE** : sans lui, le K40 **stocke** le gabarit
   (`get_templates` le montre, valide) mais ne le **matche jamais** — il ne le charge dans son
   moteur de reconnaissance qu'après `refresh_data()` **ou un redémarrage** du terminal.
   (Corrigé dans `k40_push_template.py`.)
3. **NE JAMAIS tuer l'agent `zkagent` avec `Stop-Process -Force`** : ça laisse le **handle USB
   du Live20 bloqué** → au relancement « initialisation du SDK ZKFinger échouée ». **Fix : débrancher/rebrancher le Live20 (reset USB).**
4. **Capture du doigt qui timeout (408)** : capteur à essuyer, **doigt un peu humide** (souffle
   dessus — un doigt trop sec ne marque pas sur l'optique), **appui franc et à plat**, et **maintenir**.
   Quand c'est bon → quality 100.
5. **pyzk** : utiliser **`force_udp=True`** et `ommit_ping=True` (le K40 bloque le ping). Pour
   `set_user` : **ne PAS recréer un user existant** (`set_user` lève « Can't set user ») → vérifier
   d'abord `get_users()` (le pont `k40_push_template.py` fait déjà ce `ensure_user`).
6. **Cloud vs local** : le dashboard sur le **cloud** affichera le K40 « Hors ligne » (le cloud ne
   voit pas le LAN). Au bureau → `VITE_API_URL=http://127.0.0.1:8000`. Le statut appareil est
   **stocké en base** (`/api/appareils`), pas un test live ; il est normalisé côté front
   (`en_ligne` → « En ligne »).

---

## 8. Config de référence (rappel rapide)

| Élément | Valeur |
|---|---|
| K40 | `192.168.1.201:4370`, password `0`, `K40_ROLE=gateway`, `K40_MODE=pull` |
| Agent empreintes | `http://127.0.0.1:8080` (`/status`, `/capture`) |
| API locale | `http://127.0.0.1:8000` (PHP 8.4, `php -S`) |
| MySQL | `127.0.0.1:3306`, base `madmen` |
| Dashboard (dev) | `http://localhost:5210` (Vite) ; `VITE_API_URL=http://127.0.0.1:8000` |
| Branches | front : `feat/app-admin-tauri` (app Tauri WIP) + `main` ; api : `main` |
| Scripts de secours (push direct, hors app) | `_archive/enroll_finger_to_k40.py` (capture Live20 + push K40) |

## 9. État / TODO (pour la prochaine session)
- ✅ Live20 capture + push K40 + reconnaissance (multi-personnes) + dashboard (sur API locale).
- ✅ Enrôlement + « Modifier » + « Synchroniser le K40 » dans le dashboard ; `refresh_data` ajouté.
- 🔜 Finir l'app **autonome** : embarquer le SDK ZKTeco (driver), réécrire la passerelle K40 en
  **Rust** (supprimer PHP/Python), corriger l'**auto-spawn** du sidecar `zkagent`, tray + autostart, build `.msi`.
- 🔜 Relais **K40 → cloud** (mode push/ADMS ou la passerelle pousse vers l'API cloud) pour que le
  dashboard **cloud** affiche aussi les pointages.
