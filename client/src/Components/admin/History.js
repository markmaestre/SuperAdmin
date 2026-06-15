import React, { useState, useEffect } from 'react';
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

// Helper functions for weight and emissions calculation
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
  calendar: "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  weight: "M12 2v4M12 6l4 4-4 4-4-4 4-4z M4 12h16 M12 22v-4",
  location: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  refresh: "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0020.49 15",
  clock: "M12 8v4l3 3 M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
  trash: "M4 7h16 M10 11v6 M14 11v6 M5 7l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14 M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z",
  close: "M18 6L6 18 M6 6l12 12",
  leaf: "M6.5 7.5C5 10 4 14 8 18c4 4 8.5 2.5 10.5 0.5C20 16 21 12 17 8c-3-3-7-3-9-2 M3 21l6-6",
  factory: "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z M12 7v6 M8 7v6 M16 7v6",
  co2: "M4 12h16 M12 4v16",
  trendingUp: "M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6",
  trendingDown: "M23 18l-9.5-9.5-5 5L1 6 M17 18h6v-6",
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
  } else if (status === 'processed') {
    bgColor = '#E3F2FD';
    textColor = C.accent;
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
  dateRange: {
    display: 'flex', gap: 8, alignItems: 'center',
    padding: '5px 10px', border: '1px solid rgba(27,43,75,0.12)',
    borderRadius: 7, background: C.white,
  },
  dateInput: {
    border: 'none', outline: 'none', fontSize: 11,
    fontFamily: "'Inter', 'DM Sans', sans-serif", padding: '4px',
  },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', border: '1px solid rgba(27,43,75,0.12)',
    borderRadius: 7, background: C.white,
  },
  searchInput: {
    border: 'none', outline: 'none', fontSize: 12, width: 180,
    fontFamily: "'Inter', 'DM Sans', sans-serif",
  },
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(27,43,75,0.12)',
    background: C.white, fontSize: 12, fontWeight: 500, color: C.bodyGray,
    cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'Inter', 'DM Sans', sans-serif",
  },
  historyCard: {
    background: C.white, border: '1px solid rgba(27,43,75,0.07)',
    borderRadius: 10, padding: '14px 16px', margin: '0 16px 10px 16px',
    transition: 'all 0.15s', cursor: 'pointer',
  },
  historyHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, flexWrap: 'wrap', gap: 8,
  },
  historyTitle: {
    fontWeight: 700, fontSize: 14, color: C.navyDark,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  historyDetails: {
    display: 'flex', gap: 16, fontSize: 12, color: C.bodyGray,
    flexWrap: 'wrap', marginTop: 8,
  },
  detailItem: {
    display: 'flex', alignItems: 'center', gap: 5,
  },
  emissionsBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
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
    borderBottom: '1px solid rgba(27,43,75,0.07)', fontSize: 12, color: C.bodyGray,
    flexWrap: 'wrap', gap: 10,
  },
  summaryEmissionsItem: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '4px 12px', borderRadius: 20,
    background: 'rgba(79,195,247,0.08)',
  },
};

