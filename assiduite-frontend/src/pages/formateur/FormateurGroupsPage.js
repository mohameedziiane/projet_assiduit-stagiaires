export default function FormateurGroupsPage() {
  return (
    <div className="page-stack">
      <div className="page-header-row formateur-page-header">
        <div>
          <span className="formateur-page-eyebrow">Formateur</span>
          <h2>Mes groupes</h2>
          <p>Consultez les groupes qui vous sont affectes.</p>
        </div>
      </div>

      <section className="content-card formateur-module-card">
        <div className="formateur-card-head">
          <div>
            <span className="formateur-section-tag">Groupes</span>
            <h3 className="section-title">Groupes affectes</h3>
            <p className="soft-text">
              Les groupes du formateur seront affiches ici lorsqu'ils seront disponibles.
            </p>
          </div>
        </div>

        <div className="empty-state">
          <strong>Aucun groupe disponible</strong>
          <p>Les groupes du formateur seront affiches ici.</p>
        </div>
      </section>
    </div>
  );
}
