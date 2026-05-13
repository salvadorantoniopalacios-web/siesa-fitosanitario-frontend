import React, { useState } from "react";
import axios from "../api/axiosConfig.js";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

function ConsultaIA() {
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFotoChange = (e) => {
    const archivo = e.target.files[0];

    if (!archivo) {
      setFoto(null);
      setPreview(null);
      return;
    }

    setFoto(archivo);
    setPreview(URL.createObjectURL(archivo));
    setResultado("");
  };

  const analizarImagen = async (e) => {
    e.preventDefault();

    if (!foto) {
      alert("Seleccione una imagen.");
      return;
    }

    try {
      setLoading(true);
      setResultado("");

      const formData = new FormData();
      formData.append("foto", foto);

      const res = await axios.post(
        `${API_URL}/ai/analizar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResultado(res.data.resultado || "Sin resultado.");
    } catch (error) {
      console.error(error);

      setResultado(
        error.response?.data?.mensaje ||
          "Error analizando imagen."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Consulta IA Fitosanitaria</h1>

      <p style={styles.subtitle}>
        Análisis visual asistido por inteligencia artificial.
      </p>

      <div style={styles.warningBox}>
        ⚠️ Resultado referencial. Debe ser validado por un técnico responsable.
      </div>

      <form onSubmit={analizarImagen} style={styles.panel}>
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFotoChange}
          style={styles.input}
        />

        {preview && (
          <img
            src={preview}
            alt="preview"
            style={styles.preview}
          />
        )}

        <button type="submit" style={styles.button}>
          {loading ? "Analizando..." : "Analizar foto con IA"}
        </button>
      </form>

      {resultado && (
        <div style={styles.resultBox}>
          <h2 style={styles.resultTitle}>Resultado IA</h2>

          <pre style={styles.resultText}>
            {resultado}
          </pre>
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
    maxWidth: "650px",
  },

  input: {
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
  },

  preview: {
    width: "100%",
    maxHeight: "380px",
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
    marginTop: "24px",
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
    maxWidth: "900px",
  },

  resultTitle: {
    marginTop: 0,
    color: "#0f172a",
  },

  resultText: {
    whiteSpace: "pre-wrap",
    color: "#334155",
    fontSize: "15px",
    lineHeight: "1.7",
    fontFamily: "inherit",
  },
};

export default ConsultaIA;