// src/lib/api.js — Client API central (fetch + JWT). Branche le dashboard sur madmen-api-php.
// Ne change PAS le design : il fournit juste les VRAIES données à la place des mocks.

const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
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
export const apiDelete = (p) => request("DELETE", p);

// Upload multipart d'une pièce jointe -> { id, nom_original, mime, taille, url }.
// Pas de Content-Type JSON : le navigateur pose lui-même la frontière multipart.
export async function apiUpload(path, file, champ = "fichier") {
  const fd = new FormData();
  fd.append(champ, file);
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

export const authLogin = (matricule, codePin) =>
  request("POST", "/api/auth/login", { matricule, code_pin: codePin });
export const authMe = () => request("GET", "/api/auth/me");
