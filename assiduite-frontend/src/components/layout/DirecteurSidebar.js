import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaChartLine,
  FaDoorOpen,
  FaFileAlt,
  FaKey,
  FaTachometerAlt,
  FaTimes,
} from "react-icons/fa";
import { clearSession } from "../../services/session";

const menuItems = [
  { label: "Tableau de bord", path: "/directeur/dashboard", icon: FaTachometerAlt },
  { label: "Rapports globaux", path: "/directeur/rapports", icon: FaFileAlt },
  { label: "Statistiques", path: "/directeur/statistiques", icon: FaChartLine },
  { label: "Demandes mot de passe", path: "/directeur/password-reset-requests", icon: FaKey },
];

export default function DirecteurSidebar() {
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
      className={`student-sidebar directeur-sidebar ${
        mobileOpen ? "sidebar-mobile-open" : ""
      }`}
    >
      <div className="sidebar-brand directeur-brand">
        <div className="brand-square">
          <FaChartLine />
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
        <nav className="sidebar-nav directeur-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? "sidebar-link directeur-link active"
                    : "sidebar-link directeur-link"
                }
                onClick={() => setMobileOpen(false)}
              >
                <span className="directeur-link-icon">
                  <Icon />
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button className="directeur-logout" onClick={handleLogout}>
          <span>
            <FaDoorOpen />
          </span>
          <span>Se deconnecter</span>
        </button>
      </div>
    </aside>
  );
}
