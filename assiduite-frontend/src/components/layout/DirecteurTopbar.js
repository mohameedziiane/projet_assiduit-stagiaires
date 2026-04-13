import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearSession, getSessionUser } from "../../services/session";

const pageConfig = {
  "/directeur/dashboard": {
    title: "Tableau de bord executif",
    subtitle: "Vue d'ensemble de l'assiduite a l'echelle de l'institution.",
  },
  "/directeur/rapports": {
    title: "Rapports globaux",
    subtitle: "Consultez et telechargez les rapports globaux.",
  },
  "/directeur/statistiques": {
    title: "Statistiques",
    subtitle: "Consultez les indicateurs et tendances globales.",
  },
  "/directeur/password-reset-requests": {
    title: "Demandes mot de passe",
    subtitle: "Traitez les demandes de reinitialisation assignees.",
  },
  "/directeur/mot-de-passe": {
    title: "Mot de passe",
    subtitle: "Mettez a jour le mot de passe de votre compte.",
  },
};

export default function DirecteurTopbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const page = useMemo(() => {
    return (
      pageConfig[location.pathname] || {
        title: "Bienvenue",
        subtitle: "Espace directeur",
      }
    );
  }, [location.pathname]);

  const session = getSessionUser();

  return (
    <header className="student-topbar">
      <div className="topbar-heading">
        <h1>{page.title}</h1>
        <p>{page.subtitle}</p>
      </div>

      <div className="topbar-actions">
        <div className="topbar-user">
          <div className="topbar-user-info">
            <strong>{session?.fullName || "Mohamed Mahi"}</strong>
            <p>{session?.group || "Directeur"}</p>
          </div>
        </div>

        <button
          className="logout-btn"
          onClick={() => {
            clearSession();
            navigate("/", { replace: true });
          }}
        >
          Deconnexion
        </button>
      </div>
    </header>
  );
}
