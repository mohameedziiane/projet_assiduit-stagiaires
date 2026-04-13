export default function FormateurCommentsPage() {
  return (
    <div className="page-stack">
      <div className="page-header-row formateur-page-header">
        <div>
          <span className="formateur-page-eyebrow">Formateur</span>
          <h2>Commentaires</h2>
          <p>Ajoutez ou consultez vos remarques.</p>
        </div>
      </div>

      <section className="content-card formateur-module-card">
        <div className="formateur-card-head">
          <div>
            <span className="formateur-section-tag">Remarques</span>
            <h3 className="section-title">Commentaires du formateur</h3>
            <p className="soft-text">
              Cette zone affichera les remarques quand elles seront disponibles.
            </p>
          </div>
        </div>

        <div className="empty-state">
          <strong>Aucun commentaire pour le moment</strong>
          <p>Les commentaires du formateur apparaitront ici.</p>
        </div>
      </section>
    </div>
  );
}
