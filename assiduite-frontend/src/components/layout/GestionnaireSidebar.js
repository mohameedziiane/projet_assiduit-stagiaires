import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaChartBar,
  FaDoorOpen,
  FaFileExport,
  FaFileMedical,
  FaIdCard,
  FaKey,
  FaLayerGroup,
  FaTimes,
  FaUserGraduate,
  FaUserTimes,
} from "react-icons/fa";
import { clearSession } from "../../services/session";

const menuItems = [
  {
    label: "Tableau de bord",
    path: "/gestionnaire/dashboard",
    icon: FaChartBar,
  },
  {
    label: "Gerer stagiaires",
    path: "/gestionnaire/stagiaires",
    icon: FaUserGraduate,
  },
  {
    label: "Affecter groupes",
    path: "/gestionnaire/groupes",
    icon: FaLayerGroup,
  },
  {
    label: "Absences",
    path: "/gestionnaire/absences",
    icon: FaUserTimes,
  },
  {
    label: "Generer billets",
    path: "/gestionnaire/billets",
    icon: FaIdCard,
  },
  {
    label: "Justificatifs",
    path: "/gestionnaire/justificatifs",
    icon: FaFileMedical,
  },
  {
    label: "Statistiques",
    path: "/gestionnaire/statistiques",
    icon: FaChartBar,
  },
  {
    label: "Demandes mot de passe",
    path: "/gestionnaire/password-reset-requests",
    icon: FaKey,
  },
  {
    label: "Export Excel",
    path: "/gestionnaire/export",
    icon: FaFileExport,
  },
];

export default function GestionnaireSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    setMobileOpen(false);
    clearSession();
    navigate("/", { replace: true });
  }

  return (
    <aside
      className={`student-sidebar gestionnaire-sidebar ${
        mobileOpen ? "sidebar-mobile-open" : ""
      }`}
    >
      <div className="sidebar-brand gestionnaire-brand">
        <div className="brand-square">
          <FaLayerGroup />
        </div>
        <div>
          <h2>Gestion</h2>
          <p>Assiduite</p>
        </div>

        <button
          type="button"
          className="sidebar-mobile-toggle"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setMobileOpen((current) => !current)}
        >
          {mobileOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      <div className="sidebar-mobile-panel">
        <nav className="sidebar-nav gestionnaire-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? "sidebar-link gestionnaire-link active"
                    : "sidebar-link gestionnaire-link"
                }
                onClick={() => setMobileOpen(false)}
              >
                <span className="gestionnaire-link-icon">
                  <Icon />
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button className="gestionnaire-logout" onClick={handleLogout}>
          <span>
            <FaDoorOpen />
          </span>
          <span>Se deconnecter</span>
        </button>
      </div>
    </aside>
  );
}
