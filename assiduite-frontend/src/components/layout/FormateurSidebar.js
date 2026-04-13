import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaChartBar,
  FaClipboardList,
  FaDoorOpen,
  FaIdCard,
  FaRegCalendarAlt,
  FaTimes,
} from "react-icons/fa";
import { clearSession } from "../../services/session";

const menuItems = [
  { label: "Tableau de bord", path: "/formateur/dashboard", icon: FaChartBar },
  { label: "Saisie des absences", path: "/formateur/absences", icon: FaClipboardList },
  { label: "Billets actifs", path: "/formateur/billets", icon: FaIdCard },
  { label: "Statistiques groupe", path: "/formateur/statistiques", icon: FaRegCalendarAlt },
];

export default function FormateurSidebar() {
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
      className={`student-sidebar formateur-sidebar ${
        mobileOpen ? "sidebar-mobile-open" : ""
      }`}
    >
      <div className="sidebar-brand formateur-brand">
        <div className="brand-square">
          <FaRegCalendarAlt />
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
        <nav className="sidebar-nav formateur-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? "sidebar-link formateur-link active"
                    : "sidebar-link formateur-link"
                }
                onClick={() => setMobileOpen(false)}
              >
                <span className="formateur-link-icon">
                  <Icon />
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button className="formateur-logout" onClick={handleLogout}>
          <span>
            <FaDoorOpen />
          </span>
          <span>Se deconnecter</span>
        </button>
      </div>
    </aside>
  );
}
