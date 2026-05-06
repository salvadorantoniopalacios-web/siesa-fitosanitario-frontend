import React, { useEffect, useState } from "react";

function Layout({ children, setVista, alertasCriticas = 0, usuario }) {
  const esAdmin = usuario?.rol === "Admin";
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [esMovil, setEsMovil] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const detectarPantalla = () => {
      setEsMovil(window.innerWidth <= 768);
    };

    window.addEventListener("resize", detectarPantalla);

    return () => {
      window.removeEventListener("resize", detectarPantalla);
    };
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.reload();
  };

  const cambiarVista = (vista) => {
    setVista(vista);

    if (esMovil) {
      setMenuAbierto(false);
    }
  };

  return (
    <div style={styles.container}>
      {esMovil && (
        <header style={styles.mobileHeader}>
          <button
            type="button"
            style={styles.mobileMenuButton}
            onClick={() => setMenuAbierto(true)}
          >
            ☰
          </button>

          <strong style={styles.mobileLogo}>🌿 SIESA</strong>

          {alertasCriticas > 0 && (
            <span style={styles.mobileBadge}>{alertasCriticas}</span>
          )}
        </header>
      )}

      {esMovil && menuAbierto && (
        <div style={styles.overlay} onClick={() => setMenuAbierto(false)} />
      )}

      <aside
        style={{
          ...styles.sidebar,
          ...(esMovil ? styles.sidebarMovil : {}),
          ...(esMovil && menuAbierto ? styles.sidebarMovilAbierto : {}),
        }}
      >
        <h2 style={styles.logo}>🌿 SIESA</h2>

        {usuario && (
          <div style={styles.userBox}>
            <strong>{usuario.nombre || "Usuario"}</strong>
            <span>{usuario.rol || "Sin rol"}</span>
          </div>
        )}

        <div style={styles.menu} onClick={() => cambiarVista("inicio")}>
          🏠 Inicio
        </div>

        <div style={styles.menu} onClick={() => cambiarVista("fincas")}>
          🌱 Fincas
        </div>

        <div style={styles.menu} onClick={() => cambiarVista("lotes")}>
          🧾 Lotes
        </div>

        <div style={styles.menu} onClick={() => cambiarVista("evaluaciones")}>
          📊 Evaluaciones
        </div>

        <div style={styles.menu} onClick={() => cambiarVista("alertas")}>
          <span>🚨 Alertas</span>

          {alertasCriticas > 0 && (
            <span style={styles.badge}>{alertasCriticas}</span>
          )}
        </div>

        <div style={styles.menu} onClick={() => cambiarVista("mapa")}>
          🗺️ Mapa
        </div>

        {esAdmin && (
          <div style={styles.menu} onClick={() => cambiarVista("usuarios")}>
            👥 Usuarios
          </div>
        )}

        <button style={styles.logoutButton} onClick={cerrarSesion}>
          🚪 Cerrar sesión
        </button>
      </aside>

      <main
        style={{
          ...styles.main,
          ...(esMovil ? styles.mainMovil : {}),
        }}
      >
        {children}
      </main>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Arial",
    background: "#f4f6f5",
  },
  sidebar: {
    width: "240px",
    minWidth: "240px",
    background: "linear-gradient(#064e2b, #022c22)",
    color: "#fff",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    position: "sticky",
    top: 0,
    boxSizing: "border-box",
    zIndex: 20,
  },
  sidebarMovil: {
    position: "fixed",
    left: 0,
    top: 0,
    transform: "translateX(-100%)",
    transition: "transform 0.25s ease",
    height: "100vh",
    width: "260px",
    minWidth: "260px",
  },
  sidebarMovilAbierto: {
    transform: "translateX(0)",
  },
  logo: {
    marginBottom: "20px",
  },
  userBox: {
    background: "rgba(255,255,255,0.12)",
    padding: "12px",
    borderRadius: "10px",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "13px",
  },
  menu: {
    padding: "12px",
    marginBottom: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    background: "#dc2626",
    color: "#fff",
    borderRadius: "999px",
    padding: "3px 8px",
    fontSize: "12px",
    fontWeight: "700",
  },
  logoutButton: {
    marginTop: "auto",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#dc2626",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },
  main: {
    flex: 1,
    background: "#f4f6f5",
    padding: "25px",
    overflow: "auto",
    boxSizing: "border-box",
    width: "100%",
  },
  mainMovil: {
    padding: "78px 14px 18px",
  },
  mobileHeader: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "58px",
    background: "linear-gradient(90deg, #064e2b, #022c22)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 14px",
    zIndex: 30,
    boxShadow: "0 8px 18px rgba(15,23,42,0.18)",
    boxSizing: "border-box",
  },
  mobileMenuButton: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.12)",
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: "800",
    cursor: "pointer",
  },
  mobileLogo: {
    fontSize: "18px",
  },
  mobileBadge: {
    background: "#dc2626",
    color: "#ffffff",
    borderRadius: "999px",
    padding: "5px 10px",
    fontSize: "12px",
    fontWeight: "800",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.45)",
    zIndex: 15,
  },
};

export default Layout;