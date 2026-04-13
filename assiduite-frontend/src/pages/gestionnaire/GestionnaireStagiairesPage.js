import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/ToastProvider";
import api from "../../services/api";

const MANUAL_INITIAL_STATE = {
  groupe_id: "",
  nom: "",
  prenom: "",
  cin: "",
  date_naissance: "",
  genre: "",
  telephone: "",
  niveau_scolaire: "",
  annee_bac: "",
  moyenne_bac: "",
  niveau: "",
  code_filiere: "",
  filiere: "",
  type_formation: "",
  annee_etude: "",
  nationalite: "Marocaine",
  date_inscription: "",
  date_dossier_complet: "",
  motif_admission: "",
  numero_stagiaire: "",
};

function formatFullName(stagiaire) {
  return (
    [stagiaire.prenom, stagiaire.nom].filter(Boolean).join(" ").trim() ||
    "Non renseigne"
  );
}

function getFieldError(errors, field) {
  if (!errors || typeof errors !== "object") {
    return "";
  }

  const value = errors[field];

  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }

  return typeof value === "string" ? value : "";
}

function buildManualPayload(form) {
  const payload = {};

  Object.entries(form).forEach(([key, value]) => {
    if (value === "") {
      return;
    }

    payload[key] = value;
  });

  return payload;
}

function normalizeRows(data) {
  return Array.isArray(data) ? data : [];
}

