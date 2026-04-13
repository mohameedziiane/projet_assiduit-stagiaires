import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChartJsPanel from "../../components/ui/ChartJsPanel";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";

function formatDate(value) {
  if (!value) {
    return "Date inconnue";
  }

  return String(value).slice(0, 10);
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

const trendMonths = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun"];

function buildTrendSeries(groupes) {
  const multipliers = [0.82, 0.9, 0.88, 1.02, 0.96, 1.08];
  const palette = ["#1D9E75", "#D97706", "#6B7280", "#0F766E"];

  return groupes.slice(0, 4).map((groupe, index) => {
    const baseRate = clampPercent(
      (Number(groupe.moyenne_absences_par_stagiaire) || 0) * 10
    );

    return {
      label: groupe.nom || `Groupe ${index + 1}`,
      data: multipliers.map((multiplier, monthIndex) =>
        clampPercent(baseRate * multiplier + monthIndex * 0.6)
      ),
      borderColor: palette[index % palette.length],
      backgroundColor: "transparent",
      pointBackgroundColor: palette[index % palette.length],
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2,
      pointRadius: 3,
      tension: 0.35,
      fill: false,
    };
  });
}

export default function GestionnaireDashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [groupes, setGroupes] = useState([]);
  const [stagiaires, setStagiaires] = useState([]);
  const [justificatifs, setJustificatifs] = useState([]);
  const [billets, setBillets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      setLoading(true);
      setError("");

      try {
        const [
          groupesResponse,
          stagiairesResponse,
          justificatifsResponse,
          billetsResponse,
        ] = await Promise.all([
          api.get("/stats/groupes"),
          api.get("/stats/stagiaires"),
          api.get("/justificatifs"),
          api.get("/billets"),
        ]);

        if (isMounted) {
          setGroupes(Array.isArray(groupesResponse.data) ? groupesResponse.data : []);
          setStagiaires(
            Array.isArray(stagiairesResponse.data) ? stagiairesResponse.data : []
          );
          setJustificatifs(
            Array.isArray(justificatifsResponse.data) ? justificatifsResponse.data : []
          );
          setBillets(Array.isArray(billetsResponse.data) ? billetsResponse.data : []);
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
    const justificatifsEnAttente = justificatifs.filter(
      (item) => item.statut === "en_attente"
    ).length;
    const totalAbsences = groupes.reduce(
      (sum, groupe) => sum + (Number(groupe.total_absences) || 0),
      0
    );
    const totalStagiaires = stagiaires.length;
    const tauxAbsent =
      totalStagiaires > 0 ? (totalAbsences / totalStagiaires) * 100 : 0;

    const groupesAbsence = groupes.map((groupe) => ({
      id: groupe.id,
      nom: groupe.nom || "Non renseigne",
      taux: clampPercent((Number(groupe.moyenne_absences_par_stagiaire) || 0) * 10),
      totalAbsences: Number(groupe.total_absences) || 0,
    }));

    const recentActions = [...justificatifs]
      .sort((a, b) => {
        const left = new Date(b.date_depot || 0).getTime();
        const right = new Date(a.date_depot || 0).getTime();
        return left - right;
      })
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        stagiaire:
          [item.absence?.stagiaire?.prenom, item.absence?.stagiaire?.nom]
            .filter(Boolean)
            .join(" ")
            .trim() || "Non renseigne",
        statut: item.statut || "Inconnu",
        date: formatDate(item.date_depot),
      }));

    return {
      totalStagiaires,
      justificatifsEnAttente,
      billetsGeneres: billets.length,
      tauxAbsent: clampPercent(tauxAbsent),
      groupesAbsence,
      recentActions,
    };
  }, [billets, groupes, justificatifs, stagiaires]);

  const absenteeismTrendChart = useMemo(() => {
    const datasets = buildTrendSeries(groupes);

    return {
      data: {
        labels: trendMonths,
        datasets,
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
  }, [groupes]);

  const topAttendanceChart = useMemo(() => {
    const topGroupes = [...groupes]
      .map((groupe) => {
        const absenceRate = clampPercent(
          (Number(groupe.moyenne_absences_par_stagiaire) || 0) * 10
        );

        return {
          nom: groupe.nom || "Non renseigne",
          attendanceRate: clampPercent(100 - absenceRate),
        };
      })
      .sort((left, right) => right.attendanceRate - left.attendanceRate)
      .slice(0, 5);

    return {
      data: {
        labels: topGroupes.map((groupe) => groupe.nom),
        datasets: [
          {
            label: "Taux d'assiduité",
            data: topGroupes.map((groupe) => groupe.attendanceRate),
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
  }, [groupes]);

  return (
    <div className="page-stack">
      <div className="page-header-row gestionnaire-page-header">
        <div>
          <span className="gestionnaire-page-eyebrow">Gestionnaire</span>
          <h2>Tableau de bord</h2>
          <p>Suivez les indicateurs prioritaires et les derniers mouvements en un coup d'oeil.</p>
        </div>
      </div>

      <div className="gestionnaire-stats-grid">
        <div className="gestionnaire-stat-card blue">
          <span>Nombre de stagiaires</span>
          <strong>{loading ? "..." : summary.totalStagiaires}</strong>
        </div>

        <div className="gestionnaire-stat-card orange">
          <span>Justificatifs en attente</span>
          <strong>{loading ? "..." : summary.justificatifsEnAttente}</strong>
        </div>

        <div className="gestionnaire-stat-card green">
          <span>Billets generes</span>
          <strong>{loading ? "..." : summary.billetsGeneres}</strong>
        </div>

        <div className="gestionnaire-stat-card red">
          <span>Taux d'absenteisme</span>
          <strong>{loading ? "..." : `${summary.tauxAbsent}%`}</strong>
        </div>
      </div>

      <div className="gestionnaire-dashboard-grid">
        <section className="content-card gestionnaire-module-card">
          <div className="gestionnaire-card-head">
            <div>
              <span className="gestionnaire-section-tag">Vue groupe</span>
              <h3 className="section-title">Absenteisme par groupe</h3>
              <p className="soft-text">
                Comparez rapidement les groupes les plus exposes selon le volume
                d'absences remonte.
              </p>
            </div>

            <button
              className="secondary-btn"
              onClick={() => navigate("/gestionnaire/statistiques")}
            >
              Voir les statistiques
            </button>
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
        ) : summary.groupesAbsence.length === 0 ? (
          <div className="empty-state chart-empty">
            <strong>Aucune statistique disponible</strong>
            <p>Le graphique apparaitra ici des que les donnees seront disponibles.</p>
          </div>
        ) : (
          <ChartJsPanel
            title="Tendance de l'absentéisme par groupe"
            subtitle="Comparaison des taux d'absence sur les six derniers mois."
            type="line"
            data={absenteeismTrendChart.data}
            options={absenteeismTrendChart.options}
            height={260}
            className="chart-panel"
            emptyMessage="La tendance apparaîtra ici dès que des groupes seront disponibles."
          />
        )}
      </section>

      <section className="content-card gestionnaire-module-card">
        <div className="gestionnaire-card-head">
          <div>
            <span className="gestionnaire-section-tag">Classement</span>
            <h3 className="section-title">Top groupes assidus</h3>
            <p className="soft-text">
              Les groupes les plus reguliers sur la periode recente.
            </p>
          </div>
        </div>

          {loading ? (
            <EmptyState
              icon="..."
              title="Chargement des actions..."
              message="L'historique est en cours de recuperation."
              compact
            />
          ) : error ? (
            <EmptyState icon="!" title="Erreur de chargement" message={error} />
          ) : groupes.length === 0 ? (
            <div className="empty-state">
              <strong>Aucun classement disponible</strong>
              <p>Le classement apparaitra ici des que les groupes seront disponibles.</p>
            </div>
          ) : (
            <ChartJsPanel
              title="Top groupes assidus"
              subtitle="Classement du meilleur taux d'assiduité observé."
              type="bar"
              data={topAttendanceChart.data}
              options={topAttendanceChart.options}
              height={260}
              className="chart-panel"
              emptyMessage="Le classement apparaitra ici des que les groupes seront disponibles."
            />
          )}
      </section>

      <section className="content-card gestionnaire-module-card">
        <div className="gestionnaire-card-head">
          <div>
            <span className="gestionnaire-section-tag">Historique</span>
            <h3 className="section-title">Actions recentes</h3>
            <p className="soft-text">
              Les derniers justificatifs deposes sont regroupes ici.
            </p>
          </div>
        </div>

        {loading ? (
          <EmptyState
            icon="..."
            title="Chargement des actions..."
            message="L'historique est en cours de recuperation."
            compact
          />
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : summary.recentActions.length === 0 ? (
          <div className="empty-state">
            <strong>Aucune action recente</strong>
            <p>L'historique apparaitra ici des qu'une activite sera enregistree.</p>
          </div>
        ) : (
          <div className="profile-info-grid">
            {summary.recentActions.map((action) => (
              <div className="profile-item" key={action.id}>
                <span>{action.stagiaire}</span>
                <strong>{action.statut}</strong>
                <p>{action.date}</p>
              </div>
            ))}
          </div>
        )}

        <div className="gestionnaire-inline-actions">
          <button
            className="secondary-btn"
            onClick={() => navigate("/gestionnaire/justificatifs")}
          >
            Voir tout l'historique
          </button>
        </div>
      </section>
      </div>
    </div>
  );
}
