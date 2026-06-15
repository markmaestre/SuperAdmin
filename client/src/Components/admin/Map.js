// Map.js
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import 'leaflet-fullscreen/dist/Leaflet.fullscreen.js';
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css';
import API_URL from '../Utils/Api';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ==================== THEME CONSTANTS ====================
const C = {
  navyDark:  '#1B2B4B',
  navyMid:   '#2C4070',
  accent:    '#4FC3F7',
  success:   '#4CAF50',
  warning:   '#FF9800',
  danger:    '#F44336',
  deepDark:  '#0F1E38',
  bodyGray:  '#546E7A',
  mutedGray: '#90A4AE',
  pageBg:    '#F0F4F8',
  white:     '#FFFFFF',
  southColor: '#FF6B6B',
  centralColor: '#4ECDC4',
};

// ==================== ICON COMPONENT ====================
const Icon = ({ d, size = 18, color = 'currentColor', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  map:         "M21 10.5c0 4.5-9 12-9 12s-9-7.5-9-12a9 9 0 0118 0z M12 13.5a3 3 0 100-6 3 3 0 000 6z",
  target:      "M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z M12 18a6 6 0 100-12 6 6 0 000 12z M12 14a2 2 0 100-4 2 2 0 000 4z",
  location:    "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z",
  alert:       ["M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z", "M12 9v4", "M12 17h.01"],
  list:        "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  close:       ["M18 6L6 18", "M6 6l12 12"],
  refresh:     "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  building:    ["M3 21h18", "M5 21V7l8-4 8 4v14", "M9 21v-6h6v6"],
};

// ==================== STYLES ====================
const S = {
  mapContainer: {
    background: C.white,
    border: '1px solid rgba(27,43,75,0.07)',
    borderRadius: 12,
    minHeight: 550,
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 1px 4px rgba(27,43,75,0.04)',
  },
  mapLegend: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    background: 'rgba(255,255,255,0.95)',
    padding: '12px 16px',
    borderRadius: 8,
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    zIndex: 1000,
    fontSize: 12,
    border: '1px solid rgba(27,43,75,0.08)',
  },
  mapLegendTitle: {
    fontWeight: 700,
    marginBottom: 8,
    color: C.navyDark,
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  legendGradient: {
    width: 190,
    height: 10,
    background: 'linear-gradient(to right, #00ff00, #ffff00, #ff0000)',
    borderRadius: 6,
    marginBottom: 6,
  },
  legendLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 10,
    color: C.bodyGray,
  },
  locationRankingMap: {
    position: 'absolute',
    top: 20,
    left: 20,
    background: 'rgba(255,255,255,0.95)',
    padding: '12px 16px',
    borderRadius: 8,
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    zIndex: 1000,
    fontSize: 12,
    border: '1px solid rgba(27,43,75,0.08)',
    maxWidth: 280,
    maxHeight: 400,
    overflowY: 'auto',
  },
  locationRankingMapTitle: {
    fontWeight: 700,
    marginBottom: 8,
    color: C.navyDark,
    fontSize: 11,
    borderBottom: '1px solid rgba(27,43,75,0.08)',
    paddingBottom: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  rankingItemMap: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 5,
    fontSize: 11,
    cursor: 'pointer',
    padding: '6px 8px',
    borderRadius: 6,
    transition: 'background 0.15s ease',
  },
  rankingName: {
    fontSize: 12,
    fontWeight: 500,
    color: C.bodyGray,
    flex: 1,
  },
  rankingCount: {
    fontSize: 13,
    fontWeight: 700,
    color: C.danger,
    background: C.danger + '10',
    padding: '2px 8px',
    borderRadius: 20,
  },
  mapInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    background: 'rgba(255,255,255,0.95)',
    padding: '7px 12px',
    borderRadius: 6,
    fontSize: 11,
    color: C.bodyGray,
    zIndex: 1000,
    border: '1px solid rgba(27,43,75,0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  mapControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000,
    display: 'flex',
    gap: 8,
  },
  mapControlBtn: {
    background: C.white,
    border: '1px solid rgba(27,43,75,0.1)',
    borderRadius: 6,
    padding: '7px 12px',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    color: C.navyDark,
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,30,56,0.7)',
    backdropFilter: 'blur(4px)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  },
  reportDetailsModal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: C.white,
    borderRadius: 12,
    width: 400,
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'auto',
    padding: 20,
    zIndex: 2000,
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  },
};

