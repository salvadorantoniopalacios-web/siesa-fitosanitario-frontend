import React, { useState } from "react";
import axios from "axios";

function Login({ setUsuario }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("");
  const [credencialesValidadas, setCredencialesValidadas] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const guardarSesion = (data) => {
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("usuario", JSON.stringify(data.usuario));

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    setUsuario(data.usuario);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMensaje("");

      const payload = {
        email,
        password,
      };

      if (empresaSeleccionada) {
        payload.company_id = empresaSeleccionada;
      }

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        payload
      );

      const empresasDisponibles =
        res.data.usuario?.empresas_disponibles || [];

      if (
        empresasDisponibles.length > 1 &&
        !empresaSeleccionada &&
        !credencialesValidadas
      ) {
        setEmpresas(empresasDisponibles);
        setCredencialesValidadas(true);
        setEmpresaSeleccionada(String(empresasDisponibles[0].id));
        setMensaje("Seleccione la empresa con la que desea ingresar.");
        return;
      }

      guardarSesion(res.data);
    } catch (error) {
      setMensaje(
        error.response?.data?.mensaje || "Usuario o contraseña incorrectos"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>

      <div style={styles.card}>
        <div style={styles.logoCircle}>🌿</div>

        <h1 style={styles.title}>SIESA</h1>
        <p style={styles.subtitle}>Sistema de Información Fitosanitaria</p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Usuario / correo"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setCredencialesValidadas(false);
              setEmpresas([]);
              setEmpresaSeleccionada("");
            }}
            style={styles.input}
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setCredencialesValidadas(false);
              setEmpresas([]);
              setEmpresaSeleccionada("");
            }}
            style={styles.input}
            disabled={loading}
          />

          {empresas.length > 1 && (
            <select
              style={styles.input}
              value={empresaSeleccionada}
              onChange={(e) => setEmpresaSeleccionada(e.target.value)}
              disabled={loading}
            >
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
          )}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading
              ? "Validando..."
              : empresas.length > 1
              ? "Ingresar a empresa"
              : "Ingresar"}
          </button>

          <p style={styles.forgot}>¿Olvidaste tu contraseña?</p>
          <p style={styles.mensaje}>{mensaje}</p>
        </form>

        <p style={styles.footer}>
          © 2026 SIESA. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    backgroundImage:
      "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    fontFamily: "Arial, sans-serif",
  },

  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    background:
      "linear-gradient(rgba(0, 50, 20, 0.25), rgba(0, 0, 0, 0.35))",
  },

  card: {
    position: "relative",
    background: "rgba(255,255,255,0.96)",
    padding: "38px",
    borderRadius: "12px",
    width: "350px",
    textAlign: "center",
    zIndex: 1,
    boxShadow: "0 15px 40px rgba(0,0,0,0.25)",
  },

  logoCircle: {
    fontSize: "42px",
    marginBottom: "5px",
  },

  title: {
    margin: 0,
    color: "#0f7a35",
    fontSize: "30px",
    fontWeight: "bold",
  },

  subtitle: {
    marginBottom: "25px",
    fontSize: "14px",
    color: "#333",
  },

  input: {
    width: "100%",
    padding: "12px",
    margin: "9px 0",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
  },

  button: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    background: "#138a3d",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  forgot: {
    fontSize: "12px",
    color: "#138a3d",
    marginTop: "15px",
  },

  mensaje: {
    color: "#b91c1c",
    fontSize: "13px",
    minHeight: "18px",
  },

  footer: {
    marginTop: "20px",
    fontSize: "11px",
    color: "#777",
  },
};

export default Login;