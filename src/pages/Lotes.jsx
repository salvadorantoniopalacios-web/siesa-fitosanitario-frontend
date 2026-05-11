import React, { useEffect, useState } from "react";
import axios from "../api/axiosConfig.js";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

function Lotes({ usuario }) {
  const [lotes, setLotes] = useState([]);

  const [fincas, setFincas] = useState([]);

  const [cultivos, setCultivos] = useState([]);

  const [evaluaciones, setEvaluaciones] = useState([]);

  const [busqueda, setBusqueda] = useState("");

  const [editandoId, setEditandoId] = useState(null);

  const [loading, setLoading] = useState(false);

  const [mensaje, setMensaje] = useState({
    texto: "",
    tipo: "",
  });

  const [loteHistorial, setLoteHistorial] =
    useState(null);

  const esAdmin = usuario?.rol === "Admin";

  const esTecnico =
    usuario?.rol === "Técnico";

  const esConsulta =
    usuario?.rol === "Consulta";

  const puedeCrearEditar =
    esAdmin || esTecnico;

  const puedeEliminar = esAdmin;

  const [form, setForm] = useState({
    codigo: "",
    farm_id: "",
    cultivo: "",
    variedad: "",
    area_hectareas: "",
    fecha_siembra: "",
    estado: "Activo",

    latitud: "",
    longitud: "",
  });

  const mostrarMensaje = (
    texto,
    tipo
  ) => {
    setMensaje({
      texto,
      tipo,
    });

    setTimeout(() => {
      setMensaje({
        texto: "",
        tipo: "",
      });
    }, 4500);
  };

  const limpiarMensaje = () => {
    setMensaje({
      texto: "",
      tipo: "",
    });
  };

  const cargarFincas = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/farms`
      );

      setFincas(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error(
        "Error cargando fincas:",
        error
      );

      setFincas([]);

      mostrarMensaje(
        "No se pudieron cargar las fincas.",
        "error"
      );
    }
  };
  const cargarCultivos = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/catalog/crops`
    );

    setCultivos(
      Array.isArray(response.data)
        ? response.data.filter((cultivo) => cultivo.estado === "Activo")
        : []
    );
  } catch (error) {
    console.error(
      "Error cargando cultivos:",
      error.response?.data || error.message
    );

    setCultivos([]);

    mostrarMensaje(
      "No se pudieron cargar los cultivos.",
      "error"
    );
  }
};
  const cargarLotes = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/lots`
      );

      setLotes(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error(
        "Error cargando lotes:",
        error
      );

      setLotes([]);

      mostrarMensaje(
        "No se pudieron cargar los lotes.",
        "error"
      );
    }
  };

  const cargarEvaluaciones =
    async () => {
      try {
        const response =
          await axios.get(
            `${API_URL}/evaluations`
          );

        setEvaluaciones(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (error) {
        console.error(
          "Error cargando evaluaciones:",
          error
        );

        setEvaluaciones([]);
      }
    };

  useEffect(() => {
  cargarFincas();

  cargarCultivos();

  cargarLotes();

  cargarEvaluaciones();
  }, []);

  const obtenerUbicacionActual = () => {
    if (!navigator.geolocation) {
      mostrarMensaje(
        "El navegador no soporta GPS.",
        "error"
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,

          latitud:
            position.coords.latitude.toFixed(
              8
            ),

          longitud:
            position.coords.longitude.toFixed(
              8
            ),
        }));

        mostrarMensaje(
          "Ubicación GPS capturada correctamente.",
          "ok"
        );
      },

      () => {
        mostrarMensaje(
          "No se pudo obtener ubicación GPS.",
          "error"
        );
      }
    );
  };

  const limpiarFormulario = () => {
    setForm({
      codigo: "",
      farm_id: "",
      cultivo: "",
      variedad: "",
      area_hectareas: "",
      fecha_siembra: "",
      estado: "Activo",

      latitud: "",
      longitud: "",
    });

    setEditandoId(null);

    limpiarMensaje();
  };

  const validarFormulario = () => {
    limpiarMensaje();

    if (!puedeCrearEditar) {
      mostrarMensaje(
        "No tiene permisos para crear o editar lotes.",
        "error"
      );

      return false;
    }

    if (
      !form.codigo ||
      !form.farm_id ||
      !form.cultivo
    ) {
      mostrarMensaje(
        "Código, finca y cultivo son obligatorios.",
        "error"
      );

      return false;
    }

    if (
      form.area_hectareas !== "" &&
      form.area_hectareas !== null &&
      form.area_hectareas !==
        undefined &&
      Number(form.area_hectareas) < 0
    ) {
      mostrarMensaje(
        "El área no puede ser negativa.",
        "error"
      );

      return false;
    }

    return true;
  };

  const prepararDataLote = () => ({
    codigo: form.codigo,

    farm_id: Number(form.farm_id),

    cultivo: form.cultivo,

    variedad: form.variedad || null,

    area_hectareas:
      form.area_hectareas &&
      !isNaN(form.area_hectareas)
        ? Number(form.area_hectareas)
        : null,

    fecha_siembra:
      form.fecha_siembra || null,

    estado: form.estado,

    latitud:
      form.latitud !== ""
        ? Number(form.latitud)
        : null,

    longitud:
      form.longitud !== ""
        ? Number(form.longitud)
        : null,
  });

  const guardarLote = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setLoading(true);

      if (editandoId) {
        await axios.put(
          `${API_URL}/lots/${editandoId}`,
          prepararDataLote()
        );

        mostrarMensaje(
          "Lote actualizado correctamente.",
          "ok"
        );
      } else {
        await axios.post(
          `${API_URL}/lots`,
          prepararDataLote()
        );

        mostrarMensaje(
          "Lote guardado correctamente.",
          "ok"
        );
      }

      limpiarFormulario();

      cargarLotes();
    } catch (error) {
      console.error(
        "Error guardando lote:",
        error.response?.data ||
          error.message
      );

      mostrarMensaje(
        error.response?.data?.mensaje ||
          "No se pudo guardar el lote.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };
    const iniciarEdicion = (lote) => {
    if (!puedeCrearEditar) {
      mostrarMensaje(
        "No tiene permisos para editar lotes.",
        "error"
      );

      return;
    }

    limpiarMensaje();

    setEditandoId(lote.id);

    setForm({
      codigo: lote.codigo || "",

      farm_id: lote.farm_id || "",

      cultivo: lote.cultivo || "",

      variedad: lote.variedad || "",

      area_hectareas:
        lote.area_hectareas || "",

      fecha_siembra:
        lote.fecha_siembra
          ? lote.fecha_siembra.substring(
              0,
              10
            )
          : "",

      estado:
        lote.estado || "Activo",

      latitud:
        lote.latitud || "",

      longitud:
        lote.longitud || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const eliminarLote = async (
    id
  ) => {
    if (!puedeEliminar) {
      mostrarMensaje(
        "Solo un usuario Admin puede eliminar lotes.",
        "error"
      );

      return;
    }

    const confirmar =
      window.confirm(
        "¿Está seguro que desea eliminar este lote?"
      );

    if (!confirmar) return;

    try {
      setLoading(true);

      await axios.delete(
        `${API_URL}/lots/${id}`
      );

      cargarLotes();

      mostrarMensaje(
        "Lote eliminado correctamente.",
        "ok"
      );
    } catch (error) {
      console.error(
        "Error eliminando lote:",
        error.response?.data ||
          error.message
      );

      mostrarMensaje(
        error.response?.data
          ?.mensaje ||
          "No se pudo eliminar el lote.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const abrirHistorial = (
    lote
  ) => {
    setLoteHistorial(lote);
  };

  const cerrarHistorial =
    () => {
      setLoteHistorial(null);
    };

  const colorRiesgo = (
    riesgo
  ) => {
    if (riesgo === "Crítico") {
      return {
        background: "#fee2e2",
        color: "#991b1b",
      };
    }

    if (riesgo === "Alto") {
      return {
        background: "#ffedd5",
        color: "#9a3412",
      };
    }

    if (riesgo === "Medio") {
      return {
        background: "#fef9c3",
        color: "#854d0e",
      };
    }

    return {
      background: "#dcfce7",
      color: "#166534",
    };
  };

  const historialLote =
    loteHistorial
      ? evaluaciones
          .filter(
            (e) =>
              Number(e.lot_id) ===
              Number(
                loteHistorial.id
              )
          )
          .sort(
            (a, b) =>
              new Date(a.fecha) -
              new Date(b.fecha)
          )
      : [];

  const datosGraficaHistorial =
    historialLote.map((e) => ({
      fecha: e.fecha
        ? new Date(
            e.fecha
          ).toLocaleDateString()
        : "-",

      incidencia: Number(
        e.incidencia || 0
      ),
    }));

  const lotesFiltrados =
    lotes.filter((lote) => {
      const texto = `
      ${lote.codigo || ""}
      ${lote.finca_nombre || ""}
      ${lote.cultivo || ""}
      ${lote.variedad || ""}
      ${lote.estado || ""}
    `.toLowerCase();

      return texto.includes(
        busqueda.toLowerCase()
      );
    });

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>
        Lotes
      </h1>

      <p style={styles.subtitle}>
        Gestión de lotes agrícolas
        con GPS,
        historial fitosanitario y
        trazabilidad.
      </p>

      {usuario && (
        <div style={styles.roleBox}>
          Rol activo:{" "}
          <strong>
            {usuario.rol}
          </strong>

          {esConsulta && (
            <span
              style={
                styles.roleNote
              }
            >
              {" "}
              | Modo consulta
            </span>
          )}
        </div>
      )}

      {mensaje.texto && (
        <div
          style={{
            ...styles.messageBox,

            ...(mensaje.tipo ===
            "ok"
              ? styles.messageOk
              : styles.messageError),
          }}
        >
          {mensaje.texto}
        </div>
      )}

      <div style={styles.cards}>
        <div style={styles.card}>
          <p
            style={
              styles.cardLabel
            }
          >
            Total lotes
          </p>

          <h2
            style={
              styles.cardNumber
            }
          >
            {lotes.length}
          </h2>
        </div>

        <div style={styles.card}>
          <p
            style={
              styles.cardLabel
            }
          >
            Lotes activos
          </p>

          <h2
            style={
              styles.cardNumber
            }
          >
            {
              lotes.filter(
                (l) =>
                  l.estado ===
                  "Activo"
              ).length
            }
          </h2>
        </div>

        <div style={styles.card}>
          <p
            style={
              styles.cardLabel
            }
          >
            Lotes con GPS
          </p>

          <h2
            style={
              styles.cardNumber
            }
          >
            {
              lotes.filter(
                (l) =>
                  l.latitud &&
                  l.longitud
              ).length
            }
          </h2>
        </div>
      </div>
      {puedeCrearEditar && (
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>
            {editandoId
              ? "Editar lote"
              : "Registrar nuevo lote"}
          </h2>

          <form
            onSubmit={guardarLote}
            style={styles.form}
          >
            <input
              style={styles.input}
              type="text"
              placeholder="Código del lote"
              value={form.codigo}
              onChange={(e) =>
                setForm({
                  ...form,
                  codigo:
                    e.target.value,
                })
              }
            />

            <select
              style={styles.input}
              value={form.farm_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  farm_id:
                    e.target.value,
                })
              }
            >
              <option value="">
                Seleccione finca
              </option>

              {fincas.map(
                (finca) => (
                  <option
                    key={finca.id}
                    value={finca.id}
                  >
                    {finca.nombre}
                  </option>
                )
              )}
            </select>

            <select
  style={styles.input}
  value={form.cultivo}
  onChange={(e) =>
    setForm({
      ...form,
      cultivo:
        e.target.value,
    })
  }
>
  <option value="">
    Seleccione cultivo
  </option>

  {form.cultivo &&
    !cultivos.some(
      (cultivo) => cultivo.nombre === form.cultivo
    ) && (
      <option value={form.cultivo}>
        {form.cultivo}
      </option>
    )}

  {cultivos.map((cultivo) => (
    <option
      key={cultivo.id}
      value={cultivo.nombre}
    >
      {cultivo.nombre}
    </option>
  ))}
</select>

            <input
              style={styles.input}
              type="text"
              placeholder="Variedad"
              value={form.variedad}
              onChange={(e) =>
                setForm({
                  ...form,
                  variedad:
                    e.target.value,
                })
              }
            />

            <input
              style={styles.input}
              type="number"
              min="0"
              step="0.01"
              placeholder="Área hectáreas"
              value={
                form.area_hectareas
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  area_hectareas:
                    e.target.value,
                })
              }
            />

            <input
              style={styles.input}
              type="date"
              value={
                form.fecha_siembra
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  fecha_siembra:
                    e.target.value,
                })
              }
            />

            <select
              style={styles.input}
              value={form.estado}
              onChange={(e) =>
                setForm({
                  ...form,
                  estado:
                    e.target.value,
                })
              }
            >
              <option value="Activo">
                Activo
              </option>

              <option value="Inactivo">
                Inactivo
              </option>
            </select>

            <input
              style={styles.input}
              type="number"
              step="0.00000001"
              placeholder="Latitud GPS"
              value={form.latitud}
              onChange={(e) =>
                setForm({
                  ...form,
                  latitud:
                    e.target.value,
                })
              }
            />

            <input
              style={styles.input}
              type="number"
              step="0.00000001"
              placeholder="Longitud GPS"
              value={form.longitud}
              onChange={(e) =>
                setForm({
                  ...form,
                  longitud:
                    e.target.value,
                })
              }
            />

            <button
              type="button"
              style={
                styles.gpsButton
              }
              onClick={
                obtenerUbicacionActual
              }
            >
              📍 Usar GPS actual
            </button>

            <button
              type="submit"
              style={styles.button}
              disabled={loading}
            >
              {loading
                ? "Guardando..."
                : editandoId
                ? "Guardar cambios"
                : "Guardar lote"}
            </button>

            <button
              type="button"
              onClick={
                limpiarFormulario
              }
              style={
                styles.cancelButton
              }
            >
              Limpiar
            </button>
          </form>
        </div>
      )}

      <div style={styles.panel}>
        <div
          style={
            styles.tableHeader
          }
        >
          <h2
            style={
              styles.panelTitle
            }
          >
            Listado de lotes
          </h2>

          <input
            style={styles.search}
            type="text"
            placeholder="Buscar lote..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(
                e.target.value
              )
            }
          />
        </div>

        <div
          style={
            styles.tableWrapper
          }
        >
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>
                  Código
                </th>

                <th style={styles.th}>
                  Finca
                </th>

                <th style={styles.th}>
                  Cultivo
                </th>

                <th style={styles.th}>
                  GPS
                </th>

                <th style={styles.th}>
                  Estado
                </th>

                <th style={styles.th}>
                  Historial
                </th>

                <th style={styles.th}>
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {lotesFiltrados.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={
                      styles.empty
                    }
                  >
                    No hay lotes registrados.
                  </td>
                </tr>
              ) : (
                lotesFiltrados.map(
                  (lote) => (
                    <tr key={lote.id}>
                      <td
                        style={
                          styles.td
                        }
                      >
                        {lote.codigo}
                      </td>

                      <td
                        style={
                          styles.td
                        }
                      >
                        {
                          lote.finca_nombre
                        }
                      </td>

                      <td
                        style={
                          styles.td
                        }
                      >
                        {
                          lote.cultivo
                        }
                      </td>

                      <td
                        style={
                          styles.td
                        }
                      >
                        {lote.latitud &&
                        lote.longitud
                          ? "📍 Registrado"
                          : "—"}
                      </td>

                      <td
                        style={
                          styles.td
                        }
                      >
                        <span
                          style={{
                            ...styles.badge,

                            backgroundColor:
                              lote.estado ===
                              "Activo"
                                ? "#dcfce7"
                                : "#fee2e2",

                            color:
                              lote.estado ===
                              "Activo"
                                ? "#166534"
                                : "#991b1b",
                          }}
                        >
                          {lote.estado}
                        </span>
                      </td>

                      <td
                        style={
                          styles.td
                        }
                      >
                        <button
                          style={
                            styles.historyButton
                          }
                          onClick={() =>
                            abrirHistorial(
                              lote
                            )
                          }
                        >
                          Ver historial
                        </button>
                      </td>

                      <td
                        style={
                          styles.td
                        }
                      >
                        <div
                          style={
                            styles.actions
                          }
                        >
                          <button
                            style={
                              styles.editButton
                            }
                            onClick={() =>
                              iniciarEdicion(
                                lote
                              )
                            }
                          >
                            Editar
                          </button>

                          {puedeEliminar && (
                            <button
                              style={
                                styles.deleteButton
                              }
                              onClick={() =>
                                eliminarLote(
                                  lote.id
                                )
                              }
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
      {loteHistorial && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
                  Historial fitosanitario
                </h2>

                <p style={styles.modalSubtitle}>
                  Lote:
                  <strong>
                    {" "}
                    {loteHistorial.codigo}
                  </strong>
                </p>
              </div>

              <button
                style={styles.closeButton}
                onClick={cerrarHistorial}
              >
                ✕
              </button>
            </div>

            <div style={styles.chartBox}>
              <h3 style={styles.chartTitle}>
                Tendencia de incidencia
              </h3>

              {datosGraficaHistorial.length >
              0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={260}
                >
                  <LineChart
                    data={
                      datosGraficaHistorial
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="fecha" />

                    <YAxis />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="incidencia"
                      stroke="#2563eb"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div
                  style={
                    styles.emptyHistory
                  }
                >
                  Este lote aún no tiene
                  evaluaciones registradas.
                </div>
              )}
            </div>
          </div>
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
    marginBottom: "4px",
  },

  subtitle: {
    color: "#64748b",
    marginBottom: "24px",
  },

  roleBox: {
    background: "#eff6ff",
    color: "#1e40af",
    padding: "12px 14px",
    borderRadius: "12px",
    marginBottom: "16px",
    border: "1px solid #bfdbfe",
    fontWeight: "600",
  },

  roleNote: {
    color: "#475569",
    fontWeight: "500",
  },

  messageBox: {
    padding: "14px 16px",
    borderRadius: "14px",
    marginBottom: "20px",
    fontWeight: "700",
  },

  messageOk: {
    background: "#dcfce7",
    color: "#166534",
  },

  messageError: {
    background: "#fee2e2",
    color: "#991b1b",
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
    marginBottom: "24px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "22px",
    boxShadow:
      "0 10px 24px rgba(15,23,42,0.08)",
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
    boxShadow:
      "0 10px 24px rgba(15,23,42,0.08)",
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
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
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
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },

  gpsButton: {
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
    minWidth: "260px",
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
  },

  td: {
    padding: "14px",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
  },

  badge: {
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "13px",
  },

  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  historyButton: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },

  editButton: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },

  deleteButton: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#dc2626",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },

  empty: {
    textAlign: "center",
    padding: "28px",
    color: "#64748b",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(15,23,42,0.55)",
    zIndex: 100,
    padding: "24px",
  },

  modal: {
    background: "#ffffff",
    maxWidth: "1000px",
    margin: "0 auto",
    borderRadius: "22px",
    padding: "24px",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },

  modalTitle: {
    margin: 0,
    color: "#0f172a",
  },

  modalSubtitle: {
    marginTop: "6px",
    color: "#64748b",
  },

  closeButton: {
    border: "none",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "12px",
    padding: "10px 14px",
    fontWeight: "800",
    cursor: "pointer",
  },

  chartBox: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "18px",
  },

  chartTitle: {
    marginTop: 0,
    color: "#0f172a",
  },

  emptyHistory: {
    padding: "24px",
    textAlign: "center",
    color: "#64748b",
  },
};

export default Lotes;