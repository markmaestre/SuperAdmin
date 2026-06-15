import React, { useState, useEffect, useCallback } from 'react';
import API_URL from '../Utils/Api';

// ==================== SCIENTIFIC CO2 EMISSION FACTORS (EPA 2025 ALIGNED) ====================
const EPA_CO2_FACTORS = {
  // kg CO₂e per kg of material
  landfill: {
    plastic: 0.07,
    paper: 0.04,
    glass: 0.02,
    metal: 0.03,
    aluminum: 0.03,
    organic: 0.58,      // EPA 2025: 530 kg CO₂e/short ton
    electronic: 0.12,
    textile: 0.09,
    cardboard: 0.05,
    default: 0.10,
  },
  incineration: {
    plastic: 2.40,      // EPA range: 2.2-2.6
    paper: 0.18,
    glass: 0.02,
    metal: 0.02,
    aluminum: 0.02,
    organic: 0.30,
    electronic: 0.45,
    textile: 0.28,
    cardboard: 0.15,
    default: 0.25,
  },
  recycling: {
    // Negative values = emissions saved (avoided virgin production)
    plastic: -0.20,     // EPA 2025: net savings vs virgin
    paper: -0.35,
    glass: -0.12,
    metal: -2.80,
    aluminum: -9.00,    // Very high savings for aluminum
    organic: -0.08,     // Composting savings
    electronic: -0.65,
    textile: -0.42,
    cardboard: -0.28,
    default: -0.15,
  },
  transportation: 0.000115, // kg CO₂e per kg per km (diesel truck, EPA average)
};

const VIRGIN_EMISSIONS = {
  plastic: 2.50,
  paper: 1.50,
  glass: 0.80,
  metal: 6.00,
  aluminum: 12.00,
  organic: 0.20,
  electronic: 3.50,
  textile: 2.00,
  cardboard: 1.20,
  default: 1.50,
};

const RECYCLED_EMISSIONS = {
  plastic: 1.00,
  paper: 0.60,
  glass: 0.30,
  metal: 1.50,
  aluminum: 2.00,
  organic: 0.10,
  electronic: 1.00,
  textile: 0.80,
  cardboard: 0.50,
  default: 0.60,
};

const calculateTotalWeight = (report) => {
  const quantity = (report.detectedObjects && report.detectedObjects.length > 0)
    ? report.detectedObjects.length
    : 1;
  const unitWeight = report.itemWeight || report.weight || 0.1;
  return unitWeight * quantity;
};

const calculateRecyclingSavings = (wasteType, weight) => {
  const virgin = VIRGIN_EMISSIONS[wasteType] || VIRGIN_EMISSIONS.default;
  const recycled = RECYCLED_EMISSIONS[wasteType] || RECYCLED_EMISSIONS.default;
  return (virgin - recycled) * weight;
};

const calculateCO2Emission = (wasteType, weight, disposalMethod = 'landfill', distance = 15) => {
  const type = (wasteType || '').toLowerCase();
  let baseEmission = 0;
  
  switch (disposalMethod) {
    case 'recycled':
      baseEmission = (EPA_CO2_FACTORS.recycling[type] || EPA_CO2_FACTORS.recycling.default) * weight;
      break;
    case 'incinerated':
      baseEmission = (EPA_CO2_FACTORS.incineration[type] || EPA_CO2_FACTORS.incineration.default) * weight;
      break;
    default:
      baseEmission = (EPA_CO2_FACTORS.landfill[type] || EPA_CO2_FACTORS.landfill.default) * weight;
      break;
  }
  
  // Transportation emissions (if not recycled locally)
  let transportEmission = 0;
  if (disposalMethod !== 'recycled') {
    transportEmission = weight * distance * EPA_CO2_FACTORS.transportation;
  }
  
  return baseEmission + transportEmission;
};

// ==================== STYLES ====================
const C = {
  navyDark: '#1B2B4B',
  navyMid: '#2C4070',
  accent: '#4FC3F7',
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
  deepDark: '#0F1E38',
  bodyGray: '#546E7A',
  mutedGray: '#90A4AE',
  pageBg: '#F0F4F8',
  white: '#FFFFFF',
};

const Icon = ({ d, size = 18, color = 'currentColor', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}>
    <path d={d} />
  </svg>
);

