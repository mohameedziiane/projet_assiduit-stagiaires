import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearSession, getSessionUser } from "../../services/session";

const pageConfig = {
  "/admin/password-reset-requests": {
    title: "Demandes mot de passe",
    subtitle: "Traitez les demandes de reinitialisation des comptes directeur.",
  },
  "/admin/mot-de-passe": {
    title: "Mot de passe",
    subtitle: "Mettez a jour le mot de passe de votre compte administrateur.",
  },
};

export default function AdminTopbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSessionUser();

  const page = useMemo(() => {
    return (
      pageConfig[location.pathname] || {
        title: "Administration",
        subtitle: "Gestion securisee des comptes sensibles.",
      }
    );
  }, [location.pathname]);

  return (
    <header className="student-topbar">
      <div className="topbar-heading">
        <h1>{page.title}</h1>
        <p>{page.subtitle}</p>
      </div>

      <div className="topbar-actions">
        <div className="topbar-user">
          <div className="topbar-user-info">
            <strong>{session?.name || "Admin"}</strong>
            <p>{session?.email || "admin@example.com"}</p>
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
      </div>
    </header>
  );
}
