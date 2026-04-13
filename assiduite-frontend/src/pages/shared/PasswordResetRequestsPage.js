import { useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";
import { getSessionRole } from "../../services/session";

const roleCopy = {
  gestionnaire: {
    eyebrow: "Gestionnaire",
    title: "Demandes mot de passe",
    subtitle: "Traitez les demandes de reinitialisation des comptes stagiaire.",
  },
  directeur: {
    eyebrow: "Directeur",
    title: "Demandes mot de passe",
    subtitle: "Traitez les demandes des comptes formateur et gestionnaire.",
  },
  admin: {
    eyebrow: "Admin",
    title: "Demandes mot de passe",
    subtitle: "Traitez les demandes de reinitialisation des comptes directeur.",
  },
};

function formatDate(value) {
  if (!value) {
    return "Non renseignee";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("fr-FR");
}

export default function PasswordResetRequestsPage() {
  const toast = useToast();
  const role = getSessionRole();
  const copy = roleCopy[role] || roleCopy.gestionnaire;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingId, setSubmittingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [refusalReasons, setRefusalReasons] = useState({});

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/password-reset-requests/assigned");
      setRequests(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        "Impossible de charger les demandes assignees.";
      setError(message);
      toast.error(message, "Demandes");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const pendingCount = useMemo(() => requests.length, [requests]);

  async function handleApprove(requestId) {
    setSubmittingId(requestId);

    try {
      const response = await api.post(`/password-reset-requests/${requestId}/approve`);
      toast.success(
        response.data?.message || "Demande approuvee avec succes.",
        "Demandes"
      );
      setRejectingId(null);
      await fetchRequests();
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        "Impossible d approuver la demande.";
      toast.error(message, "Demandes");
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleReject(requestId) {
    const refusalReason = (refusalReasons[requestId] || "").trim();

    if (!refusalReason) {
      toast.error("Le motif du refus est obligatoire.", "Demandes");
      return;
    }

    setSubmittingId(requestId);

    try {
      const response = await api.post(`/password-reset-requests/${requestId}/reject`, {
        refusal_reason: refusalReason,
      });
      toast.success(
        response.data?.message || "Demande rejetee avec succes.",
        "Demandes"
      );
      setRejectingId(null);
      setRefusalReasons((current) => {
        const next = { ...current };
        delete next[requestId];
        return next;
      });
      await fetchRequests();
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        requestError.response?.data?.errors?.refusal_reason?.[0] ||
        "Impossible de rejeter la demande.";
      toast.error(message, "Demandes");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <span className="directeur-page-eyebrow">{copy.eyebrow}</span>
          <h2>{copy.title}</h2>
          <p>{copy.subtitle}</p>
        </div>
      </div>

      <section className="content-card">
        <div className="page-header-row">
          <div>
            <h3 className="section-title">Demandes assignees</h3>
            <p className="soft-text">
              Consultez les demandes en attente et appliquez la decision adaptee.
            </p>
          </div>

          {!loading && !error ? (
            <span className="status-badge info">{pendingCount} demande(s)</span>
          ) : null}
        </div>

        {loading ? (
          <EmptyState
            icon="..."
            title="Chargement des demandes..."
            message="Les demandes assignees sont en cours de recuperation."
            compact
          />
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon="o"
            title="Aucune demande en attente"
            message="Aucune demande de reinitialisation n est actuellement assignee."
          />
        ) : (
          <div className="password-reset-request-list">
            {requests.map((requestItem) => {
              const requestId = requestItem.id;
              const isRejectOpen = rejectingId === requestId;
              const isBusy = submittingId === requestId;

              return (
                <article key={requestId} className="password-reset-request-card">
                  <div className="password-reset-request-grid">
                    <div>
                      <span className="password-reset-request-label">Demandeur</span>
                      <strong>{requestItem.requester?.name || "Non renseigne"}</strong>
                      <p>{requestItem.requester?.email || "Email indisponible"}</p>
                    </div>

                    <div>
                      <span className="password-reset-request-label">Role cible</span>
                      <strong>{requestItem.target_role || "Non renseigne"}</strong>
                      <p>{requestItem.target_user?.email || "Compte indisponible"}</p>
                    </div>

                    <div>
                      <span className="password-reset-request-label">Date</span>
                      <strong>{formatDate(requestItem.created_at)}</strong>
                      <p>ID demande #{requestId}</p>
                    </div>

                    <div>
                      <span className="password-reset-request-label">Statut</span>
                      <span className="status-badge warning">{requestItem.status}</span>
                    </div>
                  </div>

                  <div className="password-reset-request-actions">
                    <button
                      type="button"
                      className="primary-btn"
                      disabled={isBusy}
                      onClick={() => handleApprove(requestId)}
                    >
                      {isBusy ? "Traitement..." : "Approuver"}
                    </button>

                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={isBusy}
                      onClick={() =>
                        setRejectingId((current) =>
                          current === requestId ? null : requestId
                        )
                      }
                    >
                      Rejeter
                    </button>
                  </div>

                  {isRejectOpen ? (
                    <div className="password-reset-reject-panel">
                      <label>
                        <span>Motif du refus</span>
                        <textarea
                          value={refusalReasons[requestId] || ""}
                          onChange={(event) =>
                            setRefusalReasons((current) => ({
                              ...current,
                              [requestId]: event.target.value,
                            }))
                          }
                          placeholder="Expliquez la raison du refus"
                        />
                      </label>

                      <div className="password-reset-reject-actions">
                        <button
                          type="button"
                          className="secondary-btn"
                          disabled={isBusy}
                          onClick={() => setRejectingId(null)}
                        >
                          Annuler
                        </button>

                        <button
                          type="button"
                          className="primary-btn"
                          disabled={isBusy}
                          onClick={() => handleReject(requestId)}
                        >
                          Confirmer le refus
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
