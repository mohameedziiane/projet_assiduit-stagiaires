import { useState } from "react";
import EmptyState from "../../components/ui/EmptyState";
import api from "../../services/api";

function hasBilletDetails(result) {
  return Boolean(result?.billet_id);
}

export default function FormateurBilletsPage() {
  const [form, setForm] = useState({
    code_unique: "",
    stagiaire_id: "",
    seance_id: "",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    setResult(null);

    const codeUnique = form.code_unique.trim();
    const stagiaireId = form.stagiaire_id.trim();
    const seanceId = form.seance_id.trim();

    if (!codeUnique && (!stagiaireId || !seanceId)) {
      setError("Saisissez un code unique ou un couple stagiaire/seance.");
      return;
    }

    const params = codeUnique
      ? { code_unique: codeUnique }
      : {
          stagiaire_id: Number(stagiaireId),
          seance_id: Number(seanceId),
        };

    setLoading(true);

    try {
      const response = await api.get("/billets/verifier", { params });
      setResult(response.data);
    } catch (err) {
      if (err.response?.data) {
        setResult(err.response.data);
      } else {
        setError("Impossible de verifier le billet.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header-row formateur-page-header">
        <div>
          <span className="formateur-page-eyebrow">Formateur</span>
          <h2>Verification des billets</h2>
          <p>Verifiez un billet par code unique ou par stagiaire et seance.</p>
        </div>
      </div>

      <section className="content-card formateur-module-card formateur-filter-card">
        <div className="formateur-card-head">
          <div>
            <span className="formateur-section-tag">Verification</span>
            <h3 className="section-title">Recherche d'un billet</h3>
            <p className="soft-text">
              Le controle garde le comportement existant, avec une presentation plus claire.
            </p>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Code unique</span>
            <input
              type="text"
              name="code_unique"
              value={form.code_unique}
              onChange={handleChange}
              placeholder="Ex: ABCD1234"
              disabled={loading}
            />
          </label>

          <label>
            <span>Stagiaire ID</span>
            <input
              type="number"
              name="stagiaire_id"
              value={form.stagiaire_id}
              onChange={handleChange}
              placeholder="Ex: 12"
              disabled={loading}
            />
          </label>

          <label>
            <span>Seance ID</span>
            <input
              type="number"
              name="seance_id"
              value={form.seance_id}
              onChange={handleChange}
              placeholder="Ex: 5"
              disabled={loading}
            />
          </label>

          {error ? (
            <div className="status-badge danger formateur-inline-badge">
              {error}
            </div>
          ) : null}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Verification..." : "Verifier"}
          </button>
        </form>
      </section>

      <section className="content-card formateur-module-card">
        <div className="formateur-card-head">
          <div>
            <span className="formateur-section-tag">Resultat</span>
            <h3 className="section-title">Retour de verification</h3>
            <p className="soft-text">
              Le resultat detaille apparait ici apres verification.
            </p>
          </div>
        </div>

        {!result && !error ? (
          <EmptyState
            icon="o"
            title="Aucune verification"
            message="Le resultat de verification apparaitra ici."
          />
        ) : null}

        {result ? (
          <div className="form-grid">
            <div>
              <span>Autorise</span>
              <div
                className={`status-badge ${
                  result.autorise ? "success" : "danger"
                }`}
                style={{ width: "fit-content", marginTop: "8px" }}
              >
                {String(Boolean(result.autorise))}
              </div>
            </div>

            <div>
              <span>Message</span>
              <p style={{ marginTop: "8px" }}>{result.message || "-"}</p>
            </div>

            {hasBilletDetails(result) ? (
              <>
                <div>
                  <span>Billet ID</span>
                  <p style={{ marginTop: "8px" }}>{result.billet_id}</p>
                </div>

                <div>
                  <span>Code unique</span>
                  <p style={{ marginTop: "8px" }}>{result.code_unique || "-"}</p>
                </div>

                <div>
                  <span>Stagiaire ID</span>
                  <p style={{ marginTop: "8px" }}>{result.stagiaire_id || "-"}</p>
                </div>

                <div>
                  <span>Absence ID</span>
                  <p style={{ marginTop: "8px" }}>{result.absence_id || "-"}</p>
                </div>

                <div>
                  <span>Type</span>
                  <p style={{ marginTop: "8px" }}>{result.type || "-"}</p>
                </div>

                <div>
                  <span>Date validite</span>
                  <p style={{ marginTop: "8px" }}>{result.date_validite || "-"}</p>
                </div>

                <div>
                  <span>Actif</span>
                  <p style={{ marginTop: "8px" }}>{String(Boolean(result.est_actif))}</p>
                </div>

                <div>
                  <span>Correspondance</span>
                  <p style={{ marginTop: "8px" }}>{result.matched_by || "-"}</p>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
