import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/ToastProvider";
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

function formatDate(value) {
  if (!value) {
    return "Non renseignee";
  }

  const [year, month, day] = String(value).slice(0, 10).split("-");

  if (year && month && day) {
    return `${day}/${month}/${year}`;
  }

  return value;
}

function formatFullName(stagiaire) {
  return (
    [stagiaire?.prenom, stagiaire?.nom].filter(Boolean).join(" ").trim() ||
    "Non renseigne"
  );
}

function getStatusTone(statut) {
  const value = String(statut || "").toLowerCase();

  if (value.includes("justifie") || value.includes("valide")) {
    return "success";
  }

  if (value.includes("attente")) {
    return "warning";
  }

  if (value.includes("non") || value.includes("rejete") || value.includes("absent")) {
    return "danger";
  }

  return "info";
}

export default function GestionnaireAbsencesPage() {
  const toast = useToast();
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    groupe: "",
    date: "",
    stagiaire: "",
    statut: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchAbsences() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/absences");

        if (isMounted) {
          setAbsences(extractCollection(response.data));
        }
      } catch (err) {
        if (isMounted) {
          const nextError =
            err.response?.data?.message ||
            "Impossible de charger les absences.";
          setError(nextError);
          toast.error(nextError, "Absences");
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

  const groupeOptions = useMemo(() => {
    return [
      ...new Set(
        absences
          .map((absence) => absence.stagiaire?.groupe?.nom || "")
          .filter(Boolean)
      ),
    ].sort();
  }, [absences]);

  const statutOptions = useMemo(() => {
    return [
      ...new Set(absences.map((absence) => absence.statut || "").filter(Boolean)),
    ].sort();
  }, [absences]);

  const filteredRows = useMemo(() => {
    return absences.filter((absence) => {
      const absenceDate = String(absence.seance?.date_seance || "").slice(0, 10);
      const stagiaireName = formatFullName(absence.stagiaire).toLowerCase();
      const groupeName = (absence.stagiaire?.groupe?.nom || "").toLowerCase();
      const statut = String(absence.statut || "").toLowerCase();

      if (filters.groupe && groupeName !== filters.groupe.toLowerCase()) {
        return false;
      }

      if (filters.date && absenceDate !== filters.date) {
        return false;
      }

      if (
        filters.stagiaire &&
        !stagiaireName.includes(filters.stagiaire.trim().toLowerCase())
      ) {
        return false;
      }

      if (filters.statut && statut !== filters.statut.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [absences, filters]);

  return (
    <div className="page-stack">
      <div className="page-header-row gestionnaire-page-header">
        <div>
          <span className="gestionnaire-page-eyebrow">Gestionnaire</span>
          <h2>Absences</h2>
          <p>Suivez les absences de tous les groupes depuis une seule page.</p>
        </div>
      </div>

      <section className="content-card gestionnaire-module-card gestionnaire-filter-card">
        <div className="gestionnaire-card-head">
          <div>
            <span className="gestionnaire-section-tag">Filtres</span>
            <h3 className="section-title">Recherche des absences</h3>
            <p className="soft-text">
              Filtrez par groupe, date, stagiaire ou statut sans modifier les donnees.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <label>
            <span>Groupe</span>
            <select
              value={filters.groupe}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  groupe: event.target.value,
                }))
              }
            >
              <option value="">Tous les groupes</option>
              {groupeOptions.map((groupe) => (
                <option key={groupe} value={groupe}>
                  {groupe}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Date</span>
            <input
              type="date"
              value={filters.date}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  date: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Stagiaire</span>
            <input
              type="text"
              value={filters.stagiaire}
              placeholder="Nom ou prenom"
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  stagiaire: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Statut</span>
            <select
              value={filters.statut}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  statut: event.target.value,
                }))
              }
            >
              <option value="">Tous les statuts</option>
              {statutOptions.map((statut) => (
                <option key={statut} value={statut}>
                  {statut}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="content-card gestionnaire-module-card">
        <div className="gestionnaire-card-head">
          <div>
            <span className="gestionnaire-section-tag">Tableau</span>
            <h3 className="section-title">Vue d'ensemble des absences</h3>
            <p className="soft-text">
              Table de suivi avec les informations de seance, duree et commentaire.
            </p>
          </div>

          {!loading && !error ? (
            <span className="status-badge info">
              {filteredRows.length} resultat(s)
            </span>
          ) : null}
        </div>

        {loading ? (
          <EmptyState
            icon="..."
            title="Chargement des absences..."
            message="La liste est en cours de recuperation."
            compact
          />
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            icon="o"
            title="Aucun resultat"
            message="Aucune absence ne correspond aux filtres appliques."
          />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Stagiaire</th>
                  <th>Groupe</th>
                  <th>Module</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Duree</th>
                  <th>Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((absence) => (
                  <tr key={absence.id}>
                    <td>{formatDate(absence.seance?.date_seance)}</td>
                    <td>{formatFullName(absence.stagiaire)}</td>
                    <td>{absence.stagiaire?.groupe?.nom || "Non renseigne"}</td>
                    <td>{absence.seance?.module || `Seance #${absence.seance_id}`}</td>
                    <td>{absence.type_absence || "Non renseigne"}</td>
                    <td>
                      <span className={`status-badge ${getStatusTone(absence.statut)}`}>
                        {absence.statut || "Non renseigne"}
                      </span>
                    </td>
                    <td>
                      {absence.duree_minutes != null
                        ? `${absence.duree_minutes} min`
                        : "Non renseignee"}
                    </td>
                    <td>{absence.commentaire || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
