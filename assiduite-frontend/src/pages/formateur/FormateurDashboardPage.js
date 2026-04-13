import { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaClipboardList,
  FaExclamationTriangle,
  FaUsers,
} from "react-icons/fa";
import EmptyState from "../../components/ui/EmptyState";
import api from "../../services/api";

function extractCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) {
    return "Date inconnue";
  }

  const [year, month, day] = String(value).split("-");

  if (year && month && day) {
    return `${day}/${month}/${year}`;
  }

  return value;
}

function formatTime(value) {
  if (!value) {
    return "--:--";
  }

  return String(value).slice(0, 5);
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function FormateurDashboardPage() {
  const [seances, setSeances] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      setLoading(true);
      setError("");

      try {
        const [seancesResponse, absencesResponse] = await Promise.all([
          api.get("/seances"),
          api.get("/absences"),
        ]);

        if (isMounted) {
          setSeances(extractCollection(seancesResponse.data));
          setAbsences(extractCollection(absencesResponse.data));
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Impossible de charger le tableau de bord."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const todayKey = getTodayKey();
    const seancesToday = seances.filter(
      (seance) => String(seance.date_seance || "").slice(0, 10) === todayKey
    );
    const absencesToday = absences.filter(
      (absence) =>
        String(absence.seance?.date_seance || "").slice(0, 10) === todayKey
    );
    const nonJustifiees = absences.filter(
      (absence) => absence.statut === "non_justifiee"
    );

    const absenceRate =
      seances.length > 0 ? (absences.length / seances.length) * 100 : 0;
    const justifiedRate =
      absences.length > 0
        ? ((absences.length - nonJustifiees.length) / absences.length) * 100
        : 0;

    return {
      seancesToday,
      seancesTotal: seances.length,
      absencesToday: absencesToday.length,
      absencesTotal: absences.length,
      nonJustifieesTotal: nonJustifiees.length,
      absenceRate: clampPercent(absenceRate),
      justifiedRate: clampPercent(justifiedRate),
    };
  }, [absences, seances]);

  return (
    <div className="page-stack">
      <div className="page-header-row formateur-page-header">
        <div>
          <span className="formateur-page-eyebrow">Formateur</span>
          <h2>Tableau de bord</h2>
          <p>Vue globale de votre espace formateur et des signaux du jour.</p>
        </div>
      </div>

      <div className="formateur-stats-grid">
        <div className="formateur-stat-card blue">
          <div className="formateur-stat-icon">
            <FaCalendarAlt />
          </div>
          <div className="formateur-stat-label">Seances du jour</div>
          <div className="formateur-stat-value">
            {loading ? "..." : summary.seancesToday.length}
          </div>
        </div>

        <div className="formateur-stat-card red">
          <div className="formateur-stat-icon">
            <FaUsers />
          </div>
          <div className="formateur-stat-label">Stagiaires absents</div>
          <div className="formateur-stat-value">
            {loading ? "..." : summary.absencesToday}
          </div>
        </div>

        <div className="formateur-stat-card green">
          <div className="formateur-stat-icon">
            <FaClipboardList />
          </div>
          <div className="formateur-stat-label">Seances planifiees</div>
          <div className="formateur-stat-value">
            {loading ? "..." : summary.seancesTotal}
          </div>
        </div>

        <div className="formateur-stat-card orange">
          <div className="formateur-stat-icon">
            <FaExclamationTriangle />
          </div>
          <div className="formateur-stat-label">Alertes</div>
          <div className="formateur-stat-value">
            {loading ? "..." : summary.nonJustifieesTotal}
          </div>
        </div>
      </div>

      <div className="formateur-dashboard-grid">
        <section className="content-card formateur-module-card">
          <div className="formateur-card-head">
            <div>
              <span className="formateur-section-tag">Planning</span>
              <h3 className="section-title">Seances d'aujourd'hui</h3>
              <p className="soft-text">
                Retrouvez les seances du jour et leur repartition par groupe.
              </p>
            </div>
          </div>

          {error ? (
            <EmptyState icon="!" title="Chargement impossible" message={error} />
          ) : null}

          {!error && loading ? (
            <EmptyState
              icon="..."
              title="Chargement en cours"
              message="Les donnees du jour sont en cours de recuperation."
              compact
            />
          ) : null}

          {!error && !loading && summary.seancesToday.length === 0 ? (
            <EmptyState
              icon="o"
              title="Aucune seance pour le moment"
              message="Aucune seance n'est planifiee aujourd'hui."
            />
          ) : null}

          {!error && !loading && summary.seancesToday.length > 0 ? (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Groupe</th>
                    <th>Date</th>
                    <th>Horaire</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.seancesToday.map((seance) => (
                    <tr key={seance.id}>
                      <td>{seance.module || "Module non renseigne"}</td>
                      <td>{seance.groupe?.nom || "Groupe non renseigne"}</td>
                      <td>{formatDate(seance.date_seance)}</td>
                      <td>
                        {formatTime(seance.heure_debut)} - {formatTime(seance.heure_fin)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <section className="content-card formateur-module-card formateur-summary-card">
          <div className="formateur-card-head">
            <div>
              <span className="formateur-section-tag">Indicateurs</span>
              <h3 className="section-title">Statistiques groupe</h3>
              <p className="soft-text">
                Resume compact des absences et du suivi de regularisation.
              </p>
            </div>
          </div>

          <div className="formateur-progress-block">
            <div className="formateur-progress-head">
              <span>Taux de presence</span>
              <strong>{loading ? "..." : `${summary.absenceRate}%`}</strong>
            </div>
            <div className="formateur-progress-bar">
              <div
                className="formateur-progress-fill blue-fill"
                style={{ width: `${loading ? 0 : summary.absenceRate}%` }}
              />
            </div>
          </div>

          <div className="formateur-progress-block">
            <div className="formateur-progress-head">
              <span>Absences justifiees</span>
              <strong>{loading ? "..." : `${summary.justifiedRate}%`}</strong>
            </div>
            <div className="formateur-progress-bar">
              <div
                className="formateur-progress-fill green-fill"
                style={{ width: `${loading ? 0 : summary.justifiedRate}%` }}
              />
            </div>
          </div>

          {!error && !loading ? (
            <div className="formateur-summary-note">
              Total absences: {summary.absencesTotal} | Absences du jour:{" "}
              {summary.absencesToday}
            </div>
          ) : null}

          {error ? <div className="formateur-summary-note">{error}</div> : null}
        </section>
      </div>
    </div>
  );
}
