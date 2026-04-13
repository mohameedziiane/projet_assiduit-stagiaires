import { useLocation, useNavigate } from "react-router-dom";
import { clearSession, getSessionUser } from "../../services/session";

export default function FormateurTopbar() {
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
    session?.groupe?.nom ||
    "DEV-201";

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const pageConfig = {
    "/formateur/dashboard": {
      title: "Bienvenue",
      subtitle: "Suivez l'assiduite de vos groupes et gerez vos actions.",
    },
    "/formateur/seances": {
      title: "Seances",
      subtitle: "Consultez vos seances et le planning disponible.",
    },
    "/formateur/absences": {
      title: "Saisie des absences",
      subtitle: "Enregistrez les absences de vos stagiaires.",
    },
    "/formateur/billets": {
      title: "Billets actifs",
      subtitle: "Consultez et verifiez les billets actifs de vos stagiaires.",
    },
    "/formateur/statistiques": {
      title: "Statistiques groupe",
      subtitle: "Visualisez les indicateurs de votre groupe.",
    },
    "/formateur/commentaires": {
      title: "Commentaires",
      subtitle: "Ajoutez et consultez les remarques liees aux absences.",
    },
    "/formateur/groupes": {
      title: "Mes groupes",
      subtitle: "Consultez les groupes qui vous sont affectes.",
    },
    "/formateur/mot-de-passe": {
      title: "Mot de passe",
      subtitle: "Mettez a jour le mot de passe de votre compte.",
    },
  };

  const currentPage = pageConfig[location.pathname] || {
    title: "Espace formateur",
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
            {userCode && <p>{userCode}</p>}
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Deconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
