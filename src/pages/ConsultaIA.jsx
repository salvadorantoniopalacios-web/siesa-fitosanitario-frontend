import React, { useState } from "react";

function ConsultaIA({ usuario }) {
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);

  const analizarImagen = async (e) => {
    e.preventDefault();

    if (!foto) {
      alert("Seleccione una imagen para analizar.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setResultado({
        posible: "Análisis IA pendiente de conexión",
        confianza: "Modo demostración",
        observacion:
          "Esta pestaña está lista para conectar la IA. La foto no se guarda en base de datos ni en Cloudinary.",
      });

      setLoading(false);
    }, 1200);
  };

  const handleFotoChange = (e) => {
    const archivo = e.target.files[0];

    if (!archivo) {
      setFoto(null);
      setPreview(null);
      setResultado(null);
      return;
    }

    setFoto(archivo);
    setPreview(URL.createObjectURL(archivo));
    setResultado(null);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Consulta IA Fitosanitaria</h1>

      <p style={styles.subtitle}>
        Herramienta de consulta visual. La imagen no se guarda en el sistema.
      </p>

      <div style={styles.warningBox}>
        ⚠️ La IA será una referencia técnica, no un diagnóstico definitivo. El
        resultado debe ser validado por un técnico responsable.
      </div>

      <form onSubmit={analizarImagen} style={styles.panel}>
        <label style={styles.label}>Subir foto para consulta</label>

        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFotoChange}
          style={styles.input}
        />

        {preview && (
          <div style={styles.previewBox}>
            <img src={preview} alt="Vista previa" style={styles.preview} />
          </div>
        )}

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Analizando..." : "Analizar foto con IA"}
        </button>
      </form>

      {resultado && (
        <div style={styles.resultBox}>
          <h2 style={styles.resultTitle}>Resultado de consulta</h2>

          <p>
            <strong>Posible resultado:</strong> {resultado.posible}
          </p>

          <p>
            <strong>Confianza:</strong> {resultado.confianza}
          </p>

          <p>
            <strong>Observación:</strong> {resultado.observacion}
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "28px",
    background: "#f8fafc",
    minHeight: "100vh",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "6px",
  },
  subtitle: {
    color: "#64748b",
    marginBottom: "18px",
  },
  warningBox: {
    background: "#fef9c3",
    color: "#854d0e",
    padding: "14px 16px",
    borderRadius: "14px",
    marginBottom: "20px",
    fontWeight: "700",
    border: "1px solid #fde68a",
  },
  panel: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    maxWidth: "620px",
  },
  label: {
    fontWeight: "800",
    color: "#334155",
  },
  input: {
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
  },
  previewBox: {
    marginTop: "8px",
  },
  preview: {
    width: "100%",
    maxHeight: "360px",
    objectFit: "contain",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
  },
  button: {
    padding: "13px 16px",
    borderRadius: "12px",
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },
  resultBox: {
    marginTop: "22px",
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
    maxWidth: "620px",
  },
  resultTitle: {
    marginTop: 0,
    color: "#0f172a",
  },
};

export default ConsultaIA;