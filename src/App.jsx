import React, { useState } from "react";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function App() {
  const [usuario, setUsuario] = useState(
    JSON.parse(localStorage.getItem("usuario"))
  );

  if (!usuario) {
    return <Login setUsuario={setUsuario} />;
  }

  return <Dashboard usuario={usuario} />;
}

export default App;