import React, { useState } from "react";

function JustificationUploadForm({ onSubmit }) {
  const [comment, setComment] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setFileName(file ? file.name : "");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      fileName,
      comment,
      status: "En attente",
      sentAt: new Date().toLocaleString("fr-FR"),
    });

    setComment("");
    setFileName("");
    event.target.reset();
  };

  return (
    <form className="upload-card" onSubmit={handleSubmit}>
      <div className="upload-section">
        <label className="upload-label">Document (PDF, JPG, PNG)</label>
        <label className="dropzone">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            hidden
            onChange={handleFileChange}
          />
          <div className="dropzone-icon">⇪</div>
          <strong>Cliquez ou glissez votre fichier ici</strong>
          <span>Taille maximale : 5 Mo</span>
          {fileName && <small>{fileName}</small>}
        </label>
      </div>

      <div className="upload-section">
        <label className="upload-label">Commentaire (Optionnel)</label>
        <textarea
          rows="5"
          placeholder="Expliquez brièvement le motif de votre absence..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <button className="primary-btn submit-justif-btn" type="submit">
        Envoyer le justificatif
      </button>
    </form>
  );
}

export default JustificationUploadForm;