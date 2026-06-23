// MadMen Admin — coque desktop Tauri 2 du dashboard.
// Fondations : ouvre le dashboard, s'enregistre en autostart, expose la config locale.
// (tray + sidecar empreintes + passerelle K40 ajoutés dans les tâches suivantes du plan.)
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod config;

use tauri_plugin_autostart::ManagerExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            // Démarrage automatique avec Windows (enregistré au 1er lancement).
            let _ = app.handle().autolaunch().enable();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_config,
            commands::set_config
        ])
        .run(tauri::generate_context!())
        .expect("erreur au lancement de MadMen Admin");
}
