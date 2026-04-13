import { useEffect, useMemo, useState } from "react";
import AbsenceTable from "../../components/student/AbsenceTable";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";

function formatStatus(status) {
  switch (status) {
    case "justifiee":
      return "Justifiee";
    case "non_justifiee":
      return "Non justifiee";
    case "en_attente":
      return "En attente";
    default:
      return "Inconnu";
  }
}

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

export default function StudentAbsencesPage() {
  const toast = useToast();
  const [showReport, setShowReport] = useState(false);
  const [absences, setAbsences] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedAbsence, setSelectedAbsence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchAbsences() {
      setLoading(true);
      setError("");

      try {
        const [absencesResponse, statsResponse] = await Promise.all([
          api.get("/stagiaire/absences"),
          api.get("/stagiaire/stats"),
        ]);

        if (isMounted) {
          const fetchedAbsences = Array.isArray(absencesResponse.data)
            ? absencesResponse.data
            : [];

          setAbsences(fetchedAbsences);
          setStats(statsResponse.data || null);
          setSelectedAbsence((currentSelection) => {
            if (!currentSelection) {
              return null;
            }

            return (
              fetchedAbsences.find((absence) => absence.id === currentSelection.id) ||
              null
            );
          });
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err.response?.data?.message ||
            "Impossible de charger vos absences.";
          setError(message);
          toast.error(message, "Absences");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAbsences();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const rows = useMemo(() => {
    return absences.map((absence) => ({
      id: absence.id,
      date: formatDate(absence.seance?.date_seance),
      module: absence.seance?.module,
      trainer: absence.seance?.formateur?.nom_complet,
      duration: formatDuration(absence.duree_minutes),
      status: formatStatus(absence.statut),
    }));
  }, [absences]);

  function handleExploreReport() {
    setShowReport((prev) => !prev);
  }

  function handleExploreAbsence(absenceId) {
    const absence = absences.find((item) => item.id === absenceId) || null;
    setSelectedAbsence(absence);
  }

  return (
    <div className="page-stack">
      <div className="page-header-row stagiaire-page-header">
        <div>
          <span className="stagiaire-page-eyebrow">Stagiaire</span>
          <h2>Mes absences</h2>
          <p>Consultez la liste chronologique de vos absences.</p>
        </div>

        <button className="secondary-btn" onClick={handleExploreReport}>
          {showReport ? "Fermer le rapport" : "Explorer le rapport"}
        </button>
      </div>

      {showReport && (
        <section className="content-card stagiaire-module-card">
          <div className="stagiaire-card-head">
            <div>
              <span className="stagiaire-section-tag">Rapport</span>
              <h3 className="section-title">Rapport des absences</h3>
              <p className="soft-text">
                Resume personnel base sur les statistiques deja chargees.
              </p>
            </div>
          </div>

          {loading ? (
            <EmptyState
              icon="..."
              title="Chargement du rapport..."
              message="Resume en cours de preparation."
              compact
            />
          ) : error ? (
            <EmptyState icon="!" title="Erreur de chargement" message={error} />
          ) : stats ? (
            <div className="profile-info-grid">
              <div className="profile-item">
                <span>Total absences</span>
                <strong>{stats.total_absences}</strong>
              </div>

              <div className="profile-item">
                <span>Justifiees</span>
                <strong>{stats.justified}</strong>
              </div>

              <div className="profile-item">
                <span>En attente</span>
                <strong>{stats.pending}</strong>
              </div>

              <div className="profile-item">
                <span>Non justifiees</span>
                <strong>{stats.unjustified}</strong>
              </div>

              <div className="profile-item">
                <span>Duree totale</span>
                <strong>{formatDuration(stats.total_minutes)}</strong>
              </div>
            </div>
          ) : null}
        </section>
      )}

      <section className="content-card stagiaire-module-card">
        <div className="stagiaire-card-head">
          <div>
            <span className="stagiaire-section-tag">Historique</span>
            <h3 className="section-title">Historique des absences</h3>
            <p className="soft-text">
              Tableau chronologique de vos absences avec acces au detail.
            </p>
          </div>
        </div>

        {loading ? (
          <EmptyState
            icon="..."
            title="Chargement des absences..."
            message="Les seances sont en cours de recuperation."
            compact
          />
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="o"
            title="Aucune absence enregistree"
            message="Votre historique apparaitra ici des qu'une absence sera creee."
          />
        ) : (
          <AbsenceTable rows={rows} onExplore={handleExploreAbsence} />
        )}
      </section>

      {selectedAbsence ? (
        <section className="content-card stagiaire-module-card">
          <div className="page-header-row">
            <div>
              <h3 className="section-title">Detail de l'absence</h3>
              <p>Informations detaillees sur l'absence selectionnee.</p>
            </div>

            <button
              className="secondary-btn"
              type="button"
              onClick={() => setSelectedAbsence(null)}
            >
              Fermer
            </button>
          </div>

          <div className="profile-info-grid">
            <div className="profile-item">
              <span>Date</span>
              <strong>{formatDate(selectedAbsence.seance?.date_seance)}</strong>
            </div>

            <div className="profile-item">
              <span>Module</span>
              <strong>{selectedAbsence.seance?.module || "Non renseigne"}</strong>
            </div>

            <div className="profile-item">
              <span>Formateur</span>
              <strong>
                {selectedAbsence.seance?.formateur?.nom_complet || "Non renseigne"}
              </strong>
            </div>

            <div className="profile-item">
              <span>Duree</span>
              <strong>{formatDuration(selectedAbsence.duree_minutes)}</strong>
            </div>

            <div className="profile-item">
              <span>Statut</span>
              <strong>{formatStatus(selectedAbsence.statut)}</strong>
            </div>

            <div className="profile-item">
              <span>Type d'absence</span>
              <strong>{selectedAbsence.type_absence || "Non renseigne"}</strong>
            </div>

            <div className="profile-item">
              <span>Salle</span>
              <strong>{selectedAbsence.seance?.salle || "Non renseignee"}</strong>
            </div>

            <div className="profile-item">
              <span>Commentaire</span>
              <strong>{selectedAbsence.commentaire || "Aucun commentaire"}</strong>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
