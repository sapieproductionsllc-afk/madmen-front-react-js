// src/lib/api.js — Client API central (fetch + JWT). Branche le dashboard sur madmen-api-php.
// Ne change PAS le design : il fournit juste les VRAIES données à la place des mocks.

const BASE = import.meta.env.VITE_API_URL || "https://api-madmen.ssmanager.uk";
const TOKEN_KEY = "madmen_token";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t, remember) => {
  try {
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, t);
  } catch {
    /* ignore */
  }
};
export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const tok = getToken();
  if (tok) headers.Authorization = `Bearer ${tok}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    const err = new Error("Réseau indisponible — l'API est-elle démarrée ?");
    err.network = true;
    throw err;
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (res.status === 401) clearToken();
  if (!res.ok) {
    const err = new Error((data && data.error) || `Erreur HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const apiGet = (p) => request("GET", p);
export const apiPost = (p, b) => request("POST", p, b);
export const apiPut = (p, b) => request("PUT", p, b);
export const apiPatch = (p, b) => request("PATCH", p, b);
export const apiDelete = (p) => request("DELETE", p);

// Upload multipart d'une pièce jointe -> { id, nom_original, mime, taille, url }.
// Pas de Content-Type JSON : le navigateur pose lui-même la frontière multipart.
// `extra` (optionnel) : champs texte ajoutés au même FormData (ex. titre, type, description).
export async function apiUpload(path, file, champ = "fichier", extra = null) {
  const fd = new FormData();
  fd.append(champ, file);
  if (extra && typeof extra === "object") {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined && v !== null && v !== "") fd.append(k, v);
    }
  }
  const headers = {};
  const tok = getToken();
  if (tok) headers.Authorization = `Bearer ${tok}`;
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: fd });
  } catch {
    const err = new Error("Réseau indisponible — l'API est-elle démarrée ?");
    err.network = true;
    throw err;
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (res.status === 401) clearToken();
  if (!res.ok) {
    const err = new Error((data && data.error) || `Erreur HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Téléchargement authentifié d'un binaire (ex. pièce jointe /api/fichiers/{id}).
// La route exige l'en-tête Bearer : un <a href> nu renverrait 403. On récupère donc
// le blob avec le JWT puis on déclenche un téléchargement navigateur.
export async function apiDownload(path, nomFichier) {
  const headers = {};
  const tok = getToken();
  if (tok) headers.Authorization = `Bearer ${tok}`;
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method: "GET", headers });
  } catch {
    const err = new Error("Réseau indisponible — l'API est-elle démarrée ?");
    err.network = true;
    throw err;
  }
  if (res.status === 401) clearToken();
  if (!res.ok) {
    let msg = `Erreur HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.error) msg = data.error;
    } catch {
      /* ignore */
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  if (nomFichier) a.download = nomFichier;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Libère l'object URL après le déclenchement du téléchargement.
  setTimeout(() => URL.revokeObjectURL(objUrl), 10000);
}

// GET /api/rapports/export -> page HTML imprimable (PDF navigateur). La réponse
// n'est PAS du JSON et la route exige le JWT : on récupère le HTML avec l'en-tête
// Authorization puis on l'ouvre via une URL blob (window.open nu ne peut pas poser
// d'en-tête Bearer et serait rejeté en 401). `query` (optionnel) ex. "?service=Atelier".
export async function exportRapport(query = "") {
  const headers = {};
  const tok = getToken();
  if (tok) headers.Authorization = `Bearer ${tok}`;
  let res;
  try {
    res = await fetch(`${BASE}/api/rapports/export${query}`, { method: "GET", headers });
  } catch {
    const err = new Error("Réseau indisponible — l'API est-elle démarrée ?");
    err.network = true;
    throw err;
  }
  if (res.status === 401) clearToken();
  if (!res.ok) {
    const err = new Error(`Erreur HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const html = await res.text();
  const objUrl = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  window.open(objUrl, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(objUrl), 60000);
}

export const authLogin = (matricule, codePin) =>
  request("POST", "/api/auth/login", { matricule, code_pin: codePin });
export const authMe = () => request("GET", "/api/auth/me");
