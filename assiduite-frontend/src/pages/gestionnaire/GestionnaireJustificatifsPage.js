import { useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";

function extractApiError(err, fallback) {
  const errors = err.response?.data?.errors;

  if (errors && typeof errors === "object") {
    const firstError = Object.values(errors)[0];

    if (Array.isArray(firstError) && firstError[0]) {
      return firstError[0];
    }
  }

  return err.response?.data?.message || fallback;
}

function formatStagiaireName(justificatif) {
  const stagiaire = justificatif.absence?.stagiaire;
  return (
    [stagiaire?.prenom, stagiaire?.nom].filter(Boolean).join(" ").trim() ||
    "Non renseigne"
  );
}

function buildAcceptedPromptMessage(justificatif) {
  const fullName = formatStagiaireName(justificatif);
  const groupeName = justificatif?.absence?.stagiaire?.groupe?.nom;

  if (groupeName) {
    return `Le justificatif du stagiaire ${fullName} (Groupe ${groupeName}) a ete accepte. Souhaitez-vous creer un billet pour lui maintenant ?`;
  }

  return `Le justificatif du stagiaire ${fullName} a ete accepte. Souhaitez-vous creer un billet pour lui maintenant ?`;
}

function formatAbsenceLabel(justificatif) {
  const absence = justificatif.absence;
  const date = absence?.seance?.date_seance || "Date inconnue";
  const module = absence?.seance?.module || "Module non renseigne";

  return `${date} - ${module}`;
}

function formatDateTime(value) {
  if (!value) {
    return "Non renseigne";
  }

  return new Date(value).toLocaleString("fr-FR");
}

function getStatusTone(statut) {
  const value = String(statut || "").toLowerCase();

  if (value.includes("accepte") || value.includes("cree")) {
    return "success";
  }

  if (value.includes("attente")) {
    return "warning";
  }

  if (value.includes("refuse")) {
    return "danger";
  }

  return "info";
}

function buildFileUrl(path) {
  if (!path) {
    return "#";
  }

  return new URL(path, api.defaults.baseURL).toString();
}

function buildInitialBilletForm(justificatif, personnelId) {
  return {
    stagiaire_id: justificatif.absence?.stagiaire?.id || "",
    absence_id: justificatif.absence?.id || "",
    justificatif_id: justificatif.id,
    personnel_id: personnelId || "",
    type: justificatif.absence?.type_absence || "absence",
    motif: "",
    date_validite: justificatif.absence?.seance?.date_seance || "",
    heure_debut: justificatif.absence?.seance?.heure_debut || "",
    heure_fin: justificatif.absence?.seance?.heure_fin || "",
    statut: "actif",
  };
}

export default function GestionnaireJustificatifsPage() {
  const toast = useToast();
  const [justificatifs, setJustificatifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeRejectId, setActiveRejectId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [acceptedJustificatif, setAcceptedJustificatif] = useState(null);
  const [showBilletPrompt, setShowBilletPrompt] = useState(false);
  const [showBilletForm, setShowBilletForm] = useState(false);
  const [billetForm, setBilletForm] = useState({
    stagiaire_id: "",
    absence_id: "",
    justificatif_id: "",
    personnel_id: "",
    type: "absence",
    motif: "",
    date_validite: "",
    heure_debut: "",
    heure_fin: "",
    statut: "actif",
  });
  const [gestionnairePersonnelId, setGestionnairePersonnelId] = useState("");

  const fetchJustificatifs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [response, meResponse] = await Promise.all([
        api.get("/justificatifs"),
        api.get("/me"),
      ]);

      setJustificatifs(Array.isArray(response.data) ? response.data : []);
      setGestionnairePersonnelId(meResponse.data?.personnel?.id || "");
    } catch (err) {
      const message = extractApiError(
        err,
        "Impossible de charger les justificatifs."
      );
      setError(message);
      toast.error(message, "Justificatifs");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchJustificatifs();
  }, [fetchJustificatifs]);

  const pendingCount = useMemo(() => {
    return justificatifs.filter((item) => item.statut === "en_attente").length;
  }, [justificatifs]);

  async function handleAccept(justificatifId) {
    setProcessingId(justificatifId);

    try {
      const response = await api.put(`/justificatifs/${justificatifId}/accepter`);
      const accepted = response.data?.justificatif || null;

      await fetchJustificatifs();

      if (accepted) {
        setAcceptedJustificatif(accepted);
        setBilletForm(buildInitialBilletForm(accepted, gestionnairePersonnelId));
        setShowBilletPrompt(true);
      }

      toast.success("Justificatif accepte.");
    } catch (err) {
      toast.error(
        extractApiError(err, "Impossible d'accepter le justificatif."),
        "Traitement"
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(justificatifId) {
    if (!rejectionReason.trim()) {
      toast.error("Le motif de refus est obligatoire.", "Traitement");
      return;
    }

    setProcessingId(justificatifId);

    try {
      await api.put(`/justificatifs/${justificatifId}/refuser`, {
        motif_refus: rejectionReason.trim(),
      });
      setActiveRejectId(null);
      setRejectionReason("");
      await fetchJustificatifs();
      toast.success("Justificatif refuse.");
    } catch (err) {
      toast.error(
        extractApiError(err, "Impossible de refuser le justificatif."),
        "Traitement"
      );
    } finally {
      setProcessingId(null);
    }
  }

  function closeBilletDialogs() {
    setShowBilletPrompt(false);
    setShowBilletForm(false);
    setAcceptedJustificatif(null);
  }

  function handlePromptNo() {
    closeBilletDialogs();
    toast.success("Le billet reste en attente de creation.");
  }

  function handlePromptYes() {
    if (!acceptedJustificatif) {
      return;
    }

    setBilletForm(buildInitialBilletForm(acceptedJustificatif, gestionnairePersonnelId));
    setShowBilletPrompt(false);
    setShowBilletForm(true);
  }

  async function handleCreateBillet(event) {
    event.preventDefault();

    if (!billetForm.personnel_id) {
      toast.error("Le profil gestionnaire est introuvable.", "Billet");
      return;
    }

    const targetId = acceptedJustificatif?.id || billetForm.justificatif_id;
    setProcessingId(targetId);

    try {
      await api.post("/billets", billetForm);
      await fetchJustificatifs();
      closeBilletDialogs();
      toast.success("Billet cree avec succes.");
    } catch (err) {
      toast.error(
        extractApiError(err, "Impossible de creer le billet."),
        "Billet"
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header-row gestionnaire-page-header">
        <div>
          <span className="gestionnaire-page-eyebrow">Gestionnaire</span>
          <h2>Justificatifs</h2>
          <p>Revoyez les justificatifs deposes, puis acceptez-les ou refusez-les.</p>
        </div>
      </div>

      <section className="content-card gestionnaire-module-card">
        <div className="gestionnaire-card-head">
          <div>
            <span className="gestionnaire-section-tag">Revue</span>
            <h3 className="section-title">Liste des justificatifs</h3>
            <p className="soft-text">
              Les justificatifs en attente sont prets a etre traites. Un motif est
              obligatoire en cas de refus.
            </p>
          </div>

          {!loading && !error ? (
            <span className="status-badge warning">
              {pendingCount} en attente
            </span>
          ) : null}
        </div>

        {showBilletPrompt ? (
          <div className="content-card gestionnaire-module-card">
            <div className="gestionnaire-card-head">
              <div>
                <span className="gestionnaire-section-tag">Billet</span>
                <h3 className="section-title">
                  Justificatif accepte
                </h3>
                <p className="soft-text">
                  {buildAcceptedPromptMessage(acceptedJustificatif)}
                </p>
                <p className="soft-text">
                  Choisissez Oui pour ouvrir le formulaire de creation ou Non pour
                  laisser l'absence en attente de creation du billet.
                </p>
              </div>
            </div>

            <div className="gestionnaire-inline-actions">
              <button className="primary-btn" type="button" onClick={handlePromptYes}>
                Oui
              </button>
              <button className="secondary-btn" type="button" onClick={handlePromptNo}>
                Non
              </button>
            </div>
          </div>
        ) : null}

        {showBilletForm ? (
          <div className="content-card gestionnaire-module-card">
            <div className="gestionnaire-card-head">
              <div>
                <span className="gestionnaire-section-tag">Creation</span>
                <h3 className="section-title">Creer un billet</h3>
                <p className="soft-text">
                  Formulaire minimal relie au justificatif accepte.
                </p>
              </div>
            </div>

            <form className="form-grid" onSubmit={handleCreateBillet}>
              <label>
                <span>Type</span>
                <select
                  value={billetForm.type}
                  onChange={(e) =>
                    setBilletForm((current) => ({ ...current, type: e.target.value }))
                  }
                >
                  <option value="absence">Absence</option>
                  <option value="retard">Retard</option>
                  <option value="entree">Entree</option>
                </select>
              </label>

              <label>
                <span>Date de validite</span>
                <input
                  type="date"
                  value={billetForm.date_validite}
                  onChange={(e) =>
                    setBilletForm((current) => ({
                      ...current,
                      date_validite: e.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label>
                <span>Heure debut</span>
                <input
                  type="time"
                  value={billetForm.heure_debut}
                  onChange={(e) =>
                    setBilletForm((current) => ({
                      ...current,
                      heure_debut: e.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Heure fin</span>
                <input
                  type="time"
                  value={billetForm.heure_fin}
                  onChange={(e) =>
                    setBilletForm((current) => ({
                      ...current,
                      heure_fin: e.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Motif</span>
                <textarea
                  rows="3"
                  value={billetForm.motif}
                  onChange={(e) =>
                    setBilletForm((current) => ({ ...current, motif: e.target.value }))
                  }
                  placeholder="Motif du billet"
                />
              </label>

              <div className="gestionnaire-inline-actions">
                <button className="primary-btn" type="submit">
                  Creer le billet
                </button>
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={closeBilletDialogs}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {loading ? (
          <EmptyState
            icon="..."
            title="Chargement des justificatifs..."
            message="La liste est en cours de recuperation."
            compact
          />
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : justificatifs.length === 0 ? (
          <EmptyState
            icon="o"
            title="Aucun justificatif disponible"
            message="Les justificatifs apparaitront ici des qu'ils seront disponibles."
          />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Stagiaire</th>
                  <th>Absence</th>
                  <th>Depot</th>
                  <th>Statut</th>
                  <th>Document</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {justificatifs.map((justificatif) => {
                  const isPending = justificatif.statut === "en_attente";
                  const isRejecting = activeRejectId === justificatif.id;
                  const isProcessing = processingId === justificatif.id;

                  return (
                    <tr key={justificatif.id}>
                      <td>{formatStagiaireName(justificatif)}</td>
                      <td>
                        <div>{formatAbsenceLabel(justificatif)}</div>
                        <small>{justificatif.absence?.type_absence || "Absence"}</small>
                      </td>
                      <td>{formatDateTime(justificatif.date_depot)}</td>
                      <td>
                        <span
                          className={`status-badge ${getStatusTone(justificatif.statut)}`}
                        >
                          {justificatif.status_label || justificatif.statut}
                        </span>
                        {justificatif.motif_refus ? (
                          <p className="soft-text">{justificatif.motif_refus}</p>
                        ) : null}
                        {justificatif.absence?.billet_label ? (
                          <p className="soft-text">{justificatif.absence.billet_label}</p>
                        ) : null}
                      </td>
                      <td>
                        {justificatif.fichier_url ? (
                          <a
                            href={buildFileUrl(justificatif.fichier_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="secondary-btn"
                          >
                            Ouvrir
                          </a>
                        ) : (
                          <span>Indisponible</span>
                        )}
                      </td>
                      <td>
                        {isPending ? (
                          <div className="page-stack">
                            <div className="gestionnaire-inline-actions">
                              <button
                                className="primary-btn"
                                type="button"
                                onClick={() => handleAccept(justificatif.id)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? "Traitement..." : "Accepter"}
                              </button>
                              <button
                                className="secondary-btn"
                                type="button"
                                onClick={() => {
                                  setActiveRejectId(
                                    isRejecting ? null : justificatif.id
                                  );
                                  setRejectionReason("");
                                }}
                                disabled={isProcessing}
                              >
                                Refuser
                              </button>
                            </div>

                            {isRejecting ? (
                              <div className="form-grid">
                                <label>
                                  <span>Motif de refus</span>
                                  <textarea
                                    rows="3"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Expliquez pourquoi le justificatif est refuse."
                                  />
                                </label>
                                <button
                                  className="primary-btn"
                                  type="button"
                                  onClick={() => handleReject(justificatif.id)}
                                  disabled={isProcessing}
                                >
                                  Confirmer le refus
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <span>Traite</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
