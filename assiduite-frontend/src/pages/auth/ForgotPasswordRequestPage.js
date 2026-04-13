import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";
import { getSessionRole, getSessionUser } from "../../services/session";
import "./LoginPage.css";

const supportedRoles = {
  stagiaire: "gestionnaire",
  formateur: "directeur",
  gestionnaire: "directeur",
  directeur: "admin",
};

export default function ForgotPasswordRequestPage() {
  const toast = useToast();
  const sessionUser = getSessionUser();
  const sessionRole = getSessionRole();
  const isSupportedAuthenticatedRole = Boolean(
    sessionRole && supportedRoles[sessionRole]
  );

  const [email, setEmail] = useState(sessionUser?.email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const helperText = useMemo(() => {
    if (isSupportedAuthenticatedRole) {
      return `Votre demande sera transmise au ${supportedRoles[sessionRole]} pour traitement.`;
    }

    return "Cette demande interne sera transmise au responsable habilité selon le rôle du compte. Aucun lien de réinitialisation n'est envoyé par email.";
  }, [isSupportedAuthenticatedRole, sessionRole]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("L'adresse email est obligatoire.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/password-reset-requests", { email });
      const message =
        response.data?.message ||
        "Demande de réinitialisation envoyée avec succès.";

      setSuccess(message);
      toast.success(message, "Mot de passe");
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        "Impossible d'envoyer la demande de réinitialisation.";

      setError(message);
      toast.error(message, "Mot de passe");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-showcase" aria-hidden="true">
          <div className="login-showcase-copy">
            <span className="login-badge">Demande interne</span>
            <h1>Mot de passe oublié</h1>
            <p>
              Cette procédure ne repose pas sur un lien email. La demande est
              examinée en interne par le responsable habilité selon le rôle du
              compte.
            </p>
          </div>

          <div className="login-showcase-panel">
            <div className="login-showcase-stat">
              <span>Stagiaire</span>
              <strong>Traitement par gestionnaire</strong>
              <p>Le gestionnaire examine la demande de réinitialisation.</p>
            </div>

            <div className="login-showcase-stat">
              <span>Formateur / gestionnaire / directeur</span>
              <strong>Traitement hiérarchique</strong>
              <p>Les demandes sont routées automatiquement vers le responsable autorisé.</p>
            </div>
          </div>
        </section>

        <section className="login-card" aria-labelledby="forgot-password-title">
          <div className="login-card-top">
            <img
              src="/ofppt-logo-png_seeklogo-216971.webp"
              alt="OFPPT"
              className="ofppt-image-logo"
            />

            <div className="login-header">
              <p className="login-eyebrow">Assistance</p>
              <h2 id="forgot-password-title">Demander une réinitialisation</h2>
              <p className="login-subtitle">{helperText}</p>
            </div>
          </div>

          {sessionUser && !isSupportedAuthenticatedRole ? (
            <div className="forgot-password-info-block">
              <strong>Demande non disponible pour ce rôle</strong>
              <p>
                Ce compte ne peut pas soumettre de demande via cette interface.
              </p>
              <Link to="/" className="secondary-btn forgot-password-link-btn">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="forgot-password-info-block">
                <strong>Comment cela fonctionne</strong>
                <p>
                  Saisissez l'adresse email du compte concerné. Si la demande est
                  approuvée, le mot de passe sera réinitialisé par
                  l'administration à la valeur par défaut de l'établissement.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="forgot-password-email">Email</label>
                <input
                  id="forgot-password-email"
                  type="email"
                  className="form-input"
                  placeholder="Entrez votre adresse email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  disabled={isSupportedAuthenticatedRole}
                />
              </div>

              {error ? <p className="login-error">{error}</p> : null}
              {success ? <p className="login-success">{success}</p> : null}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Envoi en cours..." : "Envoyer la demande"}
              </button>

              <Link to="/" className="login-secondary-link">
                Retour à la connexion
              </Link>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
