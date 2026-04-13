import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";
import { getSessionUser } from "../../services/session";

const ALLOWED_TIME_SLOTS = new Set([
  "08:30-10:30",
  "10:30-12:30",
  "14:30-16:30",
  "16:30-18:30",
]);

const DEFAULT_ABSENCE_COMMENT = "Absence saisie par le formateur";
const DEFAULT_RETARD_DURATION = 15;

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

function formatDateLabel(value) {
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

function getTimeSlotKey(seance) {
  return `${formatTime(seance?.heure_debut)}-${formatTime(seance?.heure_fin)}`;
}

function parseTimeToMinutes(value) {
  if (!value) {
    return null;
  }

  const [hours, minutes] = String(value).slice(0, 5).split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function getSeanceDurationMinutes(seance) {
  const start = parseTimeToMinutes(seance?.heure_debut);
  const end = parseTimeToMinutes(seance?.heure_fin);

  if (start === null || end === null || end <= start) {
    return null;
  }

  return end - start;
}

function formatStagiaireLabel(stagiaire) {
  const fullName = [stagiaire.prenom, stagiaire.nom]
    .filter(Boolean)
    .join(" ")
    .trim();

  return stagiaire.nom_complet || fullName || `Stagiaire #${stagiaire.id}`;
}

export default function FormateurAbsencesPage() {
  const toast = useToast();
  const sessionUser = getSessionUser();
  const personnelId = sessionUser?.personnel?.id || sessionUser?.personnel_id;
  const todayKey = getTodayKey();

  const [seances, setSeances] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [stagiaires, setStagiaires] = useState([]);
  const [selectedSeanceId, setSelectedSeanceId] = useState("");
  const [statusByStagiaire, setStatusByStagiaire] = useState({});
  const [commentByStagiaire, setCommentByStagiaire] = useState({});
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [loadingStagiaires, setLoadingStagiaires] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchInitialData() {
      setLoadingInitialData(true);
      setError("");

      try {
        const [seancesResponse, absencesResponse] = await Promise.all([
          api.get("/seances"),
          api.get("/absences"),
        ]);

        if (!isMounted) {
          return;
        }

        setSeances(extractCollection(seancesResponse.data));
        setAbsences(extractCollection(absencesResponse.data));
      } catch (err) {
        if (isMounted) {
          const nextError =
            err.response?.data?.message ||
            "Impossible de charger les donnees d'absences.";
          setError(nextError);
          toast.error(nextError, "Absences");
        }
      } finally {
        if (isMounted) {
          setLoadingInitialData(false);
        }
      }
    }

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const todaySeances = useMemo(() => {
    return [...seances]
      .filter((seance) => {
        return (
          Number(seance.personnel_id) === Number(personnelId) &&
          String(seance.date_seance || "").slice(0, 10) === todayKey &&
          ALLOWED_TIME_SLOTS.has(getTimeSlotKey(seance))
        );
      })
      .sort((left, right) => {
        const leftKey = `${left.date_seance || ""} ${left.heure_debut || ""}`;
        const rightKey = `${right.date_seance || ""} ${right.heure_debut || ""}`;

        return leftKey.localeCompare(rightKey);
      });
  }, [personnelId, seances, todayKey]);

  const selectedSeance = useMemo(() => {
    return (
      todaySeances.find(
        (seance) => String(seance.id) === String(selectedSeanceId)
      ) || null
    );
  }, [selectedSeanceId, todaySeances]);

  const existingAbsenceStagiaireIds = useMemo(() => {
    if (!selectedSeanceId) {
      return new Set();
    }

    return new Set(
      absences
        .filter(
          (absence) => String(absence.seance_id) === String(selectedSeanceId)
        )
        .map((absence) => String(absence.stagiaire_id))
    );
  }, [absences, selectedSeanceId]);

  useEffect(() => {
    let isMounted = true;

    async function fetchStagiairesForSeance() {
      if (!selectedSeanceId) {
        setStagiaires([]);
        setStatusByStagiaire({});
        setCommentByStagiaire({});
        return;
      }

      setLoadingStagiaires(true);
      setError("");
      setMessage("");

      try {
        const response = await api.get(
          `/formateur/seances/${selectedSeanceId}/stagiaires`
        );
        const nextStagiaires = extractCollection(response.data);

        if (!isMounted) {
          return;
        }

        setStagiaires(nextStagiaires);
        setStatusByStagiaire(
          nextStagiaires.reduce((accumulator, stagiaire) => {
            accumulator[stagiaire.id] = "present";
            return accumulator;
          }, {})
        );
        setCommentByStagiaire(
          nextStagiaires.reduce((accumulator, stagiaire) => {
            accumulator[stagiaire.id] = "";
            return accumulator;
          }, {})
        );
      } catch (err) {
        if (isMounted) {
          const nextError =
            err.response?.data?.message ||
            "Impossible de charger les stagiaires de cette seance.";
          setError(nextError);
          setStagiaires([]);
          setStatusByStagiaire({});
          setCommentByStagiaire({});
          toast.error(nextError, "Stagiaires");
        }
      } finally {
        if (isMounted) {
          setLoadingStagiaires(false);
        }
      }
    }

    fetchStagiairesForSeance();

    return () => {
      isMounted = false;
    };
  }, [selectedSeanceId, toast]);

  const nonPresentEntries = useMemo(() => {
    return stagiaires
      .map((stagiaire) => ({
        stagiaire,
        status: statusByStagiaire[stagiaire.id] || "present",
        comment: (commentByStagiaire[stagiaire.id] || "").trim(),
      }))
      .filter((entry) => entry.status !== "present");
  }, [commentByStagiaire, stagiaires, statusByStagiaire]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!selectedSeanceId) {
      setError("Veuillez selectionner une seance.");
      return;
    }

    if (nonPresentEntries.length === 0) {
      setMessage("Aucune absence ou retard a enregistrer.");
      return;
    }

    const newEntries = nonPresentEntries.filter(
      ({ stagiaire }) => !existingAbsenceStagiaireIds.has(String(stagiaire.id))
    );

    if (newEntries.length === 0) {
      setMessage("Aucune nouvelle absence ou retard a enregistrer.");
      return;
    }

    const seanceDuration = getSeanceDurationMinutes(selectedSeance);

    if (seanceDuration === null) {
      setError("Impossible de calculer la duree de la seance selectionnee.");
      return;
    }

    setSubmitting(true);

    try {
      await Promise.all(
        newEntries.map(({ stagiaire, status, comment }) =>
          api.post("/absences", {
            seance_id: Number(selectedSeanceId),
            stagiaire_id: Number(stagiaire.id),
            type_absence: status === "retard" ? "retard" : "absence",
            statut: "non_justifiee",
            commentaire:
              status === "absent"
                ? comment || DEFAULT_ABSENCE_COMMENT
                : comment || null,
            duree_minutes:
              status === "retard" ? DEFAULT_RETARD_DURATION : seanceDuration,
          })
        )
      );

      const absencesResponse = await api.get("/absences");
      setAbsences(extractCollection(absencesResponse.data));
      setMessage("Absences et retards enregistres avec succes.");
      toast.success("Absences et retards enregistres.");
    } catch (err) {
      const nextError =
        err.response?.data?.message ||
        "Impossible d'enregistrer les absences.";
      setError(nextError);
      toast.error(nextError, "Absences");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header-row formateur-page-header">
        <div>
          <span className="formateur-page-eyebrow">Formateur</span>
          <h2>Saisie des absences</h2>
          <p>Absences du jour basees uniquement sur les seances reelles.</p>
        </div>
      </div>

      <section className="content-card formateur-module-card formateur-filter-card">
        <div className="formateur-card-head">
          <div>
            <span className="formateur-section-tag">Selection</span>
            <h3 className="section-title">Choix de la seance</h3>
            <p className="soft-text">
              La selection conserve la logique actuelle et se base sur vos seances du jour.
            </p>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Date</span>
            <input type="text" value={formatDateLabel(todayKey)} readOnly />
          </label>

          <label>
            <span>Seance</span>
            <select
              value={selectedSeanceId}
              onChange={(event) => setSelectedSeanceId(event.target.value)}
              disabled={
                loadingInitialData || submitting || todaySeances.length === 0
              }
            >
              <option value="">Selectionnez une seance</option>
              {todaySeances.map((seance) => (
                <option key={seance.id} value={seance.id}>
                  {`${getTimeSlotKey(seance)} | ${seance.module || "Module non renseigne"}`}
                </option>
              ))}
            </select>
          </label>

          {selectedSeance ? (
            <>
              <label>
                <span>Module</span>
                <input type="text" value={selectedSeance.module || ""} readOnly />
              </label>

              <label>
                <span>Groupe</span>
                <input
                  type="text"
                  value={selectedSeance.groupe?.nom || ""}
                  readOnly
                />
              </label>
            </>
          ) : null}

          {loadingInitialData ? (
            <div className="status-badge info formateur-inline-badge">
              Chargement des seances...
            </div>
          ) : null}

          {loadingStagiaires ? (
            <div className="status-badge info formateur-inline-badge">
              Chargement des stagiaires...
            </div>
          ) : null}

          {error ? (
            <div className="status-badge danger formateur-inline-badge">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="status-badge info formateur-inline-badge">
              {message}
            </div>
          ) : null}
        </form>

        {!loadingInitialData && !error && todaySeances.length === 0 ? (
          <EmptyState
            icon="o"
            title="Aucune seance aujourd'hui"
            message="Aucune seance aujourd'hui"
          />
        ) : null}

        {!loadingStagiaires &&
        selectedSeanceId &&
        !error &&
        stagiaires.length === 0 ? (
          <EmptyState
            icon="o"
            title="Aucun stagiaire disponible"
            message="Aucun stagiaire n'est lie au groupe de cette seance."
          />
        ) : null}

        {selectedSeance && stagiaires.length > 0 ? (
          <div className="formateur-attendance-stack">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Stagiaire</th>
                    <th>Matricule</th>
                    <th>Presence</th>
                    <th>Commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  {stagiaires.map((stagiaire) => {
                    const radioName = `presence-${stagiaire.id}`;
                    const status = statusByStagiaire[stagiaire.id] || "present";
                    const showComment = status === "absent" || status === "retard";

                    return (
                      <tr key={stagiaire.id}>
                        <td>{formatStagiaireLabel(stagiaire)}</td>
                        <td>{stagiaire.matricule || stagiaire.numero_stagiaire || "-"}</td>
                        <td>
                          <div className="formateur-radio-group">
                            <label className="formateur-radio-option">
                              <input
                                type="radio"
                                name={radioName}
                                value="present"
                                checked={status === "present"}
                                onChange={() =>
                                  setStatusByStagiaire((current) => ({
                                    ...current,
                                    [stagiaire.id]: "present",
                                  }))
                                }
                                disabled={submitting}
                              />
                              <span>Present</span>
                            </label>

                            <label className="formateur-radio-option">
                              <input
                                type="radio"
                                name={radioName}
                                value="absent"
                                checked={status === "absent"}
                                onChange={() =>
                                  setStatusByStagiaire((current) => ({
                                    ...current,
                                    [stagiaire.id]: "absent",
                                  }))
                                }
                                disabled={submitting}
                              />
                              <span>Absent</span>
                            </label>

                            <label className="formateur-radio-option">
                              <input
                                type="radio"
                                name={radioName}
                                value="retard"
                                checked={status === "retard"}
                                onChange={() =>
                                  setStatusByStagiaire((current) => ({
                                    ...current,
                                    [stagiaire.id]: "retard",
                                  }))
                                }
                                disabled={submitting}
                              />
                              <span>Retard</span>
                            </label>
                          </div>
                        </td>
                        <td>
                          {showComment ? (
                            <textarea
                              rows={2}
                              value={commentByStagiaire[stagiaire.id] || ""}
                              onChange={(event) =>
                                setCommentByStagiaire((current) => ({
                                  ...current,
                                  [stagiaire.id]: event.target.value,
                                }))
                              }
                              disabled={submitting}
                              placeholder={
                                status === "absent"
                                  ? "Absence saisie par le formateur"
                                  : "Commentaire optionnel"
                              }
                            />
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="formateur-action-row">
              <div className="status-badge info formateur-inline-badge">
                {nonPresentEntries.length} absence(s) ou retard(s) selectionne(s)
              </div>

              <button
                type="submit"
                className="primary-btn"
                onClick={handleSubmit}
                disabled={
                  !selectedSeanceId ||
                  nonPresentEntries.length === 0 ||
                  loadingStagiaires ||
                  submitting
                }
              >
                {submitting ? "Enregistrement..." : "Enregistrer les absences"}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
