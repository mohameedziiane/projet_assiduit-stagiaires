import React from "react";

function getStatusClass(status) {
  if (status === "Justifiee") return "status-badge success";
  if (status === "Non justifiee") return "status-badge danger";
  return "status-badge warning";
}

function AbsenceTable({ rows, onExplore }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Module</th>
            <th>Formateur</th>
            <th>Duree</th>
            <th>Statut</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <tr key={row.id}>
                <td>{row.date}</td>
                <td>{row.module}</td>
                <td>{row.trainer}</td>
                <td>{row.duration}</td>
                <td>
                  <span className={getStatusClass(row.status)}>{row.status}</span>
                </td>
                <td>
                  <button
                    className="table-action-btn"
                    type="button"
                    onClick={() => onExplore?.(row.id)}
                  >
                    Explorer
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="empty-cell">
                Aucune donnee trouvee
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AbsenceTable;
