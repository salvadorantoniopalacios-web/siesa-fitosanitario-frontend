import React, { useState } from "react";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function App() {
  const [usuario, setUsuario] = useState(() => {
    const usuarioSesion = sessionStorage.getItem("usuario");

    if (!usuarioSesion) {
      localStorage.removeItem("usuario");
      localStorage.removeItem("token");
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

  if (!usuario) {
    return <Login setUsuario={setUsuario} />;
  }

  return <Dashboard usuario={usuario} />;
}

export default App;