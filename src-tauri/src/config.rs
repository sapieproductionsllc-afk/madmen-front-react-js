//! Réglages locaux de la passerelle (persistés en JSON dans le dossier de config de l'app).
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

fn chemin(app_dir: &PathBuf) -> PathBuf {
    app_dir.join("config.json")
}

/// Charge la config ; renvoie les valeurs par défaut si absente/illisible.
pub fn charger(app_dir: &PathBuf) -> Config {
    fs::read_to_string(chemin(app_dir))
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

/// Écrit la config (crée le dossier au besoin).
pub fn sauver(app_dir: &PathBuf, c: &Config) -> std::io::Result<()> {
    fs::create_dir_all(app_dir)?;
    fs::write(chemin(app_dir), serde_json::to_string_pretty(c).unwrap())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn config_roundtrip_defaults() {
        let c = Config::default();
        let s = serde_json::to_string(&c).unwrap();
        let back: Config = serde_json::from_str(&s).unwrap();
        assert_eq!(back.intervalle_sync_sec, 30);
        assert_eq!(back.k40_port, 4370);
        assert_eq!(back.api_url, "https://api-madmen.ssmanager.uk");
    }
}
