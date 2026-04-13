import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { getDefaultRouteByRole, setSession } from "../../services/session";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    if (!form.email || !form.password) {
      setError("Tous les champs sont obligatoires.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/login", {
        email: form.email,
        password: form.password,
      });

      const token =
        response.data.token ||
        response.data.access_token ||
        response.data.data?.token;

      const user =
        response.data.user ||
        response.data.data?.user ||
        response.data.data ||
        null;

      if (!token) {
        setError("Le token est absent de la réponse du serveur.");
        setLoading(false);
        return;
      }

      if (!user) {
        setError(
          "Les informations utilisateur sont absentes de la réponse du serveur."
        );
        setLoading(false);
        return;
      }

      const finalRole = user.role?.nom || user.role;
      setSession({ token, user });
      navigate(getDefaultRouteByRole(finalRole), { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Échec de la connexion.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-showcase" aria-hidden="true">
          <div className="login-showcase-copy">
            <span className="login-badge">Plateforme OFPPT</span>
            <h1>Assiduité des stagiaires</h1>
            <p>
              Une interface claire pour suivre les absences, les justificatifs,
              les billets et les statistiques de chaque espace.
            </p>
          </div>

          <div className="login-showcase-panel">
            <div className="login-showcase-stat">
              <span>Suivi centralisé</span>
              <strong>4 espaces métiers</strong>
              <p>Stagiaire, formateur, gestionnaire et directeur.</p>
            </div>

            <div className="login-showcase-stat">
              <span>Lecture rapide</span>
              <strong>Dashboards unifiés</strong>
              <p>Indicateurs, tableaux et alertes dans un même produit.</p>
            </div>
          </div>
        </section>

        <section className="login-card" aria-labelledby="login-title">
          <div className="login-card-top">
            <img
              src="/ofppt-logo-png_seeklogo-216971.webp"
              alt="OFPPT"
              className="ofppt-image-logo"
            />

            <div className="login-header">
              <p className="login-eyebrow">Connexion</p>
              <h2 id="login-title">Accédez à votre espace</h2>
              <p className="login-subtitle">
                Connectez-vous pour retrouver vos outils et vos statistiques.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="form-input"
                placeholder="Entrez votre adresse email"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Mot de passe</label>
              <input
                id="login-password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Entrez votre mot de passe"
                autoComplete="current-password"
              />
            </div>

            {error ? <p className="login-error">{error}</p> : null}

            <Link to="/mot-de-passe-oublie" className="login-secondary-link">
              Mot de passe oublié ?
            </Link>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
