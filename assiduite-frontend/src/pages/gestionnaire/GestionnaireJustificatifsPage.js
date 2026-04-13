import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";

function formatStagiaireName(justificatif) {
  const stagiaire = justificatif.absence?.stagiaire;
  return (
    [stagiaire?.prenom, stagiaire?.nom].filter(Boolean).join(" ").trim() ||
    "Non renseigne"
  );
}

function formatAbsenceLabel(justificatif) {
  const absence = justificatif.absence;
  const date = absence?.seance?.date_seance || "Date inconnue";
  const module = absence?.seance?.module || "Module non renseigne";

  return `${date} - ${module}`;
}

function getStatusTone(statut) {
  const value = String(statut || "").toLowerCase();

  if (value.includes("valide")) {
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

export default function GestionnaireJustificatifsPage() {
  const toast = useToast();
  const [justificatifs, setJustificatifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchJustificatifs() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/justificatifs");

        if (isMounted) {
          setJustificatifs(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err.response?.data?.message ||
            "Impossible de charger les justificatifs.";
          setError(message);
          toast.error(message, "Justificatifs");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchJustificatifs();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const rows = useMemo(() => {
    return justificatifs.map((justificatif) => ({
      id: justificatif.id,
      stagiaire: formatStagiaireName(justificatif),
      absence: formatAbsenceLabel(justificatif),
      statut: justificatif.statut || "Inconnu",
      type: justificatif.type_fichier || "Non renseigne",
    }));
  }, [justificatifs]);

  return (
    <div className="page-stack">
      <div className="page-header-row gestionnaire-page-header">
        <div>
          <span className="gestionnaire-page-eyebrow">Gestionnaire</span>
          <h2>Justificatifs</h2>
          <p>Consultez les justificatifs deposes et leur statut de traitement.</p>
        </div>
      </div>

      <section className="content-card gestionnaire-module-card">
        <div className="gestionnaire-card-head">
          <div>
            <span className="gestionnaire-section-tag">Documents</span>
            <h3 className="section-title">Liste des justificatifs</h3>
            <p className="soft-text">
              Vue unifiee des justificatifs, absences associees et statuts de validation.
            </p>
          </div>

          {!loading && !error && rows.length > 0 ? (
            <span className="status-badge info">{rows.length} justificatif(s)</span>
          ) : null}
        </div>

        {loading ? (
          <EmptyState
            icon="..."
            title="Chargement des justificatifs..."
            message="La liste est en cours de recuperation."
            compact
          />
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="o"
            title="Aucun justificatif disponible"
            message="Les justificatifs apparaitront ici des qu'ils seront disponibles."
          />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Stagiaire</th>
                  <th>Absence</th>
                  <th>Type</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.stagiaire}</td>
                    <td>{row.absence}</td>
                    <td>{row.type}</td>
                    <td>
                      <span className={`status-badge ${getStatusTone(row.statut)}`}>
                        {row.statut}
                      </span>
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
