'use client';

import { divIcon } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { hyderabadHospitals } from '@/lib/data/hospitals';

const HYDERABAD_CENTER: [number, number] = [25.3960, 68.3578];

function hospitalPin(availableIcu: number) {
  const color = availableIcu > 5 ? '#0e7c52' : availableIcu > 2 ? '#b7791f' : '#be182a';
  return divIcon({
    className: 'hospital-map-pin',
    html: `<svg aria-hidden="true" viewBox="0 0 32 40" width="32" height="40" xmlns="http://www.w3.org/2000/svg"><path d="M16 1C8.3 1 2 7.3 2 15c0 10.5 14 24 14 24s14-13.5 14-24C30 7.3 23.7 1 16 1Z" fill="${color}" stroke="#fff" stroke-width="2"/><path d="M14 8h4v5h5v4h-5v5h-4v-5H9v-4h5V8Z" fill="#fff"/></svg>`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -38],
  });
}

export function HyderabadGISMap() {
  return (
    <div className="h-[420px] w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800" aria-label="Hyderabad hospital availability map">
      <MapContainer center={HYDERABAD_CENTER} zoom={12} scrollWheelZoom className="h-full w-full" aria-label="Hyderabad, Sindh hospital map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hyderabadHospitals.map((hospital) => (
          <Marker key={hospital.id} position={[hospital.coordinates.lat, hospital.coordinates.lng]} icon={hospitalPin(hospital.availableIcu)}>
            <Popup>
              <strong>{hospital.nameEn}</strong><br />
              {hospital.area}<br />
              ICU: {hospital.availableIcu}/{hospital.totalIcu} · Beds: {hospital.availableBeds}/{hospital.totalBeds}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
