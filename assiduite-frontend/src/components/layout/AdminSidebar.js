import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaDoorOpen,
  FaKey,
  FaShieldAlt,
  FaTimes,
} from "react-icons/fa";
import { clearSession } from "../../services/session";

const menuItems = [
  {
    label: "Demandes mot de passe",
    path: "/admin/password-reset-requests",
    icon: FaKey,
  },
  {
    label: "Mot de passe",
    path: "/admin/mot-de-passe",
    icon: FaShieldAlt,
  },
];

export default function AdminSidebar() {
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
      className={`student-sidebar directeur-sidebar admin-sidebar ${
        mobileOpen ? "sidebar-mobile-open" : ""
      }`}
    >
      <div className="sidebar-brand directeur-brand admin-brand">
        <div className="brand-square">
          <FaShieldAlt />
        </div>

        <div>
          <h2>Administration</h2>
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
        <nav className="sidebar-nav directeur-nav admin-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? "sidebar-link directeur-link admin-link active"
                    : "sidebar-link directeur-link admin-link"
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

        <button className="directeur-logout admin-logout" onClick={handleLogout}>
          <span>
            <FaDoorOpen />
          </span>
          <span>Se deconnecter</span>
        </button>
      </div>
    </aside>
  );
}
