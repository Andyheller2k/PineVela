const fs = require('fs');

let code = fs.readFileSync('src/components/PageStaffDashboard.tsx', 'utf8');

code = code.replace(
  "const [viewingOfferMap, setViewingOfferMap] = useState<any | null>(null);",
  "const [viewingOfferMap, setViewingOfferMap] = useState<any | null>(null);\n  const mapInstanceRef = React.useRef<any>(null);"
);

// We need to add the import if React isn't imported, but React is usually available.
// Let's just use mapInstanceRef instead. Wait, it's safer to just clear the container.
// Or we can just check if L.map was already initialized by adding a flag.

let newEffect = `useEffect(() => {
    if (viewingOfferMap) {
      const timer = setTimeout(() => {
        const container = document.getElementById('staff-offer-map-view');
        if (!container) return;
        
        // Clean up previous map if exists
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const L = (window as any).L;
        if (!L) return;

        const lat = viewingOfferMap.lat || 5.6037;
        const lng = viewingOfferMap.lng || -0.1870;

        const map = L.map(container).setView([lat, lng], 16);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        L.marker([lat, lng]).addTo(map)
          .bindPopup(\`<b>\${viewingOfferMap.requesterName}</b><br/>\${viewingOfferMap.location}\`).openPopup();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    }
  }, [viewingOfferMap]);`;

code = code.replace(
  /useEffect\(\(\) => \{\n\s*if \(viewingOfferMap\) \{[\s\S]*?\}, \[viewingOfferMap\]\);/m,
  newEffect
);

fs.writeFileSync('src/components/PageStaffDashboard.tsx', code);
console.log("Patched PageStaffDashboard.tsx map cleanup");
