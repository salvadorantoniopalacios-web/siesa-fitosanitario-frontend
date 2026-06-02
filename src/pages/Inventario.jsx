import React, { useEffect, useState } from "react";
import axios from "../api/axiosConfig.js";

function Inventario({ usuario }) {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  const [form, setForm] = useState({
    nombre: "",
    ingrediente_activo: "",
    proveedor: "",
    existencia: "",
    unidad: "L",
    costo_unitario: "",
    fecha_vencimiento: "",
    estado: "Activo",
  });

  const esSuperAdmin = usuario?.rol === "SuperAdmin";
  const esAdmin = usuario?.rol === "Admin";
  const esTecnico = usuario?.rol === "Técnico";
  const esConsulta = usuario?.rol === "Consulta";

  const puedeCrearEditar = esSuperAdmin || esAdmin || esTecnico;
  const puedeEliminar = esSuperAdmin || esAdmin;

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 4500);
  };

  const limpiarMensaje = () => {
    setMensaje({ texto: "", tipo: "" });
  };

  const cargarProductos = async () => {
    try {
      const res = await axios.get("/inventory");
      setProductos(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error cargando inventario:", error.response?.data || error.message);
      mostrarMensaje("No se pudo cargar el inventario.", "error");
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const limpiarFormulario = () => {
    setForm({
      nombre: "",
      ingrediente_activo: "",
      proveedor: "",
      existencia: "",
      unidad: "L",
      costo_unitario: "",
      fecha_vencimiento: "",
      estado: "Activo",
    });

    setEditandoId(null);
    limpiarMensaje();
  };

  const validarFormulario = () => {
    limpiarMensaje();

    if (!puedeCrearEditar) {
      mostrarMensaje("No tiene permisos para crear o editar inventario.", "error");
      return false;
    }

    if (!form.nombre.trim()) {
      mostrarMensaje("El nombre del producto es obligatorio.", "error");
      return false;
    }

    if (form.existencia !== "" && Number(form.existencia) < 0) {
      mostrarMensaje("La existencia no puede ser negativa.", "error");
      return false;
    }

    if (form.costo_unitario !== "" && Number(form.costo_unitario) < 0) {
      mostrarMensaje("El costo unitario no puede ser negativo.", "error");
      return false;
    }

    return true;
  };

  const prepararData = () => ({
    nombre: form.nombre.trim(),
    ingrediente_activo: form.ingrediente_activo.trim(),
    proveedor: form.proveedor.trim(),
    existencia: form.existencia === "" ? 0 : Number(form.existencia),
    unidad: form.unidad,
    costo_unitario:
      form.costo_unitario === "" ? null : Number(form.costo_unitario),
    fecha_vencimiento: form.fecha_vencimiento || null,
    estado: form.estado,
  });

  const guardarProducto = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setLoading(true);

      if (editandoId) {
        await axios.put(`/inventory/${editandoId}`, prepararData());
        mostrarMensaje("Producto actualizado correctamente.", "ok");
      } else {
        await axios.post("/inventory", prepararData());
        mostrarMensaje("Producto creado correctamente.", "ok");
      }

      limpiarFormulario();
      await cargarProductos();
    } catch (error) {
      console.error("Error guardando producto:", error.response?.data || error.message);

      mostrarMensaje(
        error.response?.data?.mensaje || "No se pudo guardar el producto.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicion = (producto) => {
    if (!puedeCrearEditar) {
      mostrarMensaje("No tiene permisos para editar inventario.", "error");
      return;
    }

    setEditandoId(producto.id);

    setForm({
      nombre: producto.nombre || "",
      ingrediente_activo: producto.ingrediente_activo || "",
      proveedor: producto.proveedor || "",
      existencia: producto.existencia || "",
      unidad: producto.unidad || "L",
      costo_unitario: producto.costo_unitario || "",
      fecha_vencimiento: producto.fecha_vencimiento
        ? String(producto.fecha_vencimiento).substring(0, 10)
        : "",
      estado: producto.estado || "Activo",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminarProducto = async (id) => {
    if (!puedeEliminar) {
      mostrarMensaje("No tiene permisos para eliminar productos.", "error");
      return;
    }

    const confirmar = window.confirm(
      "¿Está seguro que desea eliminar este producto del inventario?"
    );

    if (!confirmar) return;

    try {
      setLoading(true);
      await axios.delete(`/inventory/${id}`);
      await cargarProductos();
      mostrarMensaje("Producto eliminado correctamente.", "ok");
    } catch (error) {
      console.error("Error eliminando producto:", error.response?.data || error.message);

      mostrarMensaje(
        error.response?.data?.mensaje || "No se pudo eliminar el producto.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const texto = String(fecha).substring(0, 10);
    const [year, month, day] = texto.split("-");
    if (!year || !month || !day) return "-";
    return `${day}/${month}/${year}`;
  };

  const estaPorVencer = (fecha) => {
    if (!fecha) return false;

    const hoy = new Date();
    const vencimiento = new Date(fecha);
    const diferenciaDias = (vencimiento - hoy) / (1000 * 60 * 60 * 24);

    return diferenciaDias >= 0 && diferenciaDias <= 30;
  };

  const estaVencido = (fecha) => {
    if (!fecha) return false;

    const hoy = new Date();
    const vencimiento = new Date(fecha);

    return vencimiento < hoy;
  };

  const productosFiltrados = productos.filter((producto) => {
    const texto = `
      ${producto.nombre || ""}
      ${producto.ingrediente_activo || ""}
      ${producto.proveedor || ""}
      ${producto.unidad || ""}
      ${producto.estado || ""}
    `.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  const totalProductos = productos.length;
  const activos = productos.filter((p) => p.estado === "Activo").length;
  const bajoStock = productos.filter((p) => Number(p.existencia || 0) <= 5).length;
  const vencidos = productos.filter((p) => estaVencido(p.fecha_vencimiento)).length;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Inventario Agroquímicos</h1>

      <p style={styles.subtitle}>
        Control de productos, existencias, ingredientes activos, costos y vencimientos.
      </p>

      {usuario && (
        <div style={styles.roleBox}>
          Rol activo: <strong>{usuario.rol}</strong>
          {esConsulta && <span style={styles.roleNote}> | Modo consulta</span>}
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
          <p style={styles.cardLabel}>Total productos</p>
          <h2 style={styles.cardNumber}>{totalProductos}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Activos</p>
          <h2 style={{ ...styles.cardNumber, color: "#166534" }}>{activos}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Bajo stock</p>
          <h2 style={{ ...styles.cardNumber, color: "#ca8a04" }}>{bajoStock}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Vencidos</p>
          <h2 style={{ ...styles.cardNumber, color: "#991b1b" }}>{vencidos}</h2>
        </div>
      </div>

      {puedeCrearEditar && (
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>
            {editandoId ? "Editar producto" : "Nuevo producto"}
          </h2>

          <form onSubmit={guardarProducto} style={styles.form}>
            <input
              style={styles.input}
              placeholder="Nombre del producto"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />

            <input
              style={styles.input}
              placeholder="Ingrediente activo"
              value={form.ingrediente_activo}
              onChange={(e) =>
                setForm({ ...form, ingrediente_activo: e.target.value })
              }
            />

            <input
              style={styles.input}
              placeholder="Proveedor"
              value={form.proveedor}
              onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
            />

            <input
              style={styles.input}
              type="number"
              min="0"
              step="0.01"
              placeholder="Existencia"
              value={form.existencia}
              onChange={(e) => setForm({ ...form, existencia: e.target.value })}
            />

            <select
              style={styles.input}
              value={form.unidad}
              onChange={(e) => setForm({ ...form, unidad: e.target.value })}
            >
              <option value="L">L</option>
              <option value="ml">ml</option>
              <option value="Kg">Kg</option>
              <option value="g">g</option>
              <option value="Unidad">Unidad</option>
              <option value="Galón">Galón</option>
            </select>

            <input
              style={styles.input}
              type="number"
              min="0"
              step="0.01"
              placeholder="Costo unitario"
              value={form.costo_unitario}
              onChange={(e) =>
                setForm({ ...form, costo_unitario: e.target.value })
              }
            />

            <input
              style={styles.input}
              type="date"
              value={form.fecha_vencimiento}
              onChange={(e) =>
                setForm({ ...form, fecha_vencimiento: e.target.value })
              }
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
                : "Crear producto"}
            </button>

            <button
              type="button"
              style={styles.cancelButton}
              onClick={limpiarFormulario}
              disabled={loading}
            >
              Limpiar
            </button>
          </form>
        </div>
      )}

      <div style={styles.panel}>
        <div style={styles.tableHeader}>
          <h2 style={styles.panelTitle}>Listado de productos</h2>

          <input
            style={styles.search}
            placeholder="Buscar producto, ingrediente, proveedor o estado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Producto</th>
                <th style={styles.th}>Ingrediente activo</th>
                <th style={styles.th}>Proveedor</th>
                <th style={styles.th}>Existencia</th>
                <th style={styles.th}>Costo</th>
                <th style={styles.th}>Vencimiento</th>
                <th style={styles.th}>Estado</th>
                {(puedeCrearEditar || puedeEliminar) && (
                  <th style={styles.th}>Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={puedeCrearEditar || puedeEliminar ? "8" : "7"}
                    style={styles.empty}
                  >
                    No hay productos registrados.
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((producto) => (
                  <tr key={producto.id}>
                    <td style={styles.td}>{producto.nombre || "-"}</td>
                    <td style={styles.td}>{producto.ingrediente_activo || "-"}</td>
                    <td style={styles.td}>{producto.proveedor || "-"}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(Number(producto.existencia || 0) <= 5
                            ? styles.badgeWarning
                            : styles.badgeOk),
                        }}
                      >
                        {producto.existencia || 0} {producto.unidad || ""}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {producto.costo_unitario
                        ? `Q ${producto.costo_unitario}`
                        : "-"}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(estaVencido(producto.fecha_vencimiento)
                            ? styles.badgeError
                            : estaPorVencer(producto.fecha_vencimiento)
                            ? styles.badgeWarning
                            : styles.badgeNeutral),
                        }}
                      >
                        {formatearFecha(producto.fecha_vencimiento)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(producto.estado === "Activo"
                            ? styles.badgeOk
                            : styles.badgeError),
                        }}
                      >
                        {producto.estado}
                      </span>
                    </td>

                    {(puedeCrearEditar || puedeEliminar) && (
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          {puedeCrearEditar && (
                            <button
                              type="button"
                              style={styles.editButton}
                              onClick={() => iniciarEdicion(producto)}
                              disabled={loading}
                            >
                              Editar
                            </button>
                          )}

                          {puedeEliminar && (
                            <button
                              type="button"
                              style={styles.deleteButton}
                              onClick={() => eliminarProducto(producto.id)}
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
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
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
    fontWeight: "800",
    fontSize: "13px",
  },
  badgeOk: {
    background: "#dcfce7",
    color: "#166534",
  },
  badgeWarning: {
    background: "#fef3c7",
    color: "#92400e",
  },
  badgeError: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  badgeNeutral: {
    background: "#f1f5f9",
    color: "#475569",
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

export default Inventario;