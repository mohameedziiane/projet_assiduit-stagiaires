import { useEffect, useMemo, useState } from "react";
import StudentAbsenceEvolutionChart from "../../components/student/StudentAbsenceEvolutionChart";
import ChartJsPanel from "../../components/ui/ChartJsPanel";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString("fr-FR", {
    month: "short",
    year: "numeric",
  });
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getComparisonState(diff) {
  if (Math.abs(diff) < 0.25) {
    return {
      label: "Proche de la moyenne du groupe",
      tone: "neutral",
      message: "Votre situation est globalement alignee avec celle de votre groupe.",
    };
  }

  if (diff < 0) {
    return {
      label: "Meilleur que la moyenne du groupe",
      tone: "positive",
      message: "Vous avez moins d'absences que la moyenne de votre groupe.",
    };
  }

  return {
    label: "Au-dessus de la moyenne du groupe",
    tone: "warning",
    message: "Votre nombre d'absences depasse la moyenne de votre groupe.",
  };
}

export default function StudentStatisticsPage() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      setLoading(true);
      setError("");

      try {
        const meResponse = await api.get("/me");
        const stagiaireId = meResponse.data?.stagiaire?.id;

        if (!stagiaireId) {
          throw new Error("Profil stagiaire introuvable.");
        }

        const response = await api.get(`/stats/stagiaire/${stagiaireId}`);

        if (isMounted) {
          setStats(response.data);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err.response?.data?.message ||
            err.message ||
            "Impossible de charger vos statistiques.";
          setError(message);
          toast.error(message, "Statistiques");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const chartData = useMemo(() => {
    if (!Array.isArray(stats?.absences_par_mois)) {
      return [];
    }

    return stats.absences_par_mois.map((item) => ({
      key: item.mois,
      month: formatMonthLabel(item.mois),
      value: Number(item.total) || 0,
    }));
  }, [stats]);

  const distributionChartConfig = useMemo(() => {
    if (!stats) {
      return null;
    }

    const justified = Number(stats?.absences_justifiees ?? stats?.justified) || 0;
    const unjustified =
      Number(stats?.absences_non_justifiees ?? stats?.unjustified) || 0;
    const pending = Number(stats?.pending) || 0;

    return {
      data: {
        labels: ["Justifiée", "Non justifiée", "En attente"],
        datasets: [
          {
            data: [justified, unjustified, pending],
            backgroundColor: ["#1D9E75", "#EAB308", "#9CA3AF"],
            borderColor: "#ffffff",
            borderWidth: 2,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        cutout: "66%",
        plugins: {
          tooltip: {
            callbacks: {
              label(context) {
                return `${context.label} : ${context.parsed}`;
              },
            },
          },
        },
      },
    };
  }, [stats]);

  const insights = useMemo(() => {
    const totalAbsences = Number(stats?.total_absences) || 0;
    const groupAverage = Number(stats?.moyenne_absences_groupe) || 0;
    const absenceRate = Number(stats?.taux_absence) || 0;
    const attendanceRate = clampPercent(100 - absenceRate);
    const comparisonGap =
      Number(stats?.comparaison_groupe?.ecart_absences_vs_moyenne) ||
      totalAbsences - groupAverage;
    const comparisonState = getComparisonState(comparisonGap);

    return {
      totalAbsences,
      groupAverage,
      absenceRate: clampPercent(absenceRate),
      attendanceRate,
      comparisonGap,
      comparisonState,
      groupName: stats?.stagiaire?.groupe || "Votre groupe",
    };
  }, [stats]);

  return (
    <div className="page-stack">
      <div className="page-header-row stagiaire-page-header">
        <div>
          <span className="stagiaire-page-eyebrow">Stagiaire</span>
          <h2>Statistiques</h2>
          <p>Suivez votre evolution et comparez votre assiduite.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total absences</span>
          <strong>{loading ? "..." : stats?.total_absences ?? 0}</strong>
          <p>{loading ? "Chargement..." : "Statistique personnelle"}</p>
        </div>

        <div className="stat-card">
          <span>Absences justifiees</span>
          <strong>{loading ? "..." : stats?.absences_justifiees ?? stats?.justified ?? 0}</strong>
          <p>{loading ? "Chargement..." : "Absences regularisees"}</p>
        </div>

        <div className="stat-card">
          <span>Absences non justifiees</span>
          <strong>
            {loading ? "..." : stats?.absences_non_justifiees ?? stats?.unjustified ?? 0}
          </strong>
          <p>{loading ? "Chargement..." : "A regulariser rapidement"}</p>
        </div>

        <div className="stat-card">
          <span>En attente</span>
          <strong>{loading ? "..." : stats?.pending ?? 0}</strong>
          <p>{loading ? "Chargement..." : "Justificatifs en cours"}</p>
        </div>
      </div>

      <section className="content-card stagiaire-module-card">
        <div className="stagiaire-card-head">
          <div>
            <span className="stagiaire-section-tag">Comparaison</span>
            <h3 className="section-title">Comparaison avec le groupe</h3>
            <p className="soft-text">
              Positionnement personnel par rapport a la moyenne de votre groupe.
            </p>
          </div>
        </div>

        {loading ? (
          <EmptyState
            icon="..."
            title="Chargement de la comparaison..."
            message="Votre position par rapport au groupe est en cours de calcul."
            compact
          />
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : !stats ? (
          <EmptyState
            icon="~"
            title="Aucune comparaison disponible"
            message="Les indicateurs comparatifs apparaitront ici des que les donnees seront disponibles."
          />
        ) : (
          <div className="statistics-page-stack">
            <div className="student-comparison-grid">
              <article className="student-comparison-card">
                <span>Vos absences</span>
                <strong>{insights.totalAbsences}</strong>
                <p>Total personnel enregistre</p>
              </article>

              <article className="student-comparison-card">
                <span>Moyenne du groupe</span>
                <strong>{insights.groupAverage.toFixed(1)}</strong>
                <p>{insights.groupName}</p>
              </article>

              <article className="student-comparison-card">
                <span>Votre position</span>
                <strong>{insights.comparisonState.label}</strong>
                <p>
                  Ecart de {Math.abs(insights.comparisonGap).toFixed(1)} absence(s)
                  par rapport a la moyenne
                </p>
              </article>

              <article className="student-comparison-card">
                <span>Taux de presence</span>
                <strong>{insights.attendanceRate}%</strong>
                <p>
                  {insights.absenceRate}% d'absences sur les seances de votre groupe
                </p>
              </article>
            </div>

            <div
              className={`student-comparison-banner student-comparison-${insights.comparisonState.tone}`}
            >
              <strong>{insights.comparisonState.label}</strong>
              <p>{insights.comparisonState.message}</p>
            </div>
          </div>
        )}
      </section>

      <section className="content-card stagiaire-module-card">
        <div className="stagiaire-card-head">
          <div>
            <span className="stagiaire-section-tag">Evolution</span>
            <h3 className="section-title">Evolution de l'absenteisme</h3>
            <p className="soft-text">
              Suivi mensuel de vos absences deja consolidees.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <strong>Chargement des statistiques</strong>
            <p>Le graphique est en cours de preparation.</p>
          </div>
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : chartData.length === 0 ? (
          <div className="empty-state">
            <strong>Aucune statistique pour le moment</strong>
            <p>Le graphique apparaitra ici des qu'une absence sera enregistree.</p>
          </div>
        ) : (
          <StudentAbsenceEvolutionChart
            data={chartData}
            groupAverage={insights.groupAverage}
          />
        )}
      </section>

      <section className="content-card stagiaire-module-card">
        <div className="stagiaire-card-head">
          <div>
            <span className="stagiaire-section-tag">Répartition</span>
            <h3 className="section-title">Répartition de vos absences</h3>
            <p className="soft-text">
              Visualisez rapidement la part des absences justifiées, non justifiées et en attente.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <strong>Chargement de la répartition</strong>
            <p>Le graphique est en cours de préparation.</p>
          </div>
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : (
          <ChartJsPanel
            title="Statut de vos absences"
            subtitle="Une lecture simple de votre situation personnelle."
            type="doughnut"
            data={distributionChartConfig?.data}
            options={distributionChartConfig?.options}
            height={220}
            className="chart-card"
            emptyMessage="Aucune absence n'est disponible pour établir une répartition."
          />
        )}
      </section>
    </div>
  );
}
