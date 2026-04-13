const billets = [];

export default function StudentBilletsPage() {
  return (
    <div className="page-stack">
      <div className="page-header-row stagiaire-page-header">
        <div>
          <span className="stagiaire-page-eyebrow">Stagiaire</span>
          <h2>Mes billets</h2>
          <p>Retrouvez les billets qui vous ont ete attribues.</p>
        </div>
      </div>

      <section className="content-card stagiaire-module-card">
        <div className="stagiaire-card-head">
          <div>
            <span className="stagiaire-section-tag">Billets</span>
            <h3 className="section-title">Liste des billets</h3>
            <p className="soft-text">
              Alignement visuel uniquement, sans toucher au contrat backend actuel.
            </p>
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Date</th>
                <th>Heure</th>
                <th>Code / QR</th>
                <th>Statut</th>
              </tr>
            </thead>

            <tbody>
              {billets.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">
                      <strong>Aucun billet pour le moment</strong>
                      <p>Les billets apparaitront ici apres liaison avec le backend.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                billets.map((billet, index) => (
                  <tr key={index}>
                    <td>{billet.type}</td>
                    <td>{billet.date}</td>
                    <td>{billet.heure}</td>
                    <td>{billet.code}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          billet.status === "Actif" ? "success" : "warning"
                        }`}
                      >
                        {billet.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
