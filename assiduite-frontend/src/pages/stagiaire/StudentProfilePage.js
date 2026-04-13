import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";
import { updateSessionUser } from "../../services/session";

export default function StudentProfilePage() {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/me");

        if (isMounted) {
          setUser(response.data);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err.response?.data?.message ||
            "Impossible de charger votre profil.";
          setError(message);
          toast.error(message, "Profil");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const profile = useMemo(() => {
    if (!user) {
      return null;
    }

    return {
      fullName:
        user.name ||
        [user.stagiaire?.prenom, user.stagiaire?.nom].filter(Boolean).join(" ") ||
        "Non renseigné",
      email: user.email || "Non renseigné",
      role: user.role?.nom || "Non renseigné",
      code:
        user.stagiaire?.numero_stagiaire ||
        user.stagiaire?.matricule ||
        "Non renseigné",
      groupe: user.groupe?.nom || "Non renseigné",
      telephone:
        user.stagiaire?.telephone ||
        user.personnel?.telephone ||
        "Non renseigné",
      adresse: "Non renseigné",
      cin: user.stagiaire?.cin || "Non renseigné",
      dateNaissance: user.stagiaire?.date_naissance || "Non renseigné",
      mustChangePassword: Boolean(user.must_change_password),
    };
  }, [user]);

  function handlePasswordChange(event) {
    const { name, value } = event.target;
    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (
      !passwordForm.current_password ||
      !passwordForm.new_password ||
      !passwordForm.new_password_confirmation
    ) {
      setPasswordError("Tous les champs sont obligatoires.");
      return;
    }

    if (
      passwordForm.new_password !== passwordForm.new_password_confirmation
    ) {
      setPasswordError("La confirmation du nouveau mot de passe ne correspond pas.");
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await api.post("/change-password", passwordForm);
      const nextUser = response.data?.user || null;
      const message =
        response.data?.message || "Mot de passe mis à jour avec succès.";

      if (nextUser) {
        setUser(nextUser);
        updateSessionUser(nextUser);
      }

      setPasswordForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
      setPasswordSuccess(message);
      toast.success(message, "Sécurité");
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        requestError.response?.data?.errors?.new_password?.[0] ||
        requestError.response?.data?.errors?.current_password?.[0] ||
        "Impossible de mettre à jour le mot de passe.";

      setPasswordError(message);
      toast.error(message, "Sécurité");
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleForgotSubmit(event) {
    event.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (!user?.email) {
      setForgotError("L'adresse email du compte est introuvable.");
      return;
    }

    setForgotLoading(true);

    try {
      const response = await api.post("/password-reset-requests", {
        email: user.email,
      });
      const message =
        response.data?.message ||
        "Demande de réinitialisation envoyée avec succès.";

      setForgotSuccess(message);
      toast.success(message, "Mot de passe");
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        "Impossible d'envoyer la demande de réinitialisation.";

      setForgotError(message);
      toast.error(message, "Mot de passe");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header-row stagiaire-page-header">
        <div>
          <span className="stagiaire-page-eyebrow">Stagiaire</span>
          <h2>Mon profil</h2>
          <p>Consultez vos informations personnelles et gérez votre mot de passe.</p>
        </div>
      </div>

      <section className="content-card stagiaire-module-card">
        <div className="stagiaire-card-head">
          <div>
            <span className="stagiaire-section-tag">Profil</span>
            <h3 className="section-title">Informations personnelles</h3>
            <p className="soft-text">
              Retrouvez vos informations principales dans une présentation plus
              lisible.
            </p>
          </div>
        </div>

        {loading ? (
          <EmptyState
            icon="..."
            title="Chargement du profil..."
            message="Vos informations personnelles arrivent."
            compact
          />
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : profile ? (
          <div className="profile-grid">
            <div className="profile-item">
              <span>Nom complet</span>
              <strong>{profile.fullName}</strong>
            </div>

            <div className="profile-item">
              <span>Email</span>
              <strong>{profile.email}</strong>
            </div>

            <div className="profile-item">
              <span>Rôle</span>
              <strong>{profile.role}</strong>
            </div>

            <div className="profile-item">
              <span>Code stagiaire</span>
              <strong>{profile.code}</strong>
            </div>

            <div className="profile-item">
              <span>Groupe</span>
              <strong>{profile.groupe}</strong>
            </div>

            <div className="profile-item">
              <span>Téléphone</span>
              <strong>{profile.telephone}</strong>
            </div>

            <div className="profile-item">
              <span>Adresse</span>
              <strong>{profile.adresse}</strong>
            </div>

            <div className="profile-item">
              <span>CIN</span>
              <strong>{profile.cin}</strong>
            </div>

            <div className="profile-item">
              <span>Date de naissance</span>
              <strong>{profile.dateNaissance}</strong>
            </div>
          </div>
        ) : (
          <EmptyState
            icon="o"
            title="Aucune donnée de profil"
            message="Le profil n'a retourné aucune information exploitable."
          />
        )}
      </section>

      <section className="content-card stagiaire-module-card" id="mot-de-passe">
        <div className="stagiaire-card-head">
          <div>
            <span className="stagiaire-section-tag">Sécurité</span>
            <h3 className="section-title">Changer mot de passe</h3>
            <p className="soft-text">
              Modifiez votre mot de passe personnel ou envoyez une demande de
              réinitialisation au gestionnaire si vous ne connaissez plus le mot
              de passe actuel.
            </p>
          </div>
        </div>

        {profile?.mustChangePassword ? (
          <div className="must-change-password-panel">
            <span className="must-change-password-badge">Mot de passe réinitialisé</span>
            <strong>Votre compte utilise encore le mot de passe provisoire.</strong>
            <p>
              Choisissez un nouveau mot de passe personnel dès maintenant pour
              sécuriser votre accès.
            </p>
          </div>
        ) : null}

        <form className="form-grid password-change-form" onSubmit={handlePasswordSubmit}>
          <label>
            <span>Mot de passe actuel</span>
            <input
              type="password"
              name="current_password"
              value={passwordForm.current_password}
              onChange={handlePasswordChange}
              autoComplete="current-password"
            />
          </label>

          <label>
            <span>Nouveau mot de passe</span>
            <input
              type="password"
              name="new_password"
              value={passwordForm.new_password}
              onChange={handlePasswordChange}
              autoComplete="new-password"
            />
          </label>

          <label>
            <span>Confirmation du nouveau mot de passe</span>
            <input
              type="password"
              name="new_password_confirmation"
              value={passwordForm.new_password_confirmation}
              onChange={handlePasswordChange}
              autoComplete="new-password"
            />
          </label>

          {passwordError ? (
            <div className="status-badge danger password-status">{passwordError}</div>
          ) : null}
          {passwordSuccess ? (
            <div className="status-badge success password-status">{passwordSuccess}</div>
          ) : null}

          <button type="submit" className="primary-btn" disabled={passwordLoading}>
            {passwordLoading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          </button>
        </form>

        <div className="stagiaire-password-help">
          <button
            type="button"
            className="link-btn"
            onClick={() => setForgotOpen((current) => !current)}
          >
            Mot de passe oublié ?
          </button>
          <p className="soft-text">
            Cette demande interne sera prise en charge par le gestionnaire.
          </p>
        </div>

        {forgotOpen ? (
          <form className="stagiaire-forgot-panel" onSubmit={handleForgotSubmit}>
            <div className="form-grid">
              <label>
                <span>Email du compte</span>
                <input type="email" value={user?.email || ""} disabled />
              </label>
            </div>

            {forgotError ? <p className="login-error">{forgotError}</p> : null}
            {forgotSuccess ? <p className="login-success">{forgotSuccess}</p> : null}

            <div className="stagiaire-forgot-actions">
              <button type="submit" className="secondary-btn" disabled={forgotLoading}>
                {forgotLoading ? "Envoi en cours..." : "Envoyer la demande"}
              </button>
            </div>
          </form>
        ) : null}
      </section>
    </div>
  );
}
