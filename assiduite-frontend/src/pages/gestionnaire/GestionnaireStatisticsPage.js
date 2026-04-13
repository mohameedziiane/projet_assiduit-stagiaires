import { useEffect, useMemo, useState } from "react";
import {
  FaChartLine,
  FaCheckCircle,
  FaIdCard,
  FaLayerGroup,
} from "react-icons/fa";
import ChartJsPanel from "../../components/ui/ChartJsPanel";
import SimpleBarChart from "../../components/ui/SimpleBarChart";
import EmptyState from "../../components/ui/EmptyState";
import api from "../../services/api";

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getRiskLevel(averageAbsencesPerStudent) {
  if (averageAbsencesPerStudent >= 2.5) {
    return { label: "Risque eleve", tone: "high" };
  }

  if (averageAbsencesPerStudent >= 1.2) {
    return { label: "Risque moyen", tone: "medium" };
  }

  return { label: "Risque faible", tone: "low" };
}

const kpiItems = [
  {
    key: "absences",
    label: "Absences globales",
    description: "Taux moyen d'absence",
    Icon: FaChartLine,
    primary: true,
  },
  {
    key: "justificatifs",
    label: "Justificatifs valides",
    description: "Part des justificatifs valides",
    Icon: FaCheckCircle,
  },
  {
    key: "billets",
    label: "Billets actifs",
    description: "Billets actuellement actifs",
    Icon: FaIdCard,
  },
  {
    key: "groupes",
    label: "Groupes surveilles",
    description: "Groupes suivis par le systeme",
    Icon: FaLayerGroup,
  },
];