// Weight calculation function
const calculateItemWeight = (classification, detectedObjectLabel) => {
  const weights = {
    plastic: { default: 0.04, bottle: 0.05, bag: 0.01, container: 0.08, cup: 0.03, straw: 0.002 },
    paper: { default: 0.08, bag: 0.05, cup: 0.01, newspaper: 0.10, magazine: 0.15 },
    glass: { default: 0.25, bottle: 0.30, jar: 0.25, cup: 0.20 },
    metal: { default: 0.02, can: 0.015, tin: 0.015, lid: 0.01 },
    aluminum: { default: 0.015, can: 0.015, foil: 0.005 },
    organic: { default: 0.25, food: 0.25, fruit: 0.10, vegetable: 0.20, yard: 0.50 },
    electronic: { default: 0.50, phone: 0.18, laptop: 2.00, tablet: 0.50, battery: 0.15 },
    textile: { default: 0.25, shirt: 0.20, pants: 0.40, jeans: 0.50, jacket: 0.60 },
    cardboard: { default: 0.25, box: 0.50, sheet: 0.15, carton: 0.10 },
  };
  
  const classKey = (classification || '').toLowerCase().trim();
  const rawLabel = (detectedObjectLabel || '').toLowerCase().trim();
  const category = weights[classKey] || { default: 0.10 };
  
  for (const [keyword, weight] of Object.entries(category)) {
    if (rawLabel.includes(keyword)) return weight;
  }
  return category.default || 0.10;
};

const calculateTotalWeight = (report) => {
  const quantity = (report.detectedObjects && report.detectedObjects.length > 0)
    ? report.detectedObjects.length
    : 1;
  const classKey = (report.classification || '').toLowerCase().trim();
  const rawLabel = (report.detectedObjects?.[0]?.label || '').toLowerCase().trim();
  const unitWeight = calculateItemWeight(classKey, rawLabel);
  return unitWeight * quantity;
};

// Geocoding function with more addresses
const geocodeAddress = (address) => {
  const defaultCoords = { lat: 14.5117, lng: 121.0558 };
  if (!address) return defaultCoords;
  
  const addressMap = {
    'south signal': { lat: 14.50493, lng: 121.05368 },
    'south signal village': { lat: 14.50493, lng: 121.05368 },
    'signal village': { lat: 14.50493, lng: 121.05368 },
    'central bicutan': { lat: 14.5185, lng: 121.0580 },
    'central signal': { lat: 14.5185, lng: 121.0580 },
    'phase 1': { lat: 14.5012, lng: 121.0505 },
    'phase 1a': { lat: 14.5015, lng: 121.0508 },
    'phase 1b': { lat: 14.5018, lng: 121.0510 },
    'phase 2': { lat: 14.5028, lng: 121.0521 },
    'phase 2a': { lat: 14.5030, lng: 121.0523 },
    'phase 2b': { lat: 14.5032, lng: 121.0525 },
    'phase 3': { lat: 14.5045, lng: 121.0542 },
    'phase 3a': { lat: 14.5048, lng: 121.0545 },
    'phase 3b': { lat: 14.5050, lng: 121.0548 },
    'phase 4': { lat: 14.5061, lng: 121.0558 },
    'phase 4a': { lat: 14.5063, lng: 121.0560 },
    'phase 4b': { lat: 14.5065, lng: 121.0562 },
    'phase 5': { lat: 14.5078, lng: 121.0575 },
    'phase 5a': { lat: 14.5080, lng: 121.0577 },
    'phase 5b': { lat: 14.5082, lng: 121.0579 },
    'phase 6': { lat: 14.5090, lng: 121.0585 },
    'phase 7': { lat: 14.5100, lng: 121.0590 },
    'phase 8': { lat: 14.5110, lng: 121.0595 },
    'phase 9': { lat: 14.5120, lng: 121.0600 },
    'phase 10': { lat: 14.5130, lng: 121.0605 },
    'bagong silang': { lat: 14.5100, lng: 121.0530 },
    'maharlika': { lat: 14.5130, lng: 121.0560 },
    'purok': { lat: 14.5085, lng: 121.0545 },
    'purok 1': { lat: 14.5080, lng: 121.0540 },
    'purok 2': { lat: 14.5085, lng: 121.0545 },
    'purok 3': { lat: 14.5090, lng: 121.0550 },
    'purok 4': { lat: 14.5095, lng: 121.0555 },
    'purok 5': { lat: 14.5100, lng: 121.0560 },
    'san miguel': { lat: 14.5150, lng: 121.0570 },
    'santo niño': { lat: 14.5160, lng: 121.0580 },
    'sto niño': { lat: 14.5160, lng: 121.0580 },
  };
  
  const lowerAddr = address.toLowerCase();
  for (const [key, coords] of Object.entries(addressMap)) {
    if (lowerAddr.includes(key)) return coords;
  }
  
  return defaultCoords;
};

