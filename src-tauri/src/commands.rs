//! Commandes Tauri exposées au front React (via `invoke`).
use crate::config::{charger, sauver, Config};
use tauri::{AppHandle, Manager};

fn app_dir(app: &AppHandle) -> std::path::PathBuf {
    app.path()
        .app_config_dir()
        .expect("dossier de configuration introuvable")
}

#[tauri::command]
pub fn get_config(app: AppHandle) -> Config {
    charger(&app_dir(&app))
}

#[tauri::command]
pub fn set_config(app: AppHandle, config: Config) -> Result<(), String> {
    sauver(&app_dir(&app), &config).map_err(|e| e.to_string())
}
