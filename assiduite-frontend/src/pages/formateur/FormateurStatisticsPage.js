import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/ui/EmptyState";
import api from "../../services/api";

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function FormateurStatisticsPage() {
  const [seances, setSeances] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchStatistics() {
      setLoading(true);
      setError("");

      try {
        const [seancesResponse, absencesResponse] = await Promise.all([
          api.get("/seances"),
          api.get("/absences"),
        ]);

        if (isMounted) {
          setSeances(Array.isArray(seancesResponse.data) ? seancesResponse.data : []);
          setAbsences(
            Array.isArray(absencesResponse.data) ? absencesResponse.data : []
          );
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Impossible de charger les statistiques du groupe."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchStatistics();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const totalSeances = seances.length;
    const totalAbsences = absences.length;
    const justifiees = absences.filter(
      (absence) => absence.statut === "justifiee"
    ).length;
    const nonJustifiees = absences.filter(
      (absence) => absence.statut === "non_justifiee"
    ).length;
    const enAttente = absences.filter(
      (absence) => absence.statut === "en_attente"
    ).length;
    const totalMinutes = absences.reduce(
      (sum, absence) => sum + (Number(absence.duree_minutes) || 0),
      0
    );

    const groupedRows = Object.values(
      seances.reduce((accumulator, seance) => {
        const groupeName = seance.groupe?.nom || "Non renseigne";

        if (!accumulator[groupeName]) {
          accumulator[groupeName] = {
            groupe: groupeName,
            seances: 0,
            absences: 0,
          };
        }

        accumulator[groupeName].seances += 1;
        accumulator[groupeName].absences += absences.filter(
          (absence) => absence.seance_id === seance.id
        ).length;

        return accumulator;
      }, {})
    ).map((row) => ({
      ...row,
      taux: row.seances > 0 ? clampPercent((row.absences / row.seances) * 100) : 0,
    }));

    return {
      totalSeances,
      totalAbsences,
      justifiees,
      nonJustifiees,
      enAttente,
      totalMinutes,
      groupedRows,
    };
  }, [absences, seances]);

  return (
    <div className="page-stack">
      <div className="page-header-row formateur-page-header">
        <div>
          <span className="formateur-page-eyebrow">Formateur</span>
          <h2>Statistiques groupe</h2>
          <p>Consultez les indicateurs et statistiques du groupe.</p>
        </div>
      </div>

      <section className="content-card formateur-module-card">
        <div className="formateur-card-head">
          <div>
            <span className="formateur-section-tag">Analyse</span>
            <h3 className="section-title">Vue d'ensemble</h3>
            <p className="soft-text">
              Les indicateurs de suivi restent identiques, avec une presentation plus lisible.
            </p>
          </div>
        </div>

        {loading ? (
          <EmptyState
            icon="..."
            title="Chargement des statistiques..."
            message="Les indicateurs sont en cours de recuperation."
            compact
          />
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <span>Seances</span>
                <strong>{summary.totalSeances}</strong>
                <p>Planifiees</p>
              </div>

              <div className="stat-card">
                <span>Absences</span>
                <strong>{summary.totalAbsences}</strong>
                <p>Enregistrees</p>
              </div>

              <div className="stat-card">
                <span>Justifiees</span>
                <strong>{summary.justifiees}</strong>
                <p>Regularisees</p>
              </div>

              <div className="stat-card">
                <span>Non justifiees</span>
                <strong>{summary.nonJustifiees}</strong>
                <p>A traiter</p>
              </div>

              <div className="stat-card">
                <span>En attente</span>
                <strong>{summary.enAttente}</strong>
                <p>Validation requise</p>
              </div>

              <div className="stat-card">
                <span>Duree totale</span>
                <strong>{summary.totalMinutes} min</strong>
                <p>Absences cumulees</p>
              </div>
            </div>

            {summary.groupedRows.length === 0 ? (
              <div className="empty-state formateur-block-gap">
                <strong>Aucune statistique disponible</strong>
                <p>
                  Les statistiques du groupe apparaitront ici apres liaison avec le backend.
                </p>
              </div>
            ) : (
              <div className="data-table-wrap formateur-block-gap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Groupe</th>
                      <th>Seances</th>
                      <th>Absences</th>
                      <th>Taux</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.groupedRows.map((row) => (
                      <tr key={row.groupe}>
                        <td>{row.groupe}</td>
                        <td>{row.seances}</td>
                        <td>{row.absences}</td>
                        <td>
                          <span className="status-badge info">{row.taux}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