const ICONS = {
  check: "M20 6L9 17l-5-5",
  calendar: "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  weight: "M12 2v4M12 6l4 4-4 4-4-4 4-4z M4 12h16 M12 22v-4",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  barChart: "M18 20V10 M12 20V4 M6 20v-6",
  refresh: "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0020.49 15",
  package: "M20 7h-4.18A3 3 0 0013 5h-2a3 3 0 00-2.82 2H4a1 1 0 00-1 1v10a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z M12 11v4 M9 13h6",
  trendingUp: "M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6",
  trendingDown: "M23 18l-9.5-9.5-5 5L1 6 M17 18h6v-6",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z",
  clock: "M12 8v4l3 3 M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  location: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z",
  trash: "M4 7h16 M10 11v6 M14 11v6 M5 7l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14 M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3",
  close: "M18 6L6 18 M6 6l12 12",
  image: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  messageSquare: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  award: "M12 15v4m-3 0h6M12 2a3 3 0 00-3 3v4a3 3 0 006 0V5a3 3 0 00-3-3z M6 10h12 M6 14h12",
  xCircle: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  leaf: "M6.5 7.5C5 10 4 14 8 18c4 4 8.5 2.5 10.5 0.5C20 16 21 12 17 8c-3-3-7-3-9-2 M3 21l6-6",
  factory: "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z M12 7v6 M8 7v6 M16 7v6",
  co2: "M4 12h16 M12 4v16",
};

const statusBadgeStyle = (status, disposalMethod = null) => {
  let bgColor, textColor;
  
  if (status === 'recycled') {
    bgColor = '#E8F5E9';
    textColor = C.success;
  } else if (status === 'disposed') {
    if (disposalMethod === 'incinerated') {
      bgColor = '#FFF3E0';
      textColor = C.warning;
    } else {
      bgColor = '#FFEBEE';
      textColor = C.danger;
    }
  } else {
    bgColor = '#FFF3E0';
    textColor = C.warning;
  }
  
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: 600,
    background: bgColor, color: textColor,
  };
};

