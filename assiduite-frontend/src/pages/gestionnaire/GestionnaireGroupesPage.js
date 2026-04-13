import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";

export default function GestionnaireGroupesPage() {
  const toast = useToast();
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchGroupes() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/groupes");

        if (isMounted) {
          setGroupes(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err.response?.data?.message || "Impossible de charger les groupes.";
          setError(message);
          toast.error(message, "Groupes");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchGroupes();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const rows = useMemo(() => {
    return groupes.map((groupe) => ({
      id: groupe.id,
      nom: groupe.nom || "Non renseigne",
      filiere: groupe.filiere || "Non renseignee",
      niveau: groupe.niveau || "Non renseigne",
      anneeScolaire: groupe.annee_scolaire || "Non renseignee",
      anneeFormation: groupe.annee_formation || "Non renseignee",
    }));
  }, [groupes]);

  return (
    <div className="page-stack">
      <div className="page-header-row gestionnaire-page-header">
        <div>
          <span className="gestionnaire-page-eyebrow">Gestionnaire</span>
          <h2>Groupes</h2>
          <p>Consultez les groupes et leurs informations de structure.</p>
        </div>
      </div>

      <section className="content-card gestionnaire-module-card">
        <div className="gestionnaire-card-head">
          <div>
            <span className="gestionnaire-section-tag">Organisation</span>
            <h3 className="section-title">Liste des groupes</h3>
            <p className="soft-text">
              Vue centralisee des groupes, filieres et annees de formation.
            </p>
          </div>

          {!loading && !error && rows.length > 0 ? (
            <span className="status-badge info">{rows.length} groupe(s)</span>
          ) : null}
        </div>

        {loading ? (
          <EmptyState
            icon="..."
            title="Chargement des groupes..."
            message="La liste est en cours de recuperation."
            compact
          />
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="o"
            title="Aucun groupe disponible"
            message="Les groupes apparaitront ici des qu'ils seront disponibles."
          />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Filiere</th>
                  <th>Niveau</th>
                  <th>Annee scolaire</th>
                  <th>Annee formation</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.nom}</td>
                    <td>{row.filiere}</td>
                    <td>{row.niveau}</td>
                    <td>{row.anneeScolaire}</td>
                    <td>{row.anneeFormation}</td>
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
