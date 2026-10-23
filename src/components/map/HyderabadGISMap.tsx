'use client';

import { divIcon } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { HospitalBedData } from '@/types';

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

interface HyderabadGISMapProps {
  hospitals: HospitalBedData[];
}

export function HyderabadGISMap({ hospitals }: HyderabadGISMapProps) {
  return (
    <div className="h-[440px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-inner dark:border-slate-800 bg-slate-100 dark:bg-slate-900" aria-label="Hyderabad hospital availability map">
      <MapContainer center={HYDERABAD_CENTER} zoom={12} scrollWheelZoom className="h-full w-full z-0" aria-label="Hyderabad, Sindh hospital map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hospitals.map((hospital) => {
          const isNeedsConfirmation = hospital.reportedAgoMins > 60;
          return (
            <Marker
              key={hospital.id}
              position={[hospital.coordinates.lat, hospital.coordinates.lng]}
              icon={hospitalPin(hospital.availableIcu)}
            >
              <Popup className="hospital-gis-popup">
                <div className="p-1 min-w-[200px] text-slate-900">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                      {hospital.category}
                    </span>
                    <span className={`text-[10px] font-bold ${isNeedsConfirmation ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {isNeedsConfirmation ? 'Needs confirmation' : `Updated ${hospital.reportedAgoMins}m ago`}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm leading-snug text-slate-950 mb-1">{hospital.nameEn}</h4>
                  <p className="text-xs text-slate-600 mb-2">{hospital.area} · {hospital.distanceKm} km (~{hospital.etaMins}m)</p>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-2 p-1.5 rounded bg-slate-100 border border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Free ICU</span>
                      <strong className="text-emerald-700 font-extrabold">{hospital.availableIcu}/{hospital.totalIcu}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Free Vents</span>
                      <strong className="text-teal-700 font-extrabold">{hospital.availableVents}/{hospital.totalVents}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200">
                    <a
                      href={`tel:${hospital.emergencyPhone}`}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 underline"
                    >
                      Call: {hospital.emergencyPhone}
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