const styles = {
  container: { background: C.white, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(27,43,75,0.04)' },
  toolbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', background: C.white, borderBottom: '1px solid rgba(27,43,75,0.07)',
    flexWrap: 'wrap', gap: 12,
  },
  filterGroup: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  filterSelect: {
    padding: '7px 12px', borderRadius: 7, border: '1px solid rgba(27,43,75,0.12)',
    fontSize: 12, color: C.navyDark, background: C.white, cursor: 'pointer',
    fontFamily: "'Inter', 'DM Sans', sans-serif",
  },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', border: '1px solid rgba(27,43,75,0.12)',
    borderRadius: 7, background: C.white,
    flex: 1, minWidth: 200,
  },
  searchInput: {
    border: 'none', outline: 'none', fontSize: 12, width: '100%',
    fontFamily: "'Inter', 'DM Sans', sans-serif",
    background: 'transparent',
  },
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(27,43,75,0.12)',
    background: C.white, fontSize: 12, fontWeight: 500, color: C.bodyGray,
    cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'Inter', 'DM Sans', sans-serif",
  },
  viewBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(79,195,247,0.2)',
    background: 'rgba(79,195,247,0.08)', fontSize: 11, fontWeight: 600,
    color: C.accent, cursor: 'pointer', transition: 'all 0.15s',
    fontFamily: "'Inter', 'DM Sans', sans-serif",
  },
  clearSearchBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '4px', borderRadius: 4, border: 'none',
    background: 'transparent', color: C.mutedGray,
    cursor: 'pointer', transition: 'all 0.15s',
    fontSize: 12,
  },
  tableHeader: {
    display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr 0.9fr 1fr 0.9fr 0.8fr',
    background: '#F8FAFC', padding: '12px 20px',
    fontWeight: 700, fontSize: 10.5, color: C.navyDark,
    borderBottom: '1px solid rgba(27,43,75,0.08)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  tableRow: {
    display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr 0.9fr 1fr 0.9fr 0.8fr',
    padding: '12px 20px', fontSize: 13, color: C.bodyGray,
    borderBottom: '1px solid rgba(27,43,75,0.04)',
    transition: 'background 0.15s', alignItems: 'center',
  },
  pagination: {
    display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
    gap: 8, padding: '16px 20px', borderTop: '1px solid rgba(27,43,75,0.07)',
  },
  pageBtn: {
    padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(27,43,75,0.12)',
    background: C.white, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
    fontFamily: "'Inter', 'DM Sans', sans-serif",
  },
  pageActive: { background: C.accent, color: C.white, borderColor: C.accent },
  emptyState: { padding: '60px 20px', textAlign: 'center', color: C.mutedGray },
  summaryBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 20px', background: '#F8FAFC',
    borderTop: '1px solid rgba(27,43,75,0.07)', fontSize: 12, color: C.bodyGray,
    flexWrap: 'wrap', gap: 10,
  },
  summaryItem: {
    display: 'flex', alignItems: 'center', gap: 6,
  },
  summaryEmissionsItem: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '4px 12px', borderRadius: 20,
    background: 'rgba(79,195,247,0.08)',
  },
  modal: {
    position: 'fixed', inset: 0, background: 'rgba(15,30,56,0.65)',
    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 9999, padding: 16,
  },
  modalBox: {
    background: C.white, borderRadius: 16, width: '100%', maxWidth: 600,
    maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
    border: '1px solid rgba(27,43,75,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid rgba(27,43,75,0.07)',
  },
  modalBody: { overflowY: 'auto', flex: 1, padding: '20px' },
  modalClose: {
    width: 30, height: 30, borderRadius: '50%', background: C.pageBg,
    border: '1px solid rgba(27,43,75,0.1)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, color: C.bodyGray,
  },
  infoRow: {
    display: 'flex', padding: '10px 0', borderBottom: '1px solid rgba(27,43,75,0.06)',
    fontSize: 13,
  },
  infoLabel: { width: 130, fontWeight: 600, color: C.navyDark, flexShrink: 0 },
  infoValue: { flex: 1, color: C.bodyGray },
  imageContainer: {
    marginTop: 10, marginBottom: 10, borderRadius: 8, overflow: 'hidden',
    background: C.pageBg, textAlign: 'center',
  },
  image: { maxWidth: '100%', maxHeight: 250, objectFit: 'contain' },
  proofContainer: {
    background: C.pageBg, padding: '12px', borderRadius: 8, marginTop: 10,
    border: '1px solid rgba(27,43,75,0.07)',
  },
  proofText: { fontSize: 12, color: C.navyDark, lineHeight: 1.6, marginBottom: 8 },
  proofMeta: {
    fontSize: 10, color: C.mutedGray, display: 'flex', alignItems: 'center',
    gap: 8, marginTop: 6,
  },
  badgeSuccess: {
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
    borderRadius: 4, fontSize: 10, fontWeight: 600,
    background: 'rgba(16,185,129,0.1)', color: C.success,
  },
  debounceInfo: { fontSize: 10, color: C.mutedGray, marginLeft: 8 },
  emissionsImpactPositive: { color: C.danger, fontWeight: 600 },
  emissionsImpactNegative: { color: C.success, fontWeight: 600 },
};

