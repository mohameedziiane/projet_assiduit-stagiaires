import { useMemo, useState } from "react";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";
import {
  getSessionRole,
  getSessionUser,
  updateSessionUser,
} from "../../services/session";

const roleLabels = {
  stagiaire: "Stagiaire",
  formateur: "Formateur",
  gestionnaire: "Gestionnaire",
  directeur: "Directeur",
  admin: "Admin",
};

export default function ChangePasswordPage() {
  const toast = useToast();
  const sessionUser = getSessionUser();
  const role = getSessionRole();
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const roleLabel = useMemo(() => roleLabels[role] || "Compte", [role]);

  const mustChangePassword = Boolean(sessionUser?.must_change_password);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !form.current_password ||
      !form.new_password ||
      !form.new_password_confirmation
    ) {
      setError("Tous les champs sont obligatoires.");
      return;
    }

    if (form.new_password !== form.new_password_confirmation) {
      setError("La confirmation du nouveau mot de passe ne correspond pas.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/change-password", form);
      const nextUser = response.data?.user || null;

      if (nextUser) {
        updateSessionUser(nextUser);
      }

      setForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });

      const message =
        response.data?.message || "Mot de passe mis a jour avec succes.";

      setSuccess(message);
      toast.success(message, "Securite");
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        requestError.response?.data?.errors?.new_password?.[0] ||
        requestError.response?.data?.errors?.current_password?.[0] ||
        "Impossible de mettre a jour le mot de passe.";

      setError(message);
      toast.error(message, "Securite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <span className="directeur-page-eyebrow">{roleLabel}</span>
          <h2>Changer le mot de passe</h2>
          <p>Mettez a jour votre mot de passe pour securiser votre compte.</p>
        </div>
      </div>

      {mustChangePassword ? (
        <section className="must-change-password-panel">
          <span className="must-change-password-badge">Action recommandee</span>
          <strong>Votre mot de passe a ete reinitialise.</strong>
          <p>
            Choisissez un nouveau mot de passe personnel pour desactiver cette
            alerte.
          </p>
        </section>
      ) : null}

      <section className="content-card">
        <div className="page-header-row">
          <div>
            <h3 className="section-title">Mise a jour du mot de passe</h3>
            <p className="soft-text">
              Saisissez votre mot de passe actuel, puis confirmez le nouveau.
            </p>
          </div>
        </div>

        <form className="form-grid password-change-form" onSubmit={handleSubmit}>
          <label>
            <span>Mot de passe actuel</span>
            <input
              type="password"
              name="current_password"
              value={form.current_password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </label>

          <label>
            <span>Nouveau mot de passe</span>
            <input
              type="password"
              name="new_password"
              value={form.new_password}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </label>

          <label>
            <span>Confirmation</span>
            <input
              type="password"
              name="new_password_confirmation"
              value={form.new_password_confirmation}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </label>

          {error ? <div className="status-badge danger password-status">{error}</div> : null}
          {success ? <div className="status-badge success password-status">{success}</div> : null}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Mise a jour..." : "Mettre a jour le mot de passe"}
          </button>
        </form>
      </section>
    </div>
  );
}
