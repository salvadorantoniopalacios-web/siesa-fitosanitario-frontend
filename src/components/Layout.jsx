import React, { useEffect, useState } from "react";

function Layout({ children, setVista, alertasCriticas = 0, usuario }) {
  const esAdmin = usuario?.rol?.toLowerCase() === "admin";
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [esMovil, setEsMovil] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const detectarPantalla = () => {
      setEsMovil(window.innerWidth <= 768);
    };

    window.addEventListener("resize", detectarPantalla);
    detectarPantalla();

    return () => {
      window.removeEventListener("resize", detectarPantalla);
    };
  }, []);

  const cerrarSesion = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("usuario");
    sessionStorage.removeItem("siesa_token");
    sessionStorage.removeItem("siesa_usuario");

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("siesa_token");
    localStorage.removeItem("siesa_usuario");

    window.location.reload();
  };

  const cambiarVista = (vista) => {
    setVista(vista);

    if (esMovil) {
      setMenuAbierto(false);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const opcionMenu = (emoji, texto, vista, extra = null) => (
    <button type="button" style={styles.menuButton} onClick={() => cambiarVista(vista)}>
      <span>
        {emoji} {texto}
      </span>
      {extra}
    </button>
  );

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

          {alertasCriticas > 0 ? (
            <span style={styles.mobileBadge}>{alertasCriticas}</span>
          ) : (
            <span style={styles.mobileStatus}>Online</span>
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
        {esMovil && (
          <button
            type="button"
            style={styles.closeButton}
            onClick={() => setMenuAbierto(false)}
          >
            ✕
          </button>
        )}

        <h2 style={styles.logo}>🌿 SIESA</h2>

        {usuario && (
          <div style={styles.userBox}>
            <strong>{usuario.nombre || usuario.email || "Usuario"}</strong>
            <span>{usuario.rol || "Sin rol"}</span>
          </div>
        )}

        <nav style={styles.nav}>
          {opcionMenu("🏠", "Inicio", "inicio")}
          {opcionMenu("🌱", "Fincas", "fincas")}
          {opcionMenu("🧾", "Lotes", "lotes")}
          {opcionMenu("🌾", "Cultivos", "cultivos")}
          {opcionMenu("🐛", "Plagas", "plagas")}
          {opcionMenu("🤖", "Consulta IA", "consultaIA")}
          {opcionMenu("📊", "Evaluaciones", "evaluaciones")}
          {opcionMenu("💧", "Aplicaciones", "aplicaciones")}

          {opcionMenu(
            "🚨",
            "Alertas",
            "alertas",
            alertasCriticas > 0 && <span style={styles.badge}>{alertasCriticas}</span>
          )}

          {opcionMenu("🗺️", "Mapa", "mapa")}

          {esAdmin && opcionMenu("👥", "Usuarios", "usuarios")}
        </nav>

        <button type="button" style={styles.logoutButton} onClick={cerrarSesion}>
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
    fontFamily: "Arial, sans-serif",
    background: "#f4f6f5",
  },

  sidebar: {
    width: "240px",
    minWidth: "240px",
    background: "linear-gradient(#064e2b, #022c22)",
    color: "#ffffff",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    position: "sticky",
    top: 0,
    boxSizing: "border-box",
    zIndex: 20,
    boxShadow: "8px 0 24px rgba(15,23,42,0.16)",
  },

  sidebarMovil: {
    position: "fixed",
    left: 0,
    top: 0,
    transform: "translateX(-105%)",
    transition: "transform 0.25s ease",
    height: "100vh",
    width: "285px",
    minWidth: "285px",
    zIndex: 40,
    borderTopRightRadius: "20px",
    borderBottomRightRadius: "20px",
  },

  sidebarMovilAbierto: {
    transform: "translateX(0)",
  },

  closeButton: {
    position: "absolute",
    top: "14px",
    right: "14px",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.12)",
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: "800",
    cursor: "pointer",
  },

  logo: {
    margin: "8px 0 20px",
    fontSize: "24px",
    fontWeight: "900",
    letterSpacing: "0.5px",
  },

  userBox: {
    background: "rgba(255,255,255,0.12)",
    padding: "14px",
    borderRadius: "14px",
    marginBottom: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    fontSize: "13px",
    border: "1px solid rgba(255,255,255,0.12)",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  menuButton: {
    width: "100%",
    padding: "14px 13px",
    borderRadius: "12px",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "15px",
    fontWeight: "700",
    textAlign: "left",
  },

  badge: {
    background: "#dc2626",
    color: "#ffffff",
    borderRadius: "999px",
    padding: "4px 9px",
    fontSize: "12px",
    fontWeight: "800",
  },

  logoutButton: {
    marginTop: "auto",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: "#dc2626",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "14px",
    boxShadow: "0 8px 18px rgba(220,38,38,0.28)",
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
    padding: "74px 10px 18px",
    width: "100%",
    overflowX: "hidden",
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
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.12)",
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: "900",
    cursor: "pointer",
  },

  mobileLogo: {
    fontSize: "18px",
    fontWeight: "900",
  },

  mobileBadge: {
    background: "#dc2626",
    color: "#ffffff",
    borderRadius: "999px",
    padding: "6px 11px",
    fontSize: "12px",
    fontWeight: "900",
  },

  mobileStatus: {
    background: "rgba(255,255,255,0.14)",
    color: "#ffffff",
    borderRadius: "999px",
    padding: "6px 11px",
    fontSize: "12px",
    fontWeight: "800",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.48)",
    zIndex: 35,
  },
};

export default Layout;