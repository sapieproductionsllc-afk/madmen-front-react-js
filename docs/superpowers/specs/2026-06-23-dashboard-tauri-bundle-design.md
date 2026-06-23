# App admin desktop (Tauri) « tout-en-un » — dashboard + empreintes Live20 + passerelle K40

> Spec de conception — 2026-06-23
> Projet principal : `madmen-front-react-js` (devient une app Tauri 2)
> Statut : **design approuvé** (par l'utilisateur), en attente de relecture de la spec avant plan d'implémentation.

## 1. Contexte & problème

Aujourd'hui, pour qu'un poste admin gère la biométrie MadMen/Watchmen, il faut **plusieurs installations séparées** :

1. Le **dashboard** React (`madmen-front-react-js`) lancé via un serveur de dev / navigateur.
2. L'**agent d'empreintes** `zkagent.exe` (C# .NET) qui expose le lecteur **Live20** USB sur `http://127.0.0.1:8080`.
3. Le **driver/SDK ZKTeco ZKFinger** (`libzkfp.dll` en `System32`) sans lequel l'agent échoue à l'initialisation.
4. Une **passerelle K40** (terminal de pointage réseau) qui, en l'état, repose sur PHP (`rats/zkteco`) + un script Python (`pyzk`).

L'admin doit donc installer des pilotes et lancer des briques à la main. **On veut une seule installation** : un installeur unique qui embarque tout et ne demande aucune install manuelle de pilote.

### Fait technique clé (lève une idée fausse)
- Le **K40 est un appareil RÉSEAU** (TCP/IP, port `4370`, protocole ZKTeco). **Il n'a besoin d'AUCUN pilote Windows.** « Un seul install » pour le K40 est gratuit.
- Le **seul vrai pilote** en jeu est celui du **lecteur d'empreintes Live20** (USB) : son SDK ZKTeco (`libzkfp.dll`) doit être présent. C'est lui qu'on embarque.

### Contrainte d'architecture réseau (la raison d'être de l'app)
L'**API est en cloud** (`https://api-madmen.ssmanager.uk`, Hetzner) et le **K40 est au bureau** (réseau privé). Le cloud **ne peut pas joindre** le K40. Aujourd'hui `K40_ROLE=cloud` → la récupération des pointages **n'est pas active en prod**. L'app, installée **sur un PC du bureau (même réseau que le K40)**, devient le **pont manquant**.

## 2. Objectifs

- **Une seule installation** (`.msi`/`.exe` Tauri) qui embarque : le dashboard, l'agent empreintes, le SDK/driver du Live20, et la passerelle K40 — **zéro install de pilote manuelle**.
- L'app tourne sur **un PC du bureau**, démarre avec Windows, vit **dans le tray** (fenêtre = dashboard ; fond = passerelle + agent).
- **Enrôlement d'empreintes** depuis l'app : capture Live20 → gabarit → poussé au K40 + envoyé à l'API.
- **Passerelle K40** : sync des pointages du terminal vers l'API cloud, **quasi temps réel tant que le PC est allumé** (intervalle réglable, défaut 30 s). Aucun pointage perdu (le K40 bufferise).

## 3. Non-objectifs (hors périmètre)

- Pas de fusion avec le **kiosque** `app-en-mode-kiosque` (`WatchMEN`) : ce sont 2 produits distincts. On **réutilise** sa recette de packaging Tauri 2, sans toucher au kiosque.
- Pas de **temps réel 24/7 indépendant d'un PC** (push K40→cloud ADMS, ou mini-passerelle dédiée). Décision : quasi temps réel quand le poste bureau est allumé. Le mode push pourra être ajouté plus tard.
- Pas de refonte de l'UI du dashboard ni de l'authentification (HTTPS + JWT admin inchangés).
- Pas d'embarquement de runtimes PHP/MySQL dans l'app (l'API reste hébergée ailleurs).

## 4. Décisions actées

| Sujet | Décision |
|---|---|
| Base de l'app | `madmen-front-react-js` devient une **app Tauri 2** (on y ajoute `src-tauri/`) |
| Approche de bundling | **B — Hybride** : agent empreintes en **sidecar réutilisé**, comm K40 **réécrite en Rust** |
| Empreintes (Live20) | `zkagent.exe` + `libzkfpcsharp.dll` embarqués en **sidecar** (`127.0.0.1:8080`) — réutilisés tels quels |
| Driver Live20 | **SDK ZKTeco ZKFinger** (fourni par l'utilisateur) embarqué → **post-install silencieuse** (`libzkfp.dll` + driver USB) |
| K40 | Module **Rust** : **pull** des pointages + **push** des gabarits (protocole ZKTeco TCP 4370) |
| Fraîcheur des pointages | **Quasi temps réel** quand le PC bureau est ON ; sync auto (défaut **30 s**, réglable) ; buffer K40 sinon |
| Cible matériel | **PC du bureau** avec Live20 branché + sur le **même réseau** que le K40 |
| Nom / identité | **MadMen Admin** — `productName: "MadMen Admin"`, `identifier: "com.madmen.dashboard"` |
| Plan B push gabarit | Si le push gabarit en Rust est trop dur → **mini-sidecar `pyzk` compilé** (PyInstaller, 1 `.exe`) **juste pour ce push** ; le reste reste en Rust |

## 5. Architecture & composants

Chaque brique a une responsabilité unique et une interface claire.

| Composant | Rôle | Techno / interface |
|---|---|---|
| **Coque Tauri** | Fenêtre, tray, autostart, lance/surveille les briques, expose des commandes au front | Rust (Tauri 2) ; commandes `invoke` |
| **Dashboard** | UI admin actuelle (inchangée) | React/Vite, build statique `dist/` |
| **Agent empreintes** | Capture Live20 → gabarit + qualité | `zkagent.exe` **sidecar**, HTTP `127.0.0.1:8080` (`GET /status`, `POST /capture`) |
| **Module K40 (Rust)** | Pull pointages, push gabarits, état terminal | Rust, socket TCP `K40_IP:4370` (protocole ZKTeco) |
| **Service de sync** | Boucle périodique pull → relais API, file d'attente, anti-doublon | Rust (tâche async, intervalle réglable) |
| **Réglages locaux** | IP/clé K40, URL API, intervalle, jeton admin | fichier config local (modèle du kiosque) |
| **Post-install** | Installe le SDK ZKTeco (driver + `libzkfp.dll`) en silencieux ; autostart | hook NSIS/MSI + script |

**Frontières :** le front ne parle JAMAIS au K40 directement — il passe par des commandes Tauri (`invoke`). L'agent empreintes reste une boîte noire HTTP locale. Le module K40 ne connaît que le protocole terminal + l'API.

## 6. Flux de données

### 6.1 Enrôlement d'une empreinte
1. Dashboard (employé sélectionné) → `invoke("capturer_empreinte")`.
2. La coque interroge `zkagent` (`POST 127.0.0.1:8080/capture`) → `{ template (base64), quality }` (attend le doigt, max 15 s).
3. Le module K40 **pousse le gabarit** au terminal (associé à l'`uid`/matricule de l'employé).
4. Le gabarit est aussi **envoyé à l'API cloud** (rattaché à l'employé) pour persistance / autres terminaux.
5. Retour UI : succès / qualité insuffisante / lecteur absent.

### 6.2 Synchronisation des pointages (passerelle)
1. Toutes les *X* s (défaut 30), le service de sync **lit les nouveaux pointages** du K40 (pull).
2. Il les **relaie à l'API cloud** (`POST /api/k40/sync` ou équivalent) avec dédoublonnage (curseur sur le dernier pointage remonté).
3. En cas d'échec réseau cloud → **file d'attente locale**, réessai au tick suivant (le K40 garde la source de vérité).
4. UI : bandeau d'état « terminal en ligne / hors ligne », dernier sync, compteur en attente.

### 6.3 Dashboard ↔ cloud
Inchangé : appels HTTPS + JWT admin vers `https://api-madmen.ssmanager.uk` (lecture employés, présence, paie, etc.).

## 7. L'installeur unique

Le `.msi` Tauri (cible Windows) contient **dans un seul fichier** :
- la coque Tauri + le dashboard buildé,
- `zkagent.exe` + `libzkfpcsharp.dll` (resources/sidecar),
- l'**installeur SDK ZKTeco** (fourni par l'utilisateur) en resource,
- une **étape post-install silencieuse** qui : installe le SDK (driver USB Live20 + `libzkfp.dll` en `System32`), puis enregistre l'**autostart** et l'icône tray.

Résultat : l'admin double-clique **une fois**, branche le Live20, et tout fonctionne. Le K40 ne demande aucune install (réseau).

## 8. Gestion des erreurs / cas limites

| Cas | Comportement |
|---|---|
| Lecteur Live20 débranché | Enrôlement affiche « lecteur absent » ; le reste du dashboard fonctionne |
| K40 injoignable (éteint / IP changée) | Bandeau « terminal hors ligne », réessais auto ; rien perdu (buffer K40) |
| App fermée / PC éteint | Pas de sync ; rattrapage complet à la réouverture |
| Pas de réseau cloud | Dashboard montre le dernier état ; file d'attente de remontée des pointages |
| SDK ZKTeco non installé (post-install échouée) | Détection au 1er lancement → propose de relancer l'install du pilote |
| Push gabarit K40 échoue | Message clair + retry ; bascule possible sur le plan B (sidecar pyzk) |

## 9. Risques & atténuations

- ⚠️ **Push de gabarit AU K40 en Rust** = partie la plus pointue (côté PHP, `rats/zkteco.setFingerprint` était cassé → recours à `pyzk`). **Atténuation :** garder en réserve un **mini-sidecar `pyzk` compilé** (PyInstaller, 1 `.exe`) dédié à ce seul push ; le **pull** des pointages reste en Rust (faible risque).
- **Protocole ZKTeco en Rust** : s'appuyer sur une crate existante si fiable, sinon implémenter le sous-ensemble nécessaire (connexion, lecture logs, upload template) en se calquant sur `pyzk`/`rats/zkteco`.
- **Driver USB silencieux** : l'install silencieuse du SDK ZKTeco dépend des options du `.exe` fourni ; à valider tôt (sinon fallback : install interactive au 1er lancement).
- **.NET Framework 4** requis par `zkagent.exe` : présent par défaut sur Windows 10/11 ; à documenter.

## 10. Dépendances / pré-requis

- Le **SDK/installeur ZKTeco ZKFinger** (fourni par l'utilisateur) — à intégrer aux resources de build.
- L'**API cloud** doit exposer/accepter le relais des pointages de la passerelle (`/api/k40/...`) avec auth (jeton admin / clé passerelle). À aligner avec `K40Controller` côté `madmen-api-php`.
- Toolchain : Rust + Tauri 2 CLI + Node (déjà utilisés par le kiosque).

## 11. Vérification (pas de framework de test lourd dans le projet)

1. **Build** : `npm run tauri build` produit un `.msi` unique ; install propre sur une VM/poste neuf.
2. **Post-install** : après install, `libzkfp.dll` présent ; le Live20 est reconnu sans étape manuelle.
3. **Enrôlement** : capture Live20 OK → gabarit poussé au K40 → l'employé peut pointer au doigt.
4. **Sync** : un pointage au K40 remonte dans l'API en < intervalle ; couper le réseau → rattrapage à la reprise ; couper l'app → rattrapage à la réouverture.
5. **Tray/autostart** : l'app redémarre au boot et tourne en fond.

## 12. Découpage pressenti (pour le plan d'implémentation)

1. **Scaffold Tauri 2** dans `madmen-front-react-js` (réutiliser la config du kiosque : autostart, tray, build `.msi`).
2. **Sidecar empreintes** : embarquer `zkagent.exe` + le lancer/surveiller depuis Rust ; commande `capturer_empreinte`.
3. **Module K40 (Rust) — pull** : connexion + lecture pointages + relais API + dédoublonnage + service de sync réglable.
4. **Module K40 (Rust) — push gabarit** (avec plan B pyzk en réserve).
5. **Réglages locaux** (IP/clé K40, URL API, intervalle) + écran de config.
6. **Installeur** : embarquer le SDK ZKTeco + étape post-install silencieuse + autostart.
7. **Vérification** de bout en bout (section 11).

> Chaque étape est livrable et vérifiable indépendamment.
