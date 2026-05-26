import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

function Empresas({ usuario }) {
  const [empresas, setEmpresas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [mensaje, setMensaje] = useState({
    texto: "",
    tipo: "",
  });

  const [form, setForm] = useState({
    nombre: "",
    nit: "",
    direccion: "",
    telefono: "",
    logo_url: "",
    activo: true,
  });

  const esSuperAdmin = usuario?.rol === "SuperAdmin";

  const obtenerToken = () => {
    const token =
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("siesa_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("siesa_token");

    if (!token || token === "undefined" || token === "null") {
      return "";
    }

    return token;
  };

  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${obtenerToken()}`,
    },
  });

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });

    setTimeout(() => {
      setMensaje({ texto: "", tipo: "" });
    }, 4500);
  };

  const limpiarMensaje = () => {
    setMensaje({
      texto: "",
      tipo: "",
    });
  };

  const cargarEmpresas = async () => {
    try {
      if (!obtenerToken()) {
        mostrarMensaje("Debe cerrar sesión e iniciar sesión nuevamente.", "error");
        setEmpresas([]);
        return;
      }

      const res = await axios.get(`${API_URL}/companies`, getHeaders());

      setEmpresas(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error cargando empresas:", error.response?.data || error.message);

      mostrarMensaje(
        error.response?.data?.mensaje || "No se pudieron cargar las empresas.",
        "error"
      );

      setEmpresas([]);
    }
  };

  useEffect(() => {
    if (esSuperAdmin) {
      cargarEmpresas();
    }
  }, [esSuperAdmin]);

  const limpiarFormulario = () => {
    setForm({
      nombre: "",
      nit: "",
      direccion: "",
      telefono: "",
      logo_url: "",
      activo: true,
    });

    setEditandoId(null);
    limpiarMensaje();
  };

  const validarFormulario = () => {
    limpiarMensaje();

    if (!esSuperAdmin) {
      mostrarMensaje("Solo un usuario SuperAdmin puede administrar empresas.", "error");
      return false;
    }

    if (!obtenerToken()) {
      mostrarMensaje("Debe cerrar sesión e iniciar sesión nuevamente.", "error");
      return false;
    }

    if (!form.nombre.trim()) {
      mostrarMensaje("El nombre de la empresa es obligatorio.", "error");
      return false;
    }

    return true;
  };

  const prepararDataEmpresa = () => ({
    nombre: form.nombre.trim(),
    nit: form.nit.trim(),
    direccion: form.direccion.trim(),
    telefono: form.telefono.trim(),
    logo_url: form.logo_url.trim(),
    activo: form.activo,
  });

  const guardarEmpresa = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setLoading(true);

      if (editandoId) {
        await axios.put(
          `${API_URL}/companies/${editandoId}`,
          prepararDataEmpresa(),
          getHeaders()
        );

        mostrarMensaje("Empresa actualizada correctamente.", "ok");
      } else {
        await axios.post(
          `${API_URL}/companies`,
          prepararDataEmpresa(),
          getHeaders()
        );

        mostrarMensaje("Empresa creada correctamente.", "ok");
      }

      limpiarFormulario();
      cargarEmpresas();
    } catch (error) {
      console.error("Error guardando empresa:", error.response?.data || error.message);

      mostrarMensaje(
        error.response?.data?.mensaje || "No se pudo guardar la empresa.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicion = (empresa) => {
    limpiarMensaje();

    setEditandoId(empresa.id);

    setForm({
      nombre: empresa.nombre || "",
      nit: empresa.nit || "",
      direccion: empresa.direccion || "",
      telefono: empresa.telefono || "",
      logo_url: empresa.logo_url || "",
      activo: empresa.activo === false ? false : true,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cambiarEstadoEmpresa = async (empresa) => {
    const nuevoEstado = !empresa.activo;

    const confirmar = window.confirm(
      `¿Está seguro que desea ${nuevoEstado ? "activar" : "desactivar"} esta empresa?`
    );

    if (!confirmar) return;

    try {
      setLoading(true);

      await axios.patch(
        `${API_URL}/companies/${empresa.id}/toggle-status`,
        {},
        getHeaders()
      );

      mostrarMensaje(
        `Empresa ${nuevoEstado ? "activada" : "desactivada"} correctamente.`,
        "ok"
      );

      cargarEmpresas();
    } catch (error) {
      console.error("Error cambiando estado:", error.response?.data || error.message);

      mostrarMensaje(
        error.response?.data?.mensaje ||
          "No se pudo cambiar el estado de la empresa.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const empresasFiltradas = empresas.filter((empresa) => {
    const texto = `
      ${empresa.nombre || ""}
      ${empresa.nit || ""}
      ${empresa.direccion || ""}
      ${empresa.telefono || ""}
      ${empresa.activo ? "activo" : "inactivo"}
    `.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  const totalEmpresas = empresas.length;
  const totalActivas = empresas.filter((empresa) => empresa.activo !== false).length;
  const totalInactivas = empresas.filter((empresa) => empresa.activo === false).length;

  if (!esSuperAdmin) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Empresas</h1>

        <div style={styles.messageBoxError}>
          No tiene permisos para administrar empresas.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Empresas</h1>

      <p style={styles.subtitle}>
        Administración de clientes, empresas y cuentas comerciales del sistema.
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
          <p style={styles.cardLabel}>Total empresas</p>
          <h2 style={styles.cardNumber}>{totalEmpresas}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Activas</p>
          <h2 style={{ ...styles.cardNumber, color: "#166534" }}>
            {totalActivas}
          </h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Inactivas</p>
          <h2 style={{ ...styles.cardNumber, color: "#991b1b" }}>
            {totalInactivas}
          </h2>
        </div>
      </div>

      <div style={styles.panel}>
        <h2 style={styles.panelTitle}>
          {editandoId ? "Editar empresa" : "Crear nueva empresa"}
        </h2>

        <form onSubmit={guardarEmpresa} style={styles.form}>
          <input
            style={styles.input}
            type="text"
            placeholder="Nombre de empresa"
            value={form.nombre}
            onChange={(e) => {
              limpiarMensaje();
              setForm({ ...form, nombre: e.target.value });
            }}
          />

          <input
            style={styles.input}
            type="text"
            placeholder="NIT"
            value={form.nit}
            onChange={(e) => {
              limpiarMensaje();
              setForm({ ...form, nit: e.target.value });
            }}
          />

          <input
            style={styles.input}
            type="text"
            placeholder="Dirección"
            value={form.direccion}
            onChange={(e) => {
              limpiarMensaje();
              setForm({ ...form, direccion: e.target.value });
            }}
          />

          <input
            style={styles.input}
            type="text"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={(e) => {
              limpiarMensaje();
              setForm({ ...form, telefono: e.target.value });
            }}
          />

          <input
            style={styles.input}
            type="text"
            placeholder="URL del logo"
            value={form.logo_url}
            onChange={(e) => {
              limpiarMensaje();
              setForm({ ...form, logo_url: e.target.value });
            }}
          />

          {editandoId && (
            <select
              style={styles.input}
              value={form.activo ? "Activo" : "Inactivo"}
              onChange={(e) => {
                limpiarMensaje();
                setForm({
                  ...form,
                  activo: e.target.value === "Activo",
                });
              }}
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          )}

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
              : "+ Crear empresa"}
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

      <div style={styles.panel}>
        <div style={styles.tableHeader}>
          <h2 style={styles.panelTitle}>Listado de empresas</h2>

          <input
            style={styles.search}
            type="text"
            placeholder="Buscar empresa, NIT, dirección, teléfono o estado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Empresa</th>
                <th style={styles.th}>NIT</th>
                <th style={styles.th}>Dirección</th>
                <th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {empresasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.empty}>
                    No hay empresas registradas.
                  </td>
                </tr>
              ) : (
                empresasFiltradas.map((empresa) => (
                  <tr key={empresa.id}>
                    <td style={styles.td}>{empresa.nombre || "-"}</td>
                    <td style={styles.td}>{empresa.nit || "-"}</td>
                    <td style={styles.td}>{empresa.direccion || "-"}</td>
                    <td style={styles.td}>{empresa.telefono || "-"}</td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(empresa.activo === false
                            ? styles.badgeInactivo
                            : styles.badgeActivo),
                        }}
                      >
                        {empresa.activo === false ? "Inactiva" : "Activa"}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button
                          type="button"
                          onClick={() => iniciarEdicion(empresa)}
                          style={styles.editButton}
                          disabled={loading}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => cambiarEstadoEmpresa(empresa)}
                          style={
                            empresa.activo === false
                              ? styles.enableButton
                              : styles.disableButton
                          }
                          disabled={loading}
                        >
                          {empresa.activo === false ? "Activar" : "Desactivar"}
                        </button>
                      </div>
                    </td>
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
  },
  messageOk: {
    background: "#dcfce7",
    color: "#166534",
  },
  messageError: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  messageBoxError: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "18px",
    borderRadius: "14px",
    fontWeight: "700",
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
  },
  cardLabel: {
    color: "#64748b",
  },
  cardNumber: {
    fontSize: "32px",
    color: "#0f172a",
  },
  panel: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
  },
  panelTitle: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "18px",
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
    marginBottom: "14px",
    gap: "14px",
    flexWrap: "wrap",
  },
  search: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    minWidth: "300px",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    background: "#f1f5f9",
    padding: "14px",
    textAlign: "left",
  },
  td: {
    padding: "14px",
    borderBottom: "1px solid #e2e8f0",
  },
  badge: {
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "13px",
  },
  badgeActivo: {
    background: "#dcfce7",
    color: "#166534",
  },
  badgeInactivo: {
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
  },
  enableButton: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#15803d",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },
  disableButton: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#f59e0b",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },
  empty: {
    textAlign: "center",
    padding: "28px",
    color: "#64748b",
  },
};

export default Empresas;