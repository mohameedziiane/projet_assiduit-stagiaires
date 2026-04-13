import { useLocation, useNavigate } from "react-router-dom";
import { clearSession, getSessionUser } from "../../services/session";

export default function StudentTopbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSessionUser();

  const userName =
    session?.name ||
    session?.nom ||
    `${session?.prenom || ""} ${session?.nom || ""}`.trim() ||
    "Utilisateur";

  const userCode =
    session?.code_massar ||
    session?.code ||
    session?.matricule ||
    session?.identifiant ||
    "ID101";

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const pageConfig = {
    "/stagiaire/dashboard": {
      title: "Bienvenue",
      subtitle: "Suivez vos absences, billets et statistiques.",
    },
    "/stagiaire/absences": {
      title: "Mes absences",
      subtitle: "Consultez toutes vos absences et leurs details.",
    },
    "/stagiaire/justificatif": {
      title: "Justificatif",
      subtitle: "Deposez vos justificatifs d'absence.",
    },
    "/stagiaire/billets": {
      title: "Mes billets",
      subtitle: "Consultez vos billets d'autorisation.",
    },
    "/stagiaire/statistiques": {
      title: "Statistiques",
      subtitle: "Visualisez vos statistiques personnelles.",
    },
    "/stagiaire/profil": {
      title: "Profil",
      subtitle: "Consultez et gerez vos informations personnelles.",
    },
    "/stagiaire/mot-de-passe": {
      title: "Mot de passe",
      subtitle: "Mettez a jour le mot de passe de votre compte.",
    },
  };

  const currentPage = pageConfig[location.pathname] || {
    title: "Espace stagiaire",
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
            <p>{userCode}</p>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Deconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
