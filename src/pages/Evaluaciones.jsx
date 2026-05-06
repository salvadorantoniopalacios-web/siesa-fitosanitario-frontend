import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000/api";
const BACKEND_URL = "http://localhost:3000";

function Evaluaciones({ usuario }) {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [fincas, setFincas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [foto, setFoto] = useState(null);
  const [fotoActual, setFotoActual] = useState(null);
  const [mensaje, setMensaje] = useState({
    texto: "",
    tipo: "",
  });

  const esAdmin = usuario?.rol === "Admin";
  const esTecnico = usuario?.rol === "Técnico";
  const esConsulta = usuario?.rol === "Consulta";

  const puedeCrearEditar = esAdmin || esTecnico;
  const puedeEliminar = esAdmin;

  const [form, setForm] = useState({
    fecha: "",
    farm_id: "",
    lot_id: "",
    plaga_enfermedad: "",
    incidencia: "",
    severidad: "",
    observaciones: "",
    responsable: "",
  });

  const obtenerToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("siesa_token") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("siesa_token")
    );
  };

  const obtenerEvaluaciones = async () => {
    try {
      const res = await axios.get(`${API_URL}/evaluations`);
      setEvaluaciones(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(
        "Error obteniendo evaluaciones:",
        error.response?.data || error.message
      );
      setMensaje({
        texto: "No se pudieron cargar las evaluaciones.",
        tipo: "error",
      });
    }
  };

  const obtenerFincas = async () => {
    try {
      const res = await axios.get(`${API_URL}/farms`);
      setFincas(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error obteniendo fincas:", error.response?.data || error.message);
      setMensaje({
        texto: "No se pudieron cargar las fincas.",
        tipo: "error",
      });
    }
  };

  const obtenerLotes = async () => {
    try {
      const res = await axios.get(`${API_URL}/lots`);
      setLotes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error obteniendo lotes:", error.response?.data || error.message);
      setMensaje({
        texto: "No se pudieron cargar los lotes.",
        tipo: "error",
      });
    }
  };

  useEffect(() => {
    obtenerEvaluaciones();
    obtenerFincas();
    obtenerLotes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    limpiarMensaje();

    if (name === "farm_id") {
      setForm({
        ...form,
        farm_id: value,
        lot_id: "",
      });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleFotoChange = (e) => {
    limpiarMensaje();

    const archivo = e.target.files[0];

    if (!archivo) {
      setFoto(null);
      return;
    }

    const tiposPermitidos = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

    if (!tiposPermitidos.includes(archivo.type)) {
      mostrarMensaje("Solo se permiten imágenes JPG, PNG o WEBP.", "error");
      e.target.value = "";
      setFoto(null);
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      mostrarMensaje("La imagen no debe superar 5 MB.", "error");
      e.target.value = "";
      setFoto(null);
      return;
    }

    setFoto(archivo);
  };

  const limpiarFormulario = () => {
    setForm({
      fecha: "",
      farm_id: "",
      lot_id: "",
      plaga_enfermedad: "",
      incidencia: "",
      severidad: "",
      observaciones: "",
      responsable: "",
    });

    setFoto(null);
    setFotoActual(null);
    setEditandoId(null);
    limpiarMensaje();

    const inputFoto = document.getElementById("foto-evaluacion");
    if (inputFoto) {
      inputFoto.value = "";
    }
  };

  const limpiarMensaje = () => {
    setMensaje({
      texto: "",
      tipo: "",
    });
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });

    setTimeout(() => {
      setMensaje({ texto: "", tipo: "" });
    }, 4500);
  };

  const lotesFiltradosPorFinca = form.farm_id
    ? lotes.filter((l) => Number(l.farm_id) === Number(form.farm_id))
    : [];

  const colorRiesgo = (riesgo) => {
    if (riesgo === "Crítico") return { background: "#fee2e2", color: "#991b1b" };
    if (riesgo === "Alto") return { background: "#ffedd5", color: "#9a3412" };
    if (riesgo === "Medio") return { background: "#fef9c3", color: "#854d0e" };
    return { background: "#dcfce7", color: "#166534" };
  };

  const validarFormulario = () => {
    limpiarMensaje();

    if (!puedeCrearEditar) {
      mostrarMensaje("No tiene permisos para crear o editar evaluaciones.", "error");
      return false;
    }

    if (
      !form.fecha ||
      !form.farm_id ||
      !form.lot_id ||
      !form.plaga_enfermedad ||
      form.incidencia === "" ||
      form.incidencia === null ||
      form.incidencia === undefined ||
      !form.severidad
    ) {
      mostrarMensaje(
        "Completa fecha, finca, lote, plaga/enfermedad, incidencia y severidad.",
        "error"
      );
      return false;
    }

    if (Number(form.incidencia) < 0 || Number(form.incidencia) > 100) {
      mostrarMensaje("La incidencia debe estar entre 0 y 100%.", "error");
      return false;
    }

    return true;
  };

  const prepararFormDataEvaluacion = () => {
    const data = new FormData();

    data.append("fecha", form.fecha);
    data.append("farm_id", Number(form.farm_id));
    data.append("lot_id", Number(form.lot_id));
    data.append("plaga_enfermedad", form.plaga_enfermedad);
    data.append("incidencia", Number(form.incidencia));
    data.append("severidad", form.severidad);
    data.append("observaciones", form.observaciones || "");
    data.append("responsable", form.responsable || "");

    if (foto) {
      data.append("foto", foto);
    }

    return data;
  };

  const crearEvaluacion = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setLoading(true);

      await axios.post(`${API_URL}/evaluations`, prepararFormDataEvaluacion(), {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      limpiarFormulario();
      obtenerEvaluaciones();
      mostrarMensaje("Evaluación creada correctamente.", "ok");
    } catch (error) {
      console.error("Error creando evaluación:", error.response?.data || error.message);
      mostrarMensaje(
        error.response?.data?.mensaje || "No se pudo crear la evaluación.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicion = (evaluacion) => {
    if (!puedeCrearEditar) {
      mostrarMensaje("No tiene permisos para editar evaluaciones.", "error");
      return;
    }

    limpiarMensaje();
    setEditandoId(evaluacion.id);
    setFoto(null);
    setFotoActual(evaluacion.foto_url || null);

    setForm({
      fecha: evaluacion.fecha ? evaluacion.fecha.substring(0, 10) : "",
      farm_id: evaluacion.farm_id || "",
      lot_id: evaluacion.lot_id || "",
      plaga_enfermedad: evaluacion.plaga_enfermedad || "",
      incidencia: evaluacion.incidencia || "",
      severidad: evaluacion.severidad || "",
      observaciones: evaluacion.observaciones || "",
      responsable: evaluacion.responsable || "",
    });

    const inputFoto = document.getElementById("foto-evaluacion");
    if (inputFoto) {
      inputFoto.value = "";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const actualizarEvaluacion = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setLoading(true);

      await axios.put(
        `${API_URL}/evaluations/${editandoId}`,
        prepararFormDataEvaluacion(),
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      limpiarFormulario();
      obtenerEvaluaciones();
      mostrarMensaje("Evaluación actualizada correctamente.", "ok");
    } catch (error) {
      console.error("Error actualizando evaluación:", error.response?.data || error.message);
      mostrarMensaje(
        error.response?.data?.mensaje || "No se pudo actualizar la evaluación.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const eliminarEvaluacion = async (id) => {
    if (!puedeEliminar) {
      mostrarMensaje("Solo un usuario Admin puede eliminar evaluaciones.", "error");
      return;
    }

    const confirmar = window.confirm(
      "¿Está seguro que desea eliminar esta evaluación?"
    );

    if (!confirmar) return;

    try {
      setLoading(true);

      await axios.delete(`${API_URL}/evaluations/${id}`);
      obtenerEvaluaciones();
      mostrarMensaje("Evaluación eliminada correctamente.", "ok");
    } catch (error) {
      console.error("Error eliminando evaluación:", error.response?.data || error.message);
      mostrarMensaje(
        error.response?.data?.mensaje || "No se pudo eliminar la evaluación.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const generarPdfEvaluacion = async (id) => {
    try {
      limpiarMensaje();

      const token = obtenerToken();

      if (!token) {
        mostrarMensaje("No se encontró token de sesión. Cierre sesión e ingrese nuevamente.", "error");
        return;
      }

      const res = await axios.get(`${API_URL}/evaluations/${id}/pdf`, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const archivoPdf = new Blob([res.data], {
        type: "application/pdf",
      });

      const urlPdf = window.URL.createObjectURL(archivoPdf);
      window.open(urlPdf, "_blank");
    } catch (error) {
      console.error("Error generando PDF:", error.response?.data || error.message);
      mostrarMensaje("No se pudo generar el PDF de la evaluación.", "error");
    }
  };

  const evaluacionesFiltradas = evaluaciones.filter((e) => {
    const texto = `
      ${e.fecha || ""}
      ${e.finca || ""}
      ${e.lote || ""}
      ${e.cultivo || ""}
      ${e.plaga_enfermedad || ""}
      ${e.severidad || ""}
      ${e.nivel_riesgo || ""}
      ${e.responsable || ""}
      ${e.foto_url ? "con evidencia foto imagen" : "sin evidencia"}
    `.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  const total = evaluaciones.length;
  const criticas = evaluaciones.filter((e) => e.nivel_riesgo === "Crítico").length;
  const altas = evaluaciones.filter((e) => e.nivel_riesgo === "Alto").length;
  const medias = evaluaciones.filter((e) => e.nivel_riesgo === "Medio").length;
  const bajas = evaluaciones.filter((e) => e.nivel_riesgo === "Bajo").length;
  const conEvidencia = evaluaciones.filter((e) => e.foto_url).length;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Evaluaciones Fitosanitarias</h1>
      <p style={styles.subtitle}>
        Registro, control, semáforo automático y evidencia fotográfica por finca y lote.
      </p>

      {usuario && (
        <div style={styles.roleBox}>
          Rol activo: <strong>{usuario.rol}</strong>
          {esConsulta && (
            <span style={styles.roleNote}>
              {" "}
              | Modo consulta: solo visualización
            </span>
          )}
        </div>
      )}

      {mensaje.texto && (
        <div
          style={{
            ...styles.messageBox,
            ...(mensaje.tipo === "ok"
              ? styles.messageOk
              : styles.messageError),
          }}
        >
          {mensaje.texto}
        </div>
      )}

      <div style={styles.cards}>
        <div style={styles.card}>
          <p style={styles.cardLabel}>Total evaluaciones</p>
          <h2 style={styles.cardNumber}>{total}</h2>
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
          <p style={styles.cardLabel}>Bajas</p>
          <h2 style={{ ...styles.cardNumber, color: "#166534" }}>{bajas}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Con evidencia</p>
          <h2 style={{ ...styles.cardNumber, color: "#2563eb" }}>{conEvidencia}</h2>
        </div>
      </div>

      {puedeCrearEditar && (
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>
            {editandoId ? "Editar evaluación" : "Crear nueva evaluación"}
          </h2>

          <form
            onSubmit={editandoId ? actualizarEvaluacion : crearEvaluacion}
            style={styles.form}
          >
            <input
              style={styles.input}
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
            />

            <select
              style={styles.input}
              name="farm_id"
              value={form.farm_id}
              onChange={handleChange}
            >
              <option value="">Seleccione finca</option>
              {fincas.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>

            <select
              style={{
                ...styles.input,
                opacity: form.farm_id ? 1 : 0.65,
              }}
              name="lot_id"
              value={form.lot_id}
              onChange={handleChange}
              disabled={!form.farm_id}
            >
              <option value="">
                {form.farm_id ? "Seleccione lote" : "Primero seleccione finca"}
              </option>

              {lotesFiltradosPorFinca.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.codigo} - {l.cultivo}
                </option>
              ))}
            </select>

            <input
              style={styles.input}
              name="plaga_enfermedad"
              placeholder="Plaga o enfermedad"
              value={form.plaga_enfermedad}
              onChange={handleChange}
            />

            <input
              style={styles.input}
              name="incidencia"
              type="number"
              min="0"
              max="100"
              placeholder="Incidencia %"
              value={form.incidencia}
              onChange={handleChange}
            />

            <select
              style={styles.input}
              name="severidad"
              value={form.severidad}
              onChange={handleChange}
            >
              <option value="">Severidad</option>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
            </select>

            <input
              style={styles.input}
              name="responsable"
              placeholder="Responsable"
              value={form.responsable}
              onChange={handleChange}
            />

            <textarea
              style={styles.textarea}
              name="observaciones"
              placeholder="Observaciones"
              value={form.observaciones}
              onChange={handleChange}
            />

            <div style={styles.fileBox}>
              <label style={styles.fileLabel}>Evidencia fotográfica</label>
              <input
                id="foto-evaluacion"
                style={styles.fileInput}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFotoChange}
              />
              <span style={styles.fileHelp}>
                Formatos permitidos: JPG, PNG o WEBP. Máximo 5 MB.
              </span>

              {foto && (
                <span style={styles.fileSelected}>
                  Nueva foto seleccionada: {foto.name}
                </span>
              )}

              {fotoActual && !foto && (
                <a
                  href={`${BACKEND_URL}${fotoActual}`}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.currentPhotoLink}
                >
                  Ver foto actual
                </a>
              )}
            </div>

            <button
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Guardando..."
                : editandoId
                ? "Guardar cambios"
                : "Crear evaluación"}
            </button>

            <button
              style={styles.cancelButton}
              type="button"
              onClick={limpiarFormulario}
              disabled={loading}
            >
              {editandoId ? "Cancelar" : "Limpiar"}
            </button>
          </form>
        </div>
      )}

      {esConsulta && (
        <div style={styles.readOnlyBox}>
          Este usuario tiene permisos de consulta. Puede revisar las evaluaciones,
          pero no puede crear, editar ni eliminar registros.
        </div>
      )}

      <div style={styles.panel}>
        <div style={styles.tableHeader}>
          <h2 style={styles.panelTitle}>Historial de evaluaciones</h2>

          <input
            style={styles.search}
            placeholder="Buscar finca, lote, plaga, severidad, responsable o evidencia..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Finca</th>
                <th style={styles.th}>Lote</th>
                <th style={styles.th}>Cultivo</th>
                <th style={styles.th}>Plaga/Enfermedad</th>
                <th style={styles.th}>Incidencia</th>
                <th style={styles.th}>Severidad</th>
                <th style={styles.th}>Semáforo</th>
                <th style={styles.th}>Responsable</th>
                <th style={styles.th}>Evidencia</th>
                <th style={styles.th}>PDF</th>
                {(puedeCrearEditar || puedeEliminar) && (
                  <th style={styles.th}>Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {evaluacionesFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={puedeCrearEditar || puedeEliminar ? "12" : "11"}
                    style={styles.empty}
                  >
                    No hay evaluaciones registradas.
                  </td>
                </tr>
              ) : (
                evaluacionesFiltradas.map((e) => (
                  <tr key={e.id}>
                    <td style={styles.td}>
                      {e.fecha ? new Date(e.fecha).toLocaleDateString() : "-"}
                    </td>
                    <td style={styles.td}>{e.finca || "-"}</td>
                    <td style={styles.td}>{e.lote || "-"}</td>
                    <td style={styles.td}>{e.cultivo || "-"}</td>
                    <td style={styles.td}>{e.plaga_enfermedad || "-"}</td>
                    <td style={styles.td}>{e.incidencia}%</td>
                    <td style={styles.td}>{e.severidad}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...colorRiesgo(e.nivel_riesgo),
                        }}
                      >
                        {e.nivel_riesgo}
                      </span>
                    </td>
                    <td style={styles.td}>{e.responsable || "-"}</td>

                    <td style={styles.td}>
                      {e.foto_url ? (
                        <a
                          href={`${BACKEND_URL}${e.foto_url}`}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.photoButton}
                        >
                          Ver foto
                        </a>
                      ) : (
                        <span style={styles.noPhoto}>Sin foto</span>
                      )}
                    </td>

                    <td style={styles.td}>
                      <button
                        type="button"
                        onClick={() => generarPdfEvaluacion(e.id)}
                        style={styles.pdfButton}
                        disabled={loading}
                      >
                        PDF
                      </button>
                    </td>

                    {(puedeCrearEditar || puedeEliminar) && (
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          {puedeCrearEditar && (
                            <button
                              type="button"
                              onClick={() => iniciarEdicion(e)}
                              style={styles.editButton}
                              disabled={loading}
                            >
                              Editar
                            </button>
                          )}

                          {puedeEliminar && (
                            <button
                              type="button"
                              onClick={() => eliminarEvaluacion(e.id)}
                              style={styles.deleteButton}
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
  readOnlyBox: {
    background: "#f8fafc",
    color: "#475569",
    padding: "14px 16px",
    borderRadius: "14px",
    marginBottom: "20px",
    border: "1px solid #cbd5e1",
    fontWeight: "600",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
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
  textarea: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    resize: "vertical",
    minHeight: "45px",
  },
  fileBox: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px dashed #94a3b8",
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  fileLabel: {
    fontWeight: "700",
    color: "#334155",
    fontSize: "14px",
  },
  fileInput: {
    fontSize: "14px",
    color: "#334155",
  },
  fileHelp: {
    color: "#64748b",
    fontSize: "12px",
  },
  fileSelected: {
    color: "#166534",
    fontWeight: "700",
    fontSize: "13px",
  },
  currentPhotoLink: {
    color: "#2563eb",
    fontWeight: "700",
    textDecoration: "none",
    fontSize: "13px",
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
  },
  badge: {
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "13px",
  },
  photoButton: {
    padding: "7px 12px",
    borderRadius: "10px",
    background: "#dbeafe",
    color: "#1e40af",
    textDecoration: "none",
    fontWeight: "700",
    fontSize: "13px",
    display: "inline-block",
  },
  noPhoto: {
    padding: "7px 12px",
    borderRadius: "10px",
    background: "#f1f5f9",
    color: "#64748b",
    fontWeight: "700",
    fontSize: "13px",
    display: "inline-block",
  },
  pdfButton: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px",
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

export default Evaluaciones;