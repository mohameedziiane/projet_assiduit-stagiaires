import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";

function formatDate(date) {
  if (!date) {
    return "Non renseignee";
  }

  return new Date(date).toLocaleDateString("fr-FR");
}

function formatTime(time) {
  if (!time) {
    return "Non renseignee";
  }

  return time.slice(0, 5);
}

export default function FormateurSeancesPage() {
  const toast = useToast();
  const [seances, setSeances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchSeances() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/seances");

        if (isMounted) {
          setSeances(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err.response?.data?.message ||
            "Impossible de charger les seances.";
          setError(message);
          toast.error(message, "Seances");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSeances();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const rows = useMemo(() => {
    return seances.map((seance) => ({
      id: seance.id,
      module: seance.module || "Non renseigne",
      groupe: seance.groupe?.nom || "Non renseigne",
      date: formatDate(seance.date_seance),
      heureDebut: formatTime(seance.heure_debut),
      heureFin: formatTime(seance.heure_fin),
      salle: seance.salle || "Non renseignee",
    }));
  }, [seances]);

  return (
    <div className="page-stack">
      <div className="page-header-row formateur-page-header">
        <div>
          <span className="formateur-page-eyebrow">Formateur</span>
          <h2>Seances</h2>
          <p>Consultez la liste des seances disponibles.</p>
        </div>
      </div>

      <section className="content-card formateur-module-card">
        <div className="formateur-card-head">
          <div>
            <span className="formateur-section-tag">Planning</span>
            <h3 className="section-title">Planning des seances</h3>
            <p className="soft-text">
              Vue centralisee des seances, groupes, horaires et salles.
            </p>
          </div>

          {!loading && !error && rows.length > 0 ? (
            <span className="status-badge info">{rows.length} seance(s)</span>
          ) : null}
        </div>

        {loading ? (
          <EmptyState
            icon="..."
            title="Chargement des seances..."
            message="Le planning est en cours de recuperation."
            compact
          />
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="o"
            title="Aucune seance disponible"
            message="Les seances apparaitront ici des qu'elles seront disponibles."
          />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Groupe</th>
                  <th>Date</th>
                  <th>Heure debut</th>
                  <th>Heure fin</th>
                  <th>Salle</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.module}</td>
                    <td>{row.groupe}</td>
                    <td>{row.date}</td>
                    <td>{row.heureDebut}</td>
                    <td>{row.heureFin}</td>
                    <td>{row.salle}</td>
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
