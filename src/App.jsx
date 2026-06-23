import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./context/AuthContext.jsx";
import { UIProvider } from "./components/ui/UIProvider.jsx";
import Layout from "./components/layout/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Employes from "./pages/Employes.jsx";
import Postes from "./pages/Postes.jsx";
import ProfilEmploye from "./pages/ProfilEmploye.jsx";
import ProfilDetails from "./pages/ProfilDetails.jsx";
import Paiement from "./pages/Paiement.jsx";
import Pointages from "./pages/Pointages.jsx";
import PointageHoraires from "./pages/PointageHoraires.jsx";
import Enrolement from "./pages/Enrolement.jsx";
import Presence from "./pages/Presence.jsx";
import Activite from "./pages/Activite.jsx";
import Productivite from "./pages/Productivite.jsx";
import Finance from "./pages/Finance.jsx";
import Rapports from "./pages/Rapports.jsx";
import Alertes from "./pages/Alertes.jsx";
import Objectifs from "./pages/Objectifs.jsx";
import Demandes from "./pages/Demandes.jsx";
import Messagerie from "./pages/Messagerie.jsx";
import Communication from "./pages/Communication.jsx";
import Administration from "./pages/Administration.jsx";
import MonProfil from "./pages/MonProfil.jsx";
import Aide from "./pages/Aide.jsx";
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
            <Route path="employes/:id" element={<ProfilEmploye />} />
            <Route path="employes/:id/details" element={<ProfilDetails />} />
            <Route path="employes/:id/paiement" element={<Paiement />} />
            <Route path="employes/:id/pointages" element={<Pointages />} />
            <Route path="enrolement" element={<Enrolement />} />
            <Route path="enrolement/:id" element={<Enrolement />} />
            <Route path="postes" element={<Postes />} />
            <Route path="presence" element={<Presence />} />
            <Route path="pointage-horaires" element={<Navigate to="/administration" replace state={{ section: "pointage" }} />} />
            <Route path="pointage-horaires/:matricule" element={<PointageHoraires />} />
            <Route path="jours-feries" element={<Navigate to="/administration" replace state={{ section: "feries" }} />} />
            <Route path="activite" element={<Activite />} />
            <Route path="productivite" element={<Productivite />} />
            <Route path="finance" element={<Finance />} />
            <Route path="appareils" element={<Navigate to="/administration" replace state={{ section: "appareils" }} />} />
            <Route path="utilisateurs" element={<Navigate to="/administration" replace state={{ section: "utilisateurs" }} />} />
            <Route path="parametres" element={<Navigate to="/administration" replace state={{ section: "parametres" }} />} />
            <Route path="objectifs" element={<Objectifs />} />
            <Route path="demandes" element={<Demandes />} />
            <Route path="messagerie" element={<Messagerie />} />
            <Route path="communication" element={<Communication />} />
            <Route path="administration" element={<Administration />} />
            <Route path="profil" element={<MonProfil />} />
            <Route path="aide" element={<Aide />} />
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
