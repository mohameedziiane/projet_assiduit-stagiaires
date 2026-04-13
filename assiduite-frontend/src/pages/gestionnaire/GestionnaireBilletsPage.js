import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";

function formatStagiaireName(billet) {
  return (
    [billet.stagiaire?.prenom, billet.stagiaire?.nom]
      .filter(Boolean)
      .join(" ")
      .trim() || "Non renseigne"
  );
}

function formatDate(value) {
  if (!value) {
    return "Non renseignee";
  }

  return String(value).slice(0, 10);
}

function isBilletValid(billet) {
  if (!billet.est_actif || !billet.date_validite) {
    return false;
  }

  const now = new Date();
  const validUntil = new Date(billet.date_validite);

  return !Number.isNaN(validUntil.getTime()) && validUntil >= now;
}

export default function GestionnaireBilletsPage() {
  const toast = useToast();
  const [billets, setBillets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchBillets() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/billets");

        if (isMounted) {
          setBillets(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err.response?.data?.message || "Impossible de charger les billets.";
          setError(message);
          toast.error(message, "Billets");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchBillets();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const rows = useMemo(() => {
    return billets.map((billet) => ({
      id: billet.id,
      codeUnique: billet.code_unique || "Non renseigne",
      stagiaire: formatStagiaireName(billet),
      dateValidite: formatDate(billet.date_validite),
      estActif: Boolean(billet.est_actif),
      etat: isBilletValid(billet) ? "valide" : "expire",
    }));
  }, [billets]);

  return (
    <div className="page-stack">
      <div className="page-header-row gestionnaire-page-header">
        <div>
          <span className="gestionnaire-page-eyebrow">Gestionnaire</span>
          <h2>Billets</h2>
          <p>Consultez les billets emis, leur validite et leur etat d'activation.</p>
        </div>
      </div>

      <section className="content-card gestionnaire-module-card">
        <div className="gestionnaire-card-head">
          <div>
            <span className="gestionnaire-section-tag">Billetterie</span>
            <h3 className="section-title">Liste des billets</h3>
            <p className="soft-text">
              Verification rapide des codes, de l'etat actif et de la validite.
            </p>
          </div>

          {!loading && !error && rows.length > 0 ? (
            <span className="status-badge info">{rows.length} billet(s)</span>
          ) : null}
        </div>

        {loading ? (
          <EmptyState
            icon="..."
            title="Chargement des billets..."
            message="La liste est en cours de recuperation."
            compact
          />
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="o"
            title="Aucun billet disponible"
            message="Les billets apparaitront ici des qu'ils seront disponibles."
          />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code unique</th>
                  <th>Stagiaire</th>
                  <th>Date validite</th>
                  <th>Actif</th>
                  <th>Etat</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.codeUnique}</td>
                    <td>{row.stagiaire}</td>
                    <td>{row.dateValidite}</td>
                    <td>
                      <span className={`status-badge ${row.estActif ? "success" : "danger"}`}>
                        {row.estActif ? "actif" : "inactif"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${row.etat === "valide" ? "success" : "warning"}`}>
                        {row.etat}
                      </span>
                    </td>
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