// Main Map Component
function Map({ adminRole, topLocations: initialTopLocations, mapLocations: initialMapLocations, loading: initialLoading }) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const heatmapRef = useRef(null);
  const circlesRef = useRef([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [topLocations, setTopLocations] = useState(initialTopLocations || []);
  const [mapLocations, setMapLocations] = useState(initialMapLocations || []);
  const [loading, setLoading] = useState(initialLoading !== undefined ? initialLoading : true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  // Fetch data using fetchWithAuth pattern
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_URL}${url}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    const ct = res.headers.get('content-type');
    if (ct?.includes('text/html')) throw new Error('Server returned HTML instead of JSON.');
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const e = await res.json(); msg = e.message || msg; } catch {}
      throw new Error(msg);
    }
    return res.json();
  };

  // Fetch data if not provided as props
  useEffect(() => {
    // If props are provided and have data, use them
    if (initialTopLocations && initialMapLocations && initialTopLocations.length > 0) {
      setTopLocations(initialTopLocations);
      setMapLocations(initialMapLocations);
      setLoading(false);
      return;
    }

    // Otherwise fetch data
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [wasteRes, usersRes] = await Promise.allSettled([
          fetchWithAuth('/api/waste-reports'),
          fetchWithAuth('/api/users/all-users'),
        ]);

        const allUsers = usersRes.status === 'fulfilled' ? (usersRes.value || []) : [];
        let wasteReports = wasteRes.status === 'fulfilled' ? (wasteRes.value.reports || []) : [];
        
        const userMap = new Map();
        allUsers.forEach(user => {
          userMap.set(user._id, user);
        });
        
        const locationMap = new Map();
        for (const report of wasteReports) {
          const user = userMap.get(report.user?._id || report.user);
          let address = report.location?.address || user?.address || '';
          
          if ((!address || address === 'Not specified' || address === '') && report.assignedBarangay) {
            address = report.assignedBarangay === 'south_signal' ? 'South Signal Village' : 'Central Bicutan';
          }
          
          if (address && address !== 'Not specified' && address !== '') {
            const key = address.toLowerCase().trim();
            const coords = geocodeAddress(address);
            let detectionCount = 0;
            if (report.detectedObjects && Array.isArray(report.detectedObjects)) {
              detectionCount = report.detectedObjects.length;
            }
            const weight = calculateTotalWeight(report);
            
            if (locationMap.has(key)) {
              const ex = locationMap.get(key);
              ex.reportCount += 1;
              ex.totalWeight += weight;
              ex.detectionCount += detectionCount;
              ex.reports.push(report);
            } else {
              locationMap.set(key, {
                id: key,
                address: address,
                lat: coords.lat,
                lng: coords.lng,
                reportCount: 1,
                totalWeight: weight,
                detectionCount: detectionCount,
                reports: [report],
              });
            }
          }
        }
        
        const locations = Array.from(locationMap.values());
        const sortedLocations = [...locations].sort((a, b) => b.reportCount - a.reportCount);
        setTopLocations(sortedLocations);
        setMapLocations(sortedLocations);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching map data:', error);
        setError(`Failed to load map data: ${error.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [initialTopLocations, initialMapLocations]);

  // Expose viewReport function to window for popup callbacks
  useEffect(() => {
    window.viewReport = (reportId) => {
      const allReports = mapLocations.flatMap(loc => loc.reports || []);
      const report = allReports.find(r => r._id === reportId);
      if (report && isMounted.current) {
        setSelectedReport(report);
        setShowReportModal(true);
      }
    };
    return () => { delete window.viewReport; };
  }, [mapLocations]);

  const getCenter = () => {
    if (adminRole === 'southadmin')   return { lat: 14.50493, lng: 121.05368 };
    if (adminRole === 'centraladmin') return { lat: 14.5185,  lng: 121.0580  };
    if (mapLocations.length > 0) {
      const avgLat = mapLocations.reduce((sum, loc) => sum + loc.lat, 0) / mapLocations.length;
      const avgLng = mapLocations.reduce((sum, loc) => sum + loc.lng, 0) / mapLocations.length;
      return { lat: avgLat, lng: avgLng };
    }
    return { lat: 14.5117, lng: 121.0558 };
  };

  const getCircleColor = (reportCount) => {
    if (reportCount >= 30) return '#FF0000';
    if (reportCount >= 15) return '#FF6600';
    if (reportCount >= 5) return '#FFAA00';
    return '#44CC44';
  };

  const getCircleRadius = (reportCount) => {
    return Math.min(15 + (reportCount / 2), 40);
  };

  // Initialize map
  useEffect(() => {
    isMounted.current = true;
    const container = document.getElementById('waste-map');
    if (!container || mapRef.current) return;

    const initMap = () => {
      try {
        const center = getCenter();
        mapRef.current = L.map('waste-map').setView([center.lat, center.lng], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
          minZoom: 12,
        }).addTo(mapRef.current);
        L.control.scale({ metric: true, imperial: false }).addTo(mapRef.current);
        
        const fullscreenControl = L.control.fullscreen({ 
          position: 'topright', 
          title: 'Fullscreen', 
          titleCancel: 'Exit Fullscreen' 
        });
        fullscreenControl.addTo(mapRef.current);
        
        window.mapInstance = mapRef.current;
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    const timer = setTimeout(initMap, 100);
    return () => {
      clearTimeout(timer);
      if (mapRef.current && isMounted.current) {
        try {
          mapRef.current.remove();
          mapRef.current = null;
          window.mapInstance = null;
        } catch (e) {
          console.warn('Error removing map:', e);
        }
      }
      isMounted.current = false;
    };
  }, [adminRole]);

  // Update markers and circles when locations change
  useEffect(() => {
    if (!mapRef.current || loading || mapLocations.length === 0) return;

    try {
      if (heatmapRef.current && mapRef.current) {
        mapRef.current.removeLayer(heatmapRef.current);
      }
      markersRef.current.forEach(marker => {
        if (mapRef.current && marker) {
          mapRef.current.removeLayer(marker);
        }
      });
      circlesRef.current.forEach(circle => {
        if (mapRef.current && circle) {
          mapRef.current.removeLayer(circle);
        }
      });
      markersRef.current = [];
      circlesRef.current = [];

      const heatData = mapLocations.map(loc => [loc.lat, loc.lng, loc.reportCount || loc.count || 1]);
      if (heatData.length > 0 && mapRef.current) {
        heatmapRef.current = L.heatLayer(heatData, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          minOpacity: 0.3,
          gradient: { 0.2: '#00ff00', 0.4: '#aaff00', 0.6: '#ffff00', 0.8: '#ff8800', 1.0: '#ff0000' }
        }).addTo(mapRef.current);
      }

      // Add circles for each location (visible dots)
      mapLocations.forEach((loc) => {
        if (!mapRef.current) return;
        
        const reportCount = loc.reportCount || loc.count || 1;
        const circleColor = getCircleColor(reportCount);
        const circleRadius = getCircleRadius(reportCount);
        
        const circle = L.circle([loc.lat, loc.lng], {
          color: circleColor,
          fillColor: circleColor,
          fillOpacity: 0.7,
          radius: circleRadius,
          weight: 2,
          opacity: 0.9,
        }).addTo(mapRef.current);
        
        circle.bindTooltip(`
          <div style="font-family: 'Inter', sans-serif; padding: 4px;">
            <strong>${loc.address}</strong><br/>
            Reports: ${reportCount}<br/>
            Weight: ${(loc.totalWeight || 0).toFixed(2)} kg
          </div>
        `, { sticky: true });
        
        let popupContent = `
          <div style="font-family: 'Inter', sans-serif; min-width: 260px; max-width: 320px;">
            <div style="background: ${circleColor}; padding: 8px 12px; border-radius: 8px 8px 0 0; color: white;">
              <strong style="font-size: 13px;">${loc.address}</strong>
            </div>
            <div style="padding: 12px; background: white; border-radius: 0 0 8px 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Total Reports:</span>
                <strong style="color: ${circleColor};">${reportCount}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Total Weight:</span>
                <strong>${(loc.totalWeight || 0).toFixed(2)} kg</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Detected Items:</span>
                <strong>${loc.detectionCount || 0}</strong>
              </div>
        `;
        
        if (loc.reports && loc.reports.length > 0) {
          popupContent += `
            <hr style="margin: 8px 0; border-color: #e2e8f0;">
            <div style="max-height: 200px; overflow-y: auto;">
              <strong>Recent Reports:</strong>
          `;
          loc.reports.slice(0, 5).forEach(report => {
            popupContent += `
              <div style="
                background: #f8fafc;
                padding: 6px;
                margin-top: 6px;
                border-radius: 6px;
                font-size: 11px;
                cursor: pointer;
                border: 1px solid #e2e8f0;
              " onclick="window.viewReport('${report._id}')">
                <div><strong>${report.classification || 'Unknown'}</strong> - ${report.status || 'pending'}</div>
                <div>Date: ${new Date(report.scanDate || report.createdAt).toLocaleDateString()}</div>
                <div>Items: ${report.detectedObjects?.map(o => o.label).join(', ') || 'No items'}</div>
              </div>
            `;
          });
          popupContent += `</div>`;
        }
        
        popupContent += `
            </div>
          </div>
        `;
        
        circle.bindPopup(popupContent);
        circlesRef.current.push(circle);
      });

      // Add marker icons with count for better visibility
      mapLocations.forEach((loc) => {
        if (!mapRef.current) return;
        
        const reportCount = loc.reportCount || loc.count || 1;
        const circleColor = getCircleColor(reportCount);
        
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            background-color: ${circleColor};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 11px;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">${reportCount > 99 ? '99+' : reportCount}</div>`,
          iconSize: [28, 28],
          popupAnchor: [0, -14],
        });

        const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(mapRef.current);
        markersRef.current.push(marker);
      });

      // Fit bounds to show all locations
      if (mapLocations.length > 0 && mapRef.current) {
        const bounds = L.latLngBounds(mapLocations.map(loc => [loc.lat, loc.lng]));
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (error) {
      console.error('Error updating map markers:', error);
    }
  }, [mapLocations, loading]);

  const resetView = () => {
    if (window.mapInstance && mapLocations.length > 0) {
      const bounds = L.latLngBounds(mapLocations.map(loc => [loc.lat, loc.lng]));
      window.mapInstance.fitBounds(bounds, { padding: [50, 50] });
    } else if (window.mapInstance) {
      const center = getCenter();
      window.mapInstance.setView([center.lat, center.lng], 13);
    }
  };

  const focusTopLocation = () => {
    if (window.mapInstance && topLocations.length > 0) {
      window.mapInstance.setView([topLocations[0].lat, topLocations[0].lng], 16);
    }
  };

  const renderReportModal = () => {
    if (!showReportModal || !selectedReport) return null;
    
    return (
      <div style={S.overlay} onClick={() => setShowReportModal(false)}>
        <div style={S.reportDetailsModal} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.navyDark }}>Report Details</h4>
            <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <Icon d={ICONS.close} size={18} color={C.bodyGray} />
            </button>
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: C.bodyGray, marginBottom: 4 }}>Classification</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.navyDark }}>{selectedReport.classification || 'Unknown'}</div>
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: C.bodyGray, marginBottom: 4 }}>Status</div>
            <div style={{ 
              display: 'inline-block', 
              padding: '2px 8px', 
              borderRadius: 4, 
              fontSize: 11, 
              fontWeight: 600,
              background: selectedReport.status === 'recycled' ? '#4CAF5020' : 
                         selectedReport.status === 'processed' ? '#4FC3F720' : 
                         selectedReport.status === 'pending' ? '#FF980020' : '#F4433620',
              color: selectedReport.status === 'recycled' ? '#4CAF50' : 
                     selectedReport.status === 'processed' ? '#4FC3F7' : 
                     selectedReport.status === 'pending' ? '#FF9800' : '#F44336'
            }}>
              {(selectedReport.status || 'pending').toUpperCase()}
            </div>
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: C.bodyGray, marginBottom: 4 }}>Date Reported</div>
            <div style={{ fontSize: 13, color: C.bodyGray }}>
              {new Date(selectedReport.scanDate || selectedReport.createdAt).toLocaleString()}
            </div>
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: C.bodyGray, marginBottom: 4 }}>Weight</div>
            <div style={{ fontSize: 13, color: C.bodyGray }}>{(selectedReport.weight || calculateTotalWeight(selectedReport) || 0.1).toFixed(2)} kg</div>
          </div>
          
          {selectedReport.detectedObjects?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.bodyGray, marginBottom: 4 }}>Detected Items</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedReport.detectedObjects.map((obj, i) => (
                  <span key={i} style={{
                    background: '#f0f4f8',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    color: C.navyDark,
                    border: '1px solid rgba(27,43,75,0.1)'
                  }}>
                    {obj.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {selectedReport.location?.address && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.bodyGray, marginBottom: 4 }}>Location</div>
              <div style={{ fontSize: 13, color: C.bodyGray }}>{selectedReport.location.address}</div>
            </div>
          )}
          
          <button
            onClick={() => setShowReportModal(false)}
            style={{
              width: '100%',
              marginTop: 16,
              padding: '8px',
              borderRadius: 6,
              border: '1px solid rgba(27,43,75,0.1)',
              background: C.white,
              color: C.bodyGray,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div style={S.mapContainer}>
        <div style={{ padding: '20px', textAlign: 'center', color: C.danger }}>
          <Icon d={ICONS.alert} size={24} color={C.danger} />
          <p>{error}</p>
          <button onClick={() => window.location.reload()} style={S.mapControlBtn}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={S.mapContainer}>
        <div style={S.mapControls}>
          <button style={S.mapControlBtn} onClick={resetView}>
            <Icon d={ICONS.target} size={13} color={C.bodyGray} strokeWidth={2} />
            Reset View
          </button>
          <button style={S.mapControlBtn} onClick={focusTopLocation}>
            <Icon d={ICONS.location} size={13} color={C.bodyGray} strokeWidth={2} />
            Focus Top Location
          </button>
        </div>
        
        <div style={S.mapLegend}>
          <div style={S.mapLegendTitle}>
            <Icon d={ICONS.alert} size={11} color={C.danger} strokeWidth={2} />
            Collection Intensity
          </div>
          <div style={S.legendGradient} />
          <div style={S.legendLabels}>
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: C.bodyGray }}>
            <div>🟢 Low: &lt;5 reports</div>
            <div>🟡 Medium: 5-10 reports</div>
            <div>🟠 High: 10-20 reports</div>
            <div>🔴 Critical: 20+ reports</div>
          </div>
        </div>
        
        <div style={S.locationRankingMap}>
          <div style={S.locationRankingMapTitle}>
            <Icon d={ICONS.list} size={12} color={C.navyDark} strokeWidth={2} />
            Top Collection Areas
          </div>
          {topLocations.slice(0, 7).map((loc, idx) => (
            <div 
              key={idx} 
              style={S.rankingItemMap}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0f4f8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              onClick={() => {
                if (window.mapInstance) {
                  window.mapInstance.setView([loc.lat, loc.lng], 16);
                }
              }}
            >
              <span style={S.rankingName}>{idx + 1}. {loc.address}</span>
              <span style={S.rankingCount}>{loc.reportCount || loc.count || 0}</span>
            </div>
          ))}
          {topLocations.length > 7 && (
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <span style={{ fontSize: 10, color: C.accent }}>
                +{topLocations.length - 7} more locations on map
              </span>
            </div>
          )}
          {topLocations.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '20px', color: C.mutedGray }}>
              No location data available
            </div>
          )}
        </div>
        
        <div style={S.mapInfo}>
          <Icon d={ICONS.map} size={12} color={C.bodyGray} strokeWidth={2} />
          {mapLocations.length} active collection points • Colored dots show intensity • Click dots for details
        </div>
        
        <div id="waste-map" style={{ height: '550px', width: '100%', borderRadius: '12px' }}></div>
        
        {loading && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(255,255,255,0.9)', padding: '20px', borderRadius: '8px', zIndex: 1000 }}>
            <Icon d={ICONS.refresh} size={24} color={C.mutedGray} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ marginLeft: 12, fontSize: 13, color: C.mutedGray }}>Loading map data...</span>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .custom-marker:hover {
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 10px;
          font-family: 'Inter', 'DM Sans', sans-serif;
        }
      `}</style>
      
      {renderReportModal()}
    </>
  );
}

export default Map;