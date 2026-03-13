"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon issues in Next.js
const customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface AddressMapProps {
    lat: number | null;
    lng: number | null;
    onChange: (lat: number, lng: number) => void;
}

function LocationMarker({ lat, lng, onChange }: AddressMapProps) {
    const map = useMap();

    // Center map on initial lat/lng if provided
    useEffect(() => {
        if (lat && lng) {
            map.setView([lat, lng], 16);
        }
    }, [lat, lng, map]);

    useMapEvents({
        click(e) {
            onChange(e.latlng.lat, e.latlng.lng);
        },
    });

    return lat && lng ? (
        <Marker 
            position={[lat, lng]} 
            icon={customIcon}
            draggable={true}
            eventHandlers={{
                dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    onChange(position.lat, position.lng);
                },
            }}
        />
    ) : null;
}

export default function AddressMap({ lat, lng, onChange }: AddressMapProps) {
    // Default to New Delhi if no location
    const center: [number, number] = useMemo(() => [lat || 28.6139, lng || 77.2090], [lat, lng]);

    return (
        <div style={{ height: "300px", width: "100%", borderRadius: "8px", overflow: "hidden", border: "1.5px solid var(--border)", zIndex: 0, position: "relative" }}>
            <MapContainer
                center={center}
                zoom={lat ? 16 : 13}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker lat={lat} lng={lng} onChange={onChange} />
            </MapContainer>
        </div>
    );
}
