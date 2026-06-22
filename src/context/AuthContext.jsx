import { createContext, useContext, useState } from "react";
import { Navigate } from "react-router-dom";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const utilisateurParDefaut = {
  name: "Elena Vance",
  role: "Directeur Général",
  matricule: "AUR-8821",
  email: "e.vance@madmen.io",
  telephone: "+242 06 12 34 56",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const enregistre = sessionStorage.getItem("madmen_user");
      return enregistre ? JSON.parse(enregistre) : null;
    } catch {
      return null;
    }
  });

  const login = (u = utilisateurParDefaut) => {
    setUser(u);
    try {
      sessionStorage.setItem("madmen_user", JSON.stringify(u));
    } catch {
      /* ignore */
    }
  };

  const logout = () => {
    setUser(null);
    try {
      sessionStorage.removeItem("madmen_user");
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
