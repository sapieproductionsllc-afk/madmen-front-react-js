# App admin « MadMen Admin » (Tauri tout-en-un) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer le dashboard `madmen-front-react-js` en une application desktop Tauri 2 unique qui embarque le dashboard, l'agent d'empreintes Live20 (`zkagent.exe` en sidecar) et une passerelle K40 native (Rust), installable en un seul `.msi` sans aucune installation manuelle de pilote.

**Architecture:** Approche B (hybride). La coque Tauri 2 (Rust) sert la fenêtre + le tray + l'autostart, lance/surveille `zkagent.exe` (empreintes, HTTP `127.0.0.1:8080`), implémente la comm K40 en Rust (TCP 4370, protocole ZKTeco : pull pointages + push gabarits), et relaie les pointages vers l'API cloud. L'installeur embarque le SDK ZKTeco et l'installe en silencieux en post-install.

**Tech Stack:** Tauri 2, Rust (tokio, serde), `tauri-plugin-autostart`, React/Vite (existant), NSIS (bundle `.msi`), `zkagent.exe` (.NET 4, sidecar). Plan B : sidecar `pyzk` compilé (PyInstaller) pour le push gabarit si le Rust bloque.

**Spec de référence:** `docs/superpowers/specs/2026-06-23-dashboard-tauri-bundle-design.md`

**Modèle à copier:** l'app Tauri 2 existante `C:\dev\madmen\app-en-mode-kiosque` (config, autostart, tray, build `.msi`).

---

## File Structure (décomposition)

```
madmen-front-react-js/
  package.json                         # MODIFIER : scripts tauri + devDeps @tauri-apps/cli, dep @tauri-apps/api
  src/lib/tauri.js                     # CRÉER : pont front -> commandes Tauri (détecte Tauri, sinon no-op web)
  src-tauri/                           # CRÉER : backend Rust de l'app
    Cargo.toml                         # deps Rust
    build.rs                           # build script Tauri
    tauri.conf.json                    # identité, bundle (externalBin sidecar, resources SDK, msi), tray
    icons/                             # icônes (copiées du kiosque)
    binaries/                          # zkagent-<triple>.exe + libzkfpcsharp.dll (sidecar)
    resources/
      zkteco-sdk/READIME.md            # emplacement où déposer l'installeur SDK ZKTeco
      scripts/install-driver.ps1       # post-install silencieuse du SDK ZKTeco
    src/
      main.rs                          # entrée Tauri : setup, tray, autostart, spawn sidecar, register commands
      config.rs                        # réglages locaux (K40 ip/clé, api url, intervalle) : load/save JSON
      fingerprint.rs                   # spawn/monitor zkagent ; commande capturer_empreinte (proxy 8080)
      api.rs                           # client API cloud : relai pointages + envoi gabarit
      commands.rs                      # commandes Tauri exposées à React
      k40/
        mod.rs                         # API publique du module K40
        protocol.rs                    # protocole ZKTeco (framing, connect, read logs, push template)
        sync.rs                        # boucle périodique pull -> relai API ; curseur anti-doublon ; file d'attente
```

**Principe de frontières :** le front React n'accède au matériel QUE via des commandes Tauri (`invoke`). `fingerprint.rs` ne connaît que le HTTP local de `zkagent`. `k40/protocol.rs` ne connaît que les octets du protocole terminal ; `k40/sync.rs` orchestre ; `api.rs` ne connaît que l'API cloud. Chaque fichier a une responsabilité unique et testable.

**Branche de travail :** `feat/app-admin-tauri` (ne pas committer sur `main` tant que non vérifié).

---

## Task 1 : Scaffold Tauri 2 dans le dépôt (branche + structure + build dev)

**Files:**
- Create: `src-tauri/Cargo.toml`, `src-tauri/build.rs`, `src-tauri/tauri.conf.json`, `src-tauri/src/main.rs`, `src-tauri/icons/*`
- Modify: `package.json` (scripts + deps Tauri)
- Modèle: `C:\dev\madmen\app-en-mode-kiosque\src-tauri\*`

- [ ] **Step 1 : Créer la branche**

```bash
cd /c/dev/madmen/madmen-front-react-js
git checkout -b feat/app-admin-tauri
```

- [ ] **Step 2 : Copier la base Tauri du kiosque et l'adapter**

