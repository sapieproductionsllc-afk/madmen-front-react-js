import { useState } from "react";
import { Outlet } from "react-router-dom";
import TopNav from "./TopNav.jsx";
import SideNav from "./SideNav.jsx";

// Structure générale : barre du haut + menu latéral + contenu (Outlet).
export default function Layout() {
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-canvas text-slate-900">
      <TopNav onMenuClick={() => setMenuOuvert(true)} />

      <div className="flex flex-1 overflow-hidden">
        <SideNav open={menuOuvert} onClose={() => setMenuOuvert(false)} />

        <main className="flex-1 overflow-y-auto scroll-thin">
          <div className="max-w-content mx-auto px-4 md:px-8 py-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
