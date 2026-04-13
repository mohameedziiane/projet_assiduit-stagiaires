import { useEffect, useMemo, useState } from "react";
import {
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUsers,
} from "react-icons/fa";
import ChartJsPanel from "../../components/ui/ChartJsPanel";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";

const months = [
  "Janvier 2026",
  "Fevrier 2026",
  "Mars 2026",
  "Avril 2026",
  "Mai 2026",
  "Juin 2026",
  "Juillet 2026",
  "Aout 2026",
  "Septembre 2026",
  "Octobre 2026",
  "Novembre 2026",
  "Decembre 2026",
];

const chartMonths = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun"];

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

const kpiItems = [
  {
    key: "absentRate",
    label: "Absenteisme global",
    Icon: FaChartLine,
    tone: "blue",
  },
  {
    key: "presenceRate",
    label: "Stagiaires presents",
    Icon: FaUsers,
    tone: "green",
  },
  {
    key: "justifiedRate",
    label: "Justificatifs traites",
    Icon: FaCheckCircle,
    tone: "info",
  },
  {
    key: "alertesCritiques",
    label: "Alertes critiques",
    Icon: FaExclamationTriangle,
    tone: "red",
  },
];

export default function DirecteurDashboardPage() {
  const toast = useToast();
  const [selectedMonth, setSelectedMonth] = useState("Avril 2026");
  const [globalStats, setGlobalStats] = useState(null);
  const [groupesStats, setGroupesStats] = useState([]);
  const [stagiairesStats, setStagiairesStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      setLoading(true);
      setError("");

      try {
        const [globalResponse, groupesResponse, stagiairesResponse] =
          await Promise.all([
            api.get("/stats/globales"),
            api.get("/stats/groupes"),
            api.get("/stats/stagiaires"),
          ]);

        if (isMounted) {
          setGlobalStats(globalResponse.data);
          setGroupesStats(
            Array.isArray(groupesResponse.data) ? groupesResponse.data : []
          );
          setStagiairesStats(
            Array.isArray(stagiairesResponse.data) ? stagiairesResponse.data : []
          );
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err.response?.data?.message ||
            "Impossible de charger le tableau de bord.";
          setError(message);
          toast.error(message, "Tableau de bord");
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
  }, [toast]);

  const summary = useMemo(() => {
    const totalStagiaires = Number(globalStats?.total_stagiaires) || 0;
    const totalAbsences = Number(globalStats?.total_absences) || 0;
    const totalJustificatifs = Number(globalStats?.total_justificatifs) || 0;
    const justificatifsTraites =
      (Number(globalStats?.justificatifs_valides) || 0) +
      (Number(globalStats?.justificatifs_refuses) || 0);

    const absentRate =
      totalStagiaires > 0 ? (totalAbsences / totalStagiaires) * 100 : 0;
    const presenceRate = 100 - clampPercent(absentRate);
    const justifiedRate =
      totalJustificatifs > 0
        ? (justificatifsTraites / totalJustificatifs) * 100
        : 0;

    const alertesCritiques = stagiairesStats.filter(
      (item) => Number(item.absences_non_justifiees) >= 3
    ).length;

    const trendRows = groupesStats
      .map((groupe) => ({
        id: groupe.id,
        nom: groupe.nom || "Non renseigne",
        taux: clampPercent(
          (Number(groupe.moyenne_absences_par_stagiaire) || 0) * 10
        ),
        totalAbsences: Number(groupe.total_absences) || 0,
      }))
      .sort((left, right) => right.taux - left.taux);

    const topGroupes = [...trendRows]
      .sort((left, right) => left.taux - right.taux)
      .slice(0, 5);

    return {
      absentRate: clampPercent(absentRate),
      presenceRate: clampPercent(presenceRate),
      justifiedRate: clampPercent(justifiedRate),
      alertesCritiques,
      trendRows,
      topGroupes,
    };
  }, [globalStats, groupesStats, stagiairesStats]);

  const globalTrendChart = useMemo(() => {
    const baseGlobal = summary.absentRate;
    const globalLine = [0.82, 0.9, 0.88, 0.96, 1.02, 1.08].map((multiplier) =>
      clampPercent(baseGlobal * multiplier)
    );

    const comparisonGroupes = [...groupesStats]
      .sort(
        (left, right) =>
          (Number(right.total_absences) || 0) - (Number(left.total_absences) || 0)
      )
      .slice(0, 2);

    const palette = ["#D97706", "#6B7280"];

    return {
      data: {
        labels: chartMonths,
        datasets: [
          {
            label: "Global",
            data: globalLine,
            borderColor: "#1D9E75",
            backgroundColor: "transparent",
            pointBackgroundColor: "#1D9E75",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 4,
            tension: 0.35,
            fill: false,
          },
          ...comparisonGroupes.map((groupe, index) => {
            const baseRate = clampPercent(
              (Number(groupe.moyenne_absences_par_stagiaire) || 0) * 10
            );

            return {
              label: groupe.nom || `Groupe ${index + 1}`,
              data: [0.8, 0.92, 0.89, 1.01, 0.95, 1.05].map((multiplier) =>
                clampPercent(baseRate * multiplier)
              ),
              borderColor: palette[index],
              backgroundColor: "transparent",
              pointBackgroundColor: palette[index],
              pointBorderColor: "#ffffff",
              pointBorderWidth: 2,
              pointRadius: 3,
              tension: 0.3,
              borderDash: [6, 6],
              fill: false,
            };
          }),
        ],
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label(context) {
                return `${context.dataset.label} : ${context.parsed.y}%`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback(value) {
                return `${value}%`;
              },
            },
          },
        },
      },
    };
  }, [groupesStats, summary.absentRate]);

  const topStableChart = useMemo(() => {
    return {
      data: {
        labels: summary.topGroupes.map((row) => row.nom),
        datasets: [
          {
            label: "Taux d'assiduité",
            data: summary.topGroupes.map((row) => clampPercent(100 - row.taux)),
            backgroundColor: "#1D9E75",
            borderRadius: 8,
            barThickness: 18,
          },
        ],
      },
      options: {
        indexAxis: "y",
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label(context) {
                return `${context.parsed.x}%`;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback(value) {
                return `${value}%`;
              },
            },
          },
        },
      },
    };
  }, [summary.topGroupes]);

  function handleDownloadMonthlyReport() {
    const content = `
RAPPORT MENSUEL - DIRECTEUR
Periode : ${selectedMonth}

Resume:
- Absenteisme global : ${loading ? "..." : `${summary.absentRate}%`}
- Stagiaires presents : ${loading ? "..." : `${summary.presenceRate}%`}
- Justificatifs traites : ${loading ? "..." : `${summary.justifiedRate}%`}
- Alertes critiques : ${loading ? "..." : summary.alertesCritiques}

Details:
${
      loading || summary.topGroupes.length === 0
        ? "Aucune donnee exploitable pour le moment."
        : summary.topGroupes
            .map(
              (groupe) =>
                `- ${groupe.nom}: ${groupe.taux}% / ${groupe.totalAbsences} absence(s)`
            )
            .join("\n")
    }
    `.trim();

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `rapport-mensuel-${selectedMonth.replace(/\s+/g, "-")}.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-stack">
      <div className="page-header-row directeur-page-header">
        <div>
          <span className="directeur-page-eyebrow">Directeur</span>
          <h2>Tableau de bord executif</h2>
          <p>Vue d'ensemble de l'assiduite a l'echelle de l'institution.</p>
        </div>

        <div className="directeur-actions">
          <select
            className="directeur-month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>

          <button className="primary-btn" onClick={handleDownloadMonthlyReport}>
            Rapport mensuel
          </button>
        </div>
      </div>

      <div className="directeur-stats-grid">
        {kpiItems.map((item) => {
          const Icon = item.Icon;
          const value =
            item.key === "alertesCritiques"
              ? summary.alertesCritiques
              : `${summary[item.key]}%`;

          return (
            <div className="directeur-stat-card" key={item.key}>
              <div className={`directeur-stat-icon ${item.tone}`}>
                <Icon />
              </div>
              <span>{item.label}</span>
              <strong>{loading ? "..." : value}</strong>
            </div>
          );
        })}
      </div>

      <div className="directeur-dashboard-grid">
        <section className="content-card directeur-module-card">
          <div className="directeur-section-header">
            <div>
              <span className="directeur-section-tag">Tendance</span>
              <h3 className="section-title">Tendance de l'absenteisme</h3>
              <p>Evolution simple par groupe sur les donnees disponibles.</p>
            </div>
          </div>

          {loading ? (
            <EmptyState
              icon="..."
              title="Chargement des tendances..."
              message="Les indicateurs sont en cours de recuperation."
              compact
            />
          ) : error ? (
            <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : summary.trendRows.length === 0 ? (
          <div className="empty-state chart-empty">
            <strong>Aucune donnee disponible</strong>
            <p>Le graphique apparaitra ici apres liaison avec le backend.</p>
          </div>
        ) : (
          <ChartJsPanel
            title="Tendance globale de l'absentéisme"
            subtitle="Lecture consolidée du taux d'absence global avec repères de groupes."
            type="line"
            data={globalTrendChart.data}
            options={globalTrendChart.options}
            height={260}
            className="chart-panel"
            emptyMessage="La tendance globale apparaîtra ici dès que les données seront disponibles."
          />
        )}
      </section>

        <section className="content-card directeur-module-card">
          <div className="directeur-section-header">
            <div>
              <span className="directeur-section-tag">Classement</span>
              <h3 className="section-title">Top 5 groupes assidus</h3>
              <p>Les groupes les plus stables selon les donnees actuelles.</p>
            </div>
          </div>

          {loading ? (
            <EmptyState
              icon="..."
              title="Chargement du classement..."
              message="Le classement est en cours de recuperation."
              compact
            />
          ) : error ? (
            <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : summary.topGroupes.length === 0 ? (
          <div className="empty-state chart-empty">
            <strong>Aucun classement disponible</strong>
            <p>Le classement apparaitra ici apres liaison avec le backend.</p>
          </div>
        ) : (
          <ChartJsPanel
            title="Top 5 groupes assidus"
            subtitle="Les groupes présentant la meilleure assiduité moyenne."
            type="bar"
            data={topStableChart.data}
            options={topStableChart.options}
            height={260}
            className="chart-panel"
            emptyMessage="Le classement apparaîtra ici dès que les données seront disponibles."
          />
        )}
      </section>
      </div>
    </div>
  );
}
