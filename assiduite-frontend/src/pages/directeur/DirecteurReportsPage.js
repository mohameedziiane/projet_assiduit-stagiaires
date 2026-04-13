import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/ui/EmptyState";
import api from "../../services/api";

export default function DirecteurReportsPage() {
  const [reportType, setReportType] = useState("global");
  const [globalStats, setGlobalStats] = useState(null);
  const [groupesStats, setGroupesStats] = useState([]);
  const [stagiairesStats, setStagiairesStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchReportData() {
      setLoading(true);
      setError("");

      try {
        const [globalResponse, groupesResponse, stagiairesResponse] =
          await Promise.all([
            api.get("/stats/globales"),
            api.get("/stats/groupes"),
            api.get("/stats/stagiaires"),
          ]);

        if (!isMounted) {
          return;
        }

        setGlobalStats(globalResponse.data || null);
        setGroupesStats(
          Array.isArray(groupesResponse.data) ? groupesResponse.data : []
        );
        setStagiairesStats(
          Array.isArray(stagiairesResponse.data) ? stagiairesResponse.data : []
        );
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Impossible de charger les rapports globaux."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchReportData();

    return () => {
      isMounted = false;
    };
  }, []);

  const reportSummary = useMemo(() => {
    const topGroupes = [...groupesStats]
      .sort(
        (left, right) =>
          (Number(right.total_absences) || 0) -
          (Number(left.total_absences) || 0)
      )
      .slice(0, 3);

    const topStagiaires = [...stagiairesStats]
      .sort(
        (left, right) =>
          (Number(right.total_absences) || 0) -
          (Number(left.total_absences) || 0)
      )
      .slice(0, 3);

    return { topGroupes, topStagiaires };
  }, [groupesStats, stagiairesStats]);

  function buildReportLines() {
    const baseLines = [
      "RAPPORT GLOBAL - DIRECTEUR",
      `Type : ${reportType}`,
      `Periode : ${new Date().getFullYear()}`,
      "",
      "Resume :",
      `- Total stagiaires : ${globalStats?.total_stagiaires ?? 0}`,
      `- Total groupes : ${globalStats?.total_groupes ?? 0}`,
      `- Total seances : ${globalStats?.total_seances ?? 0}`,
      `- Total absences : ${globalStats?.total_absences ?? 0}`,
      `- Absences justifiees : ${globalStats?.total_absences_justifiees ?? 0}`,
      `- Absences non justifiees : ${globalStats?.total_absences_non_justifiees ?? 0}`,
      `- Justificatifs en attente : ${globalStats?.justificatifs_en_attente ?? 0}`,
      `- Justificatifs valides : ${globalStats?.justificatifs_valides ?? 0}`,
      `- Billets actifs : ${globalStats?.billets_actifs ?? 0}`,
      "",
    ];

    if (reportType === "groupes") {
      return [
        ...baseLines,
        "Rapport par groupe :",
        ...groupesStats.map(
          (groupe) =>
            `- ${groupe.nom}: ${groupe.total_stagiaires ?? 0} stagiaire(s), ${groupe.total_absences ?? 0} absence(s), moyenne ${Number(
              groupe.moyenne_absences_par_stagiaire || 0
            ).toFixed(2)}`
        ),
      ];
    }

    if (reportType === "mensuel") {
      return [
        ...baseLines,
        "Suivi stagiaires :",
        ...stagiairesStats.slice(0, 10).map(
          (stagiaire) =>
            `- ${stagiaire.prenom} ${stagiaire.nom}: ${stagiaire.total_absences ?? 0} absence(s), ${stagiaire.absences_non_justifiees ?? 0} non justifiee(s), groupe ${stagiaire.groupe || "N/A"}`
        ),
      ];
    }

    return [
      ...baseLines,
      "Top groupes :",
      ...reportSummary.topGroupes.map(
        (groupe) =>
          `- ${groupe.nom}: ${groupe.total_absences ?? 0} absence(s), ${groupe.total_stagiaires ?? 0} stagiaire(s)`
      ),
      "",
      "Top stagiaires :",
      ...reportSummary.topStagiaires.map(
        (stagiaire) =>
          `- ${stagiaire.prenom} ${stagiaire.nom}: ${stagiaire.total_absences ?? 0} absence(s), groupe ${stagiaire.groupe || "N/A"}`
      ),
    ];
  }

  function handleDownloadGlobalReport() {
    const content = buildReportLines().join("\n");
    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `rapport-directeur-${reportType}.txt`;

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
          <h2>Rapports globaux</h2>
          <p>Consultez et telechargez les rapports globaux.</p>
        </div>

        <button
          className="primary-btn"
          onClick={handleDownloadGlobalReport}
          disabled={loading || !!error}
        >
          Telecharger rapport global
        </button>
      </div>

      <section className="content-card directeur-module-card directeur-filter-card">
        <div className="directeur-section-header">
          <div>
            <span className="directeur-section-tag">Configuration</span>
            <h3 className="section-title">Parametres du rapport</h3>
            <p>Selection du type de rapport, sans changement de logique.</p>
          </div>
        </div>

        <div className="profile-info-grid">
          <label>
            <span>Type de rapport</span>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="global">Rapport global</option>
              <option value="mensuel">Rapport mensuel</option>
              <option value="groupes">Rapport par groupe</option>
            </select>
          </label>

          <label>
            <span>Periode</span>
            <input type="text" value={String(new Date().getFullYear())} readOnly />
          </label>
        </div>
      </section>

      <section className="content-card directeur-module-card">
        <div className="directeur-section-header">
          <div>
            <span className="directeur-section-tag">Synthese</span>
            <h3 className="section-title">Apercu du rapport</h3>
            <p>Resume des indicateurs globaux, groupes prioritaires et stagiaires exposes.</p>
          </div>
        </div>

        {loading ? (
          <EmptyState
            icon="..."
            title="Chargement des rapports..."
            message="Les indicateurs sont en cours de recuperation."
            compact
          />
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : (
          <div className="profile-info-grid">
            <div className="profile-item">
              <span>Total stagiaires</span>
              <strong>{globalStats?.total_stagiaires ?? 0}</strong>
            </div>

            <div className="profile-item">
              <span>Total groupes</span>
              <strong>{globalStats?.total_groupes ?? 0}</strong>
            </div>

            <div className="profile-item">
              <span>Total absences</span>
              <strong>{globalStats?.total_absences ?? 0}</strong>
            </div>

            <div className="profile-item">
              <span>Billets actifs</span>
              <strong>{globalStats?.billets_actifs ?? 0}</strong>
            </div>

            {reportSummary.topGroupes.map((groupe, index) => (
              <div className="profile-item" key={`g-${groupe.nom}-${index}`}>
                <span>{groupe.nom}</span>
                <strong>{groupe.total_absences ?? 0} absence(s)</strong>
                <p>{groupe.total_stagiaires ?? 0} stagiaire(s)</p>
              </div>
            ))}

            {reportSummary.topStagiaires.map((stagiaire, index) => (
              <div
                className="profile-item"
                key={`s-${stagiaire.prenom}-${stagiaire.nom}-${index}`}
              >
                <span>{`${stagiaire.prenom} ${stagiaire.nom}`}</span>
                <strong>{stagiaire.total_absences ?? 0} absence(s)</strong>
                <p>{stagiaire.groupe || "Sans groupe"}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