Copier `app-en-mode-kiosque/src-tauri/{Cargo.toml,build.rs,icons}` vers `madmen-front-react-js/src-tauri/`. Dans `Cargo.toml`, renommer le paquet (`name = "madmen-admin"`), garder les deps tauri 2 + `tauri-plugin-autostart`. Créer `tauri.conf.json` adapté :

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "MadMen Admin",
  "version": "0.1.0",
  "identifier": "com.madmen.dashboard",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5210",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [{ "title": "MadMen Admin", "width": 1280, "height": 800, "resizable": true }],
    "security": { "csp": null }
  },
  "bundle": {
    "active": true,
    "targets": ["nsis"],
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.ico"]
  }
}
```

- [ ] **Step 3 : main.rs minimal qui ouvre le dashboard**

```rust
// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .run(tauri::generate_context!())
        .expect("erreur au lancement de MadMen Admin");
}
```

- [ ] **Step 4 : package.json — scripts + deps**

Ajouter dans `package.json` : devDependency `@tauri-apps/cli` (v2), dependency `@tauri-apps/api` (v2), et les scripts :
```json
"tauri": "tauri",
"tauri:dev": "tauri dev",
"tauri:build": "tauri build"
```
Puis `npm install`.

- [ ] **Step 5 : Vérifier que le Rust compile**

Run: `cd src-tauri && cargo check`
Expected: compilation OK (warnings tolérés). Si le toolchain Rust/Tauri manque, l'installer (`rustup`, `cargo install tauri-cli --version "^2"`).

- [ ] **Step 6 : Vérifier le lancement dev**

Run: `npm run tauri:dev`
Expected: une fenêtre desktop s'ouvre et affiche le dashboard (le `npm run dev` Vite est lancé par Tauri sur 5210).

- [ ] **Step 7 : Commit**

```bash
git add src-tauri package.json package-lock.json
git commit -m "feat(tauri): scaffold app desktop MadMen Admin (Tauri 2)"
```

---

## Task 2 : Tray + autostart + fenêtre cachée en fond

**Files:**
- Modify: `src-tauri/src/main.rs`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` (feature `tray-icon`)

- [ ] **Step 1 : Activer l'icône de tray (Cargo + conf)**

Dans `Cargo.toml`, activer la feature tauri `tray-icon`. Dans `tauri.conf.json` `app`, ajouter :
```json
"trayIcon": { "iconPath": "icons/icon.ico", "tooltip": "MadMen Admin — passerelle active" }
```

- [ ] **Step 2 : main.rs — menu tray (Afficher / Quitter) + fermer = cacher**

```rust
use tauri::{menu::{Menu, MenuItem}, tray::TrayIconBuilder, Manager, WindowEvent};

// dans .setup(|app| { ... }) :
let show = MenuItem::with_id(app, "show", "Afficher le dashboard", true, None::<&str>)?;
let quit = MenuItem::with_id(app, "quit", "Quitter", true, None::<&str>)?;
let menu = Menu::with_items(app, &[&show, &quit])?;
TrayIconBuilder::new()
    .icon(app.default_window_icon().unwrap().clone())
    .menu(&menu)
    .on_menu_event(|app, e| match e.id().as_ref() {
        "show" => { if let Some(w) = app.get_webview_window("main") { let _ = w.show(); let _ = w.set_focus(); } }
        "quit" => app.exit(0),
        _ => {}
    })
    .build(app)?;
```
Et intercepter la fermeture de fenêtre pour cacher au lieu de quitter :
```rust
.on_window_event(|window, event| {
    if let WindowEvent::CloseRequested { api, .. } = event {
        let _ = window.hide();
        api.prevent_close();
    }
})
```

- [ ] **Step 3 : Activer l'autostart au 1er lancement**

Dans `.setup`, enregistrer l'autostart :
```rust
use tauri_plugin_autostart::ManagerExt;
let _ = app.autolaunch().enable();
```

- [ ] **Step 4 : Vérifier**

Run: `npm run tauri:dev`
Expected: fermer la fenêtre la cache (icône tray reste) ; clic tray « Afficher » la rouvre ; « Quitter » ferme l'app.

- [ ] **Step 5 : Commit**

```bash
git add src-tauri
git commit -m "feat(tauri): tray + autostart + fermeture en arrière-plan"
```

---

## Task 3 : Réglages locaux (config.rs) + commandes + écran de config