const History = ({ barangayFilter = null }) => {
  const [historyData, setHistoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalWeight: 0,
    recycledItems: 0,
    disposedItems: 0,
    processedItems: 0,
    pendingItems: 0,
    totalCO2eSaved: 0,
    totalCO2eGenerated: 0,
    netCO2e: 0,
  });
  const itemsPerPage = 10;

  const fetchHistoryData = async () => {
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
      if (!response.ok) throw new Error('Failed to fetch history data');
      const data = await response.json();
      
      // Get user data for names
      const usersResponse = await fetch(`${API_URL}/api/users/all-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersResponse.json();
      const usersMap = new Map();
      if (Array.isArray(usersData)) {
        usersData.forEach(u => usersMap.set(u._id, u));
      }
      
      const reports = (data.reports || []).map(r => {
        const user = usersMap.get(r.user?._id || r.user);
        const userName = user?.username || user?.name || user?.fullName || 'Unknown User';
        const weight = calculateTotalWeight(r);
        const wasteType = (r.classification || '').toLowerCase();
        const disposalMethod = r.disposalMethod || (r.status === 'recycled' ? 'recycled' : 
                              (r.status === 'incinerated' ? 'incinerated' : 'landfill'));
        const distance = r.facilityDistance || 15;
        
        let co2eImpact = 0;
        let co2eBreakdown = { disposal: 0, transport: 0, savings: 0 };
        
        if (r.status === 'recycled') {
          const savings = calculateRecyclingSavings(wasteType, weight);
          co2eImpact = savings;
          co2eBreakdown.savings = savings;
        } else if (r.status === 'disposed' || r.status === 'incinerated') {
          const emissions = calculateCO2Emission(wasteType, weight, disposalMethod, distance);
          co2eImpact = emissions;
          co2eBreakdown.disposal = emissions - (weight * distance * EPA_CO2_FACTORS.transportation);
          co2eBreakdown.transport = weight * distance * EPA_CO2_FACTORS.transportation;
        } else if (r.status === 'processed') {
          // Processing emissions (sorting, cleaning, etc.)
          co2eImpact = (EPA_CO2_FACTORS.landfill[wasteType] || EPA_CO2_FACTORS.landfill.default) * weight * 0.1;
          co2eBreakdown.disposal = co2eImpact;
        }
        
        return {
          ...r,
          calculatedWeight: weight,
          userName: userName,
          userEmail: user?.email || 'Unknown',
          userBarangay: user?.barangay || 'Not specified',
          userUsername: user?.username || 'Unknown',
          co2eImpact: co2eImpact,
          co2eBreakdown: co2eBreakdown,
          disposalMethod: disposalMethod,
        };
      }).sort((a, b) => new Date(b.scanDate || b.createdAt) - new Date(a.scanDate || a.createdAt));
      
      setHistoryData(reports);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, [barangayFilter]);

  useEffect(() => {
    let filtered = [...historyData];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        (r.classification?.toLowerCase().includes(term)) ||
        (r.userName?.toLowerCase().includes(term)) ||
        (r.userUsername?.toLowerCase().includes(term)) ||
        (r.location?.address?.toLowerCase().includes(term))
      );
    }
    
    // Apply date range
    if (dateRange.start) {
      filtered = filtered.filter(r => {
        const date = new Date(r.scanDate || r.createdAt);
        return date >= new Date(dateRange.start);
      });
    }
    if (dateRange.end) {
      filtered = filtered.filter(r => {
        const date = new Date(r.scanDate || r.createdAt);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59);
        return date <= endDate;
      });
    }
    
    setFilteredData(filtered);
    setCurrentPage(1);
    
    // Calculate summary with CO2e metrics
    const totalItems = filtered.length;
    const totalWeight = filtered.reduce((sum, r) => sum + (r.calculatedWeight || 0.1), 0);
    const recycledItems = filtered.filter(r => r.status === 'recycled').length;
    const disposedItems = filtered.filter(r => r.status === 'disposed').length;
    const processedItems = filtered.filter(r => r.status === 'processed').length;
    const pendingItems = filtered.filter(r => r.status === 'pending').length;
    
    const totalCO2eSaved = filtered
      .filter(r => r.status === 'recycled')
      .reduce((sum, r) => sum + (r.co2eImpact || 0), 0);
    
    const totalCO2eGenerated = filtered
      .filter(r => r.status === 'disposed' || r.status === 'processed' || r.status === 'incinerated')
      .reduce((sum, r) => sum + (r.co2eImpact || 0), 0);
    
    const netCO2e = totalCO2eGenerated + totalCO2eSaved;
    
    setSummary({
      totalItems,
      totalWeight: totalWeight.toFixed(1),
      recycledItems,
      disposedItems,
      processedItems,
      pendingItems,
      totalCO2eSaved: Math.abs(totalCO2eSaved).toFixed(2),
      totalCO2eGenerated: totalCO2eGenerated.toFixed(2),
      netCO2e: netCO2e.toFixed(2),
    });
  }, [statusFilter, searchTerm, dateRange, historyData]);

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

  const exportToCSV = () => {
    const headers = ['Date', 'Classification', 'Weight (kg)', 'Status', 'Disposal Method', 'CO₂e Impact (kg)', 'Location', 'Username', 'Email', 'Barangay'];
    const rows = filteredData.map(r => [
      formatDate(r.scanDate || r.createdAt, true),
      r.classification || 'Unknown',
      (r.calculatedWeight || 0.1).toFixed(2),
      r.status,
      r.disposalMethod || (r.status === 'recycled' ? 'recycled' : 'landfill'),
      r.co2eImpact?.toFixed(2) || '0',
      r.location?.address || 'Not specified',
      r.userUsername,
      r.userEmail,
      r.userBarangay,
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `history_emissions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const HistoryDetailModal = () => {
    if (!selectedItem) return null;
    const item = selectedItem;
    const isRecycled = item.status === 'recycled';
    
    return (
      <div style={styles.modal} onClick={() => setSelectedItem(null)}>
        <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon d={isRecycled ? ICONS.leaf : ICONS.clock} size={18} color={isRecycled ? C.success : C.accent} strokeWidth={2} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.navyDark }}>
                Collection Details
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
              <div style={styles.infoLabel}>Date & Time:</div>
              <div style={styles.infoValue}>{formatDate(item.scanDate || item.createdAt, true)}</div>
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
                  {item.status === 'recycled' && <Icon d={ICONS.leaf} size={10} color={C.success} strokeWidth={2.5} />}
                  {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                  {item.status === 'disposed' && item.disposalMethod === 'incinerated' && ' (Incinerated)'}
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
                      <div style={{ marginTop: 4, fontSize: 11, color: C.mutedGray }}>
                        Based on EPA 2025 emission factors
                      </div>
                    </div>
                  ) : item.status === 'disposed' ? (
                    <div style={{ fontSize: 12, color: C.bodyGray }}>
                      <div>• Disposal: {item.co2eBreakdown?.disposal?.toFixed(2) || '0'} kg CO₂e</div>
                      <div>• Transportation: {item.co2eBreakdown?.transport?.toFixed(2) || '0'} kg CO₂e</div>
                      <div style={{ marginTop: 4, fontSize: 11, color: C.mutedGray }}>
                        Based on EPA 2025 emission factors
                      </div>
                    </div>
                  ) : item.status === 'processed' ? (
                    <div style={{ fontSize: 12, color: C.bodyGray }}>
                      <div>• Processing emissions: {item.co2eBreakdown?.disposal?.toFixed(2) || '0'} kg CO₂e</div>
                      <div style={{ marginTop: 4, fontSize: 11, color: C.mutedGray }}>
                        Includes sorting, cleaning, and preparation
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: C.mutedGray }}>
                      Pending - Emissions will be calculated when processed
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>Location:</div>
              <div style={styles.infoValue}>{item.location?.address || 'Not specified'}</div>
            </div>
            
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>Username:</div>
              <div style={styles.infoValue}>
                <div><strong>{item.userUsername}</strong></div>
              </div>
            </div>
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>Email:</div>
              <div style={styles.infoValue}>{item.userEmail}</div>
            </div>
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>Barangay:</div>
              <div style={styles.infoValue}>{item.userBarangay}</div>
            </div>
            
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
            
            {item.imageUrl && (
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Image:</div>
                <div style={styles.infoValue}>
                  <img src={item.imageUrl} alt="Waste" style={{ maxWidth: '100%', borderRadius: 8, marginTop: 8 }} />
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
          Loading history data...
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={styles.container}>
        {/* Summary Bar with CO2e Metrics */}
        <div style={styles.summaryBar}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>Total Records: <strong>{summary.totalItems}</strong></span>
            <span>Total Weight: <strong>{summary.totalWeight} kg</strong></span>
            <span>Recycled: <strong style={{ color: C.success }}>{summary.recycledItems}</strong></span>
            <span>Disposed: <strong style={{ color: C.danger }}>{summary.disposedItems}</strong></span>
            <span>Processed: <strong style={{ color: C.accent }}>{summary.processedItems}</strong></span>
            <span>Pending: <strong style={{ color: C.warning }}>{summary.pendingItems}</strong></span>
          </div>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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
          </div>
        </div>

        {/* Toolbar */}
        <div style={styles.toolbar}>
          <div style={styles.filterGroup}>
            <select 
              style={styles.filterSelect} 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processed">Processed</option>
              <option value="recycled">Recycled</option>
              <option value="disposed">Disposed</option>
            </select>
            
            <div style={styles.dateRange}>
              <Icon d={ICONS.calendar} size={12} color={C.mutedGray} strokeWidth={2} />
              <input
                type="date"
                style={styles.dateInput}
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                placeholder="Start date"
              />
              <span>—</span>
              <input
                type="date"
                style={styles.dateInput}
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                placeholder="End date"
              />
            </div>
            
            <div style={styles.searchBox}>
              <Icon d={ICONS.search} size={14} color={C.mutedGray} strokeWidth={2} />
              <input
                type="text"
                placeholder="Search by item, username, location..."
                style={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div style={styles.filterGroup}>
            <button style={styles.actionBtn} onClick={exportToCSV}>
              <Icon d={ICONS.download} size={14} color={C.bodyGray} strokeWidth={2} />
              Export CSV
            </button>
            <button style={styles.actionBtn} onClick={fetchHistoryData}>
              <Icon d={ICONS.refresh} size={14} color={C.bodyGray} strokeWidth={2} />
              Refresh
            </button>
          </div>
        </div>

        {/* History Cards */}
        {paginatedData.length > 0 ? (
          paginatedData.map((item) => (
            <div 
              key={item._id} 
              style={styles.historyCard}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(27,43,75,0.08)'; e.currentTarget.style.borderColor = 'rgba(27,43,75,0.14)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(27,43,75,0.07)'; }}
            >
              <div style={styles.historyHeader}>
                <div style={styles.historyTitle}>
                  <Icon d={ICONS.trash} size={14} color={C.bodyGray} strokeWidth={2} />
                  {item.classification || 'Unknown'} Waste
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    ...styles.emissionsBadge,
                    background: item.co2eImpact < 0 ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)',
                    color: item.co2eImpact < 0 ? C.success : C.danger,
                  }}>
                    <Icon d={item.co2eImpact < 0 ? ICONS.leaf : ICONS.factory} size={10} color={item.co2eImpact < 0 ? C.success : C.danger} strokeWidth={2} />
                    {formatCO2eImpact(item.co2eImpact)}
                  </span>
                  <span style={statusBadgeStyle(item.status, item.disposalMethod)}>
                    {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                  </span>
                </div>
              </div>
              
              <div style={styles.historyDetails}>
                <span style={styles.detailItem}>
                  <Icon d={ICONS.calendar} size={11} color={C.mutedGray} strokeWidth={2} />
                  {formatDate(item.scanDate || item.createdAt)}
                </span>
                <span style={styles.detailItem}>
                  <Icon d={ICONS.weight} size={11} color={C.mutedGray} strokeWidth={2} />
                  {(item.calculatedWeight || 0.1).toFixed(2)} kg
                </span>
                <span style={styles.detailItem}>
                  <Icon d={ICONS.location} size={11} color={C.mutedGray} strokeWidth={2} />
                  {item.location?.address || 'Not specified'}
                </span>
                <span style={styles.detailItem}>
                  <Icon d={ICONS.user} size={11} color={C.mutedGray} strokeWidth={2} />
                  {item.userUsername}
                </span>
              </div>
              
              <div style={{ ...styles.historyDetails, marginTop: 8, justifyContent: 'flex-end' }}>
                <button 
                  style={{ ...styles.actionBtn, padding: '4px 10px' }}
                  onClick={() => setSelectedItem(item)}
                >
                  <Icon d={ICONS.eye} size={12} color={C.accent} strokeWidth={2} />
                  View Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={styles.emptyState}>
            <Icon d={ICONS.clock} size={48} color={C.mutedGray} strokeWidth={1.2} />
            <p style={{ marginTop: 12, fontSize: 13 }}>No history records found</p>
            <p style={{ fontSize: 11, marginTop: 4, color: C.mutedGray }}>
              Try adjusting your filters or search criteria
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
      
      <HistoryDetailModal />
    </>
  );
};

export default History;