import { Outlet } from "react-router-dom";
import MustChangePasswordBanner from "../components/auth/MustChangePasswordBanner";
import GestionnaireSidebar from "../components/layout/GestionnaireSidebar";
import GestionnaireTopbar from "../components/layout/GestionnaireTopbar";
import "./StudentLayout.css";

export default function GestionnaireLayout() {
  return (
    <div className="student-shell">
      <GestionnaireSidebar />

      <div className="student-main">
        <GestionnaireTopbar />
        <MustChangePasswordBanner />

        <main className="student-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
