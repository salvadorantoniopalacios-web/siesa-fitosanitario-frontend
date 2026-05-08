import React, { useEffect, useState } from "react";
import "./api/axiosConfig.js";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function App() {
  const [usuario, setUsuario] = useState(() => {
    const usuarioSesion =
      sessionStorage.getItem("usuario") ||
      localStorage.getItem("usuario");

    if (!usuarioSesion) {
      return null;
    }

    try {
      return JSON.parse(usuarioSesion);
    } catch (error) {
      sessionStorage.removeItem("usuario");
      sessionStorage.removeItem("token");
      localStorage.removeItem("usuario");
      localStorage.removeItem("token");
      return null;
    }
  });

  useEffect(() => {
    if (!usuario) {
      sessionStorage.removeItem("usuario");
      sessionStorage.removeItem("token");
      localStorage.removeItem("usuario");
      localStorage.removeItem("token");
    }
  }, [usuario]);

  if (!usuario) {
    return <Login setUsuario={setUsuario} />;
  }

  return <Dashboard usuario={usuario} />;
}

export default App;