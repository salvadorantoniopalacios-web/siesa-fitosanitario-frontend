import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout.jsx";
import Fincas from "./Fincas.jsx";
import Lotes from "./Lotes.jsx";
import Evaluaciones from "./Evaluaciones.jsx";
import Alertas from "./Alertas.jsx";
import MapaFincas from "./MapaFincas.jsx";
import Usuarios from "./Usuarios.jsx";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

function Dashboard({ usuario }) {
  const [vista, setVista] = useState("inicio");

  const [resumen, setResumen] = useState({
    fincas: 0,
    lotes: 0,
    evaluaciones: 0,
    alertas: 0,
  });

  const [alertas, setAlertas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);

  const obtenerResumen = async () => {
    try {
      const res = await axios.get(`${API_URL}/dashboard/summary`);
      setResumen(res.data);
    } catch (error) {
      console.error("Error cargando resumen:", error);
    }
  };

  const cargarDatosDashboard = async () => {
    try {
      const [resAlertas, resLotes, resEvaluaciones] = await Promise.all([
        axios.get(`${API_URL}/alerts`),
        axios.get(`${API_URL}/lots`),
        axios.get(`${API_URL}/evaluations`),
      ]);

      setAlertas(Array.isArray(resAlertas.data) ? resAlertas.data : []);
      setLotes(Array.isArray(resLotes.data) ? resLotes.data : []);
      setEvaluaciones(
        Array.isArray(resEvaluaciones.data) ? resEvaluaciones.data : []
      );
    } catch (error) {
      console.error("Error cargando datos dashboard:", error);
    }
  };

  useEffect(() => {
    obtenerResumen();
    cargarDatosDashboard();
  }, []);

  const alertasCriticas = alertas.filter(
    (a) => a.nivel_alerta === "Crítico"
  ).length;

  const tituloVista =
    vista === "inicio"
      ? "Dashboard"
      : vista === "fincas"
      ? "Fincas"
      : vista === "lotes"
      ? "Lotes"
      : vista === "evaluaciones"
      ? "Evaluaciones"
      : vista === "alertas"
      ? "Alertas"
      : vista === "mapa"
      ? "Mapa de fincas"
      : vista === "usuarios"
      ? "Usuarios"
      : "Dashboard";

  const alertasPorNivel = [
    {
      name: "Crítico",
      value: alertas.filter((a) => a.nivel_alerta === "Crítico").length,
      color: "#dc2626",
    },
    {
      name: "Alto",
      value: alertas.filter((a) => a.nivel_alerta === "Alto").length,
      color: "#ea580c",
    },
    {
      name: "Medio",
      value: alertas.filter((a) => a.nivel_alerta === "Medio").length,
      color: "#ca8a04",
    },
    {
      name: "Bajo",
      value: alertas.filter((a) => a.nivel_alerta === "Bajo").length,
      color: "#16a34a",
    },
  ];

  const lotesPorFinca = Object.values(
    lotes.reduce((acc, lote) => {
      const finca = lote.finca_nombre || "Sin finca";

      if (!acc[finca]) {
        acc[finca] = {
          finca,
          lotes: 0,
        };
      }

      acc[finca].lotes += 1;
      return acc;
    }, {})
  );

  const evaluacionesPorRiesgo = [
    {
      riesgo: "Crítico",
      total: evaluaciones.filter((e) => e.nivel_riesgo === "Crítico").length,
    },
    {
      riesgo: "Alto",
      total: evaluaciones.filter((e) => e.nivel_riesgo === "Alto").length,
    },
    {
      riesgo: "Medio",
      total: evaluaciones.filter((e) => e.nivel_riesgo === "Medio").length,
    },
    {
      riesgo: "Bajo",
      total: evaluaciones.filter((e) => e.nivel_riesgo === "Bajo").length,
    },
  ];

  return (
    <Layout
      setVista={setVista}
      alertasCriticas={alertasCriticas}
      usuario={usuario}
    >
      <h2 style={styles.pageTitle}>{tituloVista}</h2>

      {vista === "inicio" && (
        <>
          {usuario && (
            <div style={styles.userBox}>
              Usuario activo: <strong>{usuario.nombre || usuario.email}</strong>{" "}
              | Rol: <strong>{usuario.rol}</strong>
            </div>
          )}

          {alertasCriticas > 0 && (
            <div style={styles.alertBanner}>
              ⚠️ Tienes <strong>{alertasCriticas}</strong> alertas críticas que
              requieren atención inmediata.
            </div>
          )}

          <div style={styles.cards}>
            <div style={styles.card}>
              <span style={styles.icon}>🌱</span>
              <strong style={styles.number}>{resumen.fincas}</strong>
              <span style={styles.label}>Fincas</span>
            </div>

            <div style={styles.card}>
              <span style={styles.icon}>🧾</span>
              <strong style={styles.number}>{resumen.lotes}</strong>
              <span style={styles.label}>Lotes</span>
            </div>

            <div style={styles.card}>
              <span style={styles.icon}>📊</span>
              <strong style={styles.number}>{resumen.evaluaciones}</strong>
              <span style={styles.label}>Evaluaciones</span>
            </div>

            <div
              style={{
                ...styles.card,
                border:
                  alertasCriticas > 0
                    ? "1px solid #fecaca"
                    : "1px solid transparent",
              }}
            >
              <span style={styles.icon}>🔔</span>
              <strong
                style={{
                  ...styles.number,
                  color: alertasCriticas > 0 ? "#dc2626" : "#0f172a",
                }}
              >
                {resumen.alertas}
              </strong>
              <span style={styles.label}>Alertas</span>
            </div>
          </div>

          <div style={styles.grid}>
            <div style={styles.panel}>
              <h3 style={styles.panelTitle}>Alertas por nivel</h3>

              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={alertasPorNivel}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={95}
                    label
                  >
                    {alertasPorNivel.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.panel}>
              <h3 style={styles.panelTitle}>Lotes por finca</h3>

              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={lotesPorFinca}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="finca" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="lotes" fill="#15803d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Evaluaciones por nivel de riesgo</h3>

            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={evaluacionesPorRiesgo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="riesgo" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {vista === "fincas" && <Fincas usuario={usuario} />}
      {vista === "lotes" && <Lotes usuario={usuario} />}
      {vista === "evaluaciones" && <Evaluaciones usuario={usuario} />}
      {vista === "alertas" && <Alertas usuario={usuario} />}
      {vista === "mapa" && <MapaFincas usuario={usuario} />}
      {vista === "usuarios" && <Usuarios usuario={usuario} />}
    </Layout>
  );
}

const styles = {
  pageTitle: {
    marginBottom: "20px",
    fontSize: "26px",
    fontWeight: "800",
    color: "#0f172a",
  },
  userBox: {
    background: "#ecfdf5",
    color: "#065f46",
    padding: "12px 14px",
    borderRadius: "12px",
    marginBottom: "15px",
    border: "1px solid #a7f3d0",
    fontWeight: "600",
  },
  alertBanner: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "15px",
    borderRadius: "12px",
    marginBottom: "15px",
    fontWeight: "600",
    border: "1px solid #fecaca",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
    marginTop: "20px",
    marginBottom: "24px",
  },
  card: {
    background: "#fff",
    padding: "25px",
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  icon: {
    fontSize: "24px",
  },
  number: {
    fontSize: "32px",
    color: "#0f172a",
  },
  label: {
    color: "#64748b",
    fontWeight: "600",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "20px",
    marginBottom: "20px",
  },
  panel: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
    border: "1px solid #e2e8f0",
    marginBottom: "20px",
  },
  panelTitle: {
    marginTop: 0,
    marginBottom: "18px",
    color: "#0f172a",
    fontSize: "20px",
  },
};

export default Dashboard;