import React, { useState, useEffect } from 'react';
import API_URL from '../Utils/Api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Users, UserCheck, UserX, BarChart2, Download, RefreshCw,
  Search, ChevronDown, X, Eye, Shield, ShieldOff, Calendar,
  Mail, MapPin, User, Clock, Hash, Filter, Trash2,
  Weight, Package, History, TrendingUp, AlertCircle, FileText, Camera, FileSpreadsheet
} from 'lucide-react';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  ink:        '#0D1829',
  inkMid:     '#1E2D47',
  inkLight:   '#2C4168',
  skyBlue:    '#2563EB',
  skyHover:   '#1D4ED8',
  skyTint:    '#EFF6FF',
  skyBorder:  '#BFDBFE',
  emerald:    '#059669',
  emeraldTint:'#ECFDF5',
  emeraldBdr: '#A7F3D0',
  rose:       '#DC2626',
  roseTint:   '#FEF2F2',
  roseBdr:    '#FECACA',
  amber:      '#D97706',
  amberTint:  '#FFFBEB',
  slate:      '#64748B',
  slateLight: '#94A3B8',
  border:     '#E2E8F0',
  borderMid:  '#CBD5E1',
  surface:    '#F8FAFC',
  surfaceAlt: '#F1F5F9',
  white:      '#FFFFFF',
};

