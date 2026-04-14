import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";

function extractApiError(err, fallback) {
  const errors = err.response?.data?.errors;

  if (errors && typeof errors === "object") {
    const firstError = Object.values(errors)[0];

    if (Array.isArray(firstError) && firstError[0]) {
      return firstError[0];
    }
  }

  return err.response?.data?.message || fallback;
}

function getStatusTone(statut) {
  const value = String(statut || "").toLowerCase();

  if (value.includes("accepte") || value.includes("justifie")) {
    return "success";
  }

  if (value.includes("attente")) {
    return "warning";
  }

  if (value.includes("refuse")) {
    return "danger";
  }

  return "info";
}

function formatDateTime(value) {
  if (!value) {
    return "Non renseigne";
  }

  return new Date(value).toLocaleString("fr-FR");
}

function formatAbsenceLabel(absence) {
  return `${absence.seance?.date_seance || "Date inconnue"} - ${
    absence.seance?.module || "Module non renseigne"
  }`;
}

function getAbsenceStatusText(absence) {
  if (absence.workflow_status === "en_attente_creation_billet") {
    return "Justificatif accepte";
  }

  return absence.status_label || absence.workflow_label || absence.statut || "Inconnu";
}

export default function StudentJustificatifPage() {
  const toast = useToast();
  const [selectedAbsenceId, setSelectedAbsenceId] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [absences, setAbsences] = useState([]);
  const [justificatifs, setJustificatifs] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      setError("");

      try {
        const [absencesResponse, justificatifsResponse] = await Promise.all([
          api.get("/stagiaire/absences"),
          api.get("/justificatifs"),
        ]);

        if (isMounted) {
          setAbsences(Array.isArray(absencesResponse.data) ? absencesResponse.data : []);
          setJustificatifs(
            Array.isArray(justificatifsResponse.data) ? justificatifsResponse.data : []
          );
        }
      } catch (err) {
        if (isMounted) {
          const nextError = extractApiError(
            err,
            "Impossible de charger les absences a regulariser."
          );
          setError(nextError);
          toast.error(nextError, "Justificatifs");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const availableAbsences = useMemo(() => {
    return absences.filter((absence) => absence.can_upload_justificatif);
  }, [absences]);

  async function refreshData() {
    const [absencesResponse, justificatifsResponse] = await Promise.all([
      api.get("/stagiaire/absences"),
      api.get("/justificatifs"),
    ]);

    setAbsences(Array.isArray(absencesResponse.data) ? absencesResponse.data : []);
    setJustificatifs(
      Array.isArray(justificatifsResponse.data) ? justificatifsResponse.data : []
    );
  }

  function handleFileChange(e) {
    setFile(e.target.files?.[0] || null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!selectedAbsenceId) {
      setError("Veuillez selectionner une absence.");
      return;
    }

    if (!file) {
      setError("Veuillez selectionner un fichier.");
      return;
    }

    const formData = new FormData();
    formData.append("absence_id", selectedAbsenceId);
    formData.append("fichier", file);

    setSubmitting(true);

    try {
      await api.post("/justificatifs", formData);
      await refreshData();
      setSelectedAbsenceId("");
      setFile(null);
      setMessage("Justificatif envoye. Il est maintenant en cours de traitement.");
      toast.success("Votre justificatif est en attente de validation.");
    } catch (err) {
      const nextError = extractApiError(err, "L'envoi du justificatif a echoue.");
      setError(nextError);
      toast.error(nextError, "Envoi impossible");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header-row stagiaire-page-header">
        <div>
          <span className="stagiaire-page-eyebrow">Stagiaire</span>
          <h2>Deposer un justificatif</h2>
          <p>Ajoutez un document pour une absence et suivez son traitement.</p>
        </div>
      </div>

      <section className="content-card stagiaire-module-card stagiaire-upload-card">
        <div className="stagiaire-card-head">
          <div>
            <span className="stagiaire-section-tag">Depot</span>
            <h3 className="section-title">Envoyer un justificatif</h3>
            <p className="soft-text">
              Formats acceptes: PDF, JPG, JPEG, PNG. Le document passe ensuite en
              attente de revue.
            </p>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Absence concernee</span>
            <select
              value={selectedAbsenceId}
              onChange={(e) => setSelectedAbsenceId(e.target.value)}
              disabled={loading || submitting || availableAbsences.length === 0}
            >
              <option value="">Selectionnez une absence</option>
              {availableAbsences.map((absence) => (
                <option key={absence.id} value={absence.id}>
                  {formatAbsenceLabel(absence)}
                </option>
              ))}
            </select>
          </label>

          <div className="upload-box">
            <strong>Choisir un justificatif</strong>
            <p>Formats acceptes: PDF, JPG, JPEG, PNG</p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={loading || submitting}
            />
            {file ? <p>Fichier selectionne: {file.name}</p> : null}
          </div>

          {loading ? (
            <div className="status-badge info stagiaire-inline-badge">
              Chargement des absences...
            </div>
          ) : null}

          {error ? (
            <div className="status-badge danger stagiaire-inline-badge">{error}</div>
          ) : null}

          {message ? (
            <div className="status-badge warning stagiaire-inline-badge">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            className="primary-btn"
            disabled={submitting || loading || availableAbsences.length === 0}
          >
            {submitting ? "Envoi..." : "Envoyer le justificatif"}
          </button>
        </form>

        {!loading && !error && availableAbsences.length === 0 ? (
          <EmptyState
            icon="o"
            title="Aucune absence a regulariser"
            message="Toutes vos absences ont deja un justificatif enregistre."
          />
        ) : null}
      </section>

      <section className="content-card stagiaire-module-card">
        <div className="stagiaire-card-head">
          <div>
            <span className="stagiaire-section-tag">Historique</span>
            <h3 className="section-title">Suivi des justificatifs</h3>
            <p className="soft-text">
              Consultez l'etat de chaque justificatif, le motif de refus et l'attente
              de creation du billet lorsque le document est accepte.
            </p>
          </div>
        </div>

        {!loading && justificatifs.length === 0 ? (
          <EmptyState
            icon="o"
            title="Aucun justificatif depose"
            message="Vos justificatifs apparaitront ici apres envoi."
          />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Absence</th>
                  <th>Depot</th>
                  <th>Statut justificatif</th>
                  <th>Suivi absence</th>
                  <th>Commentaire gestionnaire</th>
                </tr>
              </thead>
              <tbody>
                {justificatifs.map((justificatif) => (
                  <tr key={justificatif.id}>
                    <td>{formatAbsenceLabel(justificatif.absence || {})}</td>
                    <td>{formatDateTime(justificatif.date_depot)}</td>
                    <td>
                      <span
                        className={`status-badge ${getStatusTone(justificatif.statut)}`}
                      >
                        {justificatif.status_label || justificatif.statut}
                      </span>
                    </td>
                    <td>
                      <div>
                        <span
                          className={`status-badge ${getStatusTone(
                            justificatif.absence?.workflow_status
                          )}`}
                        >
                          {getAbsenceStatusText(justificatif.absence || {})}
                        </span>
                      </div>
                      {justificatif.absence?.billet_label ? (
                        <p className="soft-text">{justificatif.absence.billet_label}</p>
                      ) : null}
                      {justificatif.absence?.billet_status === "billet_cree" ? (
                        <p>
                          <Link to="/stagiaire/billets">Voir le billet</Link>
                        </p>
                      ) : null}
                    </td>
                    <td>
                      {justificatif.motif_refus ? (
                        <span>{justificatif.motif_refus}</span>
                      ) : justificatif.reviewed_at ? (
                        <span>Aucun commentaire.</span>
                      ) : (
                        <span>En attente de traitement.</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
