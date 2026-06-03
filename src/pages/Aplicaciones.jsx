import React, { useEffect, useState } from "react";
import axios from "../api/axiosConfig.js";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;
const BACKEND_URL = import.meta.env.VITE_API_URL;

function Aplicaciones({ usuario }) {
  const [aplicaciones, setAplicaciones] = useState([]);
  const [fincas, setFincas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [plagasCatalogo, setPlagasCatalogo] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [foto, setFoto] = useState(null);
  const [fotoActual, setFotoActual] = useState(null);

  const [mensaje, setMensaje] = useState({
    texto: "",
    tipo: "",
  });

  const esSuperAdmin = usuario?.rol === "SuperAdmin";
  const esAdmin = usuario?.rol === "Admin";
  const esTecnico = usuario?.rol === "Técnico";
  const esConsulta = usuario?.rol === "Consulta";

  const puedeCrearEditar = esSuperAdmin || esAdmin || esTecnico;
  const puedeEliminar = esSuperAdmin || esAdmin;

  const [form, setForm] = useState({
    fecha: "",
    farm_id: "",
    lot_id: "",
    cultivo: "",
    plaga_objetivo: "",
    producto_aplicado: "",
    ingrediente_activo: "",
    dosis: "",
    unidad: "",
    volumen_agua: "",
    responsable: "",
    equipo_usado: "",
    observaciones: "",
    latitud: "",
    longitud: "",
    inventory_product_id: "",
    cantidad_usada: "",
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

  const formatearFechaLocal = (fecha) => {
    if (!fecha) return "-";

    const fechaTexto = String(fecha).substring(0, 10);
    const [year, month, day] = fechaTexto.split("-");

    if (!year || !month || !day) return "-";

    return `${day}/${month}/${year}`;
  };

  const obtenerAplicaciones = async () => {
    try {
      const res = await axios.get(`${API_URL}/applications`);
      setAplicaciones(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error obteniendo aplicaciones:", error.response?.data || error.message);
      mostrarMensaje("No se pudieron cargar las aplicaciones.", "error");
    }
  };

  const obtenerFincas = async () => {
    try {
      const res = await axios.get(`${API_URL}/farms`);
      setFincas(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error obteniendo fincas:", error.response?.data || error.message);
      mostrarMensaje("No se pudieron cargar las fincas.", "error");
    }
  };

  const obtenerLotes = async () => {
    try {
      const res = await axios.get(`${API_URL}/lots`);
      setLotes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error obteniendo lotes:", error.response?.data || error.message);
      mostrarMensaje("No se pudieron cargar los lotes.", "error");
    }
  };

  const obtenerPlagas = async () => {
    try {
      const res = await axios.get(`${API_URL}/catalog/pests`);
      setPlagasCatalogo(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error obteniendo plagas:", error.response?.data || error.message);
      setPlagasCatalogo([]);
    }
  };
  const obtenerInventario = async () => {
  try {
    const res = await axios.get(
      `${API_URL}/inventory`
    );

    setInventario(
      Array.isArray(res.data)
        ? res.data.filter(
            (p) =>
              p.estado === "Activo" &&
              Number(p.existencia || 0) > 0
          )
        : []
    );
  } catch (error) {
    console.error(
      "Error obteniendo inventario:",
      error.response?.data || error.message
    );
  }
};
useEffect(() => {
  obtenerAplicaciones();
  obtenerFincas();
  obtenerLotes();
  obtenerPlagas();
  obtenerInventario();
}, []);

  const lotesFiltradosPorFinca = form.farm_id
    ? lotes.filter((lote) => Number(lote.farm_id) === Number(form.farm_id))
    : [];

  const loteSeleccionado = lotes.find(
    (lote) => Number(lote.id) === Number(form.lot_id)
  );

  const cultivoSeleccionado = loteSeleccionado?.cultivo || form.cultivo || "";

  const plagasActivas = plagasCatalogo.filter((plaga) => plaga.estado === "Activo");

const handleChange = (e) => {
  const { name, value } = e.target;
  limpiarMensaje();

  if (name === "farm_id") {
    setForm({
      ...form,
      farm_id: value,
      lot_id: "",
      cultivo: "",
      plaga_objetivo: "",
    });
    return;
  }

  if (name === "lot_id") {
    const lote = lotes.find((l) => Number(l.id) === Number(value));

    setForm({
      ...form,
      lot_id: value,
      cultivo: lote?.cultivo || "",
      plaga_objetivo: "",
    });
    return;
  }

  if (name === "inventory_product_id") {
    const producto = inventario.find(
      (p) => Number(p.id) === Number(value)
    );

    setForm({
      ...form,
      inventory_product_id: value,
      producto_aplicado: producto?.nombre || "",
      ingrediente_activo: producto?.ingrediente_activo || "",
      unidad: producto?.unidad || form.unidad,
    });

    return;
  }

  setForm({
    ...form,
    [name]: value,
  });
};

  const validarImagen = (archivo) => {
    if (!archivo) return true;

    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
    ];

    if (!tiposPermitidos.includes(archivo.type)) {
      mostrarMensaje("Solo se permiten imágenes JPG, PNG o WEBP.", "error");
      return false;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      mostrarMensaje("La imagen no debe superar 5 MB.", "error");
      return false;
    }

    return true;
  };

  const handleFotoChange = (e) => {
    limpiarMensaje();

    const archivo = e.target.files[0];

    if (!archivo) {
      setFoto(null);
      return;
    }

    if (!validarImagen(archivo)) {
      e.target.value = "";
      setFoto(null);
      return;
    }

    setFoto(archivo);
  };

  const obtenerUbicacionActual = () => {
    limpiarMensaje();

    if (!navigator.geolocation) {
      mostrarMensaje("El navegador no soporta GPS.", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitud: position.coords.latitude.toFixed(7),
          longitud: position.coords.longitude.toFixed(7),
        }));

        mostrarMensaje("GPS de aplicación capturado correctamente.", "ok");
      },
      () => {
        mostrarMensaje("No se pudo obtener la ubicación GPS.", "error");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const limpiarFormulario = () => {
    setForm({
      fecha: "",
      farm_id: "",
      lot_id: "",
      cultivo: "",
      plaga_objetivo: "",
      producto_aplicado: "",
      ingrediente_activo: "",
      dosis: "",
      unidad: "",
      volumen_agua: "",
      responsable: "",
      equipo_usado: "",
      observaciones: "",
      latitud: "",
      longitud: "",
      inventory_product_id: "",
      cantidad_usada: "",
    });

    setEditandoId(null);
    setFoto(null);
    setFotoActual(null);
    limpiarMensaje();

    const inputFoto = document.getElementById("foto-aplicacion");

    if (inputFoto) {
      inputFoto.value = "";
    }
  };

  const validarFormulario = () => {
    limpiarMensaje();

    if (!puedeCrearEditar) {
      mostrarMensaje("No tiene permisos para crear o editar aplicaciones.", "error");
      return false;
    }

    if (
      !form.fecha ||
      !form.farm_id ||
      !form.lot_id ||
      !form.plaga_objetivo ||
      !form.producto_aplicado
    ) {
      mostrarMensaje(
        "Complete fecha, finca, lote, plaga objetivo y producto aplicado.",
        "error"
      );
      return false;
    }

    return true;
  };

  const prepararFormData = () => {
    const data = new FormData();

    Object.keys(form).forEach((key) => {
      data.append(key, form[key] || "");
    });

    if (foto) {
      data.append("foto", foto);
    }

    return data;
  };

  const guardarAplicacion = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setLoading(true);

      if (editandoId) {
        await axios.put(
          `${API_URL}/applications/${editandoId}`,
          prepararFormData(),
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        mostrarMensaje("Aplicación actualizada correctamente.", "ok");
      } else {
        await axios.post(`${API_URL}/applications`, prepararFormData(), {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        mostrarMensaje("Aplicación registrada correctamente.", "ok");
      }

      limpiarFormulario();
      
      await obtenerAplicaciones();
    } catch (error) {
      console.error("Error guardando aplicación:", error.response?.data || error.message);

      mostrarMensaje(
        error.response?.data?.mensaje || "No se pudo guardar la aplicación.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicion = (aplicacion) => {
    if (!puedeCrearEditar) {
      mostrarMensaje("No tiene permisos para editar aplicaciones.", "error");
      return;
    }

    setEditandoId(aplicacion.id);
    setFoto(null);
    setFotoActual(aplicacion.foto_url || null);

    setForm({
      fecha: aplicacion.fecha ? String(aplicacion.fecha).substring(0, 10) : "",
      farm_id: aplicacion.farm_id || "",
      lot_id: aplicacion.lot_id || "",
      cultivo: aplicacion.cultivo || "",
      plaga_objetivo: aplicacion.plaga_objetivo || "",
      producto_aplicado: aplicacion.producto_aplicado || "",
      ingrediente_activo: aplicacion.ingrediente_activo || "",
      dosis: aplicacion.dosis || "",
      unidad: aplicacion.unidad || "",
      volumen_agua: aplicacion.volumen_agua || "",
      responsable: aplicacion.responsable || "",
      equipo_usado: aplicacion.equipo_usado || "",
      observaciones: aplicacion.observaciones || "",
      latitud: aplicacion.latitud || "",
      longitud: aplicacion.longitud || "",

      inventory_product_id: aplicacion.inventory_product_id || "",
      cantidad_usada: aplicacion.cantidad_usada || "",
    });

    const inputFoto = document.getElementById("foto-aplicacion");

    if (inputFoto) {
      inputFoto.value = "";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const eliminarAplicacion = async (id) => {
    if (!puedeEliminar) {
      mostrarMensaje("No tiene permisos para eliminar aplicaciones.", "error");
      return;
    }

    const confirmar = window.confirm(
      "¿Está seguro que desea eliminar esta aplicación?"
    );

    if (!confirmar) return;

    try {
      setLoading(true);

      await axios.delete(`${API_URL}/applications/${id}`);
      await obtenerAplicaciones();

      mostrarMensaje("Aplicación eliminada correctamente.", "ok");
    } catch (error) {
      console.error("Error eliminando aplicación:", error.response?.data || error.message);

      mostrarMensaje(
        error.response?.data?.mensaje || "No se pudo eliminar la aplicación.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const aplicacionesFiltradas = aplicaciones.filter((item) => {
    const texto = `
      ${item.fecha || ""}
      ${item.finca || ""}
      ${item.lote || ""}
      ${item.cultivo || ""}
      ${item.plaga_objetivo || ""}
      ${item.producto_aplicado || ""}
      ${item.ingrediente_activo || ""}
      ${item.responsable || ""}
      ${item.equipo_usado || ""}
    `.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  const total = aplicaciones.length;
  const conGps = aplicaciones.filter((a) => a.latitud && a.longitud).length;
  const conFoto = aplicaciones.filter((a) => a.foto_url).length;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Aplicaciones Fitosanitarias</h1>

      <p style={styles.subtitle}>
        Registro de tratamientos aplicados por finca, lote, plaga objetivo,
        producto, dosis, GPS y evidencia.
      </p>

      {usuario && (
        <div style={styles.roleBox}>
          Rol activo: <strong>{usuario.rol}</strong>
          {esConsulta && (
            <span style={styles.roleNote}> | Modo consulta: solo visualización</span>
          )}
        </div>
      )}

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
          <p style={styles.cardLabel}>Total aplicaciones</p>
          <h2 style={styles.cardNumber}>{total}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Con GPS</p>
          <h2 style={{ ...styles.cardNumber, color: "#15803d" }}>{conGps}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Con evidencia</p>
          <h2 style={{ ...styles.cardNumber, color: "#2563eb" }}>{conFoto}</h2>
        </div>
      </div>

      {puedeCrearEditar && (
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>
            {editandoId ? "Editar aplicación" : "Registrar nueva aplicación"}
          </h2>

          <form onSubmit={guardarAplicacion} style={styles.form}>
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
              {fincas.map((finca) => (
                <option key={finca.id} value={finca.id}>
                  {finca.nombre}
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
              {lotesFiltradosPorFinca.map((lote) => (
                <option key={lote.id} value={lote.id}>
                  {lote.codigo} - {lote.cultivo}
                </option>
              ))}
            </select>

            <input
              style={styles.input}
              name="cultivo"
              placeholder="Cultivo"
              value={cultivoSeleccionado}
              readOnly
            />

            <select
              style={styles.input}
              name="plaga_objetivo"
              value={form.plaga_objetivo}
              onChange={handleChange}
            >
              <option value="">Seleccione plaga objetivo</option>
              {plagasActivas.map((plaga) => (
                <option key={plaga.id} value={plaga.nombre}>
                  {plaga.nombre} ({plaga.tipo})
                </option>
              ))}
            </select>
            <select
  style={styles.input}
  name="inventory_product_id"
  value={form.inventory_product_id}
  onChange={handleChange}
>
  <option value="">
    Seleccione producto de inventario
  </option>

  {inventario.map((producto) => (
    <option
      key={producto.id}
      value={producto.id}
    >
      {producto.nombre}
      {" | "}
      Stock:
      {" "}
      {producto.existencia}
      {" "}
      {producto.unidad}
    </option>
  ))}
</select>

<input
  style={styles.input}
  type="number"
  step="0.01"
  name="cantidad_usada"
  placeholder="Cantidad usada"
  value={form.cantidad_usada}
  onChange={handleChange}
/>    
            <input
              style={styles.input}
              name="producto_aplicado"
              placeholder="Producto aplicado"
              value={form.producto_aplicado}
              onChange={handleChange}
            />

            <input
              style={styles.input}
              name="ingrediente_activo"
              placeholder="Ingrediente activo"
              value={form.ingrediente_activo}
              onChange={handleChange}
            />

            <input
              style={styles.input}
              name="dosis"
              placeholder="Dosis"
              value={form.dosis}
              onChange={handleChange}
            />

            <select
              style={styles.input}
              name="unidad"
              value={form.unidad}
              onChange={handleChange}
            >
              <option value="">Unidad</option>
              <option value="cc/L">cc/L</option>
              <option value="ml/L">ml/L</option>
              <option value="g/L">g/L</option>
              <option value="kg/ha">kg/ha</option>
              <option value="L/ha">L/ha</option>
            </select>

            <input
              style={styles.input}
              name="volumen_agua"
              placeholder="Volumen de agua"
              value={form.volumen_agua}
              onChange={handleChange}
            />

            <input
              style={styles.input}
              name="responsable"
              placeholder="Responsable"
              value={form.responsable}
              onChange={handleChange}
            />

            <input
              style={styles.input}
              name="equipo_usado"
              placeholder="Equipo usado"
              value={form.equipo_usado}
              onChange={handleChange}
            />

            <input
              style={styles.input}
              name="latitud"
              type="number"
              step="0.0000001"
              placeholder="Latitud GPS"
              value={form.latitud}
              onChange={handleChange}
            />

            <input
              style={styles.input}
              name="longitud"
              type="number"
              step="0.0000001"
              placeholder="Longitud GPS"
              value={form.longitud}
              onChange={handleChange}
            />

            <button
              type="button"
              style={styles.gpsButton}
              onClick={obtenerUbicacionActual}
              disabled={loading}
            >
              📍 Usar GPS actual
            </button>

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
                id="foto-aplicacion"
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
              }}
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Guardando..."
                : editandoId
                ? "Guardar cambios"
                : "Registrar aplicación"}
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
          Este usuario tiene permisos de consulta. Puede revisar aplicaciones,
          pero no puede crear, editar ni eliminar registros.
        </div>
      )}

      <div style={styles.panel}>
        <div style={styles.tableHeader}>
          <h2 style={styles.panelTitle}>Historial de aplicaciones</h2>

          <input
            style={styles.search}
            placeholder="Buscar finca, lote, plaga, producto, ingrediente o responsable..."
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
                <th style={styles.th}>Plaga objetivo</th>
                <th style={styles.th}>Producto</th>
                <th style={styles.th}>Ingrediente activo</th>
                <th style={styles.th}>Dosis</th>
                <th style={styles.th}>Responsable</th>
                <th style={styles.th}>GPS</th>
                <th style={styles.th}>Evidencia</th>
                {(puedeCrearEditar || puedeEliminar) && (
                  <th style={styles.th}>Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {aplicacionesFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={puedeCrearEditar || puedeEliminar ? "12" : "11"}
                    style={styles.empty}
                  >
                    No hay aplicaciones registradas.
                  </td>
                </tr>
              ) : (
                aplicacionesFiltradas.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{formatearFechaLocal(item.fecha)}</td>
                    <td style={styles.td}>{item.finca || "-"}</td>
                    <td style={styles.td}>{item.lote || "-"}</td>
                    <td style={styles.td}>{item.cultivo || "-"}</td>
                    <td style={styles.td}>{item.plaga_objetivo || "-"}</td>
                    <td style={styles.td}>{item.producto_aplicado || "-"}</td>
                    <td style={styles.td}>{item.ingrediente_activo || "-"}</td>
                    <td style={styles.td}>
                      {item.dosis || "-"} {item.unidad || ""}
                    </td>
                    <td style={styles.td}>{item.responsable || "-"}</td>

                    <td style={styles.td}>
                      {item.latitud && item.longitud ? (
                        <a
                          href={`https://www.google.com/maps?q=${item.latitud},${item.longitud}`}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.gpsLink}
                        >
                          Ver GPS
                        </a>
                      ) : (
                        <span style={styles.noGps}>Sin GPS</span>
                      )}
                    </td>

                    <td style={styles.td}>
                      {item.foto_url ? (
                        <a
                          href={`${BACKEND_URL}${item.foto_url}`}
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

                    {(puedeCrearEditar || puedeEliminar) && (
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          {puedeCrearEditar && (
                            <button
                              type="button"
                              onClick={() => iniciarEdicion(item)}
                              style={styles.editButton}
                              disabled={loading}
                            >
                              Editar
                            </button>
                          )}

                          {puedeEliminar && (
                            <button
                              type="button"
                              onClick={() => eliminarAplicacion(item.id)}
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
    minHeight: "80px",
    gridColumn: "1 / -1",
  },
  gpsButton: {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "none",
    background: "#0f766e",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
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
    whiteSpace: "nowrap",
  },
  gpsLink: {
    padding: "7px 12px",
    borderRadius: "10px",
    background: "#ccfbf1",
    color: "#0f766e",
    textDecoration: "none",
    fontWeight: "700",
    fontSize: "13px",
    display: "inline-block",
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

export default Aplicaciones;