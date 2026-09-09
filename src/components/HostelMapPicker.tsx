import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Search, Navigation, CheckCircle2, Copy, Check } from 'lucide-react';

// Fix Leaflet default icon paths in modern Vite bundlers
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface HostelMapPickerProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (coords: { lat: number; lng: number; addressSnippet?: string }) => void;
  initialAddressHint?: string;
}

// Popular University & Campus zones in Ghana for quick reference
const QUICK_LOCATIONS = [
  { name: 'UG Legon, Accra', lat: 5.6506, lng: -0.1866 },
  { name: 'KNUST, Kumasi', lat: 6.6745, lng: -1.5716 },
  { name: 'UCC, Cape Coast', lat: 5.1155, lng: -1.2858 },
  { name: 'UPSA, Accra', lat: 5.6601, lng: -0.1654 },
  { name: 'Ashesi, Berekuso', lat: 5.7597, lng: -0.2198 }
];

export default function HostelMapPicker({
  latitude,
  longitude,
  onLocationSelect,
  initialAddressHint
}: HostelMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string>('');
  const [copiedCoords, setCopiedCoords] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default to Accra / Legon if coordinates are 0 or empty
    const initialLat = latitude && !isNaN(latitude) ? latitude : 5.6506;
    const initialLng = longitude && !isNaN(longitude) ? longitude : -0.1866;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true
      });

      // Standard OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      // Add Draggable Marker
      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        title: 'Drag to adjust exact hostel location'
      }).addTo(map);

      marker.bindPopup(`<b>Hostel Location Pin</b><br/>Drag to refine position.`);

      // Listen for drag end
      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        handleUpdateCoords(pos.lat, pos.lng);
      });

      // Listen for map click
      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        handleUpdateCoords(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Ensure map renders properly on window resize
      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);

      return () => {
        resizeObserver.disconnect();
        map.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      };
    }
  }, []);

  // Update map when coordinates prop changes externally
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && latitude && longitude) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - latitude) > 0.0001 || Math.abs(currentPos.lng - longitude) > 0.0001) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.panTo([latitude, longitude]);
      }
    }
  }, [latitude, longitude]);

  // Reverse Geocoding with OpenStreetMap Nominatim
  const handleUpdateCoords = async (lat: number, lng: number) => {
    try {
      const roundedLat = Number(lat.toFixed(6));
      const roundedLng = Number(lng.toFixed(6));

      // Attempt reverse geocode to get snippet
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'PineVela-Hostel-App' } }
      );
      if (resp.ok) {
        const data = await resp.json();
        const displayName = data.display_name || '';
        setDetectedAddress(displayName);
        onLocationSelect({
          lat: roundedLat,
          lng: roundedLng,
          addressSnippet: displayName
        });
        if (markerRef.current) {
          markerRef.current.setPopupContent(`<b>Selected Pin:</b><br/>${displayName.substring(0, 70)}...`).openPopup();
        }
        return;
      }
    } catch {
      // Fallback
    }

    onLocationSelect({
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6))
    });
  };

  // Search Address or Location via Nominatim
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const query = encodeURIComponent(`${searchQuery}, Ghana`);
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
        headers: { 'User-Agent': 'PineVela-Hostel-App' }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);

          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([lat, lon], 16);
            markerRef.current.setLatLng([lat, lon]);
            handleUpdateCoords(lat, lon);
          }
        }
      }
    } catch (err) {
      console.warn("Geocoding search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Locate Current Device
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGeolocating(false);
        const { latitude: lat, longitude: lng } = pos.coords;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          markerRef.current.setLatLng([lat, lng]);
          handleUpdateCoords(lat, lng);
        }
      },
      () => {
        setIsGeolocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const copyCoordinates = () => {
    navigator.clipboard.writeText(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <form onSubmit={handleSearch} className="relative flex-1">
          <input
            type="text"
            placeholder="Search address, neighborhood, campus or landmark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-24 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent text-slate-800 shadow-xs"
          />
          <Search className="absolute left-3 top-3 text-slate-400" size={15} />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
          >
            {isSearching ? 'Locating...' : 'Search'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={isGeolocating}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-xs shrink-0"
        >
          <Navigation size={14} className={isGeolocating ? 'animate-spin text-blue-600' : 'text-blue-600'} />
          <span>{isGeolocating ? 'Detecting...' : 'My Location'}</span>
        </button>
      </div>

      {/* Quick Jump Campus Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Campus Zones:</span>
        {QUICK_LOCATIONS.map((loc) => (
          <button
            key={loc.name}
            type="button"
            onClick={() => {
              if (mapInstanceRef.current && markerRef.current) {
                mapInstanceRef.current.setView([loc.lat, loc.lng], 16);
                markerRef.current.setLatLng([loc.lat, loc.lng]);
                handleUpdateCoords(loc.lat, loc.lng);
              }
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-900 text-slate-600 rounded-lg font-medium text-[11px] transition-colors shrink-0 whitespace-nowrap border border-slate-200/60"
          >
            {loc.name}
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 h-80 sm:h-96 w-full z-10">
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Helper overlay instruction badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm pointer-events-none z-[400] text-left">
          <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Click anywhere or drag marker to set exact hostel entrance
          </p>
        </div>
      </div>

      {/* Selected Coordinates Status Card */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-900 shrink-0">
            <MapPin size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Pinpoint Coordinates:</span>
              <span className="font-mono text-xs font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {latitude ? latitude.toFixed(6) : '5.650600'}, {longitude ? longitude.toFixed(6) : '-0.186600'}
              </span>
              <button
                type="button"
                onClick={copyCoordinates}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                title="Copy Coordinates"
              >
                {copiedCoords ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>
            {detectedAddress ? (
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                <span className="font-semibold text-slate-700">Identified Area:</span> {detectedAddress}
              </p>
            ) : initialAddressHint ? (
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                <span className="font-semibold text-slate-700">Address Hint:</span> {initialAddressHint}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs shrink-0 self-end sm:self-auto bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
          <CheckCircle2 size={15} />
          <span>Coordinates Recorded</span>
        </div>
      </div>
    </div>
  );
}
