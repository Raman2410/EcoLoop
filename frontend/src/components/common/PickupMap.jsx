import { useEffect, useRef, useState } from "react";
import { geocodeAddress } from "../../utils/geocode";

// Leaflet is loaded via CDN to avoid SSR/bundler issues with its CSS.
// We inject the stylesheet once and use the global L object.

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

let leafletReady = false;
let leafletCallbacks = [];

const loadLeaflet = () => {
  if (leafletReady) return Promise.resolve();
  if (window.L) { leafletReady = true; return Promise.resolve(); }

  return new Promise((resolve) => {
    leafletCallbacks.push(resolve);

    if (document.querySelector(`link[href="${LEAFLET_CSS}"]`)) return;

    // Inject CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = LEAFLET_CSS;
    document.head.appendChild(link);

    // Inject JS
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => {
      leafletReady = true;
      leafletCallbacks.forEach((cb) => cb());
      leafletCallbacks = [];
    };
    document.head.appendChild(script);
  });
};

// Custom SVG marker icons — no broken default image paths
const makeIcon = (color, label) => {
  if (!window.L) return null;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26S32 26 32 16C32 7.163 24.837 0 16 0z"
        fill="${color}" stroke="white" stroke-width="2"/>
      <text x="16" y="20" text-anchor="middle" font-size="14" fill="white"
        font-family="sans-serif">${label}</text>
    </svg>`;
  return window.L.divIcon({
    html: svg,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
    className: "",
  });
};

/**
 * PickupMap — shows the pickup address pin and optionally a live collector pin.
 *
 * Props:
 *   address       {string}          — pickup address to geocode + display
 *   collectorCoords {[lat,lng]|null} — live collector position (from socket)
 *   height        {string}          — CSS height, default "220px"
 */
const PickupMap = ({ address, area, coords = null, collectorCoords = null, height = "220px" }) => {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);   // pickup pin
  const collectorRef = useRef(null);   // collector pin
  const [status, setStatus] = useState("loading"); // loading | ok | error

  // Initialize map once address resolves
  useEffect(() => {
    if (!address) return;
    let cancelled = false;

    const init = async () => {
      await loadLeaflet();
      if (cancelled || !containerRef.current) return;

      const resolved = coords ?? await geocodeAddress(address, area);
      if (cancelled) return;

      if (!resolved) {
        setStatus("error");
        return;
      }

      // Destroy any existing map instance before creating a new one
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const L = window.L;
      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: false });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      map.setView(resolved, 15);

      // Pickup pin — green house icon
      const pickupIcon = makeIcon("#16a34a", "🏠");
      const pickupMarker = pickupIcon
        ? L.marker(resolved, { icon: pickupIcon }).addTo(map)
        : L.marker(resolved).addTo(map);

      pickupMarker.bindPopup(
        `<div style="font-size:13px;line-height:1.5"><strong>Pickup location</strong><br/>${address}</div>`
      );
      markerRef.current = pickupMarker;

      setStatus("ok");
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [address]);

  // Update or create collector pin when collectorCoords changes
  useEffect(() => {
    if (!mapRef.current || !window.L || status !== "ok") return;

    const L = window.L;

    if (!collectorCoords) {
      // Remove collector pin if it existed
      if (collectorRef.current) {
        collectorRef.current.remove();
        collectorRef.current = null;
      }
      return;
    }

    if (collectorRef.current) {
      // Smoothly move existing pin
      collectorRef.current.setLatLng(collectorCoords);
    } else {
      // Create collector pin — blue scooter icon
      const icon = makeIcon("#2563eb", "🛵");
      const marker = icon
        ? L.marker(collectorCoords, { icon }).addTo(mapRef.current)
        : L.marker(collectorCoords).addTo(mapRef.current);
      marker.bindPopup(`<div style="font-size:13px">Collector en route</div>`);
      collectorRef.current = marker;
    }

    // Fit both pins in view
    if (markerRef.current) {
      const group = L.featureGroup([markerRef.current, collectorRef.current]);
      mapRef.current.fitBounds(group.getBounds().pad(0.25));
    }
  }, [collectorCoords, status]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ borderRadius: "12px", overflow: "hidden", position: "relative", height }}>
      {status === "loading" && (
        <div
          style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "#f9fafb", zIndex: 10, fontSize: "13px", color: "#9ca3af",
          }}
        >
          Locating address…
        </div>
      )}
      {status === "error" && (
        <div
          style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "#f9fafb", zIndex: 10, gap: "6px",
          }}
        >
          <span style={{ fontSize: "24px" }}>📍</span>
          <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>
            Could not locate address on map
          </p>
        </div>
      )}
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
};

export default PickupMap;