// ── Typography ────────────────────────────────────────────────────────────────
const fontStack = "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif";
const monoStack = "'IBM Plex Mono', 'Fira Code', monospace";

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page: {
    fontFamily: fontStack,
    background: C.surface,
    minHeight: '100vh',
  },
  container: {
    background: C.white,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 8px 32px rgba(13,24,41,0.06)',
    overflow: 'hidden',
  },

  // ── Header ──
  header: {
    padding: '20px 24px',
    borderBottom: `1px solid ${C.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    background: C.ink,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#93C5FD',
    flexShrink: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: C.white,
    margin: 0,
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  headerStats: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  statChip: (variant) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 6,
    background: variant === 'total' ? 'rgba(255,255,255,0.08)' :
                variant === 'active' ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)',
    border: variant === 'total' ? '1px solid rgba(255,255,255,0.12)' :
            variant === 'active' ? '1px solid rgba(5,150,105,0.35)' : '1px solid rgba(220,38,38,0.35)',
  }),
  statChipNum: (variant) => ({
    fontSize: 14,
    fontWeight: 700,
    color: variant === 'total' ? C.white :
           variant === 'active' ? '#34D399' : '#F87171',
    fontFamily: monoStack,
  }),
  statChipLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: 500,
  },

  // ── Analytics Bar ──
  analyticsBar: {
    padding: '16px 24px',
    borderBottom: `1px solid ${C.border}`,
    background: C.surfaceAlt,
  },
  analyticsTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 10,
  },
  analyticsSectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    fontWeight: 700,
    color: C.slate,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  analyticsCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: 8,
  },
  analyticsCard: {
    background: C.white,
    borderRadius: 8,
    padding: '12px 14px',
    border: `1px solid ${C.border}`,
    position: 'relative',
    overflow: 'hidden',
  },
  analyticsCardAccent: (color) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    background: color || C.skyBlue,
  }),
  analyticsNum: {
    fontSize: 20,
    fontWeight: 800,
    color: C.ink,
    letterSpacing: '-0.03em',
    lineHeight: 1,
    fontFamily: monoStack,
    marginTop: 4,
  },
  analyticsLabel: {
    fontSize: 10,
    color: C.slateLight,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    fontWeight: 600,
  },

  // ── Filters ──
  filterSection: {
    padding: '14px 24px',
    borderBottom: `1px solid ${C.border}`,
    background: C.white,
  },
  filterRow: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
    '&:last-child': { marginBottom: 0 },
  },
  filterRowLast: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: C.slateLight,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    minWidth: 90,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  quickBtn: (active) => ({
    padding: '5px 12px',
    borderRadius: 6,
    border: active ? `1.5px solid ${C.skyBlue}` : `1px solid ${C.border}`,
    background: active ? C.skyBlue : C.white,
    color: active ? C.white : C.slate,
    fontSize: 11.5,
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    transition: 'all 0.12s ease',
    fontFamily: fontStack,
  }),
  dateInput: {
    padding: '6px 10px',
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    fontSize: 12,
    fontFamily: fontStack,
    color: C.ink,
    outline: 'none',
    background: C.surface,
    cursor: 'pointer',
  },
  clearBtn: {
    padding: '5px 10px',
    borderRadius: 6,
    border: `1px solid ${C.roseBdr}`,
    background: C.roseTint,
    color: C.rose,
    fontSize: 11.5,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontFamily: fontStack,
  },

  // ── Search Bar ──
  searchBar: {
    padding: '12px 24px',
    borderBottom: `1px solid ${C.border}`,
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    background: C.white,
    alignItems: 'center',
  },
  searchWrap: {
    flex: 1,
    position: 'relative',
    minWidth: 200,
  },
  searchIcon: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    color: C.slateLight,
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '8px 10px 8px 33px',
    border: `1px solid ${C.border}`,
    borderRadius: 7,
    fontSize: 13,
    fontFamily: fontStack,
    color: C.ink,
    outline: 'none',
    background: C.surface,
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  selectWrap: {
    position: 'relative',
  },
  filterSelect: {
    padding: '8px 30px 8px 10px',
    border: `1px solid ${C.border}`,
    borderRadius: 7,
    fontSize: 12.5,
    fontFamily: fontStack,
    background: C.surface,
    color: C.ink,
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
  },
  selectIcon: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: C.slateLight,
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 7,
    border: 'none',
    background: C.ink,
    color: C.white,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: fontStack,
    transition: 'all 0.12s',
    whiteSpace: 'nowrap',
  },
  ghostBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '8px 12px',
    borderRadius: 7,
    border: `1px solid ${C.border}`,
    background: C.white,
    color: C.slate,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: fontStack,
    transition: 'all 0.12s',
    whiteSpace: 'nowrap',
  },

  // ── Table ──
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    padding: '10px 16px',
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: C.slateLight,
    background: C.surfaceAlt,
    borderBottom: `1px solid ${C.border}`,
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 16px',
    fontSize: 13,
    color: C.slate,
    borderBottom: `1px solid ${C.border}`,
    verticalAlign: 'middle',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: `linear-gradient(135deg, ${C.skyTint}, ${C.skyBorder})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    color: C.skyBlue,
    overflow: 'hidden',
    flexShrink: 0,
    border: `1px solid ${C.skyBorder}`,
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  username: { fontWeight: 600, color: C.ink, fontSize: 13 },
  badge: (status) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 9px',
    borderRadius: 5,
    fontSize: 10.5,
    fontWeight: 700,
    background: status === 'active' ? C.emeraldTint : status === 'banned' ? C.roseTint : C.amberTint,
    color: status === 'active' ? C.emerald : status === 'banned' ? C.rose : C.amber,
    border: `1px solid ${status === 'active' ? C.emeraldBdr : status === 'banned' ? C.roseBdr : '#FDE68A'}`,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }),
  actionBtn: (variant) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 10px',
    borderRadius: 6,
    border: `1px solid ${variant === 'view' ? C.skyBorder : variant === 'ban' ? C.roseBdr : C.emeraldBdr}`,
    fontSize: 11.5,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: fontStack,
    transition: 'all 0.12s',
    marginRight: 5,
    background: variant === 'view' ? C.skyTint : variant === 'ban' ? C.roseTint : C.emeraldTint,
    color: variant === 'view' ? C.skyBlue : variant === 'ban' ? C.rose : C.emerald,
  }),

  // ── States ──
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 64,
    color: C.slateLight,
    gap: 14,
  },
  emptyState: {
    textAlign: 'center',
    padding: 60,
    color: C.slateLight,
  },
  errorBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '11px 20px',
    background: C.roseTint,
    borderBottom: `1px solid ${C.roseBdr}`,
    color: C.rose,
    fontSize: 13,
  },

  // ── Modal ──
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(13,24,41,0.7)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 16,
  },
  modal: {
    background: C.white,
    borderRadius: 14,
    width: 680,
    maxWidth: '100%',
    maxHeight: '88vh',
    overflow: 'auto',
    boxShadow: '0 40px 80px rgba(0,0,0,0.22)',
    border: `1px solid ${C.border}`,
  },
  modalHeader: {
    padding: '16px 20px',
    borderBottom: `1px solid ${C.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    background: C.white,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: C.ink,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  modalBody: { padding: '20px' },
  modalFooter: {
    padding: '12px 20px',
    borderTop: `1px solid ${C.border}`,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: C.slateLight,
    padding: 4,
    borderRadius: 5,
    display: 'flex',
  },

  // ── User Profile Card ──
  profileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '16px',
    background: C.ink,
    borderRadius: 10,
    marginBottom: 18,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.12)',
    border: '2px solid rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    fontWeight: 800,
    color: C.white,
    overflow: 'hidden',
    flexShrink: 0,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 700,
    color: C.white,
    margin: 0,
  },
  profileEmail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },

  // ── Info Grid ──
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 1,
    background: C.border,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 18,
  },
  infoCell: {
    background: C.white,
    padding: '10px 14px',
  },
  infoCellLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: C.slateLight,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginBottom: 3,
  },
  infoCellValue: {
    fontSize: 13,
    color: C.ink,
    fontWeight: 500,
  },

  // ── Stats Grid ──
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
    marginBottom: 18,
  },
  statCard: {
    background: C.surfaceAlt,
    borderRadius: 8,
    padding: '12px 14px',
    border: `1px solid ${C.border}`,
    textAlign: 'center',
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: 800,
    color: C.ink,
    lineHeight: 1,
    fontFamily: monoStack,
  },
  statCardLabel: {
    fontSize: 10,
    color: C.slateLight,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 600,
  },

  // ── Report Items ──
  historyTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: C.ink,
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: `1px solid ${C.border}`,
  },
  reportItem: {
    background: C.surface,
    borderRadius: 8,
    padding: '12px 14px',
    marginBottom: 8,
    border: `1px solid ${C.border}`,
    cursor: 'pointer',
    transition: 'border-color 0.12s, box-shadow 0.12s',
  },
  reportItemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  reportType: {
    fontSize: 12.5,
    fontWeight: 700,
    color: C.ink,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  reportStatus: (status) => ({
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    background: status === 'recycled' ? C.emeraldTint : status === 'disposed' ? C.roseTint :
                status === 'processed' ? C.skyTint : C.amberTint,
    color: status === 'recycled' ? C.emerald : status === 'disposed' ? C.rose :
           status === 'processed' ? C.skyBlue : C.amber,
    border: `1px solid ${status === 'recycled' ? C.emeraldBdr : status === 'disposed' ? C.roseBdr :
             status === 'processed' ? C.skyBorder : '#FDE68A'}`,
  }),
  reportMeta: {
    display: 'flex',
    gap: 14,
    flexWrap: 'wrap',
    fontSize: 11,
    color: C.slateLight,
  },
  reportMetaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsBtn: {
    marginTop: 9,
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 600,
    color: C.skyBlue,
    background: C.skyTint,
    border: `1px solid ${C.skyBorder}`,
    borderRadius: 5,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontFamily: fontStack,
  },
  noReports: {
    textAlign: 'center',
    padding: 32,
    color: C.slateLight,
    fontSize: 12.5,
  },

  // ── Report Modal ──
  reportOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(13,24,41,0.75)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: 16,
  },
  reportModal: {
    background: C.white,
    borderRadius: 14,
    width: '100%',
    maxWidth: 560,
    maxHeight: '88vh',
    overflow: 'auto',
    boxShadow: '0 40px 80px rgba(0,0,0,0.25)',
    border: `1px solid ${C.border}`,
  },
  reportImage: {
    width: '100%',
    maxHeight: 260,
    objectFit: 'contain',
    borderRadius: 8,
    marginBottom: 14,
    background: C.surfaceAlt,
    border: `1px solid ${C.border}`,
  },
};

// ── CSV Export Function ─────────────────────────────────────────────────────────
const exportToCSV = (users, analytics, adminRole, barangayFilter) => {
  // Prepare CSV headers
  let headers = ['Username', 'Email', 'Gender', 'Status', 'Date Joined'];
  
  // Add Barangay column only for superadmin
  if (!adminRole || adminRole === '') {
    headers.push('Barangay');
  }
  
  // Add address column
  headers.push('Address', 'Birth Date', 'Last Login');
  
  // Prepare rows
  const rows = users.map(user => {
    const row = [
      user.username || '—',
      user.email || '—',
      user.gender || '—',
      (user.status || 'active').toUpperCase(),
      new Date(user.createdAt).toLocaleDateString('en-US')
    ];
    
    if (!adminRole || adminRole === '') {
      row.push(user.barangay || '—');
    }
    
    row.push(
      user.address || '—',
      user.bod || '—',
      user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-US') : '—'
    );
    
    return row;
  });
  
  // Create CSV content
  const csvRows = [headers];
  csvRows.push(...rows);
  
  // Add analytics summary at the bottom
  csvRows.push([]);
  csvRows.push(['ANALYTICS SUMMARY']);
  csvRows.push(['Total Users', analytics.totalUsers]);
  csvRows.push(['Active Users', analytics.activeUsers]);
  csvRows.push(['Banned Users', analytics.bannedUsers]);
  csvRows.push(['Male Users', analytics.maleUsers]);
  csvRows.push(['Female Users', analytics.femaleUsers]);
  csvRows.push(['New This Month', analytics.thisMonth]);
  csvRows.push(['New This Week', analytics.thisWeek]);
  csvRows.push(['Active Percentage', `${analytics.activePercentage}%`]);
  
  if (analytics.southSignalUsers !== null) {
    csvRows.push(['South Signal Village Users', analytics.southSignalUsers]);
  }
  if (analytics.centralBicutanUsers !== null) {
    csvRows.push(['Central Bicutan Users', analytics.centralBicutanUsers]);
  }
  
  // Convert to CSV string
  const csvContent = csvRows.map(row => 
    row.map(cell => {
      // Escape quotes and wrap in quotes if contains comma
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(',')
  ).join('\n');
  
  // Add BOM for UTF-8
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const barangayLabel = adminRole === 'southadmin' ? 'South_Signal' : 
                        adminRole === 'centraladmin' ? 'Central_Bicutan' : 'All_Barangays';
  const fileName = `user_export_${barangayLabel}_${new Date().toISOString().split('T')[0]}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ── PDF Generation ─────────────────────────────────────────────────────────────
const generateUserPDF = async (filteredUsers, analytics, adminRole, quickFilter, dateRange, barangayName) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ML = 14, MR = 14;

  // Color palette
  const P = {
    navy:   [13, 24, 41],
    navyMd: [30, 45, 71],
    blue:   [37, 99, 235],
    blueLt: [239, 246, 255],
    green:  [5, 150, 105],
    greenLt:[236, 253, 245],
    red:    [220, 38, 38],
    redLt:  [254, 242, 242],
    amber:  [217, 119, 6],
    slate:  [100, 116, 139],
    slateL: [148, 163, 184],
    border: [226, 232, 240],
    surfAlt:[241, 245, 249],
    white:  [255, 255, 255],
    teal:   [13, 148, 136],
  };

  const setRgb = (arr, type = 'text') => {
    if (type === 'text') doc.setTextColor(...arr);
    else if (type === 'fill') doc.setFillColor(...arr);
    else doc.setDrawColor(...arr);
  };

  let barangayLabel = 'All Barangays';
  if (adminRole === 'southadmin') barangayLabel = 'South Signal Village';
  else if (adminRole === 'centraladmin') barangayLabel = 'Central Bicutan';

  const periodLabel =
    quickFilter === 'week' ? 'Last 7 Days' :
    quickFilter === 'month' ? 'This Month' :
    quickFilter === 'year' ? 'This Year' :
    (dateRange.start || dateRange.end) ? 'Custom Range' : 'All Time';

  // Load logo helper
  const loadLogo = () => new Promise((resolve) => {
    let src = '/TMFK.png';
    if (barangayLabel.includes('South')) src = '/South.jpg';
    else if (barangayLabel.includes('Central')) src = '/Central.jpg';
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve(c.toDataURL('image/png'));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

  const logo = await loadLogo();

  // ── Page Header ──────────────────────────────────────────────────────────────
  const drawPageHeader = () => {
    // Background
    setRgb(P.navy, 'fill');
    doc.rect(0, 0, pw, 46, 'F');
    // Left accent bar
    setRgb(P.blue, 'fill');
    doc.rect(0, 0, 4, 46, 'F');
    // Separator line
    setRgb(P.blue, 'fill');
    doc.rect(0, 46, pw, 1.5, 'F');

    // Logo
    if (logo) {
      setRgb([255, 255, 255], 'fill');
      doc.roundedRect(ML + 1, 7, 32, 32, 2, 2, 'F');
      try { doc.addImage(logo, 'PNG', ML + 2, 8, 30, 30); } catch {}
    }

    const textX = ML + 40;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    setRgb(P.white, 'text');
    doc.text('USER ANALYTICS REPORT', textX, 19);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    setRgb([147, 197, 253], 'text');
    doc.text(`Barangay: ${barangayLabel}`, textX, 28);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    setRgb([148, 163, 184], 'text');
    doc.text(`Period: ${periodLabel}`, textX, 36);

    doc.setFontSize(7);
    setRgb([100, 116, 139], 'text');
    doc.text(`Generated: ${new Date().toLocaleString()}`, pw - MR, 38, { align: 'right' });
  };

  // ── Page Footer ──────────────────────────────────────────────────────────────
  const drawPageFooter = () => {
    const total = doc.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      setRgb(P.border, 'draw');
      doc.setLineWidth(0.3);
      doc.line(ML, ph - 14, pw - MR, ph - 14);

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      setRgb(P.slateL, 'text');
      doc.text('System-generated report. Data accuracy depends on submitted records.', ML, ph - 8);
      doc.text(`Page ${i} of ${total}`, pw - MR, ph - 8, { align: 'right' });

      setRgb(P.border, 'text');
      doc.setFontSize(6);
      doc.text('Waste Management System', pw / 2, ph - 3, { align: 'center' });
    }
  };

  // ── Section Heading ──────────────────────────────────────────────────────────
  const sectionHeading = (label, y, accentColor = P.blue) => {
    setRgb(P.surfAlt, 'fill');
    doc.roundedRect(ML, y, pw - ML - MR, 9, 1.5, 1.5, 'F');
    setRgb(accentColor, 'fill');
    doc.rect(ML, y, 3, 9, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setRgb(P.navy, 'text');
    doc.text(label, ML + 8, y + 6.2);
    return y + 14;
  };

  // ── Metric Box Row ────────────────────────────────────────────────────────────
  const metricRow = (metrics, y) => {
    const count = metrics.length;
    const boxW = (pw - ML - MR - (count - 1) * 4) / count;
    metrics.forEach((m, i) => {
      const bx = ML + i * (boxW + 4);
      setRgb(P.white, 'fill');
      setRgb(P.border, 'draw');
      doc.setLineWidth(0.3);
      doc.roundedRect(bx, y, boxW, 22, 2, 2, 'FD');
      setRgb(m.color || P.blue, 'fill');
      doc.rect(bx, y, boxW, 2, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      setRgb(m.color || P.navy, 'text');
      doc.text(String(m.value), bx + boxW / 2, y + 13, { align: 'center' });
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      setRgb(P.slateL, 'text');
      doc.text(m.label.toUpperCase(), bx + boxW / 2, y + 19, { align: 'center' });
    });
    return y + 28;
  };

  // ── Insight Box ────────────────────────────────────────────────────────────────
  const insightBox = (title, text, y, accentColor = P.blue) => {
    const usableW = pw - ML - MR;
    const innerW = usableW - 24;
    const lines = doc.splitTextToSize(text, innerW);
    const boxH = 10 + lines.length * 5 + 10;

    setRgb(P.blueLt, 'fill');
    setRgb(P.border, 'draw');
    doc.setLineWidth(0.3);
    doc.roundedRect(ML, y, usableW, boxH, 2, 2, 'FD');
    setRgb(accentColor, 'fill');
    doc.rect(ML, y, 3, boxH, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setRgb(P.navy, 'text');
    doc.text(title, ML + 8, y + 8);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    setRgb([70, 80, 100], 'text');
    let ty = y + 15;
    lines.forEach(line => { doc.text(line, ML + 8, ty); ty += 5; });
    return y + boxH + 8;
  };

  // ── Build pages ───────────────────────────────────────────────────────────────
  drawPageHeader();
  let y = 56;

  const activeP = analytics.totalUsers > 0
    ? ((analytics.activeUsers / analytics.totalUsers) * 100).toFixed(1)
    : '0.0';

  // Section 1: Executive Summary
  y = sectionHeading('1. EXECUTIVE SUMMARY', y, P.blue);
  y = metricRow([
    { label: 'Total Users',    value: analytics.totalUsers,  color: P.blue },
    { label: 'Active Users',   value: analytics.activeUsers, color: P.green },
    { label: 'Banned Users',   value: analytics.bannedUsers, color: P.red },
    { label: 'New This Month', value: analytics.thisMonth,   color: P.teal },
    { label: 'New This Week',  value: analytics.thisWeek,    color: P.amber },
  ], y);

  const summaryText = `During ${periodLabel}, the system recorded ${analytics.totalUsers} total registered users for ${barangayLabel}. Of these, ${analytics.activeUsers} (${activeP}%) are active, and ${analytics.bannedUsers} are currently banned. Community growth: ${analytics.thisMonth} new registrations this month, ${analytics.thisWeek} this week.`;
  y = insightBox('Overview', summaryText, y, P.blue);

  // Section 2: Demographics
  y = sectionHeading('2. USER DEMOGRAPHICS', y, P.teal);

  const demoMetrics = [
    { label: 'Male Users',   value: analytics.maleUsers,   color: [37, 99, 235] },
    { label: 'Female Users', value: analytics.femaleUsers, color: [157, 23, 77] },
    { label: 'Active %',     value: `${activeP}%`,         color: P.teal },
  ];
  if (adminRole === 'southadmin' || adminRole === '') {
    demoMetrics.push({ label: 'South Signal', value: analytics.southSignalUsers ?? 0, color: P.amber });
  }
  if (adminRole === 'centraladmin' || adminRole === '') {
    demoMetrics.push({ label: 'Central Bicutan', value: analytics.centralBicutanUsers ?? 0, color: P.amber });
  }

  y = metricRow(demoMetrics, y);

  let demoText = `Gender distribution: ${analytics.maleUsers} male and ${analytics.femaleUsers} female users. Active participation rate: ${activeP}%.`;
  if (adminRole === 'southadmin') {
    demoText += ` South Signal Village residents: ${analytics.southSignalUsers ?? 0}.`;
  } else if (adminRole === 'centraladmin') {
    demoText += ` Central Bicutan residents: ${analytics.centralBicutanUsers ?? 0}.`;
  } else {
    demoText += ` South Signal Village: ${analytics.southSignalUsers ?? 0}, Central Bicutan: ${analytics.centralBicutanUsers ?? 0}.`;
  }
  y = insightBox('Demographics Insight', demoText, y, P.teal);

  // Section 3: User Details Table
  if (filteredUsers.length > 0) {
    if (y > 200) { doc.addPage(); drawPageHeader(); y = 56; }
    y = sectionHeading('3. USER DETAILS (UP TO 50 RECORDS)', y, P.navy);

    const isSingleBrgy = adminRole === 'southadmin' || adminRole === 'centraladmin';

    const tableHead = isSingleBrgy
      ? [['#', 'Username', 'Email', 'Gender', 'Status', 'Date Joined']]
      : [['#', 'Username', 'Email', 'Barangay', 'Gender', 'Status', 'Date Joined']];

    const tableBody = filteredUsers.slice(0, 50).map((u, i) => {
      const row = [
        i + 1,
        u.username || '—',
        u.email || '—',
      ];
      if (!isSingleBrgy) row.push(u.barangay || '—');
      row.push(
        u.gender || '—',
        (u.status || 'active').toUpperCase(),
        new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      );
      return row;
    });

    const colStyles = isSingleBrgy ? {
      0: { cellWidth: 8,  halign: 'center', fontStyle: 'bold', textColor: P.slateL },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 65 },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 30, halign: 'center' },
    } : {
      0: { cellWidth: 8,  halign: 'center', fontStyle: 'bold', textColor: P.slateL },
      1: { cellWidth: 35, fontStyle: 'bold' },
      2: { cellWidth: 50 },
      3: { cellWidth: 30 },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 25, halign: 'center' },
    };

    const statusColIdx = isSingleBrgy ? 4 : 5;

    autoTable(doc, {
      startY: y,
      head: tableHead,
      body: tableBody,
      theme: 'plain',
      headStyles: {
        fillColor: P.navy,
        textColor: P.white,
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 },
        textColor: P.navy,
      },
      alternateRowStyles: { fillColor: P.surfAlt },
      columnStyles: colStyles,
      margin: { left: ML, right: MR },
      tableLineWidth: 0,
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === statusColIdx) {
          if (data.cell.raw === 'ACTIVE') data.cell.styles.textColor = P.green;
          else if (data.cell.raw === 'BANNED') data.cell.styles.textColor = P.red;
        }
      },
    });

    y = doc.lastAutoTable.finalY + 10;
    if (filteredUsers.length > 50) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      setRgb(P.slateL, 'text');
      doc.text(`* Showing first 50 of ${filteredUsers.length} records.`, ML, y);
    }
  }

  drawPageFooter();
  doc.save(`user-report-${barangayLabel.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
};

// ── Subcomponents ─────────────────────────────────────────────────────────────
const StatChip = ({ icon: Icon, value, label, variant }) => (
  <div style={S.statChip(variant)}>
    <Icon size={13} color={variant === 'active' ? '#34D399' : variant === 'total' ? '#93C5FD' : '#F87171'} strokeWidth={2.5} />
    <div>
      <div style={S.statChipNum(variant)}>{value}</div>
      <div style={S.statChipLabel}>{label}</div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const Icon = status === 'active' ? UserCheck : status === 'banned' ? UserX : User;
  return (
    <span style={S.badge(status)}>
      <Icon size={9} strokeWidth={2.5} />
      {status?.toUpperCase() || 'ACTIVE'}
    </span>
  );
};

const InfoCell = ({ label, value, children }) => (
  <div style={S.infoCell}>
    <div style={S.infoCellLabel}>{label}</div>
    <div style={S.infoCellValue}>{children || value || '—'}</div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const UserManagement = ({ barangayFilter, adminRole }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [quickFilter, setQuickFilter] = useState('all');
  const [userReports, setUserReports] = useState([]);
  const [userStats, setUserStats] = useState({
    totalReports: 0, totalWeight: 0,
    recycledCount: 0, disposedCount: 0,
    pendingCount: 0, processedCount: 0,
  });
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingCSV, setIsGeneratingCSV] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true); setError(null);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token found');
      const adminType = adminRole === 'southadmin' ? 'southadmin' : adminRole === 'centraladmin' ? 'centraladmin' : '';
      const url = adminType
        ? `${API_URL}/api/users/all-users?adminType=${adminType}`
        : `${API_URL}/api/users/all-users`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || `Failed to fetch users: ${res.status}`);
      }
      let all = await res.json();
      all = all.filter(u => u.status !== 'pending');
      setUsers(all); setFilteredUsers(all);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fetchUserReports = async (userId) => {
    try {
      setLoadingReports(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/api/waste-reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      const all = data.reports || [];
      const list = all.filter(r => (r.user?._id || r.user) === userId);
      let totalW = 0;
      list.forEach(r => { totalW += r.weight || 0; });
      setUserReports(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setUserStats({
        totalReports: list.length,
        totalWeight: totalW.toFixed(2),
        recycledCount: list.filter(r => r.status === 'recycled').length,
        disposedCount: list.filter(r => r.status === 'disposed').length,
        pendingCount:  list.filter(r => r.status === 'pending').length,
        processedCount: list.filter(r => r.status === 'processed').length,
      });
    } catch (err) {
      setUserReports([]);
      setUserStats({ totalReports: 0, totalWeight: 0, recycledCount: 0, disposedCount: 0, pendingCount: 0, processedCount: 0 });
    } finally { setLoadingReports(false); }
  };

  const applyDateFilter = (list, range) => {
    if (!range.start && !range.end) return list;
    return list.filter(u => {
      const d = new Date(u.createdAt);
      if (range.start && range.end) return d >= new Date(range.start) && d <= new Date(range.end);
      if (range.start) return d >= new Date(range.start);
      return d <= new Date(range.end);
    });
  };

  const applyQuickFilter = (list, type) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (type === 'week')  { const d = new Date(today); d.setDate(d.getDate() - 7);    return list.filter(u => new Date(u.createdAt) >= d); }
    if (type === 'month') { const d = new Date(today); d.setMonth(d.getMonth() - 1);  return list.filter(u => new Date(u.createdAt) >= d); }
    if (type === 'year')  { const d = new Date(today); d.setFullYear(d.getFullYear() - 1); return list.filter(u => new Date(u.createdAt) >= d); }
    return list;
  };

  useEffect(() => { fetchUsers(); }, [adminRole]);

  useEffect(() => {
    let f = [...users];
    if (quickFilter !== 'all') f = applyQuickFilter(f, quickFilter);
    if (dateRange.start || dateRange.end) f = applyDateFilter(f, dateRange);
    if (searchTerm) f = f.filter(u =>
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (statusFilter !== 'all') f = f.filter(u => u.status === statusFilter);
    setFilteredUsers(f);
  }, [searchTerm, statusFilter, users, dateRange, quickFilter]);

  const handleQuickFilter = (f) => {
    setQuickFilter(f);
    if (f !== 'all') setDateRange({ start: '', end: '' });
  };

  const handleDateChange = (type, value) => {
    setDateRange(prev => ({ ...prev, [type]: value }));
    if (value) setQuickFilter('all');
  };

  const handleBanUser = async (userId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus === 'active' ? 'ban' : 'activate'} this user?`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      const newStatus = currentStatus === 'active' ? 'banned' : 'active';
      const res = await fetch(`${API_URL}/api/users/ban/${userId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      await fetchUsers();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setShowModal(true);
    await fetchUserReports(user._id);
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    const analytics = getAnalytics();
    await generateUserPDF(filteredUsers, analytics, adminRole, quickFilter, dateRange, barangayFilter);
    setIsGeneratingPDF(false);
  };

  const handleGenerateCSV = async () => {
    setIsGeneratingCSV(true);
    const analytics = getAnalytics();
    await exportToCSV(filteredUsers, analytics, adminRole, barangayFilter);
    setIsGeneratingCSV(false);
  };

  const fmt = (date, withTime = false) => {
    if (!date) return '—';
    const d = new Date(date);
    return withTime
      ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getAnalytics = () => {
    const now = new Date();
    const totalUsers = filteredUsers.length;
    const activeUsers = filteredUsers.filter(u => u.status === 'active').length;
    const bannedUsers = filteredUsers.filter(u => u.status === 'banned').length;
    const maleUsers = filteredUsers.filter(u => u.gender?.toLowerCase() === 'male').length;
    const femaleUsers = filteredUsers.filter(u => u.gender?.toLowerCase() === 'female').length;
    const southSignalUsers = adminRole === 'centraladmin' ? null :
      filteredUsers.filter(u => u.barangay === 'South Signal Village' || u.barangay === 'South Signal').length;
    const centralBicutanUsers = adminRole === 'southadmin' ? null :
      filteredUsers.filter(u => u.barangay === 'Central Bicutan').length;
    const thisMonth = filteredUsers.filter(u => {
      const d = new Date(u.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const thisWeek = filteredUsers.filter(u => {
      const d = new Date(u.createdAt);
      const w = new Date(now); w.setDate(now.getDate() - 7);
      return d >= w;
    }).length;
    return {
      totalUsers, activeUsers, bannedUsers, maleUsers, femaleUsers,
      southSignalUsers, centralBicutanUsers, thisMonth, thisWeek,
      activePercentage: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0,
    };
  };

  const getAvatar = (user, large = false) => {
    const style = large ? S.profileAvatar : S.avatar;
    if (user.profile) return <div style={style}><img src={user.profile} alt={user.username} style={S.avatarImg} /></div>;
    return <div style={style}>{user.username?.charAt(0).toUpperCase() || 'U'}</div>;
  };

  const counts = {
    total:  users.length,
    active: users.filter(u => u.status === 'active').length,
    banned: users.filter(u => u.status === 'banned').length,
  };
  const analytics = getAnalytics();

  if (loading) return (
    <div style={S.container}>
      <div style={S.loading}>
        <RefreshCw size={26} color={C.slateLight} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        <span style={{ fontSize: 13 }}>Loading users…</span>
      </div>
    </div>
  );

  return (
    <div style={S.container}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.headerIconWrap}><Users size={18} strokeWidth={2} /></div>
          <div>
            <h3 style={S.title}>User Management</h3>
            <p style={S.subtitle}>
              {adminRole === 'southadmin' ? 'South Signal Village' :
               adminRole === 'centraladmin' ? 'Central Bicutan' : 'All Registered Users'}
            </p>
          </div>
        </div>
        <div style={S.headerStats}>
          <StatChip icon={Users}     value={counts.total}  label="Total"  variant="total"  />
          <StatChip icon={UserCheck} value={counts.active} label="Active" variant="active" />
          <StatChip icon={UserX}     value={counts.banned} label="Banned" variant="banned" />
        </div>
      </div>

      {/* ── Analytics ── */}
      <div style={S.analyticsBar}>
        <div style={S.analyticsTop}>
          <div style={S.analyticsSectionLabel}>
            <BarChart2 size={13} color={C.skyBlue} strokeWidth={2.5} />
            Analytics Summary
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{ ...S.primaryBtn, opacity: (filteredUsers.length === 0 || isGeneratingCSV) ? 0.45 : 1, cursor: (filteredUsers.length === 0 || isGeneratingCSV) ? 'not-allowed' : 'pointer', background: C.emerald }}
              onClick={handleGenerateCSV}
              disabled={filteredUsers.length === 0 || isGeneratingCSV}
            >
              <FileSpreadsheet size={13} strokeWidth={2.5} />
              {isGeneratingCSV ? 'Generating…' : 'Export CSV'}
            </button>
            <button
              style={{ ...S.primaryBtn, opacity: (filteredUsers.length === 0 || isGeneratingPDF) ? 0.45 : 1, cursor: (filteredUsers.length === 0 || isGeneratingPDF) ? 'not-allowed' : 'pointer' }}
              onClick={handleGeneratePDF}
              disabled={filteredUsers.length === 0 || isGeneratingPDF}
            >
              <Download size={13} strokeWidth={2.5} />
              {isGeneratingPDF ? 'Generating…' : 'Export PDF'}
            </button>
          </div>
        </div>
        <div style={S.analyticsCards}>
          {[
            { value: analytics.totalUsers, label: 'Filtered Users', color: C.skyBlue },
            { value: `${analytics.activeUsers} (${analytics.activePercentage}%)`, label: 'Active', color: C.emerald },
            { value: analytics.bannedUsers, label: 'Banned', color: C.rose },
            { value: analytics.thisMonth, label: 'New This Month', color: C.ink },
            { value: analytics.thisWeek,  label: 'New This Week',  color: C.ink },
            ...(adminRole === 'southadmin' ? [
              { value: analytics.southSignalUsers, label: 'South Signal Village', color: C.inkLight },
            ] : adminRole === 'centraladmin' ? [
              { value: analytics.centralBicutanUsers, label: 'Central Bicutan', color: C.inkLight },
            ] : [
              { value: analytics.southSignalUsers, label: 'South Signal', color: C.inkLight },
              { value: analytics.centralBicutanUsers, label: 'Central Bicutan', color: C.inkLight },
            ]),
          ].map((item, idx) => (
            <div key={idx} style={S.analyticsCard}>
              <div style={S.analyticsCardAccent(item.color)} />
              <div style={{ ...S.analyticsNum, color: item.color }}>{item.value}</div>
              <div style={S.analyticsLabel}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={S.filterSection}>
        <div style={S.filterRow}>
          <span style={S.filterLabel}><Filter size={10} strokeWidth={2.5} />Quick</span>
          {['all','week','month','year'].map(f => (
            <button key={f} style={S.quickBtn(quickFilter === f)} onClick={() => handleQuickFilter(f)}>
              {f === 'all' ? 'All Time' : f === 'week' ? 'Last 7 Days' : f === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>
        <div style={S.filterRowLast}>
          <span style={S.filterLabel}><Calendar size={10} strokeWidth={2.5} />Range</span>
          <input type="date" style={S.dateInput} value={dateRange.start} onChange={e => handleDateChange('start', e.target.value)} />
          <span style={{ fontSize: 11, color: C.slateLight }}>to</span>
          <input type="date" style={S.dateInput} value={dateRange.end}   onChange={e => handleDateChange('end', e.target.value)} />
          {(dateRange.start || dateRange.end) && (
            <button style={S.clearBtn} onClick={() => { setDateRange({ start: '', end: '' }); setQuickFilter('all'); }}>
              <X size={10} strokeWidth={2.5} />Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div style={S.searchBar}>
        <div style={S.searchWrap}>
          <Search size={13} style={S.searchIcon} strokeWidth={2.5} />
          <input
            type="text"
            placeholder="Search by name or email…"
            style={S.searchInput}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={S.selectWrap}>
          <select style={S.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
          <ChevronDown size={12} style={S.selectIcon} strokeWidth={2.5} />
        </div>
        <button style={S.ghostBtn} onClick={fetchUsers}>
          <RefreshCw size={12} strokeWidth={2.5} />Refresh
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={S.errorBar}>
          <UserX size={14} strokeWidth={2} />
          <span>{error}</span>
          <button onClick={fetchUsers} style={{ ...S.ghostBtn, padding: '3px 10px', fontSize: 11.5, marginLeft: 4 }}>Retry</button>
        </div>
      )}

      {/* ── Table ── */}
      {!error && (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>User</th>
                <th style={S.th}>Email</th>
                {(!adminRole || adminRole === '') && <th style={S.th}>Barangay</th>}
                <th style={S.th}>Gender</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Joined</th>
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={adminRole ? 6 : 7}>
                    <div style={S.emptyState}>
                      <Users size={32} color={C.border} style={{ display: 'block', margin: '0 auto 10px' }} />
                      <span style={{ fontSize: 13 }}>No users match the selected filters</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.map(user => (
                <tr
                  key={user._id}
                  onMouseEnter={e => e.currentTarget.style.background = C.surface}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  style={{ transition: 'background 0.1s' }}
                >
                  <td style={S.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      {getAvatar(user)}
                      <span style={S.username}>{user.username}</span>
                    </div>
                  </td>
                  <td style={S.td}>{user.email}</td>
                  {(!adminRole || adminRole === '') && <td style={S.td}>{user.barangay || '—'}</td>}
                  <td style={S.td}>{user.gender || '—'}</td>
                  <td style={S.td}><StatusBadge status={user.status} /></td>
                  <td style={S.td}>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td style={S.td}>
                    <button style={S.actionBtn('view')} onClick={() => handleViewUser(user)}>
                      <Eye size={11} strokeWidth={2.5} />View
                    </button>
                    <button
                      style={S.actionBtn(user.status === 'active' ? 'ban' : 'activate')}
                      onClick={() => handleBanUser(user._id, user.status)}
                    >
                      {user.status === 'active'
                        ? <><ShieldOff size={11} strokeWidth={2.5} />Ban</>
                        : <><Shield    size={11} strokeWidth={2.5} />Activate</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── User Detail Modal ── */}
      {showModal && selectedUser && (
        <div style={S.overlay} onClick={() => setShowModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div style={S.modalTitle}>
                <User size={15} color={C.skyBlue} strokeWidth={2} />
                User Details & Activity
              </div>
              <button style={S.closeBtn} onClick={() => setShowModal(false)}>
                <X size={17} strokeWidth={2} />
              </button>
            </div>
            <div style={S.modalBody}>
              {/* Profile card */}
              <div style={S.profileCard}>
                {getAvatar(selectedUser, true)}
                <div>
                  <div style={S.profileName}>{selectedUser.username}</div>
                  <div style={S.profileEmail}>{selectedUser.email}</div>
                  <div style={{ marginTop: 6 }}><StatusBadge status={selectedUser.status} /></div>
                </div>
              </div>

              {/* Info grid */}
              <div style={S.infoGrid}>
                <InfoCell label="Gender"       value={selectedUser.gender} />
                <InfoCell label="Date of Birth" value={selectedUser.bod} />
                <InfoCell label="Address"       value={selectedUser.address} />
                {(!adminRole || adminRole === '') && (
                  <InfoCell label="Barangay" value={selectedUser.barangay} />
                )}
                <InfoCell label="Member Since"  value={fmt(selectedUser.createdAt, true)} />
                <InfoCell label="Last Login"    value={selectedUser.lastLogin ? fmt(selectedUser.lastLogin, true) : '—'} />
              </div>

              {/* Waste history */}
              <div style={S.historyTitle}>
                <History size={14} color={C.skyBlue} strokeWidth={2} />
                Waste Collection History
              </div>

              {loadingReports ? (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <RefreshCw size={20} color={C.slateLight} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : (
                <>
                  <div style={S.statsGrid}>
                    {[
                      { value: userStats.totalReports, label: 'Reports' },
                      { value: `${userStats.totalWeight} kg`, label: 'Total Weight' },
                      { value: userStats.recycledCount, label: 'Recycled' },
                      { value: userStats.disposedCount, label: 'Disposed' },
                    ].map((s, i) => (
                      <div key={i} style={S.statCard}>
                        <div style={S.statCardValue}>{s.value}</div>
                        <div style={S.statCardLabel}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {userReports.length > 0 ? userReports.map((report, idx) => (
                    <div
                      key={idx}
                      style={S.reportItem}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.skyBorder; e.currentTarget.style.boxShadow = `0 2px 8px rgba(37,99,235,0.08)`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={S.reportItemTop}>
                        <span style={S.reportType}>
                          <Package size={12} color={C.slate} />
                          {report.classification || 'Unknown'} Waste
                        </span>
                        <span style={S.reportStatus(report.status)}>
                          {(report.status || 'pending').toUpperCase()}
                        </span>
                      </div>
                      <div style={S.reportMeta}>
                        <span style={S.reportMetaItem}><Calendar size={10} />{fmt(report.scanDate || report.createdAt)}</span>
                        <span style={S.reportMetaItem}><Weight size={10} />{(report.weight || 0.1).toFixed(2)} kg</span>
                        <span style={S.reportMetaItem}><MapPin size={10} />{report.location?.address || 'Not specified'}</span>
                      </div>
                      {report.detectedObjects?.length > 0 && (
                        <div style={{ ...S.reportMeta, marginTop: 5 }}>
                          <span style={S.reportMetaItem}>
                            <AlertCircle size={10} />
                            {report.detectedObjects.slice(0, 3).map(o => o.label).join(', ')}
                            {report.detectedObjects.length > 3 && ` +${report.detectedObjects.length - 3} more`}
                          </span>
                        </div>
                      )}
                      <button style={S.viewDetailsBtn} onClick={() => { setSelectedReport(report); setShowReportModal(true); }}>
                        <Eye size={10} strokeWidth={2} />View Details
                      </button>
                    </div>
                  )) : (
                    <div style={S.noReports}>
                      <Trash2 size={28} color={C.border} />
                      <p style={{ marginTop: 8 }}>No waste reports found for this user</p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div style={S.modalFooter}>
              <button style={S.ghostBtn} onClick={() => setShowModal(false)}>
                <X size={12} strokeWidth={2.5} />Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report Detail Modal ── */}
      {showReportModal && selectedReport && (
        <div style={S.reportOverlay} onClick={() => setShowReportModal(false)}>
          <div style={S.reportModal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div style={S.modalTitle}>
                <FileText size={15} color={C.skyBlue} strokeWidth={2} />
                Report Details
              </div>
              <button style={S.closeBtn} onClick={() => setShowReportModal(false)}>
                <X size={17} strokeWidth={2} />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              {selectedReport.imageUrl && (
                <img src={selectedReport.imageUrl} alt="Waste" style={S.reportImage} />
              )}
              <div style={S.infoGrid}>
                <InfoCell label="Report ID"     value={selectedReport._id} />
                <InfoCell label="Date Reported" value={fmt(selectedReport.scanDate || selectedReport.createdAt, true)} />
                <InfoCell label="Classification" value={selectedReport.classification || 'Unknown'} />
                <InfoCell label="Weight"        value={`${(selectedReport.weight || 0.1).toFixed(2)} kg`} />
                <InfoCell label="Status">
                  <StatusBadge status={selectedReport.status} />
                </InfoCell>
                <InfoCell label="Location"      value={selectedReport.location?.address || 'Not specified'} />
              </div>

              {selectedReport.detectedObjects?.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ ...S.historyTitle, marginBottom: 8 }}>
                    <Camera size={13} color={C.skyBlue} strokeWidth={2} />
                    Detected Items
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {selectedReport.detectedObjects.map((obj, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.surface, borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12.5, color: C.ink }}>
                        <span style={{ fontWeight: 600 }}>{obj.label}</span>
                        <span style={{ color: C.slate }}>
                          {(obj.confidence * 100).toFixed(1)}% confidence{obj.material ? ` · ${obj.material}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReport.recyclingTips?.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ ...S.historyTitle, marginBottom: 8 }}>
                    <TrendingUp size={13} color={C.emerald} strokeWidth={2} />
                    Recycling Tips
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {selectedReport.recyclingTips.map((tip, i) => (
                      <li key={i} style={{ fontSize: 12.5, color: C.slate, lineHeight: 1.5 }}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedReport.adminNotes && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: C.amberTint, border: `1px solid #FDE68A`, borderRadius: 8, fontSize: 12.5, color: C.ink }}>
                  <span style={{ fontWeight: 700, color: C.amber }}>Admin Notes: </span>
                  {selectedReport.adminNotes}
                </div>
              )}
            </div>
            <div style={S.modalFooter}>
              <button style={S.ghostBtn} onClick={() => setShowReportModal(false)}>
                <X size={12} strokeWidth={2.5} />Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;