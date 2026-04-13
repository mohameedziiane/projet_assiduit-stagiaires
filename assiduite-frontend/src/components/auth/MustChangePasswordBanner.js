import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPasswordChangeRouteByRole,
  getSessionRole,
  getSessionUser,
  subscribeToSessionUpdates,
} from "../../services/session";

export default function MustChangePasswordBanner() {
  const [sessionUser, setSessionUser] = useState(() => getSessionUser());
  const [role, setRole] = useState(() => getSessionRole());

  useEffect(() => {
    return subscribeToSessionUpdates(() => {
      setSessionUser(getSessionUser());
      setRole(getSessionRole());
    });
  }, []);

  if (!sessionUser?.must_change_password || !role) {
    return null;
  }

  return (
    <section className="must-change-password-banner" role="status">
      <div className="must-change-password-copy">
        <span className="must-change-password-badge">Securite</span>
        <strong>Votre mot de passe a ete reinitialise.</strong>
        <p>
          Pour securiser votre compte, changez votre mot de passe des que
          possible.
        </p>
      </div>

      <Link
        to={getPasswordChangeRouteByRole(role)}
        className="primary-btn must-change-password-action"
      >
        Changer mon mot de passe
      </Link>
    </section>
  );
}
