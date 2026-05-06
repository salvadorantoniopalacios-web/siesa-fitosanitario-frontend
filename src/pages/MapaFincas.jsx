import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API_URL = "http://localhost:3000/api";

function CambiarCentro({ finca }) {
  const map = useMap();

  useEffect(() => {
    if (finca?.latitud && finca?.longitud) {
      map.setView([Number(finca.latitud), Number(finca.longitud)], 15);
    }
  }, [finca, map]);

  return null;
}

function MapaFincas() {
  const [fincas, setFincas] = useState([]);
  const [fincaSeleccionada, setFincaSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tipoMapa, setTipoMapa] = useState("normal");

  const obtenerColorRiesgo = (riesgo) => {
    if (riesgo === "Crítico") return "#dc2626";
    if (riesgo === "Alto") return "#ea580c";
    if (riesgo === "Medio") return "#ca8a04";
    return "#16a34a";
  };

  const obtenerRiesgoPrioritario = (riesgos) => {
    if (riesgos.includes("Crítico")) return "Crítico";
    if (riesgos.includes("Alto")) return "Alto";
    if (riesgos.includes("Medio")) return "Medio";
    return "Bajo";
  };

  const crearIconoRiesgo = (riesgo) => {
    const color = obtenerColorRiesgo(riesgo);

    return L.divIcon({
      className: "",
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background: ${color};
          border: 3px solid white;
          border-radius: 999px;
          box-shadow: 0 4px 12px rgba(15,23,42,0.35);
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -10],
    });
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);

      const [resFincas, resAlertas] = await Promise.all([
        axios.get(`${API_URL}/farms`),
        axios.get(`${API_URL}/alerts`),
      ]);

      const fincasData = Array.isArray(resFincas.data) ? resFincas.data : [];
      const alertasData = Array.isArray(resAlertas.data) ? resAlertas.data : [];

      const fincasConGps = fincasData
        .filter((f) => f.latitud && f.longitud)
        .map((finca) => {
          const alertasFinca = alertasData.filter(
            (a) =>
              String(a.finca_nombre || "").toLowerCase() ===
              String(finca.nombre || "").toLowerCase()
          );

          const riesgos = alertasFinca.map((a) => a.nivel_alerta);
          const riesgo = obtenerRiesgoPrioritario(riesgos);

          return {
            ...finca,
            nivel_riesgo_finca: riesgo,
            total_alertas: alertasFinca.length,
            alertas_criticas: alertasFinca.filter(
              (a) => a.nivel_alerta === "Crítico"
            ).length,
            alertas_altas: alertasFinca.filter((a) => a.nivel_alerta === "Alto")
              .length,
          };
        });

      setFincas(fincasConGps);
      setFincaSeleccionada(fincasConGps[0] || null);
    } catch (error) {
      console.error("Error cargando mapa de fincas:", error);
      setFincas([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirGoogleMaps = (finca) => {
    window.open(
      `https://www.google.com/maps?q=${finca.latitud},${finca.longitud}`,
      "_blank"
    );
  };

  const centroMapa = fincaSeleccionada
    ? [Number(fincaSeleccionada.latitud), Number(fincaSeleccionada.longitud)]
    : [14.6349, -90.5069];

  const fincasCriticas = fincas.filter(
    (f) => f.nivel_riesgo_finca === "Crítico"
  ).length;

  const fincasAltas = fincas.filter(
    (f) => f.nivel_riesgo_finca === "Alto"
  ).length;

  const urlMapa =
    tipoMapa === "satelital"
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const attribution =
    tipoMapa === "satelital"
      ? "Tiles &copy; Esri"
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Mapa de fincas</h1>
      <p style={styles.subtitle}>
        Visualización interactiva con vista satelital y pines por nivel de riesgo.
      </p>

      <div style={styles.cards}>
        <div style={styles.card}>
          <p style={styles.cardLabel}>Fincas con GPS</p>
          <h2 style={styles.cardNumber}>{fincas.length}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Fincas críticas</p>
          <h2 style={{ ...styles.cardNumber, color: "#dc2626" }}>
            {fincasCriticas}
          </h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Fincas altas</p>
          <h2 style={{ ...styles.cardNumber, color: "#ea580c" }}>
            {fincasAltas}
          </h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Finca seleccionada</p>
          <h2 style={styles.cardText}>
            {fincaSeleccionada ? fincaSeleccionada.nombre : "Sin selección"}
          </h2>
        </div>
      </div>

      {cargando ? (
        <div style={styles.empty}>Cargando mapa de fincas...</div>
      ) : fincas.length === 0 ? (
        <div style={styles.empty}>
          No hay fincas con coordenadas GPS registradas.
        </div>
      ) : (
        <div style={styles.grid}>
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Fincas con GPS</h2>

            <div style={styles.legend}>
              <span style={{ ...styles.legendDot, background: "#16a34a" }} />
              Bajo
              <span style={{ ...styles.legendDot, background: "#ca8a04" }} />
              Medio
              <span style={{ ...styles.legendDot, background: "#ea580c" }} />
              Alto
              <span style={{ ...styles.legendDot, background: "#dc2626" }} />
              Crítico
            </div>

            {fincas.map((finca) => (
              <div
                key={finca.id}
                style={{
                  ...styles.fincaItem,
                  borderColor:
                    fincaSeleccionada?.id === finca.id ? "#15803d" : "#e2e8f0",
                  background:
                    fincaSeleccionada?.id === finca.id ? "#ecfdf5" : "#ffffff",
                }}
                onClick={() => setFincaSeleccionada(finca)}
              >
                <div style={styles.fincaTop}>
                  <strong>{finca.nombre}</strong>
                  <span
                    style={{
                      ...styles.riskBadge,
                      background: obtenerColorRiesgo(finca.nivel_riesgo_finca),
                    }}
                  >
                    {finca.nivel_riesgo_finca}
                  </span>
                </div>

                <span>{finca.ubicacion}</span>
                <small>
                  GPS: {finca.latitud}, {finca.longitud}
                </small>
                <small>Cultivo: {finca.cultivo_principal || "-"}</small>
                <small>Alertas: {finca.total_alertas}</small>
              </div>
            ))}
          </div>

          <div style={styles.panel}>
            <div style={styles.mapHeader}>
              <div>
                <h2 style={styles.panelTitle}>
                  {fincaSeleccionada?.nombre || "Mapa"}
                </h2>
                <p style={styles.mapSubtitle}>
                  {fincaSeleccionada?.ubicacion || ""}
                </p>
              </div>

              <div style={styles.mapActions}>
                <button
                  type="button"
                  style={{
                    ...styles.mapTypeButton,
                    background: tipoMapa === "normal" ? "#15803d" : "#64748b",
                  }}
                  onClick={() => setTipoMapa("normal")}
                >
                  Normal
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.mapTypeButton,
                    background:
                      tipoMapa === "satelital" ? "#15803d" : "#64748b",
                  }}
                  onClick={() => setTipoMapa("satelital")}
                >
                  Satelital
                </button>

                {fincaSeleccionada && (
                  <button
                    type="button"
                    style={styles.mapButton}
                    onClick={() => abrirGoogleMaps(fincaSeleccionada)}
                  >
                    Google Maps
                  </button>
                )}
              </div>
            </div>

            <div style={styles.mapBox}>
              <MapContainer
                center={centroMapa}
                zoom={14}
                scrollWheelZoom={true}
                style={styles.leafletMap}
              >
                <CambiarCentro finca={fincaSeleccionada} />

                <TileLayer attribution={attribution} url={urlMapa} />

                {fincas.map((finca) => (
                  <Marker
                    key={finca.id}
                    position={[Number(finca.latitud), Number(finca.longitud)]}
                    icon={crearIconoRiesgo(finca.nivel_riesgo_finca)}
                    eventHandlers={{
                      click: () => setFincaSeleccionada(finca),
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: "190px" }}>
                        <strong>{finca.nombre}</strong>
                        <br />
                        {finca.ubicacion}
                        <br />
                        <br />
                        <strong>Riesgo:</strong> {finca.nivel_riesgo_finca}
                        <br />
                        <strong>Cultivo:</strong>{" "}
                        {finca.cultivo_principal || "-"}
                        <br />
                        <strong>Área:</strong> {finca.area_hectareas || "-"} ha
                        <br />
                        <strong>Alertas:</strong> {finca.total_alertas}
                        <br />
                        <strong>GPS:</strong> {finca.latitud},{" "}
                        {finca.longitud}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      )}
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
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
    color: "#2563eb",
  },
  cardText: {
    fontSize: "22px",
    margin: "8px 0 0",
    color: "#0f172a",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 360px) 1fr",
    gap: "20px",
  },
  panel: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
    border: "1px solid #e2e8f0",
  },
  panelTitle: {
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
    marginBottom: "14px",
    color: "#0f172a",
  },
  legend: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    flexWrap: "wrap",
    color: "#475569",
    fontSize: "13px",
    marginBottom: "14px",
  },
  legendDot: {
    width: "11px",
    height: "11px",
    borderRadius: "999px",
    display: "inline-block",
  },
  fincaItem: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    marginBottom: "10px",
    cursor: "pointer",
    color: "#334155",
  },
  fincaTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
  },
  riskBadge: {
    color: "#ffffff",
    borderRadius: "999px",
    padding: "4px 9px",
    fontSize: "12px",
    fontWeight: "800",
  },
  mapHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: "14px",
  },
  mapSubtitle: {
    margin: 0,
    color: "#64748b",
  },
  mapActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  mapTypeButton: {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "none",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },
  mapButton: {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },
  mapBox: {
    width: "100%",
    height: "540px",
    borderRadius: "18px",
    overflow: "hidden",
    border: "1px solid #cbd5e1",
    background: "#f1f5f9",
  },
  leafletMap: {
    width: "100%",
    height: "100%",
  },
  empty: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "28px",
    textAlign: "center",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
  },
};

export default MapaFincas;