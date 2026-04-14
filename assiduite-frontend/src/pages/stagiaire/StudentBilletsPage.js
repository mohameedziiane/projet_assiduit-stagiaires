import { useEffect, useState } from "react";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";

function formatDateTime(value) {
  if (!value) {
    return "Non renseigne";
  }

  return new Date(value).toLocaleString("fr-FR");
}

function getStatusTone(status) {
  const value = String(status || "").toLowerCase();

  if (value === "actif") {
    return "success";
  }

  if (value === "expire" || value === "utilise") {
    return "warning";
  }

  if (value === "annule") {
    return "danger";
  }

  return "info";
}

export default function StudentBilletsPage() {
  const toast = useToast();
  const [billets, setBillets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchBillets() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/stagiaire/billets");

        if (isMounted) {
          setBillets(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err.response?.data?.message || "Impossible de charger vos billets.";
          setError(message);
          toast.error(message, "Billets");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchBillets();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  return (
    <div className="page-stack">
      <div className="page-header-row stagiaire-page-header">
        <div>
          <span className="stagiaire-page-eyebrow">Stagiaire</span>
          <h2>Mes billets</h2>
          <p>Retrouvez les billets qui vous ont ete attribues.</p>
        </div>
      </div>

      <section className="content-card stagiaire-module-card">
        <div className="stagiaire-card-head">
          <div>
            <span className="stagiaire-section-tag">Billets</span>
            <h3 className="section-title">Liste des billets</h3>
            <p className="soft-text">
              Consultez les billets crees apres validation des justificatifs.
            </p>
          </div>
        </div>

        {loading ? (
          <EmptyState
            icon="..."
            title="Chargement des billets..."
            message="Vos billets arrivent."
            compact
          />
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : billets.length === 0 ? (
          <EmptyState
            icon="o"
            title="Aucun billet pour le moment"
            message="Les billets apparaitront ici apres creation par le gestionnaire."
          />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Absence</th>
                  <th>Validite</th>
                  <th>Code</th>
                  <th>Statut</th>
                </tr>
              </thead>

              <tbody>
                {billets.map((billet) => (
                  <tr key={billet.id}>
                    <td>{billet.type || "Non renseigne"}</td>
                    <td>
                      {billet.absence?.seance?.date_seance || "Date inconnue"} -{" "}
                      {billet.absence?.seance?.module || "Module non renseigne"}
                    </td>
                    <td>
                      <div>{formatDateTime(billet.date_validite)}</div>
                      {billet.heure_debut || billet.heure_fin ? (
                        <small>
                          {billet.heure_debut || "--:--"} - {billet.heure_fin || "--:--"}
                        </small>
                      ) : null}
                    </td>
                    <td>
                      <strong>{billet.code_unique || "Non renseigne"}</strong>
                      {billet.motif ? <p>{billet.motif}</p> : null}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusTone(billet.statut)}`}>
                        {billet.statut || "Inconnu"}
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
