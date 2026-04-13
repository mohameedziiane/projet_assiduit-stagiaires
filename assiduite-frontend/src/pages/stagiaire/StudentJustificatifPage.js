import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";

function getStatusTone(statut) {
  const value = String(statut || "").toLowerCase();

  if (value.includes("valide") || value.includes("justifie")) {
    return "success";
  }

  if (value.includes("attente")) {
    return "warning";
  }

  if (value.includes("refuse") || value.includes("rejete")) {
    return "danger";
  }

  return "info";
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
        const fetchAbsences = async () => {
          const response = await api.get("/stagiaire/absences");
          return Array.isArray(response.data) ? response.data : [];
        };

        const fetchJustificatifs = async () => {
          const response = await api.get("/justificatifs");
          return Array.isArray(response.data) ? response.data : [];
        };

        const [fetchedAbsences, fetchedJustificatifs] = await Promise.all([
          fetchAbsences(),
          fetchJustificatifs(),
        ]);

        if (isMounted) {
          setAbsences(fetchedAbsences);
          setJustificatifs(fetchedJustificatifs);
        }
      } catch (err) {
        if (isMounted) {
          const nextError =
            err.response?.data?.message ||
            "Impossible de charger les absences a regulariser.";
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
    return absences.filter((absence) => !absence.justificatif);
  }, [absences]);

  const justificatifHistory = useMemo(() => {
    return justificatifs;
  }, [justificatifs]);

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

      const [absencesResponse, justificatifsResponse] = await Promise.all([
        api.get("/stagiaire/absences"),
        api.get("/justificatifs"),
      ]);

      setAbsences(Array.isArray(absencesResponse.data) ? absencesResponse.data : []);
      setJustificatifs(
        Array.isArray(justificatifsResponse.data) ? justificatifsResponse.data : []
      );
      setSelectedAbsenceId("");
      setFile(null);
      setMessage("Justificatif envoye avec succes.");
      toast.success("Votre justificatif a ete transmis.");
    } catch (err) {
      const nextError =
        err.response?.data?.message || "L'envoi du justificatif a echoue.";
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
          <p>Ajoutez un fichier pour regulariser une absence.</p>
        </div>
      </div>

      <section className="content-card stagiaire-module-card stagiaire-upload-card">
        <div className="stagiaire-card-head">
          <div>
            <span className="stagiaire-section-tag">Depot</span>
            <h3 className="section-title">Envoyer un justificatif</h3>
            <p className="soft-text">
              Le formulaire conserve le flux d'upload actuel, avec une presentation plus claire.
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
                  {`${absence.seance?.date_seance || "Date inconnue"} - ${
                    absence.seance?.module || "Module non renseigne"
                  }`}
                </option>
              ))}
            </select>
          </label>

          <div className="upload-box">
            <strong>Choisir un justificatif</strong>
            <p>Formats acceptes: PDF, JPG, PNG</p>
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
            <div className="status-badge danger stagiaire-inline-badge">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="status-badge info stagiaire-inline-badge">
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

        {!loading && justificatifHistory.length > 0 ? (
          <div className="stagiaire-history-block">
            <div className="stagiaire-card-head">
              <div>
                <span className="stagiaire-section-tag">Historique</span>
                <h3 className="section-title">Historique des justificatifs</h3>
                <p className="soft-text">
                  Retrouvez les justificatifs deja transmis et leur statut.
                </p>
              </div>
            </div>

            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Absence</th>
                    <th>Type</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {justificatifHistory.map((justificatif) => (
                    <tr key={justificatif.id}>
                      <td>{justificatif.absence?.seance?.date_seance || "Date inconnue"}</td>
                      <td>{justificatif.type_fichier || "Non renseigne"}</td>
                      <td>
                        <span className={`status-badge ${getStatusTone(justificatif.statut)}`}>
                          {justificatif.statut || "Inconnu"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
