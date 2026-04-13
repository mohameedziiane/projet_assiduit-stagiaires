import { useEffect, useMemo, useState } from "react";
import {
  FaChartLine,
  FaExclamationTriangle,
  FaLayerGroup,
  FaUsers,
} from "react-icons/fa";
import ChartJsPanel from "../../components/ui/ChartJsPanel";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function exportStatsCsv(rows) {
  const csvContent = [
    "Indicateur,Valeur",
    ...rows.map((row) => `${row.label},${row.value}`),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "statistiques-directeur.csv";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getSeverityTone(level) {
  if (level === "high") {
    return "red";
  }

  if (level === "medium") {
    return "orange";
  }

  return "green";
}

const kpiItems = [
  {
    key: "absentRate",
    label: "Taux d'absence global",
    Icon: FaChartLine,
    tone: "blue",
    format: (value) => `${value}%`,
  },
  {
    key: "totalAbsences",
    label: "Absences totales",
    Icon: FaUsers,
    tone: "red",
    format: (value) => value,
  },
  {
    key: "averageAbsencesPerGroup",
    label: "Moyenne par groupe",
    Icon: FaLayerGroup,
    tone: "orange",
    format: (value) => value,
  },
  {
    key: "alertsCount",
    label: "Alertes actives",
    Icon: FaExclamationTriangle,
    tone: "green",
    format: (value) => value,
  },
];

export default function DirecteurStatisticsPage() {
  const toast = useToast();
  const [globalStats, setGlobalStats] = useState(null);
  const [groupesStats, setGroupesStats] = useState([]);
  const [stagiairesStats, setStagiairesStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchStatistics() {
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
            "Impossible de charger les statistiques.";
          setError(message);
          toast.error(message, "Statistiques");
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
  }, [toast]);

  const summary = useMemo(() => {
    const totalStagiaires = Number(globalStats?.total_stagiaires) || 0;
    const totalAbsences = Number(globalStats?.total_absences) || 0;
    const totalJustificatifs = Number(globalStats?.total_justificatifs) || 0;
    const justificatifsValides = Number(globalStats?.justificatifs_valides) || 0;
    const totalGroupes = groupesStats.length;

    const absentRate =
      totalStagiaires > 0 ? (totalAbsences / totalStagiaires) * 100 : 0;
    const presenceRate = 100 - clampPercent(absentRate);
    const justifiedRate =
      totalJustificatifs > 0
        ? (justificatifsValides / totalJustificatifs) * 100
        : 0;
    const alertsCount = stagiairesStats.filter(
      (item) => Number(item.absences_non_justifiees) >= 3
    ).length;

    const groupesRows = [...groupesStats]
      .map((groupe) => ({
        id: groupe.id,
        nom: groupe.nom || "Non renseigne",
        filiere: groupe.filiere || "Non renseignee",
        totalAbsences: Number(groupe.total_absences) || 0,
        totalStagiaires: Number(groupe.total_stagiaires) || 0,
        moyenneAbsences: Number(groupe.moyenne_absences_par_stagiaire) || 0,
      }))
      .sort((left, right) => right.totalAbsences - left.totalAbsences);

    const averageAbsencesPerGroup =
      totalGroupes > 0 ? totalAbsences / totalGroupes : 0;

    const problematicGroups = groupesRows.slice(0, 3);
    const stableGroups = [...groupesRows]
      .sort((left, right) => {
        if (left.totalAbsences !== right.totalAbsences) {
          return left.totalAbsences - right.totalAbsences;
        }

        return left.moyenneAbsences - right.moyenneAbsences;
      })
      .slice(0, 3);

    const highRiskGroup = groupesRows.find(
      (groupe) =>
        groupe.totalAbsences >= Math.max(12, Math.ceil(averageAbsencesPerGroup * 1.4)) ||
        groupe.moyenneAbsences >= 2.5
    );

    const alertMessages = [];

    if (clampPercent(absentRate) >= 30) {
      alertMessages.push({
        title: "High absenteeism detected",
        description:
          "Le taux global d'absence est eleve et demande un suivi executif.",
        tone: "high",
      });
    }

    if (highRiskGroup) {
      alertMessages.push({
        title: "Some groups require attention",
        description: `${highRiskGroup.nom} presente un niveau d'absence superieur au reste de l'etablissement.`,
        tone: "medium",
      });
    }

    if (alertMessages.length === 0) {
      alertMessages.push({
        title: "Situation globale sous controle",
        description:
          "Les indicateurs actuels restent stables a l'echelle des groupes.",
        tone: "low",
      });
    }

    const topStagiaires = [...stagiairesStats]
      .sort(
        (left, right) =>
          (Number(right.total_absences) || 0) - (Number(left.total_absences) || 0)
      )
      .slice(0, 3)
      .map((stagiaire) => ({
        id: stagiaire.id,
        nom: [stagiaire.prenom, stagiaire.nom].filter(Boolean).join(" ").trim(),
        groupe: stagiaire.groupe || "Non renseigne",
        totalAbsences: Number(stagiaire.total_absences) || 0,
      }));

    const exportRows = [
      { label: "Taux d'absence global", value: `${clampPercent(absentRate)}%` },
      { label: "Presence moyenne", value: `${clampPercent(presenceRate)}%` },
      {
        label: "Moyenne absences par groupe",
        value: averageAbsencesPerGroup.toFixed(1),
      },
      { label: "Nombre total d'absences", value: totalAbsences },
      { label: "Alertes", value: alertsCount },
      { label: "Justificatifs valides", value: `${clampPercent(justifiedRate)}%` },
    ];

    return {
      absentRate: clampPercent(absentRate),
      presenceRate: clampPercent(presenceRate),
      justifiedRate: clampPercent(justifiedRate),
      justifiedAbsences: Number(globalStats?.total_absences_justifiees) || 0,
      unjustifiedAbsences: Number(globalStats?.total_absences_non_justifiees) || 0,
      pendingAbsences: Math.max(
        0,
        totalAbsences -
          (Number(globalStats?.total_absences_justifiees) || 0) -
          (Number(globalStats?.total_absences_non_justifiees) || 0),
        Number(globalStats?.justificatifs_en_attente) || 0
      ),
      alertsCount,
      totalAbsences,
      averageAbsencesPerGroup: averageAbsencesPerGroup.toFixed(1),
      problematicGroups,
      stableGroups,
      alertMessages,
      topStagiaires,
      exportRows,
    };
  }, [globalStats, groupesStats, stagiairesStats]);

  const distributionChart = useMemo(
    () => ({
      data: {
        labels: ["Justifiée", "Non justifiée", "En attente"],
        datasets: [
          {
            data: [
              summary.justifiedAbsences,
              summary.unjustifiedAbsences,
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
      summary.justifiedAbsences,
      summary.pendingAbsences,
      summary.unjustifiedAbsences,
    ]
  );

  const groupsComparisonChart = useMemo(
    () => ({
      data: {
        labels: groupesStats.map((groupe) => groupe.nom || "Non renseigne"),
        datasets: [
          {
            label: "Absences totales",
            data: groupesStats.map(
              (groupe) => Number(groupe.total_absences) || 0
            ),
            backgroundColor: "#1D9E75",
            borderRadius: 8,
          },
        ],
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label(context) {
                return `${context.parsed.y} absence(s)`;
              },
            },
          },
        },
      },
    }),
    [groupesStats]
  );

  return (
    <div className="page-stack">
      <div className="page-header-row directeur-page-header">
        <div>
          <span className="directeur-page-eyebrow">Directeur</span>
          <h2>Statistiques</h2>
          <p>Tableau executif de l'assiduite a l'echelle globale.</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => exportStatsCsv(summary.exportRows)}
          disabled={loading}
        >
          Exporter statistiques
        </button>
      </div>

      <div className="directeur-stats-grid">
        {kpiItems.map((item) => {
          const Icon = item.Icon;

          return (
            <div className="directeur-stat-card" key={item.key}>
              <div className={`directeur-stat-icon ${item.tone}`}>
                <Icon />
              </div>
              <span>{item.label}</span>
              <strong>{loading ? "..." : item.format(summary[item.key])}</strong>
            </div>
          );
        })}
      </div>

      <section className="content-card directeur-module-card">
        <div className="directeur-section-header">
          <div>
            <span className="directeur-section-tag">Alertes</span>
            <h3 className="section-title">Alertes globales</h3>
            <p>Les signaux executives les plus importants du moment.</p>
          </div>
        </div>

        {loading ? (
          <EmptyState
            icon="..."
            title="Chargement des alertes..."
            message="Les signaux executifs sont en cours de calcul."
            compact
          />
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : (
          <div className="directeur-alert-grid">
            {summary.alertMessages.map((alert) => (
              <article
                key={alert.title}
                className={`directeur-alert-card ${getSeverityTone(alert.tone)}`}
              >
                <span>{alert.title}</span>
                <strong>{alert.description}</strong>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="chart-grid">
        <ChartJsPanel
          title="Répartition globale par type"
          subtitle="Vue stratégique des absences justifiées, non justifiées et en attente."
          type="doughnut"
          data={distributionChart.data}
          options={distributionChart.options}
          height={220}
          className="content-card chart-panel"
          emptyMessage="La répartition apparaîtra ici dès que des absences seront disponibles."
        />

        <ChartJsPanel
          title="Comparaison des groupes"
          subtitle="Comparez les groupes selon le volume global d'absences."
          type="bar"
          data={groupsComparisonChart.data}
          options={groupsComparisonChart.options}
          height={260}
          className="content-card chart-panel"
          emptyMessage="La comparaison apparaîtra ici dès que des groupes seront disponibles."
        />
      </div>

      <div className="content-grid-2">
        <section className="content-card directeur-module-card">
          <div className="directeur-section-header">
            <div>
              <span className="directeur-section-tag">Risque</span>
              <h3 className="section-title">Top 3 groupes problematiques</h3>
              <p>Les groupes avec le plus grand volume d'absences.</p>
            </div>
          </div>

          {loading ? (
            <EmptyState
              icon="..."
              title="Chargement du classement..."
              message="Le classement des groupes problematiques arrive."
              compact
            />
          ) : error ? (
            <EmptyState icon="!" title="Erreur de chargement" message={error} />
          ) : summary.problematicGroups.length === 0 ? (
            <div className="empty-state chart-empty">
              <strong>Aucun groupe disponible</strong>
              <p>Le classement apparaitra ici des que des donnees seront disponibles.</p>
            </div>
          ) : (
            <div className="directeur-ranking-list">
              {summary.problematicGroups.map((groupe, index) => (
                <article className="directeur-ranking-card" key={groupe.id}>
                  <div className="directeur-ranking-rank alert">#{index + 1}</div>
                  <div className="directeur-ranking-copy">
                    <strong>{groupe.nom}</strong>
                    <p>{groupe.totalAbsences} absence(s)</p>
                    <span>{groupe.totalStagiaires} stagiaire(s)</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="content-card directeur-module-card">
          <div className="directeur-section-header">
            <div>
              <span className="directeur-section-tag">Stabilite</span>
              <h3 className="section-title">Top 3 groupes les plus stables</h3>
              <p>Les groupes les moins exposes sur les donnees actuelles.</p>
            </div>
          </div>

          {loading ? (
            <EmptyState
              icon="..."
              title="Chargement du classement..."
              message="Le classement des groupes stables arrive."
              compact
            />
          ) : error ? (
            <EmptyState icon="!" title="Erreur de chargement" message={error} />
          ) : summary.stableGroups.length === 0 ? (
            <div className="empty-state chart-empty">
              <strong>Aucun groupe disponible</strong>
              <p>Le classement apparaitra ici des que des donnees seront disponibles.</p>
            </div>
          ) : (
            <div className="directeur-ranking-list">
              {summary.stableGroups.map((groupe, index) => (
                <article className="directeur-ranking-card" key={groupe.id}>
                  <div className="directeur-ranking-rank stable">#{index + 1}</div>
                  <div className="directeur-ranking-copy">
                    <strong>{groupe.nom}</strong>
                    <p>{groupe.totalAbsences} absence(s)</p>
                    <span>{groupe.totalStagiaires} stagiaire(s)</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="content-card directeur-module-card">
        <div className="directeur-section-header">
          <div>
            <span className="directeur-section-tag">Vigilance</span>
            <h3 className="section-title">Points de vigilance stagiaires</h3>
            <p>Les cas individuels les plus exposes dans les donnees globales.</p>
          </div>
        </div>

        {loading ? (
          <EmptyState
            icon="..."
            title="Chargement des points de vigilance..."
            message="Les cas individuels prioritaires arrivent."
            compact
          />
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : summary.topStagiaires.length === 0 ? (
          <div className="empty-state chart-empty">
            <strong>Aucun point de vigilance</strong>
            <p>Les cas les plus exposes apparaitront ici si necessaire.</p>
          </div>
        ) : (
          <div className="profile-info-grid">
            {summary.topStagiaires.map((stagiaire) => (
              <div className="profile-item" key={stagiaire.id}>
                <span>{stagiaire.nom || "Non renseigne"}</span>
                <strong>{stagiaire.totalAbsences} absence(s)</strong>
                <p>{stagiaire.groupe}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
