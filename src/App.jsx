import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./context/AuthContext.jsx";
import { UIProvider } from "./components/ui/UIProvider.jsx";
import Layout from "./components/layout/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Employes from "./pages/Employes.jsx";
import Enrolement from "./pages/Enrolement.jsx";
import Organisation from "./pages/Organisation.jsx";
import Presence from "./pages/Presence.jsx";
import Activite from "./pages/Activite.jsx";
import Productivite from "./pages/Productivite.jsx";
import Finance from "./pages/Finance.jsx";
import Rapports from "./pages/Rapports.jsx";
import Alertes from "./pages/Alertes.jsx";
import Appareils from "./pages/Appareils.jsx";
import Utilisateurs from "./pages/Utilisateurs.jsx";
import Parametres from "./pages/Parametres.jsx";
import PagePlaceholder from "./pages/Placeholder.jsx";

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <UIProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
            <Route path="rapports" element={<Rapports />} />
            <Route path="alertes" element={<Alertes />} />
            <Route path="employes" element={<Employes />} />
            <Route path="enrolement" element={<Enrolement />} />
            <Route path="organisation" element={<Organisation />} />
            <Route path="presence" element={<Presence />} />
            <Route path="activite" element={<Activite />} />
            <Route path="productivite" element={<Productivite />} />
            <Route path="finance" element={<Finance />} />
            <Route path="appareils" element={<Appareils />} />
            <Route path="utilisateurs" element={<Utilisateurs />} />
            <Route path="parametres" element={<Parametres />} />
            <Route
              path="*"
              element={
                <PagePlaceholder
                  pole="Erreur"
                  icon="error"
                  title="Page introuvable"
                  subtitle="Cette page n'existe pas ou a été déplacée."
                  sections={["Vérifiez l'adresse", "Revenez au tableau de bord via le menu"]}
                />
              }
            />
            </Route>
          </Routes>
        </UIProvider>
      </AuthProvider>
    </HashRouter>
  );
}
