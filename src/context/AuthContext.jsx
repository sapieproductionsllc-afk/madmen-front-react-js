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

  // Au démarrage : on VALIDE le jeton (même si un utilisateur est déjà en mémoire).
  // Si le jeton est invalide/expiré (ex. on a changé d'API local->cloud, ou il a
  // expiré), on déconnecte PROPREMENT -> retour à l'écran de login, au lieu de rester
  // coincé sur un dashboard qui fait des 401 en boucle (l'utilisateur en mémoire faisait
  // croire qu'on était connecté alors que le jeton ne valait plus rien).
  useEffect(() => {
    const finSession = () => {
      clearToken();
      setUser(null);
      try {
        sessionStorage.removeItem("madmen_user");
        localStorage.removeItem("madmen_user");
      } catch {
        /* ignore */
      }
    };
    const tok = getToken();
    if (tok) {
      authMe()
        .then((me) => setUser((u) => u || { name: me.matricule, matricule: me.matricule, role: me.role }))
        .catch(finSession);
    } else if (user) {
      finSession(); // utilisateur en mémoire mais aucun jeton -> session incohérente
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