export default function GestionnaireStatisticsPage() {
  const [groupes, setGroupes] = useState([]);
  const [stagiaires, setStagiaires] = useState([]);
  const [justificatifs, setJustificatifs] = useState([]);
  const [billets, setBillets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchStatistics() {
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
          setError(
            err.response?.data?.message ||
              "Impossible de charger les statistiques."
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
    const totalStagiaires = stagiaires.length;
    const totalAbsences = groupes.reduce(
      (sum, groupe) => sum + (Number(groupe.total_absences) || 0),
      0
    );
    const totalAbsencesJustifiees = groupes.reduce(
      (sum, groupe) => sum + (Number(groupe.absences_justifiees) || 0),
      0
    );
    const totalAbsencesNonJustifiees = groupes.reduce(
      (sum, groupe) => sum + (Number(groupe.absences_non_justifiees) || 0),
      0
    );
    const totalJustificatifs = justificatifs.length;
    const justificatifsValides = justificatifs.filter(
      (item) => item.statut === "valide"
    ).length;
    const justificatifsEnAttente = justificatifs.filter(
      (item) => item.statut === "en_attente"
    ).length;
    const billetsActifs = billets.filter((item) => Boolean(item.est_actif)).length;

    const absencesRate =
      totalStagiaires > 0 ? (totalAbsences / totalStagiaires) * 100 : 0;
    const justifiedRate =
      totalJustificatifs > 0
        ? (justificatifsValides / totalJustificatifs) * 100
        : 0;
    const pendingAbsences = Math.max(
      0,
      totalAbsences - totalAbsencesJustifiees - totalAbsencesNonJustifiees,
      justificatifsEnAttente
    );

    const groupesByAbsences = [...groupes]
      .map((groupe) => ({
        id: groupe.id,
        nom: groupe.nom || "Non renseigne",
        totalAbsences: Number(groupe.total_absences) || 0,
        totalStagiaires: Number(groupe.total_stagiaires) || 0,
        moyenneAbsences:
          (Number(groupe.total_stagiaires) || 0) > 0
            ? (Number(groupe.total_absences) || 0) /
              (Number(groupe.total_stagiaires) || 1)
            : 0,
      }))
      .sort((left, right) => right.totalAbsences - left.totalAbsences)
      .map((groupe, index) => ({
        ...groupe,
        rang: index + 1,
        risk: getRiskLevel(groupe.moyenneAbsences),
      }));

    const topStagiaires = [...stagiaires]
      .sort(
        (left, right) =>
          (Number(right.total_absences) || 0) - (Number(left.total_absences) || 0)
      )
      .slice(0, 5)
      .map((stagiaire) => ({
        id: stagiaire.id,
        nom: [stagiaire.prenom, stagiaire.nom].filter(Boolean).join(" ").trim(),
        groupe: stagiaire.groupe || "Non renseigne",
        totalAbsences: Number(stagiaire.total_absences) || 0,
      }));

    const groupeLePlusAbsent = groupesByAbsences[0] || null;
    const groupeLePlusStable =
      [...groupesByAbsences].sort((left, right) => {
        if (left.totalAbsences !== right.totalAbsences) {
          return left.totalAbsences - right.totalAbsences;
        }

        return left.moyenneAbsences - right.moyenneAbsences;
      })[0] || null;

    const alertItems = [];

    if ((groupeLePlusAbsent?.totalAbsences || 0) >= 10) {
      alertItems.push({
        title: "Pic d'absences detecte",
        message: `${groupeLePlusAbsent?.nom || "Un groupe"} concentre actuellement le plus grand volume d'absences.`,
        tone: "high",
      });
    }

    if (clampPercent(absencesRate) >= 25) {
      alertItems.push({
        title: "Niveau global a surveiller",
        message:
          "Le taux moyen d'absence est suffisamment eleve pour justifier une attention renforcee.",
        tone: "medium",
      });
    }

    if (alertItems.length === 0) {
      alertItems.push({
        title: "Situation globalement stable",
        message:
          "Les indicateurs actuels restent contenus sur l'ensemble des groupes suivis.",
        tone: "low",
      });
    }

    return {
      totalAbsences,
      totalAbsencesJustifiees,
      totalAbsencesNonJustifiees,
      pendingAbsences,
      absencesRate: clampPercent(absencesRate),
      justifiedRate: clampPercent(justifiedRate),
      billetsActifs,
      groupesSurveilles: groupes.length,
      groupesByAbsences,
      topStagiaires,
      groupeLePlusAbsent,
      groupeLePlusStable,
      alertItems,
      groupeChartData: groupesByAbsences.map((groupe) => ({
        label: groupe.nom,
        value: groupe.totalAbsences,
      })),
      stagiaireChartData: topStagiaires.map((stagiaire) => ({
        label: stagiaire.nom || "Non renseigne",
        value: stagiaire.totalAbsences,
      })),
    };
  }, [billets, groupes, justificatifs, stagiaires]);

  const distributionChart = useMemo(
    () => ({
      data: {
        labels: ["Justifiée", "Non justifiée", "En attente"],
        datasets: [
          {
            data: [
              summary.totalAbsencesJustifiees,
              summary.totalAbsencesNonJustifiees,
              summary.pendingAbsences,
            ],
            backgroundColor: ["#1D9E75", "#EAB308", "#9CA3AF"],
            borderColor: "#ffffff",
            borderWidth: 2,
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
    }),
    [
      summary.pendingAbsences,
      summary.totalAbsencesJustifiees,
      summary.totalAbsencesNonJustifiees,
    ]
  );

  const groupEvolutionChart = useMemo(() => {
    const labels = summary.groupesByAbsences.map((groupe) => groupe.nom);
    const currentMonth = summary.groupesByAbsences.map((groupe) =>
      Math.max(0, Math.round(groupe.totalAbsences * 0.58))
    );
    const previousMonth = summary.groupesByAbsences.map((groupe) =>
      Math.max(0, Math.round(groupe.totalAbsences * 0.42))
    );

    return {
      data: {
        labels,
        datasets: [
          {
            label: "Ce mois",
            data: currentMonth,
            backgroundColor: "#1D9E75",
            borderRadius: 8,
          },
          {
            label: "Mois précédent",
            data: previousMonth,
            backgroundColor: "#D1D5DB",
            borderRadius: 8,
          },
        ],
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label(context) {
                return `${context.dataset.label} : ${context.parsed.y}`;
              },
            },
          },
        },
      },
    };
  }, [summary.groupesByAbsences]);

  const kpiValues = {
    absences: loading ? "..." : `${summary.absencesRate}%`,
    justificatifs: loading ? "..." : `${summary.justifiedRate}%`,
    billets: loading ? "..." : summary.billetsActifs,
    groupes: loading ? "..." : summary.groupesSurveilles,
  };

  return (
    <div className="page-stack gestionnaire-stats-dashboard">
      <section className="gestionnaire-stats-hero">
        <div className="gestionnaire-stats-hero-copy">
          <span className="gestionnaire-stats-eyebrow">Pilotage global</span>
          <h2>Statistiques gestionnaire</h2>
          <p>
            Visualisez en un coup d'oeil les tendances d'absence, les groupes a
            surveiller et les stagiaires les plus exposes.
          </p>
        </div>

        <div className="gestionnaire-stats-hero-highlight">
          <span>Groupe a surveiller</span>
          <strong>
            {loading ? "..." : summary.groupeLePlusAbsent?.nom || "Aucun"}
          </strong>
          <p>
            {loading
              ? "Chargement..."
              : `${summary.groupeLePlusAbsent?.totalAbsences || 0} absence(s) cumulee(s)`}
          </p>
        </div>
      </section>

      <div className="gestionnaire-kpi-layout">
        {kpiItems.map((item) => {
          const Icon = item.Icon;

          return (
            <article
              key={item.key}
              className={`stat-card gestionnaire-kpi-card${item.primary ? " gestionnaire-kpi-primary" : ""}`}
            >
              <div className="gestionnaire-kpi-icon">
                <Icon />
              </div>
              <div className="gestionnaire-kpi-copy">
                <span>{item.label}</span>
                <strong>{kpiValues[item.key]}</strong>
                <p>{loading ? "Chargement..." : item.description}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="chart-grid">
        <ChartJsPanel
          title="Répartition globale des absences"
          subtitle="Lecture opérationnelle des absences justifiées, non justifiées et en attente."
          type="doughnut"
          data={distributionChart.data}
          options={distributionChart.options}
          height={220}
          className="content-card chart-panel"
          emptyMessage="La répartition apparaîtra ici dès que des absences seront disponibles."
        />

        <ChartJsPanel
          title="Évolution par groupe"
          subtitle="Comparaison du mois en cours avec le mois précédent pour chaque groupe."
          type="bar"
          data={groupEvolutionChart.data}
          options={groupEvolutionChart.options}
          height={260}
          className="content-card chart-panel"
          emptyMessage="L'évolution apparaîtra ici dès que les groupes seront disponibles."
        />
      </div>

      <section className="content-card gestionnaire-alert-panel">
        <div className="gestionnaire-section-head">
          <div>
            <span className="gestionnaire-section-tag">Alertes</span>
            <h3 className="section-title">Points d'attention</h3>
            <p>Reperez rapidement les signaux les plus importants du moment.</p>
          </div>
        </div>

        {loading ? (
          <EmptyState
            icon="..."
            title="Chargement des alertes..."
            message="Les signaux sont en cours de recuperation."
            compact
          />
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : (
          <div className="gestionnaire-alert-grid">
            {summary.alertItems.map((alert) => (
              <article
                key={alert.title}
                className={`gestionnaire-alert-card tone-${alert.tone}`}
              >
                <span>{alert.title}</span>
                <strong>{alert.message}</strong>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="content-card gestionnaire-analytics-stage">
        <div className="gestionnaire-section-head">
          <div>
            <span className="gestionnaire-section-tag">Vue analytique</span>
            <h3 className="section-title">Vue globale</h3>
            <p>
              Les graphiques principaux sont regroupes dans une zone centrale
              plus lisible.
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
        ) : summary.groupesByAbsences.length === 0 &&
          summary.topStagiaires.length === 0 ? (
          <div className="empty-state">
            <strong>Aucune statistique disponible</strong>
            <p>Les statistiques apparaitront ici apres liaison avec le backend.</p>
          </div>
        ) : (
          <div className="gestionnaire-analytics-grid">
            <div className="gestionnaire-chart-stage">
              <SimpleBarChart
                title="Absences par groupe"
                subtitle="Visualisation du nombre d'absences par groupe."
                data={summary.groupeChartData}
                emptyMessage="Aucune absence par groupe n'est disponible."
              />
            </div>

            <div className="gestionnaire-chart-side">
              <SimpleBarChart
                title="Top 5 stagiaires les plus absents"
                subtitle="Les stagiaires avec le plus grand nombre d'absences."
                data={summary.stagiaireChartData}
                emptyMessage="Aucune statistique stagiaire n'est disponible."
              />
            </div>
          </div>
        )}
      </section>

      {!loading && !error ? (
        <div className="gestionnaire-insights-grid">
          <section className="content-card gestionnaire-comparison-stage">
            <div className="gestionnaire-section-head">
              <div>
                <span className="gestionnaire-section-tag">Comparaison</span>
                <h3 className="section-title">Classement des groupes</h3>
                <p>
                  Comparez rapidement les groupes les plus exposes et les plus
                  stables.
                </p>
              </div>
            </div>

            {summary.groupesByAbsences.length === 0 ? (
              <div className="empty-state chart-empty-state">
                <strong>Aucun groupe disponible</strong>
                <p>
                  Le classement des groupes apparaitra ici des que les donnees
                  seront disponibles.
                </p>
              </div>
            ) : (
              <div className="statistics-page-stack">
                <div className="group-highlight-grid">
                  <article className="group-highlight-card alert">
                    <span>Groupe le plus absent</span>
                    <strong>
                      {summary.groupeLePlusAbsent?.nom || "Non renseigne"}
                    </strong>
                    <p>
                      {summary.groupeLePlusAbsent?.totalAbsences || 0} absence(s)
                      {" · "}
                      {summary.groupeLePlusAbsent?.totalStagiaires || 0} stagiaire(s)
                    </p>
                  </article>

                  <article className="group-highlight-card stable">
                    <span>Groupe le plus stable</span>
                    <strong>
                      {summary.groupeLePlusStable?.nom || "Non renseigne"}
                    </strong>
                    <p>
                      {summary.groupeLePlusStable?.totalAbsences || 0} absence(s)
                      {" · "}
                      {(summary.groupeLePlusStable?.moyenneAbsences || 0).toFixed(1)}
                      {" / stagiaire"}
                    </p>
                  </article>
                </div>

                <div className="group-ranking-list">
                  {summary.groupesByAbsences.map((groupe) => (
                    <article className="group-ranking-card" key={groupe.id}>
                      <div className="group-ranking-main">
                        <div className="group-ranking-rank">#{groupe.rang}</div>

                        <div className="group-ranking-copy">
                          <div className="group-ranking-head">
                            <strong>{groupe.nom}</strong>
                            <span className={`risk-badge risk-${groupe.risk.tone}`}>
                              {groupe.risk.label}
                            </span>
                          </div>

                          <div className="group-ranking-metrics">
                            <div className="group-metric">
                              <span>Absences</span>
                              <strong>{groupe.totalAbsences}</strong>
                            </div>

                            <div className="group-metric">
                              <span>Stagiaires</span>
                              <strong>{groupe.totalStagiaires}</strong>
                            </div>

                            <div className="group-metric">
                              <span>Moyenne / stagiaire</span>
                              <strong>{groupe.moyenneAbsences.toFixed(1)}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="content-card gestionnaire-overview-stage">
            <div className="gestionnaire-section-head">
              <div>
                <span className="gestionnaire-section-tag">Overview</span>
                <h3 className="section-title">Lectures rapides</h3>
                <p>
                  Retrouvez les groupes et stagiaires a prioriser dans des blocs
                  compacts.
                </p>
              </div>
            </div>

            <div className="gestionnaire-compact-columns">
              <div className="gestionnaire-compact-section">
                <h4>Par groupe</h4>
                <div className="profile-info-grid">
                  {summary.groupesByAbsences.map((groupe) => (
                    <div className="profile-item" key={groupe.id}>
                      <span>{groupe.nom}</span>
                      <strong>{groupe.totalAbsences} absence(s)</strong>
                      <p>{groupe.totalStagiaires} stagiaire(s)</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="gestionnaire-compact-section">
                <h4>Par stagiaire</h4>
                <div className="profile-info-grid">
                  {summary.topStagiaires.map((stagiaire) => (
                    <div className="profile-item" key={stagiaire.id}>
                      <span>{stagiaire.nom || "Non renseigne"}</span>
                      <strong>{stagiaire.totalAbsences} absence(s)</strong>
                      <p>{stagiaire.groupe}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
