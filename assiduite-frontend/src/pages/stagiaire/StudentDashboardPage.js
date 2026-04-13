import { useEffect, useMemo, useState } from "react";
import AttendanceChart from "../../components/student/AttendanceChart";
import EmptyState from "../../components/ui/EmptyState";
import SkeletonBlock from "../../components/ui/SkeletonBlock";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";

function formatDuration(minutes) {
  if (!minutes) {
    return "0 min";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
}

function formatDate(date) {
  if (!date) {
    return "Non renseignee";
  }

  return new Date(date).toLocaleDateString("fr-FR");
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString("fr-FR", {
    month: "short",
    year: "numeric",
  });
}

export default function StudentDashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [absences, setAbsences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      setLoading(true);
      setError("");

      try {
        const [statsResponse, meResponse, absencesResponse] = await Promise.all([
          api.get("/stagiaire/stats"),
          api.get("/me"),
          api.get("/stagiaire/absences"),
        ]);

        if (isMounted) {
          setStats(statsResponse.data);
          setProfile(meResponse.data);
          setAbsences(absencesResponse.data);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err.response?.data?.message ||
            "Impossible de charger votre tableau de bord.";
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

  const chartData = useMemo(() => {
    if (!Array.isArray(stats?.absences_par_mois)) {
      return [];
    }

    return stats.absences_par_mois.map((item) => ({
      month: formatMonthLabel(item.mois),
      value: item.total,
    }));
  }, [stats]);

  const recentAbsences = useMemo(() => {
    if (!Array.isArray(absences)) {
      return [];
    }

    return absences.slice(0, 5);
  }, [absences]);

  function handleDownloadReport() {
    const reportContent = `
RAPPORT D'ASSIDUITE

Stagiaire : ${
      profile?.name ||
      [profile?.stagiaire?.prenom, profile?.stagiaire?.nom]
        .filter(Boolean)
        .join(" ") ||
      profile?.email ||
      "Non renseigne"
    }
Date : ${new Date().toLocaleDateString("fr-FR")}

Resume :
- Total absences : ${stats?.total_absences ?? 0}
- Justifiees : ${stats?.justified ?? 0}
- Non justifiees : ${stats?.unjustified ?? 0}
- En attente : ${stats?.pending ?? 0}
- Duree totale : ${formatDuration(stats?.total_minutes ?? 0)}

Detail :
${
      recentAbsences.length > 0
        ? recentAbsences
            .map(
              (absence) =>
                `- ${formatDate(absence.seance?.date_seance)} / ${
                  absence.seance?.module || "Module non renseigne"
                } / ${absence.statut || "inconnu"}`
            )
            .join("\n")
        : "Aucune absence enregistree."
    }
    `.trim();

    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "rapport-assiduite.txt";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-stack">
      <div className="page-header-row stagiaire-page-header">
        <div>
          <span className="stagiaire-page-eyebrow">Stagiaire</span>
          <h2>Tableau de bord</h2>
          <p>Vue globale de votre assiduite.</p>
        </div>

        <button
          className="primary-btn"
          onClick={handleDownloadReport}
          disabled={loading || !!error}
        >
          Telecharger mon rapport
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total absences</span>
          <strong>
            {loading ? <SkeletonBlock height={34} width={80} /> : stats?.total_absences ?? 0}
          </strong>
          <p>{loading ? "Chargement..." : "Depuis les statistiques backend"}</p>
        </div>

        <div className="stat-card">
          <span>Justifiees</span>
          <strong>
            {loading ? <SkeletonBlock height={34} width={80} /> : stats?.justified ?? 0}
          </strong>
          <p>{loading ? "Chargement..." : "Absences regularisees"}</p>
        </div>

        <div className="stat-card">
          <span>Non justifiees</span>
          <strong>
            {loading ? <SkeletonBlock height={34} width={80} /> : stats?.unjustified ?? 0}
          </strong>
          <p>{loading ? "Chargement..." : "A traiter rapidement"}</p>
        </div>

        <div className="stat-card">
          <span>En attente</span>
          <strong>
            {loading ? <SkeletonBlock height={34} width={80} /> : stats?.pending ?? 0}
          </strong>
          <p>{loading ? "Chargement..." : "Justificatifs en cours"}</p>
        </div>

        <div className="stat-card">
          <span>Duree totale</span>
          <strong>
            {loading ? <SkeletonBlock height={34} width={110} /> : formatDuration(stats?.total_minutes ?? 0)}
          </strong>
          <p>{loading ? "Chargement..." : "Temps cumule d'absence"}</p>
        </div>
      </div>

      <div className="content-grid-2">
        <section className="content-card stagiaire-module-card">
          <div className="stagiaire-card-head">
            <div>
              <span className="stagiaire-section-tag">Evolution</span>
              <h3 className="section-title">Evolution mensuelle</h3>
              <p className="soft-text">
                Visualisez vos absences sur les derniers mois.
              </p>
            </div>
          </div>

          {loading ? (
            <EmptyState
              icon="..."
              title="Chargement des statistiques..."
              message="Le graphique se prepare."
              compact
            />
          ) : error ? (
            <EmptyState icon="!" title="Erreur de chargement" message={error} />
          ) : chartData.length === 0 ? (
            <EmptyState
              icon="~"
              title="Aucune evolution disponible"
              message="Vos absences mensuelles apparaitront ici des que des seances seront comptabilisees."
            />
          ) : (
            <AttendanceChart data={chartData} />
          )}
        </section>

        <section className="content-card stagiaire-module-card">
          <div className="stagiaire-card-head">
            <div>
              <span className="stagiaire-section-tag">Recents</span>
              <h3 className="section-title">Dernieres absences</h3>
              <p className="soft-text">
                Les derniers evenements remontes dans votre dossier.
              </p>
            </div>
          </div>

          {loading ? (
            <EmptyState
              icon="..."
              title="Chargement des absences..."
              message="Les dernieres seances arrivent."
              compact
            />
          ) : error ? (
            <EmptyState icon="!" title="Erreur de chargement" message={error} />
          ) : recentAbsences.length === 0 ? (
            <EmptyState
              icon="o"
              title="Aucune absence enregistree"
              message="Bonne nouvelle: aucune absence recente a afficher."
            />
          ) : (
            <div className="profile-info-grid">
              {recentAbsences.map((absence) => (
                <div className="profile-item" key={absence.id}>
                  <span>{formatDate(absence.seance?.date_seance)}</span>
                  <strong>{absence.seance?.module || "Module non renseigne"}</strong>
                  <p>{absence.seance?.formateur?.nom_complet || "Formateur non renseigne"}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
