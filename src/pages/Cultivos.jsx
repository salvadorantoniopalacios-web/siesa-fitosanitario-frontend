import React, { useEffect, useState } from "react";
import axios from "../api/axiosConfig.js";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

function Cultivos({ usuario }) {
  const [cultivos, setCultivos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  const [form, setForm] = useState({
    nombre: "",
    estado: "Activo",
  });

  const esAdmin = usuario?.rol === "Admin";
  const esTecnico = usuario?.rol === "Técnico";
  const puedeCrearEditar = esAdmin || esTecnico;
  const puedeEliminar = esAdmin;

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 4500);
  };

  const limpiarMensaje = () => {
    setMensaje({ texto: "", tipo: "" });
  };

  const cargarCultivos = async () => {
    try {
      const res = await axios.get(`${API_URL}/catalog/crops`);
      setCultivos(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error cargando cultivos:", error.response?.data || error.message);
      mostrarMensaje("No se pudieron cargar los cultivos.", "error");
    }
  };

  useEffect(() => {
    cargarCultivos();
  }, []);

  const limpiarFormulario = () => {
    setForm({
      nombre: "",
      estado: "Activo",
    });
    setEditandoId(null);
    limpiarMensaje();
  };

  const guardarCultivo = async (e) => {
    e.preventDefault();
    limpiarMensaje();

    if (!puedeCrearEditar) {
      mostrarMensaje("No tiene permisos para crear o editar cultivos.", "error");
      return;
    }

    if (!form.nombre.trim()) {
      mostrarMensaje("El nombre del cultivo es obligatorio.", "error");
      return;
    }

    try {
      setLoading(true);

      if (editandoId) {
        await axios.put(`${API_URL}/catalog/crops/${editandoId}`, form);
        mostrarMensaje("Cultivo actualizado correctamente.", "ok");
      } else {
        await axios.post(`${API_URL}/catalog/crops`, form);
        mostrarMensaje("Cultivo creado correctamente.", "ok");
      }

      limpiarFormulario();
      await cargarCultivos();
    } catch (error) {
      console.error("Error guardando cultivo:", error.response?.data || error.message);
      mostrarMensaje(
        error.response?.data?.mensaje || "No se pudo guardar el cultivo.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicion = (cultivo) => {
    if (!puedeCrearEditar) {
      mostrarMensaje("No tiene permisos para editar cultivos.", "error");
      return;
    }

    setEditandoId(cultivo.id);
    setForm({
      nombre: cultivo.nombre || "",
      estado: cultivo.estado || "Activo",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminarCultivo = async (id) => {
    if (!puedeEliminar) {
      mostrarMensaje("Solo un usuario Admin puede eliminar cultivos.", "error");
      return;
    }

    const confirmar = window.confirm(
      "¿Está seguro que desea eliminar este cultivo? También eliminará sus plagas asociadas."
    );

    if (!confirmar) return;

    try {
      setLoading(true);
      await axios.delete(`${API_URL}/catalog/crops/${id}`);
      await cargarCultivos();
      mostrarMensaje("Cultivo eliminado correctamente.", "ok");
    } catch (error) {
      console.error("Error eliminando cultivo:", error.response?.data || error.message);
      mostrarMensaje(
        error.response?.data?.mensaje || "No se pudo eliminar el cultivo.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const cultivosFiltrados = cultivos.filter((cultivo) => {
    const texto = `${cultivo.nombre || ""} ${cultivo.estado || ""}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Cultivos</h1>
      <p style={styles.subtitle}>
        Catálogo maestro de cultivos para estandarizar lotes, plagas y evaluaciones.
      </p>

      {mensaje.texto && (
        <div
          style={{
            ...styles.messageBox,
            ...(mensaje.tipo === "ok" ? styles.messageOk : styles.messageError),
          }}
        >
          {mensaje.texto}
        </div>
      )}

      <div style={styles.cards}>
        <div style={styles.card}>
          <p style={styles.cardLabel}>Total cultivos</p>
          <h2 style={styles.cardNumber}>{cultivos.length}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Activos</p>
          <h2 style={{ ...styles.cardNumber, color: "#15803d" }}>
            {cultivos.filter((c) => c.estado === "Activo").length}
          </h2>
        </div>
      </div>

      {puedeCrearEditar && (
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>
            {editandoId ? "Editar cultivo" : "Nuevo cultivo"}
          </h2>

          <form style={styles.form} onSubmit={guardarCultivo}>
            <input
              style={styles.input}
              placeholder="Nombre del cultivo"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />

            <select
              style={styles.input}
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>

            <button type="submit" style={styles.button} disabled={loading}>
              {loading
                ? "Guardando..."
                : editandoId
                ? "Guardar cambios"
                : "Crear cultivo"}
            </button>

            <button
              type="button"
              style={styles.cancelButton}
              onClick={limpiarFormulario}
              disabled={loading}
            >
              {editandoId ? "Cancelar" : "Limpiar"}
            </button>
          </form>
        </div>
      )}

      <div style={styles.panel}>
        <div style={styles.tableHeader}>
          <h2 style={styles.panelTitle}>Listado de cultivos</h2>

          <input
            style={styles.search}
            placeholder="Buscar cultivo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Cultivo</th>
                <th style={styles.th}>Estado</th>
                {(puedeCrearEditar || puedeEliminar) && (
                  <th style={styles.th}>Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {cultivosFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={puedeCrearEditar || puedeEliminar ? "3" : "2"}
                    style={styles.empty}
                  >
                    No hay cultivos registrados.
                  </td>
                </tr>
              ) : (
                cultivosFiltrados.map((cultivo) => (
                  <tr key={cultivo.id}>
                    <td style={styles.td}>{cultivo.nombre}</td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(cultivo.estado === "Activo"
                            ? styles.badgeOk
                            : styles.badgeError),
                        }}
                      >
                        {cultivo.estado}
                      </span>
                    </td>

                    {(puedeCrearEditar || puedeEliminar) && (
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          {puedeCrearEditar && (
                            <button
                              type="button"
                              style={styles.editButton}
                              onClick={() => iniciarEdicion(cultivo)}
                              disabled={loading}
                            >
                              Editar
                            </button>
                          )}

                          {puedeEliminar && (
                            <button
                              type="button"
                              style={styles.deleteButton}
                              onClick={() => eliminarCultivo(cultivo.id)}
                              disabled={loading}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
  messageBox: {
    padding: "14px 16px",
    borderRadius: "14px",
    marginBottom: "20px",
    fontWeight: "700",
    border: "1px solid transparent",
  },
  messageOk: {
    background: "#dcfce7",
    color: "#166534",
    borderColor: "#bbf7d0",
  },
  messageError: {
    background: "#fee2e2",
    color: "#991b1b",
    borderColor: "#fecaca",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
    marginBottom: "24px",
    boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
    border: "1px solid #e2e8f0",
  },
  panelTitle: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "18px",
    color: "#0f172a",
  },
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
  },
  button: {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "none",
    background: "#15803d",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },
  cancelButton: {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "none",
    background: "#64748b",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  search: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    minWidth: "280px",
    fontSize: "14px",
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
    whiteSpace: "nowrap",
  },
  badge: {
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "13px",
  },
  badgeOk: {
    background: "#dcfce7",
    color: "#166534",
  },
  badgeError: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  editButton: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px",
  },
  deleteButton: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#dc2626",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px",
  },
  empty: {
    textAlign: "center",
    padding: "28px",
    color: "#64748b",
  },
};

export default Cultivos;