const Collection = ({ barangayFilter = null }) => {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [disposalMethodFilter, setDisposalMethodFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalWeight: 0,
    averageWeight: 0,
    recycledItems: 0,
    disposedItems: 0,
    totalCO2eSaved: 0,
    totalCO2eGenerated: 0,
    netCO2e: 0,
  });
  const itemsPerPage = 15;
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchCollectionData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      let url = '/api/waste-reports';
      if (barangayFilter) {
        url += `?barangay=${barangayFilter}`;
      }
      const response = await fetch(`${API_URL}${url}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch collection data');
      const data = await response.json();
      let reports = data.reports || [];
      
      // Filter to show only disposed/recycled items
      reports = reports.filter(r => r.status === 'disposed' || r.status === 'recycled');
      
      // Get user data for names
      try {
        const usersResponse = await fetch(`${API_URL}/api/users/all-users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const usersData = await usersResponse.json();
        const usersMap = new Map();
        if (Array.isArray(usersData)) {
          usersData.forEach(u => usersMap.set(u._id, u));
        }
        
        // Enrich reports with user data and calculate CO2e
        reports = reports.map(r => {
          const user = usersMap.get(r.user?._id || r.user);
          const weight = calculateTotalWeight(r);
          const wasteType = (r.classification || '').toLowerCase();
          const disposalMethod = r.disposalMethod || (r.status === 'recycled' ? 'recycled' : 'landfill');
          const distance = r.facilityDistance || 15; // Default 15km if not specified
          
          let co2eImpact = 0;
          let co2eBreakdown = { disposal: 0, transport: 0, savings: 0 };
          
          if (r.status === 'recycled') {
            const savings = calculateRecyclingSavings(wasteType, weight);
            co2eImpact = savings;
            co2eBreakdown.savings = savings;
          } else {
            const emissions = calculateCO2Emission(wasteType, weight, disposalMethod, distance);
            co2eImpact = emissions;
            co2eBreakdown.disposal = emissions - (weight * distance * EPA_CO2_FACTORS.transportation);
            co2eBreakdown.transport = weight * distance * EPA_CO2_FACTORS.transportation;
          }
          
          return {
            ...r,
            calculatedWeight: weight,
            userName: user?.username || user?.name || user?.fullName || 'Unknown User',
            userEmail: user?.email || 'Unknown',
            userBarangay: user?.barangay || 'Not specified',
            proofImage: r.disposalProof || r.recyclingProof || null,
            adminNote: r.adminNote || r.completionNote || null,
            processedDate: r.processedDate || r.updatedAt || r.scanDate || r.createdAt,
            co2eImpact: co2eImpact,
            co2eBreakdown: co2eBreakdown,
            disposalMethod: disposalMethod,
          };
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
        reports = reports.map(r => ({
          ...r,
          userName: 'Unknown User',
          userEmail: 'Unknown',
          userBarangay: 'Not specified',
          calculatedWeight: calculateTotalWeight(r),
          co2eImpact: 0,
        }));
      }
      
      setAllData(reports);
    } catch (error) {
      console.error('Error fetching collection data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectionData();
  }, [barangayFilter]);

  useEffect(() => {
    let filtered = [...allData];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    if (disposalMethodFilter !== 'all' && statusFilter === 'disposed') {
      filtered = filtered.filter(r => r.disposalMethod === disposalMethodFilter);
    }
    
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        (r.classification?.toLowerCase().includes(term)) ||
        (r.location?.address?.toLowerCase().includes(term)) ||
        (r.userName?.toLowerCase().includes(term)) ||
        (r.userEmail?.toLowerCase().includes(term))
      );
    }
    
    setFilteredData(filtered);
    setCurrentPage(1);
    
    // Calculate summary with CO2e metrics
    const totalItems = filtered.length;
    const totalWeight = filtered.reduce((sum, r) => sum + (r.calculatedWeight || 0.1), 0);
    const recycledItems = filtered.filter(r => r.status === 'recycled').length;
    const disposedItems = filtered.filter(r => r.status === 'disposed').length;
    
    const totalCO2eSaved = filtered
      .filter(r => r.status === 'recycled')
      .reduce((sum, r) => sum + (r.co2eImpact || 0), 0);
    
    const totalCO2eGenerated = filtered
      .filter(r => r.status === 'disposed')
      .reduce((sum, r) => sum + (r.co2eImpact || 0), 0);
    
    const netCO2e = totalCO2eGenerated + totalCO2eSaved;
    
    setSummary({
      totalItems,
      totalWeight: totalWeight.toFixed(1),
      averageWeight: totalItems > 0 ? (totalWeight / totalItems).toFixed(1) : 0,
      recycledItems,
      disposedItems,
      totalCO2eSaved: Math.abs(totalCO2eSaved).toFixed(2),
      totalCO2eGenerated: totalCO2eGenerated.toFixed(2),
      netCO2e: netCO2e.toFixed(2),
    });
  }, [statusFilter, disposalMethodFilter, debouncedSearchTerm, allData]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (date, includeTime = false) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    if (includeTime) {
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    }
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });
  };

  const exportToCSV = () => {
    const headers = ['Date Processed', 'Classification', 'Weight (kg)', 'Status', 'Disposal Method', 'CO₂e Impact (kg)', 'Location', 'Username', 'Email', 'Barangay', 'Admin Note'];
    const rows = filteredData.map(r => [
      formatDate(r.processedDate, true),
      r.classification || 'Unknown',
      (r.calculatedWeight || 0.1).toFixed(2),
      r.status,
      r.disposalMethod || (r.status === 'recycled' ? 'recycled' : 'landfill'),
      r.co2eImpact?.toFixed(2) || '0',
      r.location?.address || 'Not specified',
      r.userName,
      r.userEmail,
      r.userBarangay,
      r.adminNote || 'No note',
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `completed_collection_emissions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };

  const formatCO2eImpact = (impact) => {
    if (!impact && impact !== 0) return 'N/A';
    const absValue = Math.abs(impact).toFixed(2);
    if (impact < 0) {
      return `-${absValue} kg CO₂e`;
    } else if (impact > 0) {
      return `+${absValue} kg CO₂e`;
    }
    return `0 kg CO₂e`;
  };

  const CollectionDetailModal = () => {
    if (!selectedItem) return null;
    const item = selectedItem;
    const isRecycled = item.status === 'recycled';
    
    return (
      <div style={styles.modal} onClick={() => setSelectedItem(null)}>
        <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon d={isRecycled ? ICONS.leaf : ICONS.factory} size={18} color={isRecycled ? C.success : C.danger} strokeWidth={2} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.navyDark }}>
                {isRecycled ? 'Recycled Item Details' : 'Disposed Item Details'}
              </h3>
            </div>
            <button style={styles.modalClose} onClick={() => setSelectedItem(null)}>✕</button>
          </div>
          <div style={styles.modalBody}>
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>Report ID:</div>
              <div style={styles.infoValue}>{item._id}</div>
            </div>
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>Date Reported:</div>
              <div style={styles.infoValue}>{formatDate(item.scanDate || item.createdAt, true)}</div>
            </div>
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>Date Processed:</div>
              <div style={styles.infoValue}>{formatDate(item.processedDate, true)}</div>
            </div>
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>Classification:</div>
              <div style={styles.infoValue}>
                <span style={{ fontWeight: 700, color: C.navyDark }}>{item.classification || 'Unknown'}</span>
              </div>
            </div>
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>Weight:</div>
              <div style={styles.infoValue}>{(item.calculatedWeight || 0.1).toFixed(2)} kg</div>
            </div>
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>Status:</div>
              <div style={styles.infoValue}>
                <span style={statusBadgeStyle(item.status, item.disposalMethod)}>
                  {isRecycled && <Icon d={ICONS.check} size={10} color={C.success} strokeWidth={2.5} />}
                  {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                  {!isRecycled && item.disposalMethod === 'incinerated' && ' (Incinerated)'}
                </span>
              </div>
            </div>
            
            {/* CO₂e Impact Section */}
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>CO₂e Environmental Impact:</div>
              <div style={styles.infoValue}>
                <div style={{
                  padding: '10px',
                  borderRadius: 8,
                  background: item.co2eImpact < 0 ? 'rgba(76,175,80,0.08)' : 'rgba(244,67,54,0.08)',
                  border: `1px solid ${item.co2eImpact < 0 ? C.success : C.danger}30`,
                }}>
                  <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: item.co2eImpact < 0 ? C.success : C.danger }}>
                    {formatCO2eImpact(item.co2eImpact)}
                  </div>
                  {isRecycled ? (
                    <div style={{ fontSize: 12, color: C.bodyGray }}>
                      <Icon d={ICONS.leaf} size={12} color={C.success} strokeWidth={2} style={{ marginRight: 4 }} />
                      Emissions saved by recycling instead of producing virgin materials
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: C.bodyGray }}>
                      <div>• Disposal: {item.co2eBreakdown?.disposal?.toFixed(2) || '0'} kg CO₂e</div>
                      <div>• Transportation: {item.co2eBreakdown?.transport?.toFixed(2) || '0'} kg CO₂e</div>
                      <div style={{ marginTop: 4, fontSize: 11, color: C.mutedGray }}>
                        Based on EPA 2025 emission factors
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>Location:</div>
              <div style={styles.infoValue}>{item.location?.address || 'Not specified'}</div>
            </div>
            
            {/* Waste Image */}
            {item.imageUrl && (
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Waste Image:</div>
                <div style={styles.infoValue}>
                  <div style={styles.imageContainer}>
                    <img src={item.imageUrl} alt="Waste" style={styles.image} />
                  </div>
                </div>
              </div>
            )}
            
            {/* Proof of Disposal/Recycling */}
            {(item.proofImage || item.adminNote) && (
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Proof of {isRecycled ? 'Recycling' : 'Disposal'}:</div>
                <div style={styles.infoValue}>
                  <div style={styles.proofContainer}>
                    {item.proofImage && (
                      <div style={styles.imageContainer}>
                        <img src={item.proofImage} alt="Proof" style={styles.image} />
                      </div>
                    )}
                    {item.adminNote && (
                      <div style={styles.proofText}>
                        <strong>Admin Note:</strong>
                        <p style={{ margin: '5px 0 0 0' }}>{item.adminNote}</p>
                      </div>
                    )}
                    <div style={styles.proofMeta}>
                      <span style={styles.badgeSuccess}>
                        <Icon d={ICONS.check} size={8} color={C.success} strokeWidth={2.5} />
                        {isRecycled ? 'Successfully Recycled' : 'Successfully Disposed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* User Info */}
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>User Information:</div>
              <div style={styles.infoValue}>
                <div><strong>{item.userName}</strong></div>
                <div style={{ fontSize: 11, color: C.mutedGray }}>{item.userEmail}</div>
                <div style={{ fontSize: 11, color: C.mutedGray }}>Barangay: {item.userBarangay}</div>
              </div>
            </div>
            
            {/* Detected Items */}
            {item.detectedObjects && item.detectedObjects.length > 0 && (
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Detected Items:</div>
                <div style={styles.infoValue}>
                  {item.detectedObjects.map((obj, idx) => (
                    <span key={idx} style={{
                      display: 'inline-block', background: C.pageBg,
                      padding: '2px 8px', borderRadius: 4, margin: '2px 4px',
                      fontSize: 11,
                    }}>
                      {obj.label} ({obj.confidence && `${(obj.confidence * 100).toFixed(0)}%`})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ padding: 60, textAlign: 'center', color: C.mutedGray }}>
          Loading completed collections...
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={styles.container}>
        {/* Toolbar */}
        <div style={styles.toolbar}>
          <div style={styles.filterGroup}>
            <select 
              style={styles.filterSelect} 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Completed (Recycled & Disposed)</option>
              <option value="recycled">Recycled Only</option>
              <option value="disposed">Disposed Only</option>
            </select>
            
            {statusFilter === 'disposed' && (
              <select 
                style={styles.filterSelect} 
                value={disposalMethodFilter} 
                onChange={(e) => { setDisposalMethodFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">All Disposal Methods</option>
                <option value="landfill">Landfill Only</option>
                <option value="incinerated">Incineration Only</option>
              </select>
            )}
            
            <div style={styles.searchBox}>
              <Icon d={ICONS.search} size={14} color={C.mutedGray} strokeWidth={2} />
              <input
                type="text"
                placeholder="Search by item, username, location, email..."
                style={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button style={styles.clearSearchBtn} onClick={clearSearch}>
                  <Icon d={ICONS.xCircle} size={14} color={C.mutedGray} strokeWidth={2} />
                </button>
              )}
            </div>
            {searchTerm && debouncedSearchTerm !== searchTerm && (
              <span style={styles.debounceInfo}>Typing...</span>
            )}
          </div>
          
          <div style={styles.filterGroup}>
            <button style={styles.actionBtn} onClick={exportToCSV} disabled={filteredData.length === 0}>
              <Icon d={ICONS.download} size={14} color={C.bodyGray} strokeWidth={2} />
              Export CSV
            </button>
            <button style={styles.actionBtn} onClick={fetchCollectionData}>
              <Icon d={ICONS.refresh} size={14} color={C.bodyGray} strokeWidth={2} />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Bar with CO2e Metrics */}
        <div style={styles.summaryBar}>
          <div style={styles.summaryItem}>
            <Icon d={ICONS.award} size={14} color={C.success} strokeWidth={2} />
            <span>Total Completed: <strong>{summary.totalItems}</strong></span>
          </div>
          <div style={styles.summaryItem}>
            <Icon d={ICONS.weight} size={14} color={C.bodyGray} strokeWidth={2} />
            <span>Total Weight: <strong>{summary.totalWeight} kg</strong></span>
          </div>
          <div style={styles.summaryItem}>
            <Icon d={ICONS.package} size={14} color={C.success} strokeWidth={2} />
            <span>Recycled: <strong>{summary.recycledItems || 0}</strong></span>
          </div>
          <div style={styles.summaryItem}>
            <Icon d={ICONS.trash} size={14} color={C.danger} strokeWidth={2} />
            <span>Disposed: <strong>{summary.disposedItems || 0}</strong></span>
          </div>
          
          {/* CO₂e Metrics */}
          <div style={styles.summaryEmissionsItem}>
            <Icon d={ICONS.leaf} size={14} color={C.success} strokeWidth={2} />
            <span>CO₂e Saved: <strong style={{ color: C.success }}>{summary.totalCO2eSaved} kg</strong></span>
          </div>
          <div style={styles.summaryEmissionsItem}>
            <Icon d={ICONS.factory} size={14} color={C.danger} strokeWidth={2} />
            <span>CO₂e Generated: <strong style={{ color: C.danger }}>{summary.totalCO2eGenerated} kg</strong></span>
          </div>
          <div style={{
            ...styles.summaryEmissionsItem,
            background: parseFloat(summary.netCO2e) < 0 ? 'rgba(76,175,80,0.12)' : 'rgba(244,67,54,0.08)'
          }}>
            <Icon d={ICONS.co2} size={14} color={parseFloat(summary.netCO2e) < 0 ? C.success : C.danger} strokeWidth={2} />
            <span>Net CO₂e: <strong style={{ color: parseFloat(summary.netCO2e) < 0 ? C.success : C.danger }}>
              {parseFloat(summary.netCO2e) < 0 ? '-' : '+'}{Math.abs(parseFloat(summary.netCO2e)).toFixed(2)} kg
            </strong></span>
          </div>
          
          {searchTerm && (
            <div style={styles.summaryItem}>
              <Icon d={ICONS.search} size={14} color={C.accent} strokeWidth={2} />
              <span>Search results: <strong>{filteredData.length}</strong> items</span>
            </div>
          )}
        </div>

        {/* Table Header */}
        <div style={styles.tableHeader}>
          <span>Date Processed</span>
          <span>Classification</span>
          <span>Weight</span>
          <span>Status</span>
          <span>CO₂e Impact</span>
          <span>User</span>
          <span>Actions</span>
        </div>

        {/* Table Rows */}
        {paginatedData.length > 0 ? (
          paginatedData.map((item, idx) => (
            <div 
              key={item._id || idx} 
              style={styles.tableRow}
              onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ color: C.navyDark, fontWeight: 500 }}>
                {formatDate(item.processedDate)}
              </span>
              <span>{item.classification || 'Unknown'}</span>
              <span>{(item.calculatedWeight || 0.1).toFixed(2)} kg</span>
              <span>
                <span style={statusBadgeStyle(item.status, item.disposalMethod)}>
                  {item.status === 'recycled' && <Icon d={ICONS.check} size={10} color={C.success} strokeWidth={2.5} />}
                  {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                </span>
              </span>
              <span style={item.co2eImpact < 0 ? styles.emissionsImpactNegative : styles.emissionsImpactPositive}>
                {formatCO2eImpact(item.co2eImpact)}
              </span>
              <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <Icon d={ICONS.user} size={11} color={C.mutedGray} strokeWidth={2} style={{ marginRight: 4 }} />
                {item.userName}
              </span>
              <span>
                <button 
                  style={styles.viewBtn}
                  onClick={() => setSelectedItem(item)}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,195,247,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(79,195,247,0.08)'; }}
                >
                  <Icon d={ICONS.eye} size={11} color={C.accent} strokeWidth={2} />
                  View Details
                </button>
              </span>
            </div>
          ))
        ) : (
          <div style={styles.emptyState}>
            <Icon d={ICONS.award} size={48} color={C.mutedGray} strokeWidth={1.2} />
            <p style={{ marginTop: 12, fontSize: 13 }}>
              {searchTerm ? 'No matching completed collections found' : 'No completed collections found'}
            </p>
            <p style={{ fontSize: 11, marginTop: 4, color: C.mutedGray }}>
              {searchTerm ? 'Try a different search term' : 'Only disposed and recycled items appear here'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={styles.pagination}>
            <button
              style={styles.pageBtn}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              
              return (
                <button
                  key={pageNum}
                  style={{ ...styles.pageBtn, ...(currentPage === pageNum ? styles.pageActive : {}) }}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              style={styles.pageBtn}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
      
      <CollectionDetailModal />
    </>
  );
};

export default Collection;