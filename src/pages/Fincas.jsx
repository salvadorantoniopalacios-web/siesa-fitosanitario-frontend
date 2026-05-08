import React, { useEffect, useState } from "react";
import axios from "../api/axiosConfig.js";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

function Fincas({ usuario }) {
  const [fincas, setFincas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [obteniendoGps, setObteniendoGps] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  const esAdmin = usuario?.rol === "Admin";
  const esTecnico = usuario?.rol === "Técnico";
  const esConsulta = usuario?.rol === "Consulta";

  const puedeCrearEditar = esAdmin || esTecnico;
  const puedeEliminar = esAdmin;

  const [form, setForm] = useState({
    nombre: "",
    ubicacion: "",
    area_hectareas: "",
    cultivo_principal: "",
    latitud: "",
    longitud: "",
  });

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });

    setTimeout(() => {
      setMensaje({ texto: "", tipo: "" });
    }, 4500);
  };

  const limpiarMensaje = () => {
    setMensaje({ texto: "", tipo: "" });
  };

  const obtenerFincas = async () => {
    try {
      const res = await axios.get(`${API_URL}/farms`);
      setFincas(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error obteniendo fincas:", error.response?.data || error.message);
      setFincas([]);
      mostrarMensaje(
        error.response?.data?.mensaje || "No se pudieron cargar las fincas.",
        "error"
      );
    }
  };

  useEffect(() => {
    obtenerFincas();
  }, []);

  const handleChange = (e) => {
    limpiarMensaje();
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const usarUbicacionActual = () => {
    limpiarMensaje();

    if (!navigator.geolocation) {
      mostrarMensaje("Este navegador no permite obtener ubicación GPS.", "error");
      return;
    }

    setObteniendoGps(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitudActual = position.coords.latitude.toFixed(7);
        const longitudActual = position.coords.longitude.toFixed(7);

        setForm((prev) => ({
          ...prev,
          latitud: latitudActual,
          longitud: longitudActual,
        }));

        setObteniendoGps(false);
        mostrarMensaje("Ubicación GPS cargada correctamente.", "ok");
      },
      (error) => {
        console.error("Error obteniendo ubicación:", error);
        setObteniendoGps(false);

        if (error.code === 1) {
          mostrarMensaje("Permiso de ubicación denegado por el usuario.", "error");
          return;
        }

        if (error.code === 2) {
          mostrarMensaje("No se pudo determinar la ubicación del dispositivo.", "error");
          return;
        }

        if (error.code === 3) {
          mostrarMensaje("La solicitud de ubicación tardó demasiado.", "error");
          return;
        }

        mostrarMensaje("No se pudo obtener la ubicación GPS.", "error");
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const limpiarFormulario = () => {
    setForm({
      nombre: "",
      ubicacion: "",
      area_hectareas: "",
      cultivo_principal: "",
      latitud: "",
      longitud: "",
    });

    setEditandoId(null);
    limpiarMensaje();
  };

  const validarFormulario = () => {
    if (!puedeCrearEditar) {
      mostrarMensaje("No tiene permisos para crear o editar fincas.", "error");
      return false;
    }

    if (!form.nombre || !form.ubicacion || !form.area_hectareas || !form.cultivo_principal) {
      mostrarMensaje("Nombre, ubicación, área y cultivo principal son obligatorios.", "error");
      return false;
    }

    if (Number(form.area_hectareas) < 0) {
      mostrarMensaje("El área no puede ser negativa.", "error");
      return false;
    }

    if (form.latitud !== "" && (Number(form.latitud) < -90 || Number(form.latitud) > 90)) {
      mostrarMensaje("La latitud debe estar entre -90 y 90.", "error");
      return false;
    }

    if (form.longitud !== "" && (Number(form.longitud) < -180 || Number(form.longitud) > 180)) {
      mostrarMensaje("La longitud debe estar entre -180 y 180.", "error");
      return false;
    }

    return true;
  };

  const prepararDataFinca = () => ({
    nombre: form.nombre,
    ubicacion: form.ubicacion,
    area_hectareas: Number(form.area_hectareas),
    cultivo_principal: form.cultivo_principal,
    latitud:
      form.latitud !== "" && !isNaN(form.latitud) ? Number(form.latitud) : null,
    longitud:
      form.longitud !== "" && !isNaN(form.longitud) ? Number(form.longitud) : null,
  });

  const abrirMapa = (finca) => {
    if (!finca.latitud || !finca.longitud) {
      mostrarMensaje("Esta finca no tiene coordenadas GPS registradas.", "error");
      return;
    }

    const url = `https://www.google.com/maps?q=${finca.latitud},${finca.longitud}`;
    window.open(url, "_blank");
  };

  const crearFinca = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setLoading(true);

      await axios.post(`${API_URL}/farms`, prepararDataFinca());

      limpiarFormulario();
      await obtenerFincas();
      mostrarMensaje("Finca creada correctamente.", "ok");
    } catch (error) {
      console.error("Error creando finca:", error.response?.data || error.message);
      mostrarMensaje(
        error.response?.data?.mensaje || "No se pudo crear la finca.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicion = (finca) => {
    if (!puedeCrearEditar) {
      mostrarMensaje("No tiene permisos para editar fincas.", "error");
      return;
    }

    limpiarMensaje();

    setEditandoId(finca.id);
    setForm({
      nombre: finca.nombre || "",
      ubicacion: finca.ubicacion || "",
      area_hectareas: finca.area_hectareas || "",
      cultivo_principal: finca.cultivo_principal || "",
      latitud: finca.latitud || "",
      longitud: finca.longitud || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const actualizarFinca = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setLoading(true);

      await axios.put(`${API_URL}/farms/${editandoId}`, prepararDataFinca());

      limpiarFormulario();
      await obtenerFincas();
      mostrarMensaje("Finca actualizada correctamente.", "ok");
    } catch (error) {
      console.error("Error actualizando finca:", error.response?.data || error.message);
      mostrarMensaje(
        error.response?.data?.mensaje || "No se pudo actualizar la finca.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const eliminarFinca = async (id) => {
    if (!puedeEliminar) {
      mostrarMensaje("Solo un usuario Admin puede eliminar fincas.", "error");
      return;
    }

    const confirmar = window.confirm(
      "¿Está seguro que desea eliminar esta finca?"
    );

    if (!confirmar) return;

    try {
      setLoading(true);

      await axios.delete(`${API_URL}/farms/${id}`);

      await obtenerFincas();
      mostrarMensaje("Finca eliminada correctamente.", "ok");
    } catch (error) {
      console.error("Error eliminando finca:", error.response?.data || error.message);
      mostrarMensaje(
        error.response?.data?.mensaje ||
          "No se pudo eliminar la finca. Verifique si tiene lotes asociados.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const fincasFiltradas = fincas.filter((f) => {
    const texto = `
      ${f.nombre || ""}
      ${f.ubicacion || ""}
      ${f.area_hectareas || ""}
      ${f.cultivo_principal || ""}
      ${f.estado || ""}
      ${f.latitud || ""}
      ${f.longitud || ""}
    `.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  const totalFincas = fincas.length;
  const cultivosUnicos = new Set(
    fincas.map((f) => f.cultivo_principal).filter(Boolean)
  ).size;

  const areaTotal = fincas.reduce((total, f) => {
    const area = Number(f.area_hectareas);
    return total + (isNaN(area) ? 0 : area);
  }, 0);

  const fincasConGps = fincas.filter((f) => f.latitud && f.longitud).length;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Fincas</h1>
      <p style={styles.subtitle}>
        Registro y control de fincas agrícolas con ubicación GPS para trazabilidad.
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
          <p style={styles.cardLabel}>Total fincas</p>
          <h2 style={styles.cardNumber}>{totalFincas}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Área registrada</p>
          <h2 style={styles.cardNumber}>{areaTotal}</h2>
          <span style={styles.smallText}>hectáreas</span>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Cultivos principales</p>
          <h2 style={styles.cardNumber}>{cultivosUnicos}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Fincas con GPS</p>
          <h2 style={{ ...styles.cardNumber, color: "#2563eb" }}>{fincasConGps}</h2>
        </div>
      </div>

      {puedeCrearEditar && (
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>
            {editandoId ? "Editar finca" : "Nueva finca"}
          </h2>

          <form
            onSubmit={editandoId ? actualizarFinca : crearFinca}
            style={styles.form}
          >
            <input
              name="nombre"
              placeholder="Nombre de finca"
              value={form.nombre}
              onChange={handleChange}
              style={styles.input}
            />

            <input
              name="ubicacion"
              placeholder="Ubicación"
              value={form.ubicacion}
              onChange={handleChange}
              style={styles.input}
            />

            <input
              name="area_hectareas"
              type="number"
              min="0"
              placeholder="Área (ha)"
              value={form.area_hectareas}
              onChange={handleChange}
              style={styles.input}
            />

            <input
              name="cultivo_principal"
              placeholder="Cultivo principal"
              value={form.cultivo_principal}
              onChange={handleChange}
              style={styles.input}
            />

            <input
              name="latitud"
              type="number"
              step="any"
              placeholder="Latitud GPS ej. 14.6349000"
              value={form.latitud}
              onChange={handleChange}
              style={styles.input}
            />

            <input
              name="longitud"
              type="number"
              step="any"
              placeholder="Longitud GPS ej. -90.5069000"
              value={form.longitud}
              onChange={handleChange}
              style={styles.input}
            />

            <button
              type="button"
              onClick={usarUbicacionActual}
              style={{
                ...styles.gpsButton,
                opacity: obteniendoGps ? 0.7 : 1,
                cursor: obteniendoGps ? "not-allowed" : "pointer",
              }}
              disabled={obteniendoGps || loading}
            >
              {obteniendoGps ? "Obteniendo GPS..." : "📍 Usar mi ubicación actual"}
            </button>

            <button
              type="submit"
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              disabled={loading}
            >
              {loading
                ? "Guardando..."
                : editandoId
                ? "Guardar cambios"
                : "+ Crear finca"}
            </button>

            <button
              type="button"
              onClick={limpiarFormulario}
              style={styles.cancelButton}
              disabled={loading}
            >
              {editandoId ? "Cancelar" : "Limpiar"}
            </button>
          </form>
        </div>
      )}

      {esConsulta && (
        <div style={styles.readOnlyBox}>
          Este usuario tiene permisos de consulta. Puede revisar las fincas, pero
          no puede crear, editar ni eliminar registros.
        </div>
      )}

      <div style={styles.panel}>
        <div style={styles.tableHeader}>
          <h2 style={styles.panelTitle}>Listado de fincas</h2>

          <input
            style={styles.search}
            placeholder="Buscar finca, ubicación, cultivo o GPS..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Ubicación</th>
                <th style={styles.th}>Área (ha)</th>
                <th style={styles.th}>Cultivo principal</th>
                <th style={styles.th}>Latitud</th>
                <th style={styles.th}>Longitud</th>
                <th style={styles.th}>Mapa</th>
                <th style={styles.th}>Estado</th>
                {(puedeCrearEditar || puedeEliminar) && (
                  <th style={styles.th}>Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {fincasFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={puedeCrearEditar || puedeEliminar ? "9" : "8"}
                    style={styles.empty}
                  >
                    No hay fincas registradas.
                  </td>
                </tr>
              ) : (
                fincasFiltradas.map((f) => (
                  <tr key={f.id}>
                    <td style={styles.td}>{f.nombre || "-"}</td>
                    <td style={styles.td}>{f.ubicacion || "-"}</td>
                    <td style={styles.td}>{f.area_hectareas || "-"}</td>
                    <td style={styles.td}>{f.cultivo_principal || "-"}</td>
                    <td style={styles.td}>{f.latitud || "-"}</td>
                    <td style={styles.td}>{f.longitud || "-"}</td>

                    <td style={styles.td}>
                      {f.latitud && f.longitud ? (
                        <button
                          type="button"
                          onClick={() => abrirMapa(f)}
                          style={styles.mapButton}
                        >
                          Ver mapa
                        </button>
                      ) : (
                        <span style={styles.noGps}>Sin GPS</span>
                      )}
                    </td>

                    <td style={styles.td}>
                      <span style={styles.estado}>
                        {f.estado || "Activa"}
                      </span>
                    </td>

                    {(puedeCrearEditar || puedeEliminar) && (
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          {puedeCrearEditar && (
                            <button
                              type="button"
                              onClick={() => iniciarEdicion(f)}
                              style={styles.editButton}
                              disabled={loading}
                            >
                              Editar
                            </button>
                          )}

                          {puedeEliminar && (
                            <button
                              type="button"
                              onClick={() => eliminarFinca(f.id)}
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
  smallText: {
    color: "#64748b",
    fontSize: "13px",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
  gpsButton: {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "none",
    background: "#0f172a",
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
    minWidth: "300px",
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
    textAlign: "left",
    padding: "14px",
    background: "#f1f5f9",
    color: "#334155",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "14px",
    color: "#334155",
    whiteSpace: "nowrap",
  },
  estado: {
    background: "#dcfce7",
    color: "#166534",
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "13px",
  },
  mapButton: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px",
  },
  noGps: {
    padding: "7px 12px",
    borderRadius: "10px",
    background: "#f1f5f9",
    color: "#64748b",
    fontWeight: "700",
    fontSize: "13px",
    display: "inline-block",
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

export default Fincas;