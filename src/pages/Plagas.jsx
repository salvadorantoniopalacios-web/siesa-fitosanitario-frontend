import React, { useEffect, useState } from "react";
import axios from "../api/axiosConfig.js";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

function Plagas({ usuario }) {
  const [plagas, setPlagas] = useState([]);
  const [cultivos, setCultivos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  const [form, setForm] = useState({
    crop_id: "",
    nombre: "",
    tipo: "Plaga",
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

  const cargarPlagas = async () => {
    try {
      const res = await axios.get(`${API_URL}/catalog/pests`);
      setPlagas(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error cargando plagas:", error.response?.data || error.message);
      mostrarMensaje("No se pudieron cargar las plagas.", "error");
    }
  };

  useEffect(() => {
    cargarCultivos();
    cargarPlagas();
  }, []);

  const limpiarFormulario = () => {
    setForm({
      crop_id: "",
      nombre: "",
      tipo: "Plaga",
      estado: "Activo",
    });
    setEditandoId(null);
    limpiarMensaje();
  };

  const guardarPlaga = async (e) => {
    e.preventDefault();
    limpiarMensaje();

    if (!puedeCrearEditar) {
      mostrarMensaje("No tiene permisos para crear o editar plagas.", "error");
      return;
    }

    if (!form.crop_id || !form.nombre.trim()) {
      mostrarMensaje("Seleccione cultivo y escriba el nombre de la plaga.", "error");
      return;
    }

    try {
      setLoading(true);

      if (editandoId) {
        await axios.put(`${API_URL}/catalog/pests/${editandoId}`, form);
        mostrarMensaje("Plaga actualizada correctamente.", "ok");
      } else {
        await axios.post(`${API_URL}/catalog/pests`, form);
        mostrarMensaje("Plaga creada correctamente.", "ok");
      }

      limpiarFormulario();
      await cargarPlagas();
    } catch (error) {
      console.error("Error guardando plaga:", error.response?.data || error.message);
      mostrarMensaje(
        error.response?.data?.mensaje || "No se pudo guardar la plaga.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicion = (plaga) => {
    if (!puedeCrearEditar) {
      mostrarMensaje("No tiene permisos para editar plagas.", "error");
      return;
    }

    setEditandoId(plaga.id);
    setForm({
      crop_id: plaga.crop_id || "",
      nombre: plaga.nombre || "",
      tipo: plaga.tipo || "Plaga",
      estado: plaga.estado || "Activo",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminarPlaga = async (id) => {
    if (!puedeEliminar) {
      mostrarMensaje("Solo un usuario Admin puede eliminar plagas.", "error");
      return;
    }

    const confirmar = window.confirm("¿Está seguro que desea eliminar esta plaga?");
    if (!confirmar) return;

    try {
      setLoading(true);
      await axios.delete(`${API_URL}/catalog/pests/${id}`);
      await cargarPlagas();
      mostrarMensaje("Plaga eliminada correctamente.", "ok");
    } catch (error) {
      console.error("Error eliminando plaga:", error.response?.data || error.message);
      mostrarMensaje(
        error.response?.data?.mensaje || "No se pudo eliminar la plaga.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const plagasFiltradas = plagas.filter((plaga) => {
    const texto = `
      ${plaga.nombre || ""}
      ${plaga.tipo || ""}
      ${plaga.estado || ""}
      ${plaga.cultivo || ""}
    `.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Plagas por cultivo</h1>
      <p style={styles.subtitle}>
        Catálogo controlado de plagas y enfermedades asociadas a cada cultivo.
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
          <p style={styles.cardLabel}>Total plagas</p>
          <h2 style={styles.cardNumber}>{plagas.length}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Cultivos disponibles</p>
          <h2 style={{ ...styles.cardNumber, color: "#15803d" }}>{cultivos.length}</h2>
        </div>
      </div>

      {puedeCrearEditar && (
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>
            {editandoId ? "Editar plaga" : "Nueva plaga"}
          </h2>

          <form style={styles.form} onSubmit={guardarPlaga}>
            <select
              style={styles.input}
              value={form.crop_id}
              onChange={(e) => setForm({ ...form, crop_id: e.target.value })}
            >
              <option value="">Seleccione cultivo</option>
              {cultivos
                .filter((c) => c.estado === "Activo")
                .map((cultivo) => (
                  <option key={cultivo.id} value={cultivo.id}>
                    {cultivo.nombre}
                  </option>
                ))}
            </select>

            <input
              style={styles.input}
              placeholder="Nombre de plaga o enfermedad"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />

            <select
              style={styles.input}
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            >
              <option value="Plaga">Plaga</option>
              <option value="Enfermedad">Enfermedad</option>
              <option value="Deficiencia">Deficiencia</option>
              <option value="Otro">Otro</option>
            </select>

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
                : "Crear plaga"}
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
          <h2 style={styles.panelTitle}>Listado de plagas</h2>

          <input
            style={styles.search}
            placeholder="Buscar por cultivo, plaga, tipo o estado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Cultivo</th>
                <th style={styles.th}>Plaga / Enfermedad</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Estado</th>
                {(puedeCrearEditar || puedeEliminar) && (
                  <th style={styles.th}>Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {plagasFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={puedeCrearEditar || puedeEliminar ? "5" : "4"}
                    style={styles.empty}
                  >
                    No hay plagas registradas.
                  </td>
                </tr>
              ) : (
                plagasFiltradas.map((plaga) => (
                  <tr key={plaga.id}>
                    <td style={styles.td}>{plaga.cultivo || "-"}</td>
                    <td style={styles.td}>{plaga.nombre || "-"}</td>
                    <td style={styles.td}>{plaga.tipo || "-"}</td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(plaga.estado === "Activo"
                            ? styles.badgeOk
                            : styles.badgeError),
                        }}
                      >
                        {plaga.estado}
                      </span>
                    </td>

                    {(puedeCrearEditar || puedeEliminar) && (
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          {puedeCrearEditar && (
                            <button
                              type="button"
                              style={styles.editButton}
                              onClick={() => iniciarEdicion(plaga)}
                              disabled={loading}
                            >
                              Editar
                            </button>
                          )}

                          {puedeEliminar && (
                            <button
                              type="button"
                              style={styles.deleteButton}
                              onClick={() => eliminarPlaga(plaga.id)}
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
    minWidth: "320px",
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

export default Plagas;