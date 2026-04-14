import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaChartBar,
  FaDoorOpen,
  FaFileUpload,
  FaIdCard,
  FaTimes,
  FaUser,
  FaUserClock,
} from "react-icons/fa";
import { clearSession } from "../../services/session";

const menuItems = [
  { label: "Tableau de bord", path: "/stagiaire/dashboard", icon: FaChartBar },
  { label: "Mes absences", path: "/stagiaire/absences", icon: FaUserClock },
  { label: "Justificatif", path: "/stagiaire/justificatif", icon: FaFileUpload },
  { label: "Mes billets", path: "/stagiaire/billets", icon: FaIdCard },
  { label: "Statistiques", path: "/stagiaire/statistiques", icon: FaChartBar },
  { label: "Profil", path: "/stagiaire/profil", icon: FaUser },
];

export default function StudentSidebar() {
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
      className={`student-sidebar stagiaire-sidebar ${
        mobileOpen ? "sidebar-mobile-open" : ""
      }`}
    >
      <div className="sidebar-brand stagiaire-brand">
        <div className="brand-square">
          <FaUser />
        </div>
        <div>
          <h2>Assiduite</h2>
          <p>Espace stagiaire</p>
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
        <nav className="sidebar-nav stagiaire-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? "sidebar-link stagiaire-link active"
                    : "sidebar-link stagiaire-link"
                }
                onClick={() => setMobileOpen(false)}
              >
                <span className="stagiaire-link-icon">
                  <Icon />
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button className="stagiaire-logout" onClick={handleLogout}>
          <span>
            <FaDoorOpen />
          </span>
          <span>Se deconnecter</span>
        </button>
      </div>
    </aside>
  );
}
