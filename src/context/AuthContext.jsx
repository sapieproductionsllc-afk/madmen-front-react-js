import { createContext, useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authLogin, authMe, setToken, clearToken, getToken } from "../lib/api.js";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = sessionStorage.getItem("madmen_user") || localStorage.getItem("madmen_user");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  // Au démarrage : si un jeton existe mais pas d'utilisateur en mémoire, on le valide.
  useEffect(() => {
    if (!user && getToken()) {
      authMe()
        .then((me) => setUser((u) => u || { name: me.matricule, matricule: me.matricule, role: me.role }))
        .catch(() => clearToken());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Connexion RÉELLE : POST /api/auth/login (matricule + PIN) → jeton JWT + employé. */
  const login = async (matricule, codePin, remember = false) => {
    const res = await authLogin(matricule, codePin); // lève une erreur si identifiants invalides
    setToken(res.token, remember);
    const u = {
      id: res.employe.id,
      matricule: res.employe.matricule,
      name: `${res.employe.prenom} ${res.employe.nom}`.trim(),
      role: res.employe.role,
    };
    setUser(u);
    try {
      (remember ? localStorage : sessionStorage).setItem("madmen_user", JSON.stringify(u));
    } catch {
      /* ignore */
    }
    return u;
  };

  const logout = () => {
    setUser(null);
    clearToken();
    try {
      sessionStorage.removeItem("madmen_user");
      localStorage.removeItem("madmen_user");
    } catch {
      /* ignore */
    }
  };

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>;
}

// Protège les routes : redirige vers /login si non connecté.
export function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