**Files:**
- Create: `src-tauri/src/config.rs`, `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/main.rs` (mod + invoke_handler)
- Create (front): `src/lib/tauri.js`, un écran de réglages React (réutiliser le style existant)

- [ ] **Step 1 : Test unitaire de (dé)sérialisation de la config**

```rust
// en bas de src-tauri/src/config.rs
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn config_roundtrip_defaults() {
        let c = Config::default();
        let s = serde_json::to_string(&c).unwrap();
        let back: Config = serde_json::from_str(&s).unwrap();
        assert_eq!(back.intervalle_sync_sec, 30);
        assert_eq!(back.api_url, "https://api-madmen.ssmanager.uk");
    }
}
```

- [ ] **Step 2 : Lancer le test (échoue : Config n'existe pas)**

Run: `cd src-tauri && cargo test config_roundtrip_defaults`
Expected: FAIL (type `Config` inexistant).

- [ ] **Step 3 : Implémenter config.rs**

```rust
// src-tauri/src/config.rs
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub api_url: String,
    pub api_token: Option<String>,
    pub k40_ip: String,
    pub k40_port: u16,
    pub k40_password: u32,
    pub intervalle_sync_sec: u64,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            api_url: "https://api-madmen.ssmanager.uk".into(),
            api_token: None,
            k40_ip: "192.168.1.201".into(),
            k40_port: 4370,
            k40_password: 0,
            intervalle_sync_sec: 30,
        }
    }
}

fn chemin(app_dir: &PathBuf) -> PathBuf { app_dir.join("config.json") }

pub fn charger(app_dir: &PathBuf) -> Config {
    fs::read_to_string(chemin(app_dir))
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

pub fn sauver(app_dir: &PathBuf, c: &Config) -> std::io::Result<()> {
    fs::create_dir_all(app_dir)?;
    fs::write(chemin(app_dir), serde_json::to_string_pretty(c).unwrap())
}
```

- [ ] **Step 4 : Lancer le test (passe)**

Run: `cd src-tauri && cargo test config_roundtrip_defaults`
Expected: PASS.

- [ ] **Step 5 : Commandes Tauri get/set config**

```rust
// src-tauri/src/commands.rs
use crate::config::{charger, sauver, Config};
use tauri::{AppHandle, Manager};

fn app_dir(app: &AppHandle) -> std::path::PathBuf {
    app.path().app_config_dir().expect("app_config_dir")
}

#[tauri::command]
pub fn get_config(app: AppHandle) -> Config { charger(&app_dir(&app)) }

#[tauri::command]
pub fn set_config(app: AppHandle, config: Config) -> Result<(), String> {
    sauver(&app_dir(&app), &config).map_err(|e| e.to_string())
}
```
Brancher dans `main.rs` : `mod config; mod commands;` + `.invoke_handler(tauri::generate_handler![commands::get_config, commands::set_config])`.

- [ ] **Step 6 : Pont front + écran de réglages**

```js
// src/lib/tauri.js
export const estTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
export async function invokeTauri(cmd, args) {
  if (!estTauri()) return null;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke(cmd, args);
}
```
Ajouter une page « Réglages passerelle » (IP/port/clé K40, URL API, intervalle) qui lit `get_config` au montage et écrit via `set_config`. Réutiliser les composants UI existants (Input, Button). N'afficher cette page que si `estTauri()`.

- [ ] **Step 7 : Vérifier + commit**

Run: `npm run tauri:dev` → modifier un réglage, recharger → la valeur persiste.
```bash
git add src-tauri src/lib/tauri.js src/pages
git commit -m "feat(tauri): réglages locaux (config passerelle) + commandes + écran"
```

---

## Task 4 : Sidecar empreintes (zkagent.exe) — embarquer, lancer, capturer

**Files:**
- Create: `src-tauri/binaries/zkagent-<triple>.exe` (+ `libzkfpcsharp.dll`), `src-tauri/src/fingerprint.rs`
- Modify: `src-tauri/tauri.conf.json` (externalBin + resources), `src-tauri/Cargo.toml` (reqwest), `src-tauri/src/main.rs`, `commands.rs`
- Source des binaires: `C:\dev\madmen\madmen-agent\{zkagent.exe, libzkfpcsharp.dll}`

- [ ] **Step 1 : Placer le sidecar au bon nom**

Tauri exige le suffixe target-triple. Sur Windows x64 :
```bash
mkdir -p src-tauri/binaries
cp /c/dev/madmen/madmen-agent/zkagent.exe "src-tauri/binaries/zkagent-x86_64-pc-windows-msvc.exe"
cp /c/dev/madmen/madmen-agent/libzkfpcsharp.dll src-tauri/binaries/
```

- [ ] **Step 2 : Déclarer le sidecar + la dll dans tauri.conf.json**

```json
"bundle": {
  "externalBin": ["binaries/zkagent"],
  "resources": ["binaries/libzkfpcsharp.dll"]
}
```
Activer la permission shell sidecar (capabilities Tauri 2) : ajouter `shell:allow-execute` / `shell:allow-spawn` pour le sidecar `zkagent` dans `src-tauri/capabilities/default.json`.

- [ ] **Step 3 : fingerprint.rs — lancer le sidecar au démarrage**

```rust
// src-tauri/src/fingerprint.rs
use tauri::AppHandle;
use tauri_plugin_shell::{ShellExt, process::CommandChild};
use std::sync::Mutex;

pub static AGENT: Mutex<Option<CommandChild>> = Mutex::new(None);

pub fn demarrer(app: &AppHandle) {
    if let Ok(cmd) = app.shell().sidecar("zkagent") {
        if let Ok((_, child)) = cmd.spawn() {
            *AGENT.lock().unwrap() = Some(child);
        }
    }
}
```
Appeler `fingerprint::demarrer(app.handle())` dans `.setup`. Ajouter `tauri-plugin-shell` aux deps.

- [ ] **Step 4 : Commande capturer_empreinte (proxy vers 127.0.0.1:8080)**

```rust
// dans commands.rs
#[derive(serde::Serialize)]
pub struct Capture { pub template: String, pub quality: i32 }

#[tauri::command]
pub async fn capturer_empreinte() -> Result<Capture, String> {
    let r = reqwest::Client::new()
        .post("http://127.0.0.1:8080/capture")
        .send().await.map_err(|e| e.to_string())?;
    let j: serde_json::Value = r.json().await.map_err(|e| e.to_string())?;
    Ok(Capture {
        template: j["template"].as_str().unwrap_or("").to_string(),
        quality: j["quality"].as_i64().unwrap_or(0) as i32,
    })
}
```
Ajouter `reqwest` (features `json`) aux deps + enregistrer la commande.

- [ ] **Step 5 : Front — bouton d'enrôlement**

Dans l'écran profil employé (mode Tauri), ajouter « Enrôler l'empreinte » → `invokeTauri("capturer_empreinte")` → affiche la qualité ; stocke le `template` pour l'étape K40/API (Task 5/6). Gérer l'erreur « lecteur absent ».

- [ ] **Step 6 : Vérifier (avec le Live20 branché) + commit**

Run: `npm run tauri:dev`, brancher le Live20, cliquer « Enrôler » → capture renvoie un template + qualité.
```bash
git add src-tauri src/pages src/lib
git commit -m "feat(tauri): sidecar empreintes zkagent + commande de capture"
```

> ⚠️ Nécessite le SDK ZKTeco installé sur la machine de dev (Task 7 l'embarque pour la prod).

---

## Task 5 : Passerelle K40 (Rust) — PULL des pointages + relai API

**Files:**
- Create: `src-tauri/src/k40/mod.rs`, `src-tauri/src/k40/protocol.rs`, `src-tauri/src/k40/sync.rs`, `src-tauri/src/api.rs`
- Modify: `src-tauri/src/main.rs`, `Cargo.toml` (tokio)
- Références protocole: `C:\dev\madmen\madmen-api-php\src\Core\K40.php`, `scripts\k40_push_template.py` (pyzk), lib `rats/zkteco`.

- [ ] **Step 1 : Test unitaire du décodage d'un enregistrement de pointage**

```rust
// src-tauri/src/k40/protocol.rs (tests)
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn decode_attlog_record() {
        // 40 octets : uid(2) | user_id(24) | status(1) | timestamp(4) | type(1) | reserved(8)
        let mut rec = vec![0u8; 40];
        rec[2..6].copy_from_slice(b"1007");          // user_id ASCII
        rec[24] = 1;                                  // status
        let secs = encode_zk_time(2026, 6, 23, 8, 5, 0);
        rec[25..29].copy_from_slice(&secs.to_le_bytes());
        let p = parse_attlog(&rec).unwrap();
        assert_eq!(p.user_id, "1007");
        assert_eq!(p.datetime, "2026-06-23 08:05:00");
    }
}
```

- [ ] **Step 2 : Lancer (échoue) puis implémenter le framing protocole**

Run: `cd src-tauri && cargo test decode_attlog_record` → FAIL.
Implémenter dans `protocol.rs` : `encode_zk_time`/`decode_zk_time` (format ZK : `((y-2000)*12*31 + (m-1)*31 + (d-1)) * (24*60*60) + h*3600 + min*60 + s`), `struct Pointage { user_id: String, datetime: String, status: u8 }`, `parse_attlog(&[u8]) -> Option<Pointage>`. S'aligner sur le format de `pyzk`/`rats/zkteco` (paquets `CMD_*`, en-tête 8 octets, checksum). Implémenter `connect(ip, port, password) -> Conn`, `read_attlogs(&mut Conn) -> Vec<Pointage>` (CMD_ATTLOG_RRQ + lecture des chunks).

- [ ] **Step 3 : Lancer le test (passe)**

Run: `cd src-tauri && cargo test decode_attlog_record` → PASS.

- [ ] **Step 4 : Test du curseur anti-doublon**

```rust
// src-tauri/src/k40/sync.rs (tests)
#[test]
fn ne_remonte_pas_deux_fois() {
    let mut vus = Curseur::default();
    let p = Pointage { user_id: "1".into(), datetime: "2026-06-23 08:00:00".into(), status: 1 };
    assert!(vus.est_nouveau(&p));
    vus.marquer(&p);
    assert!(!vus.est_nouveau(&p));
}
```
Run: `cargo test ne_remonte_pas_deux_fois` → FAIL, puis implémenter `Curseur` (set de clés `user_id|datetime`, persisté dans le app_dir), → PASS.

- [ ] **Step 5 : api.rs — relai des pointages vers le cloud**

```rust
// src-tauri/src/api.rs
use crate::config::Config;
use crate::k40::protocol::Pointage;

pub async fn remonter(cfg: &Config, lots: &[Pointage]) -> Result<(), String> {
    let body = serde_json::json!({ "pointages": lots });
    let mut req = reqwest::Client::new().post(format!("{}/api/k40/pointages", cfg.api_url)).json(&body);
    if let Some(t) = &cfg.api_token { req = req.bearer_auth(t); }
    let r = req.send().await.map_err(|e| e.to_string())?;
    if r.status().is_success() { Ok(()) } else { Err(format!("HTTP {}", r.status())) }
}
```
> NOTE API : aligner l'endpoint `/api/k40/pointages` côté `madmen-api-php` (`K40Controller`) pour accepter un lot poussé par la passerelle (auth jeton admin). Ajouter cette route si absente.

- [ ] **Step 6 : sync.rs — boucle périodique**

```rust
pub fn lancer(app: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            let cfg = crate::config::charger(&app_dir(&app));
            if let Ok(mut conn) = crate::k40::protocol::connect(&cfg.k40_ip, cfg.k40_port, cfg.k40_password) {
                if let Ok(logs) = crate::k40::protocol::read_attlogs(&mut conn) {
                    let nouveaux = filtrer_curseur(&app, logs);
                    if !nouveaux.is_empty() {
                        if crate::api::remonter(&cfg, &nouveaux).await.is_ok() {
                            marquer_curseur(&app, &nouveaux);
                        }
                    }
                }
            }
            tokio::time::sleep(std::time::Duration::from_secs(cfg.intervalle_sync_sec)).await;
        }
    });
}
```
Appeler `k40::sync::lancer(app.handle().clone())` dans `.setup`. Exposer une commande `etat_passerelle()` (en ligne/hors ligne, dernier sync, en attente) pour le bandeau front.

- [ ] **Step 7 : Vérifier (avec un K40 sur le réseau) + commit**

Run: `npm run tauri:dev`, pointer au K40 → le pointage remonte dans l'API en < intervalle ; couper le réseau → rattrapage à la reprise.
```bash
git add src-tauri
git commit -m "feat(k40): passerelle pull pointages en Rust + relai API + anti-doublon"
```

---

## Task 6 : K40 — PUSH du gabarit d'empreinte (avec plan B pyzk)

**Files:**
- Modify: `src-tauri/src/k40/protocol.rs` (push_template), `commands.rs`
- Plan B: `src-tauri/binaries/k40push-<triple>.exe` (PyInstaller de `k40_push_template.py`)

- [ ] **Step 1 : Implémenter push_template en Rust**

Dans `protocol.rs`, ajouter `push_template(conn, user_id, finger_index, template_b64) -> Result<()>` en se calquant sur `pyzk.save_user_template` / `set_user_fingerprint` (CMD `USER_WRQ` + `TMP_WRQ`, désactivation device pendant l'écriture, refresh data). Décoder le base64 du `zkagent` vers le format attendu par le K40.

- [ ] **Step 2 : Test de framing du paquet template**

```rust
#[test]
fn template_packet_a_la_bonne_taille() {
    let tmpl = vec![0u8; 512];
    let pkt = build_tmp_wrq("1007", 6, &tmpl);
    assert!(pkt.len() > tmpl.len()); // en-tête + payload
    assert_eq!(&pkt[8..12], b"1007"[..4].as_ref()); // user_id placé
}
```
Run: `cargo test template_packet_a_la_bonne_taille` (FAIL → implémenter `build_tmp_wrq` → PASS).

- [ ] **Step 3 : Commande pousser_gabarit + branchement enrôlement**

```rust
#[tauri::command]
pub async fn pousser_gabarit(app: AppHandle, user_id: String, template: String) -> Result<(), String> {
    let cfg = crate::config::charger(&app_dir(&app));
    let mut conn = crate::k40::protocol::connect(&cfg.k40_ip, cfg.k40_port, cfg.k40_password).map_err(|e| e.to_string())?;
    crate::k40::protocol::push_template(&mut conn, &user_id, 6, &template).map_err(|e| e.to_string())
}
```
Côté front : après `capturer_empreinte` (Task 4), appeler `pousser_gabarit` + envoyer le gabarit à l'API (persistance).

- [ ] **Step 4 : Plan B (si le push Rust échoue à l'essai matériel)**

Compiler `madmen-api-php/scripts/k40_push_template.py` en exe autonome :
```bash
pip install pyinstaller pyzk
pyinstaller --onefile k40_push_template.py -n k40push
cp dist/k40push.exe "src-tauri/binaries/k40push-x86_64-pc-windows-msvc.exe"
```
Déclarer `binaries/k40push` en `externalBin` et, dans `pousser_gabarit`, basculer sur le sidecar (stdin JSON → stdout JSON) si le push Rust renvoie une erreur. NE faire cette étape QUE si le push Rust ne fonctionne pas en test réel.

- [ ] **Step 5 : Vérifier (Live20 + K40) + commit**

Enrôler une empreinte → l'employé peut pointer au doigt sur le K40.
```bash
git add src-tauri
git commit -m "feat(k40): push gabarit d'empreinte (Rust, fallback pyzk en réserve)"
```

---

## Task 7 : Installeur unique — embarquer + installer le SDK ZKTeco (driver Live20)

**Files:**
- Create: `src-tauri/resources/scripts/install-driver.ps1`
- Modify: `src-tauri/tauri.conf.json` (resources SDK + hook NSIS), placer l'installeur SDK dans `src-tauri/resources/zkteco-sdk/`

- [ ] **Step 1 : Déposer l'installeur SDK ZKTeco**

Copier le `.exe`/`.zip` SDK ZKFinger (fourni par l'utilisateur) dans `src-tauri/resources/zkteco-sdk/`. Déclarer en resource :
```json
"resources": ["binaries/libzkfpcsharp.dll", "resources/zkteco-sdk/*", "resources/scripts/*.ps1"]
```

- [ ] **Step 2 : Script d'install silencieuse du driver**

```powershell
# src-tauri/resources/scripts/install-driver.ps1
$ErrorActionPreference = "SilentlyContinue"
$sdk = Join-Path $PSScriptRoot "..\zkteco-sdk\ZKFingerSetup.exe"  # nom réel à adapter
if (Test-Path "$env:WINDIR\System32\libzkfp.dll") { exit 0 }      # déjà installé
if (Test-Path $sdk) { Start-Process -FilePath $sdk -ArgumentList "/S" -Wait }  # /S = silencieux (à confirmer selon l'installeur)
```

- [ ] **Step 3 : Hook NSIS post-install**

Ajouter un template NSIS (`installerHooks`) qui exécute le script en post-install :
```json
"bundle": { "windows": { "nsis": { "installerHooks": "./resources/scripts/hooks.nsi" } } }
```
`hooks.nsi` (macro `customInstall`) appelle :
`nsExec::Exec 'powershell -ExecutionPolicy Bypass -File "$INSTDIR\\resources\\scripts\\install-driver.ps1"'`

- [ ] **Step 4 : Détection au 1er lancement (filet de sécurité)**

Dans `.setup` : si `C:\Windows\System32\libzkfp.dll` absent, exposer un état/commande qui propose de relancer `install-driver.ps1` (au cas où le hook post-install a échoué).

- [ ] **Step 5 : Build de l'installeur**

Run: `npm run tauri:build`
Expected: `src-tauri/target/release/bundle/nsis/MadMen Admin_0.1.0_x64-setup.exe` produit. Tester l'install sur une VM/poste **sans** SDK → après install, `libzkfp.dll` présent, Live20 reconnu sans étape manuelle.

- [ ] **Step 6 : Commit**

```bash
git add src-tauri
git commit -m "feat(installer): embarque le SDK ZKTeco + post-install silencieuse du driver Live20"
```

---

## Task 8 : Vérification de bout en bout + doc d'install

**Files:**
- Create: `docs/INSTALL-ADMIN-APP.md`

- [ ] **Step 1 : Checklist de recette (sur poste neuf)**

Installer le `.msi` sur une machine propre. Vérifier dans l'ordre :
1. Install en un double-clic ; `libzkfp.dll` présent après install.
2. L'app démarre, vit dans le tray, redémarre au boot.
3. Live20 branché → enrôlement renvoie un template + le pousse au K40.
4. Pointage au K40 → remonte dans l'API en < intervalle.
5. Couper réseau cloud → file d'attente ; reprise → rattrapage. Couper l'app → rattrapage à la réouverture.

- [ ] **Step 2 : Rédiger docs/INSTALL-ADMIN-APP.md**

Documenter : pré-requis (Windows 10/11, .NET 4 présent par défaut), procédure d'install, réglages (IP/clé K40, URL API), dépannage (lecteur absent, K40 hors ligne).

- [ ] **Step 3 : Commit + ouverture de PR**

```bash
git add docs/INSTALL-ADMIN-APP.md
git commit -m "docs: guide d'installation de l'app admin + recette E2E"
git push -u origin feat/app-admin-tauri
```
Ouvrir une PR `feat/app-admin-tauri` → `main` pour relecture avant fusion.

---

## Self-Review

**Couverture spec :** §5 composants → Tasks 1-6 ; §6 flux (enrôlement T4+T6, sync T5, dashboard inchangé) ; §7 installeur → T7 ; §8 erreurs → gérées dans T4/T5/T7 + bandeau T5 ; §9 risque push gabarit → T6 + plan B ; §11 vérification → T8. ✅ Pas de section non couverte.

**Dépendances inter-tâches :** `Config` (T3) utilisé par T5/T6/T7 ; `Pointage` (T5) utilisé par `api.rs` (T5) et le curseur (T5) ; `capturer_empreinte` (T4) précède `pousser_gabarit` (T6). Noms cohérents (`connect`, `read_attlogs`, `push_template`, `Curseur`, `remonter`).

**Pré-requis externes (hors code, à fournir par l'utilisateur / à valider avec le matériel) :**
- Le **SDK ZKTeco** (installeur) + confirmer son **flag d'install silencieuse** (`/S` à ajuster) — Task 7.
- Un **K40 joignable** sur le LAN + le **Live20** branché pour les recettes T5/T6/T8.
- L'**endpoint API** `/api/k40/pointages` (relai passerelle) à ajouter/aligner côté `madmen-api-php` — noté en T5.
- Le **toolchain Rust/Tauri 2** (présent si le kiosque a déjà été buildé) — T1.

**Tâches réalisables SANS matériel (fondations, exécutables maintenant) :** T1, T2, T3 (et la structure de T4/T5 hors essai matériel). Les essais empreinte/K40 (T4 step6, T5 step7, T6 step5, T8) requièrent le matériel + le SDK et seront faits avec l'utilisateur.
