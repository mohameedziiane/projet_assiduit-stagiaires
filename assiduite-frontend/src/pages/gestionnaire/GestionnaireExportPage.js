import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/ui/EmptyState";
import api from "../../services/api";

function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export default function GestionnaireExportPage() {
  const [stagiaires, setStagiaires] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchExportData() {
      setLoading(true);
      setError("");

      try {
        const [stagiairesResponse, absencesResponse] = await Promise.all([
          api.get("/stagiaires"),
          api.get("/absences"),
        ]);

        if (isMounted) {
          setStagiaires(
            Array.isArray(stagiairesResponse.data) ? stagiairesResponse.data : []
          );
          setAbsences(Array.isArray(absencesResponse.data) ? absencesResponse.data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Impossible de charger les donnees d'export."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchExportData();

    return () => {
      isMounted = false;
    };
  }, []);

  const exportRows = useMemo(() => {
    return stagiaires.map((stagiaire) => {
      const stagiaireAbsences = absences.filter(
        (absence) => absence.stagiaire_id === stagiaire.id
      );

      return {
        nom: [stagiaire.prenom, stagiaire.nom].filter(Boolean).join(" ").trim(),
        groupe: stagiaire.groupe?.nom || "Non renseigne",
        absences: stagiaireAbsences.length,
        nonJustifiees: stagiaireAbsences.filter(
          (absence) => absence.statut === "non_justifiee"
        ).length,
        enAttente: stagiaireAbsences.filter(
          (absence) => absence.statut === "en_attente"
        ).length,
      };
    });
  }, [absences, stagiaires]);

  function handleExport() {
    const csvContent = [
      "Nom,Groupe,Absences,Non justifiees,En attente",
      ...exportRows.map(
        (row) =>
          `"${row.nom}","${row.groupe}",${row.absences},${row.nonJustifiees},${row.enAttente}`
      ),
    ].join("\n");

    downloadCsv(csvContent, "export-gestionnaire.csv");
  }

  return (
    <div className="page-stack">
      <div className="page-header-row gestionnaire-page-header">
        <div>
          <span className="gestionnaire-page-eyebrow">Gestionnaire</span>
          <h2>Export Excel</h2>
          <p>Telechargez les exports disponibles sans modifier le flux actuel.</p>
        </div>

        <button
          className="primary-btn"
          onClick={handleExport}
          disabled={loading || !!error || exportRows.length === 0}
        >
          Exporter CSV
        </button>
      </div>

      <section className="content-card gestionnaire-module-card">
        <div className="gestionnaire-card-head">
          <div>
            <span className="gestionnaire-section-tag">Export</span>
            <h3 className="section-title">Preparation des donnees</h3>
            <p className="soft-text">
              Le fichier CSV reprend les stagiaires et leurs absences reelles.
            </p>
          </div>

          {!loading && !error && exportRows.length > 0 ? (
            <span className="status-badge success">Pret a exporter</span>
          ) : null}
        </div>

        {loading ? (
          <EmptyState
            icon="..."
            title="Chargement des donnees..."
            message="Les donnees d'export sont en cours de recuperation."
            compact
          />
        ) : error ? (
          <EmptyState icon="!" title="Erreur de chargement" message={error} />
        ) : exportRows.length === 0 ? (
          <div className="empty-state">
            <strong>Aucun export disponible</strong>
            <p>Aucune donnee exploitable n'est disponible pour le moment.</p>
          </div>
        ) : (
          <div className="gestionnaire-export-ready">
            <div className="empty-state">
              <strong>Export pret</strong>
              <p>
                Le telechargement genere maintenant un CSV rempli avec les stagiaires
                et leurs absences reelles.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