export default function GestionnaireStagiairesPage() {
  const toast = useToast();
  const [activeMode, setActiveMode] = useState("manual");
  const [stagiaires, setStagiaires] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [manualForm, setManualForm] = useState(MANUAL_INITIAL_STATE);
  const [manualErrors, setManualErrors] = useState({});
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(null);

  const [importFile, setImportFile] = useState(null);
  const [importError, setImportError] = useState("");
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      setError("");

      try {
        const [stagiairesResponse, groupesResponse] = await Promise.all([
          api.get("/stagiaires"),
          api.get("/groupes"),
        ]);

        if (!isMounted) {
          return;
        }

        setStagiaires(normalizeRows(stagiairesResponse.data));
        setGroupes(normalizeRows(groupesResponse.data));
      } catch (err) {
        if (!isMounted) {
          return;
        }

        const message =
          err.response?.data?.message ||
          "Impossible de charger les stagiaires et les groupes.";
        setError(message);
        toast.error(message, "Stagiaires");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const rows = useMemo(() => {
    return stagiaires.map((stagiaire) => ({
      id: stagiaire.id,
      fullName: formatFullName(stagiaire),
      email: stagiaire.user?.email || "Non renseigne",
      groupe: stagiaire.groupe?.nom || "Non renseigne",
      code: stagiaire.numero_stagiaire || stagiaire.matricule || "Non renseigne",
      telephone: stagiaire.telephone || "Non renseigne",
    }));
  }, [stagiaires]);

  const groupOptions = useMemo(() => {
    return groupes.map((groupe) => ({
      value: String(groupe.id),
      label: groupe.nom || `Groupe #${groupe.id}`,
      details: [groupe.filiere, groupe.niveau].filter(Boolean).join(" • "),
    }));
  }, [groupes]);

  function updateManualField(field, value) {
    setManualForm((current) => ({
      ...current,
      [field]: value,
    }));

    setManualErrors((current) => {
      if (!current[field]) {
        return current;
      }

      return {
        ...current,
        [field]: undefined,
      };
    });
  }

  async function handleManualSubmit(event) {
    event.preventDefault();
    setManualSubmitting(true);
    setManualErrors({});
    setManualSuccess(null);

    try {
      const response = await api.post(
        "/stagiaires/manual",
        buildManualPayload(manualForm)
      );

      const createdStagiaire = response.data?.stagiaire;
      const credentials = response.data?.credentials || {};

      if (createdStagiaire) {
        setStagiaires((current) => [createdStagiaire, ...current]);
      }

      setManualSuccess({
        message:
          response.data?.message || "Le stagiaire a ete cree avec succes.",
        email: credentials.email || "Non renseigne",
        temporaryPassword:
          credentials.temporary_password || "Password!123",
        matricule: createdStagiaire?.matricule || "Non renseigne",
        numeroStagiaire:
          createdStagiaire?.numero_stagiaire || "Non renseigne",
      });

      setManualForm((current) => ({
        ...MANUAL_INITIAL_STATE,
        groupe_id: current.groupe_id,
        niveau: current.niveau,
        code_filiere: current.code_filiere,
        filiere: current.filiere,
        type_formation: current.type_formation,
        annee_etude: current.annee_etude,
        niveau_scolaire: current.niveau_scolaire,
      }));

      toast.success("Le stagiaire a bien ete ajoute.", "Creation");
    } catch (err) {
      const errors = err.response?.data?.errors;
      const message =
        err.response?.data?.message ||
        "Impossible de creer le stagiaire pour le moment.";

      if (errors) {
        setManualErrors(errors);
      }

      toast.error(message, "Creation");
    } finally {
      setManualSubmitting(false);
    }
  }

  async function handleImportSubmit(event) {
    event.preventDefault();

    if (!importFile) {
      setImportError("Veuillez selectionner un fichier Excel ou CSV.");
      return;
    }

    setImportSubmitting(true);
    setImportError("");
    setImportSummary(null);

    try {
      const formData = new FormData();
      formData.append("file", importFile);

      const response = await api.post("/stagiaires/import", formData);
      const summary = response.data?.summary || null;

      setImportSummary(summary);
      setImportFile(null);
      toast.success("L'import a ete traite avec succes.", "Import");

      const createdRows = Array.isArray(summary?.created_rows)
        ? summary.created_rows
        : [];

      if (createdRows.length > 0) {
        const refreshed = await api.get("/stagiaires");
        setStagiaires(normalizeRows(refreshed.data));
      }
    } catch (err) {
      const missingColumns = err.response?.data?.missing_columns;
      const backendMessage = err.response?.data?.message;

      const message = Array.isArray(missingColumns) && missingColumns.length > 0
        ? `${backendMessage || "Colonnes manquantes."} ${missingColumns.join(", ")}`
        : backendMessage || "Impossible de lancer l'import pour le moment.";

      setImportError(message);
      toast.error(message, "Import");
    } finally {
      setImportSubmitting(false);
    }
  }

  const totalLabel =
    !loading && !error && rows.length > 0 ? `${rows.length} stagiaire(s)` : null;

  return (
    <div className="page-stack">
      <div className="page-header-row gestionnaire-page-header">
        <div>
          <span className="gestionnaire-page-eyebrow">Gestionnaire</span>
          <h2>Stagiaires</h2>
          <p>
            Ajoutez de nouveaux stagiaires manuellement ou importez-les par
            fichier Excel, puis consultez la liste existante.
          </p>
        </div>
      </div>

      <section className="content-card gestionnaire-module-card">
        <div className="gestionnaire-card-head">
          <div>
            <span className="gestionnaire-section-tag">Ajout</span>
            <h3 className="section-title">Ajouter des stagiaires</h3>
            <p className="soft-text">
              Choisissez un ajout manuel pour un cas unitaire ou un import Excel
              pour une creation en masse.
            </p>
          </div>
        </div>

        <div className="gestionnaire-mode-switch" role="tablist" aria-label="Modes d ajout">
          <button
            type="button"
            className={`gestionnaire-mode-pill ${
              activeMode === "manual" ? "active" : ""
            }`}
            onClick={() => setActiveMode("manual")}
          >
            Ajout manuel
          </button>
          <button
            type="button"
            className={`gestionnaire-mode-pill ${
              activeMode === "import" ? "active" : ""
            }`}
            onClick={() => setActiveMode("import")}
          >
            Import Excel
          </button>
        </div>

        {activeMode === "manual" ? (
          <div className="gestionnaire-stagiaire-panel">
            {manualSuccess ? (
              <div className="gestionnaire-feedback-card success">
                <div className="gestionnaire-feedback-head">
                  <span className="status-badge success">Compte cree</span>
                </div>
                <strong>{manualSuccess.message}</strong>
                <div className="gestionnaire-credential-grid">
                  <div>
                    <span>Email genere</span>
                    <p>{manualSuccess.email}</p>
                  </div>
                  <div>
                    <span>Mot de passe temporaire</span>
                    <p>{manualSuccess.temporaryPassword}</p>
                  </div>
                  <div>
                    <span>Matricule</span>
                    <p>{manualSuccess.matricule}</p>
                  </div>
                  <div>
                    <span>Numero stagiaire</span>
                    <p>{manualSuccess.numeroStagiaire}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <form className="form-grid gestionnaire-stagiaire-form" onSubmit={handleManualSubmit}>
              <label>
                <span>Groupe</span>
                <select
                  value={manualForm.groupe_id}
                  onChange={(event) => updateManualField("groupe_id", event.target.value)}
                  disabled={manualSubmitting || groupes.length === 0}
                >
                  <option value="">Selectionner un groupe</option>
                  {groupOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.details ? `${option.label} - ${option.details}` : option.label}
                    </option>
                  ))}
                </select>
                {getFieldError(manualErrors, "groupe_id") ? (
                  <small className="form-error-text">
                    {getFieldError(manualErrors, "groupe_id")}
                  </small>
                ) : null}
              </label>

              <label>
                <span>Nom</span>
                <input
                  type="text"
                  value={manualForm.nom}
                  onChange={(event) => updateManualField("nom", event.target.value)}
                  disabled={manualSubmitting}
                />
                {getFieldError(manualErrors, "nom") ? (
                  <small className="form-error-text">{getFieldError(manualErrors, "nom")}</small>
                ) : null}
              </label>

              <label>
                <span>Prenom</span>
                <input
                  type="text"
                  value={manualForm.prenom}
                  onChange={(event) => updateManualField("prenom", event.target.value)}
                  disabled={manualSubmitting}
                />
                {getFieldError(manualErrors, "prenom") ? (
                  <small className="form-error-text">{getFieldError(manualErrors, "prenom")}</small>
                ) : null}
              </label>

              <label>
                <span>CIN</span>
                <input
                  type="text"
                  value={manualForm.cin}
                  onChange={(event) => updateManualField("cin", event.target.value)}
                  disabled={manualSubmitting}
                />
                {getFieldError(manualErrors, "cin") ? (
                  <small className="form-error-text">{getFieldError(manualErrors, "cin")}</small>
                ) : null}
              </label>

              <label>
                <span>Date de naissance</span>
                <input
                  type="date"
                  value={manualForm.date_naissance}
                  onChange={(event) =>
                    updateManualField("date_naissance", event.target.value)
                  }
                  disabled={manualSubmitting}
                />
                {getFieldError(manualErrors, "date_naissance") ? (
                  <small className="form-error-text">
                    {getFieldError(manualErrors, "date_naissance")}
                  </small>
                ) : null}
              </label>

              <label>
                <span>Genre</span>
                <select
                  value={manualForm.genre}
                  onChange={(event) => updateManualField("genre", event.target.value)}
                  disabled={manualSubmitting}
                >
                  <option value="">Selectionner</option>
                  <option value="M">Masculin</option>
                  <option value="F">Feminin</option>
                </select>
                {getFieldError(manualErrors, "genre") ? (
                  <small className="form-error-text">{getFieldError(manualErrors, "genre")}</small>
                ) : null}
              </label>

              <label>
                <span>Telephone</span>
                <input
                  type="text"
                  value={manualForm.telephone}
                  onChange={(event) => updateManualField("telephone", event.target.value)}
                  disabled={manualSubmitting}
                />
              </label>

              <label>
                <span>Numero stagiaire</span>
                <input
                  type="text"
                  value={manualForm.numero_stagiaire}
                  onChange={(event) =>
                    updateManualField("numero_stagiaire", event.target.value)
                  }
                  disabled={manualSubmitting}
                  placeholder="Genere automatiquement si vide"
                />
                {getFieldError(manualErrors, "numero_stagiaire") ? (
                  <small className="form-error-text">
                    {getFieldError(manualErrors, "numero_stagiaire")}
                  </small>
                ) : null}
              </label>

              <label>
                <span>Niveau scolaire</span>
                <input
                  type="text"
                  value={manualForm.niveau_scolaire}
                  onChange={(event) =>
                    updateManualField("niveau_scolaire", event.target.value)
                  }
                  disabled={manualSubmitting}
                />
                {getFieldError(manualErrors, "niveau_scolaire") ? (
                  <small className="form-error-text">
                    {getFieldError(manualErrors, "niveau_scolaire")}
                  </small>
                ) : null}
              </label>

              <label>
                <span>Annee bac</span>
                <input
                  type="text"
                  value={manualForm.annee_bac}
                  onChange={(event) => updateManualField("annee_bac", event.target.value)}
                  disabled={manualSubmitting}
                />
              </label>

              <label>
                <span>Moyenne bac</span>
                <input
                  type="number"
                  step="0.01"
                  value={manualForm.moyenne_bac}
                  onChange={(event) =>
                    updateManualField("moyenne_bac", event.target.value)
                  }
                  disabled={manualSubmitting}
                />
                {getFieldError(manualErrors, "moyenne_bac") ? (
                  <small className="form-error-text">
                    {getFieldError(manualErrors, "moyenne_bac")}
                  </small>
                ) : null}
              </label>

              <label>
                <span>Niveau</span>
                <input
                  type="text"
                  value={manualForm.niveau}
                  onChange={(event) => updateManualField("niveau", event.target.value)}
                  disabled={manualSubmitting}
                />
                {getFieldError(manualErrors, "niveau") ? (
                  <small className="form-error-text">{getFieldError(manualErrors, "niveau")}</small>
                ) : null}
              </label>

              <label>
                <span>Code filiere</span>
                <input
                  type="text"
                  value={manualForm.code_filiere}
                  onChange={(event) =>
                    updateManualField("code_filiere", event.target.value)
                  }
                  disabled={manualSubmitting}
                />
                {getFieldError(manualErrors, "code_filiere") ? (
                  <small className="form-error-text">
                    {getFieldError(manualErrors, "code_filiere")}
                  </small>
                ) : null}
              </label>

              <label>
                <span>Filiere</span>
                <input
                  type="text"
                  value={manualForm.filiere}
                  onChange={(event) => updateManualField("filiere", event.target.value)}
                  disabled={manualSubmitting}
                />
                {getFieldError(manualErrors, "filiere") ? (
                  <small className="form-error-text">{getFieldError(manualErrors, "filiere")}</small>
                ) : null}
              </label>

              <label>
                <span>Type de formation</span>
                <input
                  type="text"
                  value={manualForm.type_formation}
                  onChange={(event) =>
                    updateManualField("type_formation", event.target.value)
                  }
                  disabled={manualSubmitting}
                />
              </label>

              <label>
                <span>Annee d'etude</span>
                <input
                  type="text"
                  value={manualForm.annee_etude}
                  onChange={(event) =>
                    updateManualField("annee_etude", event.target.value)
                  }
                  disabled={manualSubmitting}
                />
                {getFieldError(manualErrors, "annee_etude") ? (
                  <small className="form-error-text">
                    {getFieldError(manualErrors, "annee_etude")}
                  </small>
                ) : null}
              </label>

              <label>
                <span>Nationalite</span>
                <input
                  type="text"
                  value={manualForm.nationalite}
                  onChange={(event) =>
                    updateManualField("nationalite", event.target.value)
                  }
                  disabled={manualSubmitting}
                />
              </label>

              <label>
                <span>Date inscription</span>
                <input
                  type="date"
                  value={manualForm.date_inscription}
                  onChange={(event) =>
                    updateManualField("date_inscription", event.target.value)
                  }
                  disabled={manualSubmitting}
                />
              </label>

              <label>
                <span>Date dossier complet</span>
                <input
                  type="date"
                  value={manualForm.date_dossier_complet}
                  onChange={(event) =>
                    updateManualField("date_dossier_complet", event.target.value)
                  }
                  disabled={manualSubmitting}
                />
              </label>

              <label className="full">
                <span>Motif admission</span>
                <textarea
                  value={manualForm.motif_admission}
                  onChange={(event) =>
                    updateManualField("motif_admission", event.target.value)
                  }
                  disabled={manualSubmitting}
                />
              </label>

              <div className="gestionnaire-form-actions full">
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={manualSubmitting || groupes.length === 0}
                >
                  {manualSubmitting ? "Creation en cours..." : "Creer le stagiaire"}
                </button>
                <p className="soft-text">
                  Le compte utilisateur sera cree automatiquement avec un email OFPPT
                  et un mot de passe temporaire.
                </p>
              </div>
            </form>
          </div>
        ) : (
          <div className="gestionnaire-stagiaire-panel">
            <div className="gestionnaire-import-intro">
              <span className="status-badge info">Formats acceptes</span>
              <p className="soft-text">
                Importez un fichier <strong>.xlsx</strong>, <strong>.csv</strong> ou{" "}
                <strong>.txt</strong>. Les lignes valides creeront automatiquement les
                comptes utilisateurs et les fiches stagiaires.
              </p>
            </div>

            <form className="gestionnaire-import-form" onSubmit={handleImportSubmit}>
              <label className="gestionnaire-file-field">
                <span>Fichier d'import</span>
                <input
                  type="file"
                  accept=".xlsx,.csv,.txt"
                  onChange={(event) =>
                    setImportFile(event.target.files?.[0] || null)
                  }
                  disabled={importSubmitting}
                />
              </label>

              <div className="gestionnaire-form-actions">
                <button type="submit" className="primary-btn" disabled={importSubmitting}>
                  {importSubmitting ? "Import en cours..." : "Lancer l'import"}
                </button>
                <p className="soft-text">
                  Les doublons et lignes invalides seront retournes dans le resume.
                </p>
              </div>
            </form>

            {importError ? (
              <div className="gestionnaire-feedback-card danger">
                <strong>Import impossible</strong>
                <p>{importError}</p>
              </div>
            ) : null}

            {importSummary ? (
              <div className="gestionnaire-import-summary">
                <div className="gestionnaire-import-kpis">
                  <div className="gestionnaire-import-kpi">
                    <span>Total lignes</span>
                    <strong>{importSummary.total_rows ?? 0}</strong>
                  </div>
                  <div className="gestionnaire-import-kpi success">
                    <span>Creees</span>
                    <strong>{importSummary.created_count ?? 0}</strong>
                  </div>
                  <div className="gestionnaire-import-kpi warning">
                    <span>Ignorees</span>
                    <strong>{importSummary.skipped_count ?? 0}</strong>
                  </div>
                  <div className="gestionnaire-import-kpi danger">
                    <span>En echec</span>
                    <strong>{importSummary.failed_count ?? 0}</strong>
                  </div>
                </div>

                <div className="gestionnaire-import-lists">
                  <div className="gestionnaire-import-list">
                    <div className="gestionnaire-import-list-head">
                      <h4>Lignes creees</h4>
                      <span className="status-badge success">
                        {(importSummary.created_rows || []).length}
                      </span>
                    </div>

                    {(importSummary.created_rows || []).length === 0 ? (
                      <p className="soft-text">Aucune ligne creee pour cet import.</p>
                    ) : (
                      <ul>
                        {importSummary.created_rows.map((item) => (
                          <li key={`created-${item.row}`}>
                            <strong>Ligne {item.row}</strong> {item.prenom} {item.nom} •{" "}
                            {item.email} • {item.groupe}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="gestionnaire-import-list">
                    <div className="gestionnaire-import-list-head">
                      <h4>Lignes ignorees</h4>
                      <span className="status-badge warning">
                        {(importSummary.skipped_rows || []).length}
                      </span>
                    </div>

                    {(importSummary.skipped_rows || []).length === 0 ? (
                      <p className="soft-text">Aucune ligne ignoree.</p>
                    ) : (
                      <ul>
                        {importSummary.skipped_rows.map((item) => (
                          <li key={`skipped-${item.row}`}>
                            <strong>Ligne {item.row}</strong>
                            <span>{(item.reasons || []).join(" • ")}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="gestionnaire-import-list">
                    <div className="gestionnaire-import-list-head">
                      <h4>Lignes en echec</h4>
                      <span className="status-badge danger">
                        {(importSummary.failed_rows || []).length}
                      </span>
                    </div>

                    {(importSummary.failed_rows || []).length === 0 ? (
                      <p className="soft-text">Aucune ligne en echec.</p>
                    ) : (
                      <ul>
                        {importSummary.failed_rows.map((item) => (
                          <li key={`failed-${item.row}`}>
                            <strong>Ligne {item.row}</strong>
                            <span>{(item.reasons || []).join(" • ")}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="content-card gestionnaire-module-card">
        <div className="gestionnaire-card-head">
          <div>
            <span className="gestionnaire-section-tag">Annuaire</span>
            <h3 className="section-title">Liste des stagiaires</h3>
            <p className="soft-text">
              Vue d'ensemble des stagiaires, de leur groupe et de leurs coordonnees.
            </p>
          </div>

          {totalLabel ? <span className="status-badge info">{totalLabel}</span> : null}
        </div>

        {loading ? (
          <EmptyState
            icon="..."
            title="Chargement des stagiaires..."
            message="La liste est en cours de recuperation."
            compact
          />
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="o"
            title="Aucun stagiaire disponible"
            message="Les stagiaires apparaitront ici des qu'ils seront disponibles."
          />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom complet</th>
                  <th>Email</th>
                  <th>Groupe</th>
                  <th>Code</th>
                  <th>Telephone</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.fullName}</td>
                    <td>{row.email}</td>
                    <td>{row.groupe}</td>
                    <td>{row.code}</td>
                    <td>{row.telephone}</td>
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
