// C:\siesa-fitosanitario\frontend\src\pages\Usuarios.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000/api";

function Usuarios({ usuario }) {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [mensaje, setMensaje] = useState({
    texto: "",
    tipo: "",
  });

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "Técnico",
    activo: true,
  });

  const esAdmin = usuario?.rol === "Admin";

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

  const cargarUsuarios = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsuarios(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(
        "Error cargando usuarios:",
        error.response?.data || error.message
      );

      mostrarMensaje(
        error.response?.data?.mensaje ||
          "No se pudieron cargar los usuarios.",
        "error"
      );

      setUsuarios([]);
    }
  };

  useEffect(() => {
    if (esAdmin) {
      cargarUsuarios();
    }
  }, [esAdmin]);

  const limpiarFormulario = () => {
    setForm({
      nombre: "",
      email: "",
      password: "",
      rol: "Técnico",
      activo: true,
    });

    setEditandoId(null);
    limpiarMensaje();
  };

  const validarFormulario = () => {
    limpiarMensaje();

    if (!esAdmin) {
      mostrarMensaje(
        "Solo un usuario Admin puede administrar usuarios.",
        "error"
      );
      return false;
    }

    if (!form.nombre || !form.email || !form.rol) {
      mostrarMensaje("Nombre, email y rol son obligatorios.", "error");
      return false;
    }

    if (!editandoId && !form.password) {
      mostrarMensaje(
        "La contraseña es obligatoria para crear usuario.",
        "error"
      );
      return false;
    }

    return true;
  };

  const prepararDataUsuario = () => ({
    nombre: form.nombre,
    email: form.email,
    password: form.password,
    rol: form.rol,
    activo: form.activo,
  });

  const guardarUsuario = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (editandoId) {
        await axios.put(
          `${API_URL}/users/${editandoId}`,
          prepararDataUsuario(),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        mostrarMensaje("Usuario actualizado correctamente.", "ok");
      } else {
        await axios.post(`${API_URL}/users`, prepararDataUsuario(), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        mostrarMensaje("Usuario creado correctamente.", "ok");
      }

      limpiarFormulario();
      cargarUsuarios();
    } catch (error) {
      console.error(
        "Error guardando usuario:",
        error.response?.data || error.message
      );

      mostrarMensaje(
        error.response?.data?.mensaje || "No se pudo guardar el usuario.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicion = (u) => {
    limpiarMensaje();

    setEditandoId(u.id);

    setForm({
      nombre: u.nombre || "",
      email: u.email || "",
      password: "",
      rol: u.rol || "Técnico",
      activo: u.activo === false ? false : true,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cambiarEstadoUsuario = async (u) => {
    const nuevoEstado = !u.activo;

    const confirmar = window.confirm(
      `¿Está seguro que desea ${nuevoEstado ? "activar" : "desactivar"} este usuario?`
    );

    if (!confirmar) return;

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_URL}/users/${u.id}/toggle-status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      mostrarMensaje(
        `Usuario ${nuevoEstado ? "activado" : "desactivado"} correctamente.`,
        "ok"
      );

      cargarUsuarios();
    } catch (error) {
      console.error(
        "Error cambiando estado:",
        error.response?.data || error.message
      );

      mostrarMensaje(
        error.response?.data?.mensaje ||
          "No se pudo cambiar el estado del usuario.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const eliminarUsuario = async (id) => {
    const confirmar = window.confirm(
      "¿Está seguro que desea eliminar este usuario?"
    );

    if (!confirmar) return;

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      await axios.delete(`${API_URL}/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      cargarUsuarios();

      mostrarMensaje("Usuario eliminado correctamente.", "ok");
    } catch (error) {
      console.error(
        "Error eliminando usuario:",
        error.response?.data || error.message
      );

      mostrarMensaje(
        error.response?.data?.mensaje || "No se pudo eliminar el usuario.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const texto = `
      ${u.nombre || ""}
      ${u.email || ""}
      ${u.rol || ""}
      ${u.activo ? "activo" : "inactivo"}
    `.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  const totalUsuarios = usuarios.length;
  const totalAdmin = usuarios.filter((u) => u.rol === "Admin").length;
  const totalTecnicos = usuarios.filter((u) => u.rol === "Técnico").length;
  const totalConsulta = usuarios.filter((u) => u.rol === "Consulta").length;
  const totalActivos = usuarios.filter((u) => u.activo !== false).length;
  const totalInactivos = usuarios.filter((u) => u.activo === false).length;

  if (!esAdmin) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Usuarios</h1>

        <div style={styles.messageBoxError}>
          No tiene permisos para administrar usuarios.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Usuarios</h1>

      <p style={styles.subtitle}>
        Administración de accesos, roles, estados y permisos del sistema fitosanitario.
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
          <p style={styles.cardLabel}>Total usuarios</p>
          <h2 style={styles.cardNumber}>{totalUsuarios}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Administradores</p>
          <h2 style={styles.cardNumber}>{totalAdmin}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Técnicos</p>
          <h2 style={styles.cardNumber}>{totalTecnicos}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Consulta</p>
          <h2 style={styles.cardNumber}>{totalConsulta}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Activos</p>
          <h2 style={{ ...styles.cardNumber, color: "#166534" }}>
            {totalActivos}
          </h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Inactivos</p>
          <h2 style={{ ...styles.cardNumber, color: "#991b1b" }}>
            {totalInactivos}
          </h2>
        </div>
      </div>

      <div style={styles.panel}>
        <h2 style={styles.panelTitle}>
          {editandoId ? "Editar usuario" : "Crear nuevo usuario"}
        </h2>

        <form onSubmit={guardarUsuario} style={styles.form}>
          <input
            style={styles.input}
            type="text"
            placeholder="Nombre completo"
            value={form.nombre}
            onChange={(e) => {
              limpiarMensaje();
              setForm({
                ...form,
                nombre: e.target.value,
              });
            }}
          />

          <input
            style={styles.input}
            type="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={(e) => {
              limpiarMensaje();
              setForm({
                ...form,
                email: e.target.value,
              });
            }}
          />

          <input
            style={styles.input}
            type="password"
            placeholder={
              editandoId ? "Nueva contraseña (opcional)" : "Contraseña"
            }
            value={form.password}
            onChange={(e) => {
              limpiarMensaje();
              setForm({
                ...form,
                password: e.target.value,
              });
            }}
          />

          <select
            style={styles.input}
            value={form.rol}
            onChange={(e) => {
              limpiarMensaje();
              setForm({
                ...form,
                rol: e.target.value,
              });
            }}
          >
            <option value="Admin">Admin</option>
            <option value="Técnico">Técnico</option>
            <option value="Consulta">Consulta</option>
          </select>

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
              : "+ Crear usuario"}
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
          <h2 style={styles.panelTitle}>Listado de usuarios</h2>

          <input
            style={styles.search}
            type="text"
            placeholder="Buscar usuario, correo, rol o estado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Correo</th>
                <th style={styles.th}>Rol</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" style={styles.empty}>
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => (
                  <tr key={u.id}>
                    <td style={styles.td}>{u.nombre || "-"}</td>

                    <td style={styles.td}>{u.email || "-"}</td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(u.rol === "Admin"
                            ? styles.badgeAdmin
                            : u.rol === "Técnico"
                            ? styles.badgeTecnico
                            : styles.badgeConsulta),
                        }}
                      >
                        {u.rol || "-"}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(u.activo === false
                            ? styles.badgeInactivo
                            : styles.badgeActivo),
                        }}
                      >
                        {u.activo === false ? "Inactivo" : "Activo"}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button
                          type="button"
                          onClick={() => iniciarEdicion(u)}
                          style={styles.editButton}
                          disabled={loading}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => cambiarEstadoUsuario(u)}
                          style={
                            u.activo === false
                              ? styles.enableButton
                              : styles.disableButton
                          }
                          disabled={loading}
                        >
                          {u.activo === false ? "Activar" : "Desactivar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => eliminarUsuario(u.id)}
                          style={styles.deleteButton}
                          disabled={loading}
                        >
                          Eliminar
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

  badgeAdmin: {
    background: "#fee2e2",
    color: "#991b1b",
  },

  badgeTecnico: {
    background: "#dbeafe",
    color: "#1e40af",
  },

  badgeConsulta: {
    background: "#dcfce7",
    color: "#166534",
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
};

export default Usuarios;