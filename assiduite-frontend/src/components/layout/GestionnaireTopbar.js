import { useLocation, useNavigate } from "react-router-dom";
import { clearSession, getSessionUser } from "../../services/session";

export default function GestionnaireTopbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSessionUser();

  const userName =
    session?.name ||
    session?.nom ||
    `${session?.prenom || ""} ${session?.nom || ""}`.trim() ||
    "Utilisateur";

  const userInfo =
    session?.email ||
    session?.matricule ||
    session?.identifiant ||
    "";

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const pageConfig = {
    "/gestionnaire/dashboard": {
      title: "Bienvenue",
      subtitle: "Gerez les stagiaires, groupes, billets et justificatifs.",
    },
    "/gestionnaire/stagiaires": {
      title: "Stagiaires",
      subtitle: "Consultez et gerez les stagiaires.",
    },
    "/gestionnaire/groupes": {
      title: "Groupes",
      subtitle: "Consultez et gerez les groupes.",
    },
    "/gestionnaire/absences": {
      title: "Absences",
      subtitle: "Suivez les absences et appliquez vos filtres de suivi.",
    },
    "/gestionnaire/billets": {
      title: "Billets",
      subtitle: "Generez et consultez les billets.",
    },
    "/gestionnaire/justificatifs": {
      title: "Justificatifs",
      subtitle: "Validez ou refusez les justificatifs deposes.",
    },
    "/gestionnaire/statistiques": {
      title: "Statistiques",
      subtitle: "Visualisez les statistiques globales.",
    },
    "/gestionnaire/password-reset-requests": {
      title: "Demandes mot de passe",
      subtitle: "Traitez les demandes de reinitialisation assignees.",
    },
    "/gestionnaire/export": {
      title: "Export",
      subtitle: "Exportez les donnees et rapports.",
    },
    "/gestionnaire/mot-de-passe": {
      title: "Mot de passe",
      subtitle: "Mettez a jour le mot de passe de votre compte.",
    },
  };

  const currentPage = pageConfig[location.pathname] || {
    title: "Espace gestionnaire",
    subtitle: "Bienvenue dans votre espace personnel.",
  };

  return (
    <header className="student-topbar">
      <div className="topbar-heading">
        <h1>{currentPage.title}</h1>
        <p>{currentPage.subtitle}</p>
      </div>

      <div className="topbar-actions">
        <div className="topbar-user">
          <div className="topbar-user-info">
            <strong>{userName}</strong>
            {userInfo && <p>{userInfo}</p>}
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Deconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
