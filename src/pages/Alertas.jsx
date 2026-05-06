import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroNivel, setFiltroNivel] = useState("Todos");
  const [cargando, setCargando] = useState(true);

  const cargarAlertas = async () => {
    try {
      setCargando(true);
      const response = await axios.get(`${API_URL}/alerts`);
      setAlertas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error cargando alertas:", error);
      setAlertas([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAlertas();
  }, []);

  const obtenerColor = (nivel) => {
    if (nivel === "Crítico") {
      return { background: "#fee2e2", color: "#991b1b", border: "#fecaca" };
    }

    if (nivel === "Alto") {
      return { background: "#ffedd5", color: "#9a3412", border: "#fed7aa" };
    }

    if (nivel === "Medio") {
      return { background: "#fef9c3", color: "#854d0e", border: "#fde68a" };
    }

    return { background: "#dcfce7", color: "#166534", border: "#bbf7d0" };
  };

  const obtenerColorPrioridad = (prioridad) => {
    if (prioridad === "Urgente") {
      return { background: "#fee2e2", color: "#991b1b", border: "#fecaca" };
    }

    if (prioridad === "Alta") {
      return { background: "#ffedd5", color: "#9a3412", border: "#fed7aa" };
    }

    if (prioridad === "Media") {
      return { background: "#fef9c3", color: "#854d0e", border: "#fde68a" };
    }

    return { background: "#dcfce7", color: "#166534", border: "#bbf7d0" };
  };

  const alertasFiltradas = alertas.filter((alerta) => {
    const texto = `
      ${alerta.lote_codigo || ""}
      ${alerta.finca_nombre || ""}
      ${alerta.cultivo || ""}
      ${alerta.nivel_alerta || ""}
      ${alerta.prioridad || ""}
      ${alerta.estado_operativo || ""}
      ${alerta.mensaje_alerta || ""}
      ${alerta.accion_recomendada || ""}
      ${alerta.plaga_enfermedad || ""}
      ${alerta.responsable || ""}
    `.toLowerCase();

    const coincideBusqueda = texto.includes(busqueda.toLowerCase());
    const coincideNivel =
      filtroNivel === "Todos" || alerta.nivel_alerta === filtroNivel;

    return coincideBusqueda && coincideNivel;
  });

  const totalAlertas = alertas.length;
  const criticas = alertas.filter((a) => a.nivel_alerta === "Crítico").length;
  const altas = alertas.filter((a) => a.nivel_alerta === "Alto").length;
  const medias = alertas.filter((a) => a.nivel_alerta === "Medio").length;
  const bajas = alertas.filter((a) => a.nivel_alerta === "Bajo").length;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Alertas inteligentes</h1>
      <p style={styles.subtitle}>
        Semáforo fitosanitario con prioridad, estado operativo y acción recomendada.
      </p>

      <div style={styles.cards}>
        <div style={styles.card}>
          <p style={styles.cardLabel}>Total alertas</p>
          <h2 style={styles.cardNumber}>{totalAlertas}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Críticas</p>
          <h2 style={{ ...styles.cardNumber, color: "#991b1b" }}>{criticas}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Altas</p>
          <h2 style={{ ...styles.cardNumber, color: "#9a3412" }}>{altas}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Medias</p>
          <h2 style={{ ...styles.cardNumber, color: "#854d0e" }}>{medias}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Controladas</p>
          <h2 style={{ ...styles.cardNumber, color: "#166534" }}>{bajas}</h2>
        </div>
      </div>

      <div style={styles.panel}>
        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.panelTitle}>Listado de alertas PRO</h2>
            <p style={styles.panelSubtitle}>
              Los lotes sin evaluación se clasifican automáticamente como críticos.
            </p>
          </div>

          <div style={styles.filters}>
            <select
              style={styles.input}
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
            >
              <option value="Todos">Todos los niveles</option>
              <option value="Crítico">Crítico</option>
              <option value="Alto">Alto</option>
              <option value="Medio">Medio</option>
              <option value="Bajo">Bajo</option>
            </select>

            <input
              style={styles.search}
              type="text"
              placeholder="Buscar lote, finca, cultivo, prioridad o acción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {cargando ? (
          <div style={styles.empty}>Cargando alertas...</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nivel</th>
                  <th style={styles.th}>Prioridad</th>
                  <th style={styles.th}>Lote</th>
                  <th style={styles.th}>Finca</th>
                  <th style={styles.th}>Cultivo</th>
                  <th style={styles.th}>Estado operativo</th>
                  <th style={styles.th}>Mensaje</th>
                  <th style={styles.th}>Días</th>
                  <th style={styles.th}>Última evaluación</th>
                  <th style={styles.th}>Plaga / Enfermedad</th>
                  <th style={styles.th}>Responsable</th>
                  <th style={styles.th}>Acción recomendada</th>
                </tr>
              </thead>

              <tbody>
                {alertasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="12" style={styles.empty}>
                      No hay alertas para mostrar.
                    </td>
                  </tr>
                ) : (
                  alertasFiltradas.map((alerta) => {
                    const color = obtenerColor(alerta.nivel_alerta);
                    const colorPrioridad = obtenerColorPrioridad(alerta.prioridad);

                    return (
                      <tr key={alerta.lot_id}>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.badge,
                              backgroundColor: color.background,
                              color: color.color,
                              border: `1px solid ${color.border}`,
                            }}
                          >
                            {alerta.nivel_alerta}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.badge,
                              backgroundColor: colorPrioridad.background,
                              color: colorPrioridad.color,
                              border: `1px solid ${colorPrioridad.border}`,
                            }}
                          >
                            {alerta.prioridad || "Normal"}
                          </span>
                        </td>

                        <td style={styles.td}>{alerta.lote_codigo || "-"}</td>
                        <td style={styles.td}>{alerta.finca_nombre || "Sin finca"}</td>
                        <td style={styles.td}>{alerta.cultivo || "-"}</td>
                        <td style={styles.td}>{alerta.estado_operativo || "-"}</td>
                        <td style={styles.td}>{alerta.mensaje_alerta || "-"}</td>
                        <td style={styles.td}>
                          {alerta.dias_desde_ultima_evaluacion !== null &&
                          alerta.dias_desde_ultima_evaluacion !== undefined
                            ? `${alerta.dias_desde_ultima_evaluacion} días`
                            : "Sin evaluación"}
                        </td>
                        <td style={styles.td}>
                          {alerta.fecha_evaluacion
                            ? new Date(alerta.fecha_evaluacion).toLocaleDateString()
                            : "Sin evaluación"}
                        </td>
                        <td style={styles.td}>{alerta.plaga_enfermedad || "-"}</td>
                        <td style={styles.td}>{alerta.responsable || "-"}</td>
                        <td style={styles.actionTd}>
                          {alerta.accion_recomendada || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
    marginBottom: "4px",
  },
  subtitle: {
    color: "#64748b",
    marginBottom: "24px",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "18px",
    marginBottom: "24px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "22px",
    boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
    border: "1px solid #e2e8f0",
  },
  cardLabel: {
    color: "#64748b",
    margin: 0,
  },
  cardNumber: {
    fontSize: "32px",
    margin: "8px 0 0",
    color: "#0f172a",
  },
  panel: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
    border: "1px solid #e2e8f0",
  },
  panelTitle: {
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
    color: "#0f172a",
  },
  panelSubtitle: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "14px",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  filters: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
  },
  search: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    minWidth: "280px",
    fontSize: "14px",
    outline: "none",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "12px",
  },
  th: {
    padding: "14px",
    textAlign: "left",
    background: "#f1f5f9",
    color: "#334155",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
    fontSize: "14px",
    verticalAlign: "top",
    whiteSpace: "nowrap",
  },
  actionTd: {
    padding: "14px",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
    fontSize: "14px",
    verticalAlign: "top",
    minWidth: "280px",
  },
  badge: {
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  empty: {
    textAlign: "center",
    padding: "28px",
    color: "#64748b",
  },
};

export default Alertas;