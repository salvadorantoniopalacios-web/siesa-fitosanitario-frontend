import React, { useEffect, useState } from "react";
import axios from "axios";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function App() {
  const [usuario, setUsuario] = useState(() => {
    const usuarioSesion =
      sessionStorage.getItem("usuario") || localStorage.getItem("usuario");

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
    const token =
      sessionStorage.getItem("token") || localStorage.getItem("token");

    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  }, [usuario]);

  if (!usuario) {
    return <Login setUsuario={setUsuario} />;
  }

  return <Dashboard usuario={usuario} />;
}

export default App;