"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface PropertyMapProps {
  lat: number;
  lng: number;
  label?: string;
}

export function PropertyMap({ lat, lng, label }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Guard against StrictMode double-mount: skip if already initialized
    if ((el as HTMLElement & { _leaflet_id?: number })._leaflet_id != null) return;

    const instance = L.map(el, { scrollWheelZoom: false }).setView([lat, lng], 15);
    mapRef.current = instance;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(instance);

    const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(instance);
    if (label) marker.bindPopup(label);

    return () => {
      instance.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mapRef.current?.setView([lat, lng]);
  }, [lat, lng]);

  return (
    <div ref={containerRef} style={{ height: "320px", width: "100%", borderRadius: "8px" }} />
  );
}
