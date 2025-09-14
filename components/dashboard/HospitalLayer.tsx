"use client";

import { GeoJSON } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";

// Use a custom SVG DivIcon for hospitals
const hospitalIcon = new L.DivIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#d32f2f">
    <circle cx="12" cy="12" r="12" fill="white" stroke="#d32f2f" stroke-width="2"/>
    <path d="M13 11h4v2h-4v4h-2v-4H7v-2h4V7h2v4z"/>
  </svg>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

export default function HospitalLayer() {
  const [geojsonData, setGeojsonData] = useState<any>(null);

  useEffect(() => {
    fetch("/hospitals.json")
      .then((res) => res.json())
      .then((data) => setGeojsonData(data))
      .catch((err) => console.error("Error loading hospital data:", err));
  }, []);

  return geojsonData ? (
    <GeoJSON
      data={geojsonData}
      pointToLayer={(_, latlng) => L.marker(latlng, { icon: hospitalIcon })}
      onEachFeature={(feature, layer) => {
        const name = feature.properties?.name || "Unnamed Facility";
        const type = feature.properties?.amenity || "Health Facility";
        const operator = feature.properties?.operator || "Unknown";

        layer.bindPopup(`
          <div>
            <strong>${name}</strong><br/>
            Type: ${type}<br/>
            Operator: ${operator}
          </div>
        `);
      }}
    />
  ) : null;
}
