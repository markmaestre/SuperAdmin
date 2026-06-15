import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Pie, Line, Doughnut, Radar, PolarArea } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale,
} from 'chart.js';
import API_URL from '../Utils/Api';
import WasteManagement from './WasteManagement';
import Message from './Message';
import AdminProfiles from './AdminProfiles';
import Analytics from './Analytics';
import UserManagement from './UserManagement';
import Collection from './Collection';
import History from './History';
import FeedbackManagement from './FeedbackManagement';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet-fullscreen/dist/Leaflet.fullscreen.js';
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler, RadialLinearScale
);

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ==================== WEIGHT CALCULATION FUNCTIONS ====================
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
    ? report.detectedObjects.length : 1;
  const classKey = (report.classification || '').toLowerCase().trim();
  const rawLabel = (report.detectedObjects?.[0]?.label || '').toLowerCase().trim();
  const unitWeight = calculateItemWeight(classKey, rawLabel);
  return unitWeight * quantity;
};

// ==================== DESIGN TOKENS ====================
const T = {
  sidebarBg:    '#15192B',
  sidebarBg2:   '#1B2138',
  sidebarHover: 'rgba(255,255,255,0.06)',
  sidebarActive:'rgba(255,255,255,0.08)',
  sidebarBorder:'rgba(255,255,255,0.06)',
  sidebarText:  'rgba(231,234,243,0.55)',
  sidebarTextActive: '#F4F6FB',
  sidebarMuted: 'rgba(231,234,243,0.28)',

  topbarBg:  '#ffffff',
  pageBg:    '#F6F7FB',
  cardBg:    '#ffffff',
  border:    '#E7E9F1',
  borderSoft:'#EEF0F6',

  accent:    '#4F5BD5',
  accentSoft:'#EEF0FD',
  accentDeep:'#3C46B8',

  success:   '#1F9D6D',
  successSoft:'#E5F6EF',
  warning:   '#D08B1E',
  warningSoft:'#FCF1DF',
  danger:    '#D9483C',
  dangerSoft:'#FBEBE9',
  info:      '#3070C9',
  infoSoft:  '#E8EFFB',
  neutral:   '#6B7280',
  neutralSoft:'#EEF1F5',

  textPrimary:   '#1B2030',
  textSecondary: '#5B6276',
  textMuted:     '#9AA1B5',

  southColor:   '#C9633F',
  centralColor: '#2F8F8C',
};

const SIDEBAR_W        = 248;
const SIDEBAR_W_COLLAPSED = 68;

// ==================== CHART COLORS ====================
const CHART_COLORS = [
  '#4F5BD5','#2F8F8C','#D08B1E','#C9633F',
  '#3070C9','#8B6FD1','#1F9D6D','#B85C9E',
  '#6B7280','#A6763E',
];

// ==================== SVG ICON ====================
const Icon = ({ d, size = 18, color = 'currentColor', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  dashboard:   'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  analytics:   'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  collection:  'M20 7h-4.18A3 3 0 0013 5h-2a3 3 0 00-2.82 2H4a1 1 0 00-1 1v10a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z M12 11v4 M9 13h6',
  map:         'M21 10.5c0 4.5-9 12-9 12s-9-7.5-9-12a9 9 0 0118 0z M12 13.5a3 3 0 100-6 3 3 0 000 6z',
  history:     'M12 8v4l3 3 M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
  waste:       ['M3 6h18','M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6','M10 11v6','M14 11v6','M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2'],
  messages:    ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z','M22 6l-10 7L2 6'],
  logout:      ['M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4','M16 17l5-5-5-5','M21 12H9'],
  profile:     ['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2','M12 11a4 4 0 100-8 4 4 0 000 8z'],
  users:       ['M12 11a4 4 0 100-8 4 4 0 000 8z','M18 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2','M22 21v-2a4 4 0 00-3-3.87','M16 3.13a4 4 0 010 7.75'],
  close:       ['M18 6L6 18','M6 6l12 12'],
  calendar:    ['M8 2v4','M16 2v4','M3 10h18','M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z'],
  location:    'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z',
  recycle:     ['M4 15l3 3 3-3','M7 18V9.5C7 7 9 5 11.5 5H13','M20 9l-3-3-3 3','M17 6v8.5C17 17 15 19 12.5 19H11'],
  alert:       ['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z','M12 9v4','M12 17h.01'],
  building:    ['M3 21h18','M5 21V7l8-4 8 4v14','M9 21v-6h6v6'],
  target:      'M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z M12 18a6 6 0 100-12 6 6 0 000 12z M12 14a2 2 0 100-4 2 2 0 000 4z',
  list:        'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  eye:         'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z',
  refresh:     'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  feedback:    'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
  menu:        'M4 6h16M4 12h16M4 18h16',
  search:      'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  chevronRight:'M9 18l6-6-6-6',
  chevronLeft: 'M15 18l-6-6 6-6',
  bell:        ['M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 01-3.46 0'],
  trash:       ['M3 6h18','M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6','M10 11v6','M14 11v6','M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2'],
  check:       'M20 6L9 17l-5-5',
  bottle:      'M12 2v4M12 6l4 4-4 4-4-4 4-4z M4 12h16 M12 22v-4',
  can:         'M5 6h14v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6z M8 3h8v3H8V3z',
  box:         'M3 8h18v13a2 2 0 01-2 2H5a2 2 0 01-2-2V8z M3 8l6-5h6l6 5 M8 8v2 M12 8v2 M16 8v2',
  circleDot:   'M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z M12 16a4 4 0 100-8 4 4 0 000 8z',
  trendUp:     ['M23 6l-9.5 9.5-5-5L1 18','M17 6h6v6'],
  trendDown:   ['M23 18l-9.5-9.5-5 5L1 6','M17 18h6v-6'],
  weight:      ['M12 3l3 3-3 3-3-3 3-3z','M5.5 9h13l2 11a1 1 0 01-1 1.2H4.5a1 1 0 01-1-1.2L5.5 9z'],
  expand:      ['M15 3h6v6','M9 21H3v-6','M21 3l-7 7','M3 21l7-7'],
  layers:      ['M12 2l9 5-9 5-9-5 9-5z','M3 12l9 5 9-5','M3 17l9 5 9-5'],
  pin:         'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z',
};

// Status -> {label, color, soft, icon} mapping
const STATUS_META = {
  recycled:  { color: T.success, soft: T.successSoft, icon: ICONS.recycle },
  processed: { color: T.info,    soft: T.infoSoft,    icon: ICONS.layers },
  pending:   { color: T.warning, soft: T.warningSoft, icon: ICONS.refresh },
  disposed:  { color: T.danger,  soft: T.dangerSoft,  icon: ICONS.alert },
};
const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.pending;

// Intensity levels
const getIntensityMeta = (count) => {
  if (count >= 20) return { label: 'Critical', color: T.danger,  soft: T.dangerSoft };
  if (count >= 10) return { label: 'High',     color: '#C97A2E', soft: '#FCF1E2' };
  if (count >= 5)  return { label: 'Medium',   color: T.warning, soft: T.warningSoft };
  return                  { label: 'Low',      color: T.success, soft: T.successSoft };
};

// ==================== NOTIFICATION COMPONENT ====================
const NotificationsPanel = ({ isOpen, onClose, adminId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, unread: 0 });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/notifications/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setNotifications(data.notifications || []);
        setStats({ total: data.total || 0, unread: data.unread || 0 });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'report_created': return ICONS.waste;
      case 'report_processed': return ICONS.recycle;
      case 'pickup_scheduled': return ICONS.collection;
      case 'recycling_tips': return ICONS.target;
      default: return ICONS.bell;
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(21,25,43,0.55)', backdropFilter: 'blur(4px)', zIndex: 9999 }} onClick={onClose}>
          <div style={{ position: 'absolute', top: 70, right: 20, width: 400, maxWidth: '90vw', background: T.cardBg, borderRadius: 16, boxShadow: '0 20px 40px rgba(20,24,40,0.2)', border: '1px solid ' + T.border, overflow: 'hidden', zIndex: 10000 }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + T.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon d={ICONS.bell} size={18} color={T.accent} strokeWidth={2} />
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: T.textPrimary }}>Notifications</h3>
                {stats.unread > 0 && (
                  <span style={{ background: T.danger, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>{stats.unread} new</span>
                )}
              </div>
              {stats.unread > 0 && (
                <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', fontSize: 11, color: T.accent, cursor: 'pointer', fontWeight: 500 }}>
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: T.textMuted }}>
                  <Icon d={ICONS.refresh} size={24} color={T.textMuted} strokeWidth={2} />
                  <p style={{ marginTop: 12, fontSize: 13 }}>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: '50px 20px', textAlign: 'center' }}>
                  <Icon d={ICONS.bell} size={32} color={T.textMuted} strokeWidth={1.5} />
                  <p style={{ marginTop: 12, fontSize: 13, color: T.textMuted }}>No notifications yet</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const typeIcon = getTypeIcon(notif.type);
                  return (
                    <div key={notif._id} style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid ' + T.borderSoft,
                      background: notif.read ? 'transparent' : T.accentSoft,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      position: 'relative'
                    }}
                    onClick={() => !notif.read && markAsRead(notif._id)}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: notif.read ? T.pageBg : T.accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon d={typeIcon} size={14} color={notif.read ? T.textMuted : T.accent} strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: 13, fontWeight: 700, color: notif.read ? T.textSecondary : T.textPrimary }}>{notif.title}</strong>
                            <span style={{ fontSize: 10, color: T.textMuted }}>{formatDate(notif.createdAt)}</span>
                          </div>
                          <p style={{ fontSize: 12, color: notif.read ? T.textMuted : T.textSecondary, margin: 0, lineHeight: 1.5 }}>{notif.message}</p>
                          {notif.relatedReport && (
                            <div style={{ marginTop: 8 }}>
                              <span style={{ fontSize: 10, color: T.accent, background: T.accentSoft, padding: '2px 8px', borderRadius: 12, display: 'inline-block' }}>
                                View Report →
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: T.textMuted, alignSelf: 'flex-start' }}
                          onMouseEnter={e => e.currentTarget.style.color = T.danger}
                          onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>
                          <Icon d={ICONS.trash} size={14} color="currentColor" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid ' + T.border, textAlign: 'center' }}>
                <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 12, color: T.textMuted, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// ==================== SECTION HEADING ====================
const SectionHeading = ({ children, icon }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase',
    color: T.textMuted, marginBottom: 14, marginTop: 0, display: 'flex', alignItems: 'center', gap: 8,
  }}>
    {icon && <Icon d={icon} size={13} color={T.textMuted} strokeWidth={2} />}
    <span>{children}</span>
    <div style={{ flex: 1, height: 1, background: T.border }} />
  </div>
);

// ==================== WASTE HEATMAP COMPONENT ====================
const WasteHeatmap = ({ locations, adminRole, onSelectLocation, selectedLocation }) => {
  const mapRef = useRef(null);
  const clusterGroupRef = useRef(null);
  const heatmapRef = useRef(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    window.viewReport = (reportId) => {
      const allReports = locations.flatMap(loc => loc.reports || []);
      const report = allReports.find(r => r._id === reportId);
      if (report && isMounted.current) { setSelectedReport(report); setShowReportModal(true); }
    };
    return () => { delete window.viewReport; };
  }, [locations]);

  const getCenter = () => {
    if (adminRole === 'southadmin')   return { lat: 14.50493, lng: 121.05368 };
    if (adminRole === 'centraladmin') return { lat: 14.5185,  lng: 121.0580  };
    return { lat: 14.5117, lng: 121.0558 };
  };

  const getClusterColor = (count) => {
    if (count >= 20) return T.danger;
    if (count >= 10) return '#C97A2E';
    if (count >= 5)  return T.warning;
    return T.success;
  };

  const buildMarkerIcon = (count) => {
    const color = getClusterColor(count);
    const size  = count >= 20 ? 44 : count >= 10 ? 38 : count >= 5 ? 32 : 28;
    const fs    = size >= 40 ? 13 : 11;
    const label = count > 99 ? '99+' : count;
    return L.divIcon({
      html: `<div style="position:relative;width:${size}px;height:${size}px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.18;transform:scale(1.65);"></div>
        <div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${fs}px;box-shadow:0 2px 8px rgba(20,24,40,0.25);font-family:'Inter','DM Sans',sans-serif;">${label}</div>
      </div>`,
      className: '', iconSize: [size, size], iconAnchor: [size/2, size/2], popupAnchor: [0, -(size/2)-6],
    });
  };

  const buildClusterIcon = (cluster) => {
    const count = cluster.getChildCount();
    const color = getClusterColor(count);
    const size  = count >= 20 ? 48 : count >= 10 ? 42 : count >= 5 ? 36 : 30;
    const fs    = size >= 44 ? 15 : 13;
    return L.divIcon({
      html: `<div style="position:relative;width:${size}px;height:${size}px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.16;transform:scale(1.7);"></div>
        <div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${fs}px;box-shadow:0 3px 10px rgba(20,24,40,0.28);font-family:'Inter','DM Sans',sans-serif;">${count > 99 ? '99+' : count}</div>
      </div>`,
      className: '', iconSize: [size, size], iconAnchor: [size/2, size/2],
    });
  };

  const buildPopupHtml = (loc) => {
    const count = loc.reportCount || loc.count || 1;
    const color = getClusterColor(count);
    const intensity = getIntensityMeta(count);
    const pinSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
    let reportsHtml = '';
    if (loc.reports && loc.reports.length > 0) {
      const rows = loc.reports.slice(0, 5).map(r => {
        const meta = getStatusMeta(r.status);
        const dateStr = new Date(r.scanDate || r.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
        const items = r.detectedObjects?.slice(0, 3).map(o => o.label).join(', ') || 'No items';
        return `<div onclick="window.viewReport('${r._id}')" style="background:#FAFAFC;border:1px solid #EEF0F6;border-radius:8px;padding:8px 10px;margin-top:6px;cursor:pointer;font-family:'Inter','DM Sans',sans-serif;" onmouseover="this.style.background='#F1F2FB'" onmouseout="this.style.background='#FAFAFC'">
          <div style="font-size:11px;font-weight:700;color:#1B2030;display:flex;justify-content:space-between;align-items:center;">
            <span>${r.classification || 'Unknown'}</span>
            <span style="font-size:10px;padding:1px 7px;border-radius:20px;font-weight:700;background:${meta.color}18;color:${meta.color};text-transform:capitalize;">${r.status || 'pending'}</span>
          </div>
          <div style="font-size:10px;color:#9AA1B5;margin-top:3px;">${dateStr} &middot; ${items}</div>
        </div>`;
      }).join('');
      reportsHtml = `<div style="border-top:1px solid #EEF0F6;margin-top:10px;padding-top:8px;"><div style="font-size:11px;font-weight:700;color:#5B6276;margin-bottom:2px;">Recent reports</div>${rows}</div>`;
    }
    return `<div style="font-family:'Inter','DM Sans',sans-serif;min-width:265px;max-width:310px;">
      <div style="background:${color};padding:11px 14px;border-radius:10px 10px 0 0;color:#fff;display:flex;align-items:center;gap:7px;">${pinSvg}<strong style="font-size:13px;line-height:1.3;">${loc.address}</strong></div>
      <div style="padding:13px 14px;background:#fff;border-radius:0 0 10px 10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #EEF0F6;"><span style="font-size:12px;color:#9AA1B5;">Total reports</span><strong style="font-size:14px;color:${color};">${count}</strong></div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #EEF0F6;"><span style="font-size:12px;color:#9AA1B5;">Total weight</span><strong style="font-size:12px;color:#1B2030;">${(loc.totalWeight || 0).toFixed(2)} kg</strong></div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #EEF0F6;"><span style="font-size:12px;color:#9AA1B5;">Detected items</span><strong style="font-size:12px;color:#1B2030;">${loc.detectionCount || 0}</strong></div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;"><span style="font-size:12px;color:#9AA1B5;">Intensity</span><span style="font-size:11px;font-weight:700;padding:2px 9px;border-radius:20px;background:${intensity.soft};color:${intensity.color};">${intensity.label}</span></div>
        ${reportsHtml}
      </div>
    </div>`;
  };

  useEffect(() => {
    isMounted.current = true;
    const container = document.getElementById('waste-map');
    if (!container || mapRef.current) return;
    const initMap = () => {
      try {
        const center = getCenter();
        mapRef.current = L.map('waste-map').setView([center.lat, center.lng], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CartoDB', subdomains: 'abcd', maxZoom: 19, minZoom: 11,
        }).addTo(mapRef.current);
        L.control.scale({ metric: true, imperial: false }).addTo(mapRef.current);
        L.control.fullscreen({ position: 'topright', title: 'Fullscreen', titleCancel: 'Exit Fullscreen' }).addTo(mapRef.current);
        window.mapInstance = mapRef.current;
      } catch (error) { console.error('Error initializing map:', error); }
    };
    const timer = setTimeout(initMap, 100);
    return () => {
      clearTimeout(timer);
      if (mapRef.current && isMounted.current) {
        try { mapRef.current.remove(); mapRef.current = null; window.mapInstance = null; } catch (e) { console.warn(e); }
      }
      isMounted.current = false;
    };
  }, [adminRole]);

  useEffect(() => {
    if (!mapRef.current) return;
    const updateMap = () => {
      try {
        if (heatmapRef.current) { mapRef.current.removeLayer(heatmapRef.current); heatmapRef.current = null; }
        if (clusterGroupRef.current) { mapRef.current.removeLayer(clusterGroupRef.current); clusterGroupRef.current = null; }
        const heatData = locations.map(loc => [loc.lat, loc.lng, Math.min((loc.reportCount || 1) / 5, 1)]);
        if (heatData.length > 0) {
          heatmapRef.current = L.heatLayer(heatData, { radius: 40, blur: 25, maxZoom: 17, minOpacity: 0.2, gradient: { 0.2: T.success, 0.5: T.warning, 0.75: '#C97A2E', 1.0: T.danger } }).addTo(mapRef.current);
        }
        clusterGroupRef.current = L.markerClusterGroup({ maxClusterRadius: 70, showCoverageOnHover: false, zoomToBoundsOnClick: true, spiderfyOnMaxZoom: true, iconCreateFunction: buildClusterIcon });
        locations.forEach((loc) => {
          const count = loc.reportCount || loc.count || 1;
          const marker = L.marker([loc.lat, loc.lng], { icon: buildMarkerIcon(count) });
          marker.bindPopup(buildPopupHtml(loc), { maxWidth: 320, className: 'waste-cluster-popup' });
          clusterGroupRef.current.addLayer(marker);
        });
        mapRef.current.addLayer(clusterGroupRef.current);
        if (selectedLocation && mapRef.current) { mapRef.current.setView([selectedLocation.lat, selectedLocation.lng], 16); }
      } catch (error) { console.error('Error updating map:', error); }
    };
    setTimeout(updateMap, 100);
  }, [locations, selectedLocation]);

  const renderReportModal = () => {
    if (!showReportModal || !selectedReport) return null;
    const meta = getStatusMeta(selectedReport.status);
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(21,25,43,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowReportModal(false)}>
        <div style={{ background: T.cardBg, borderRadius: 14, width: 420, maxWidth: '90vw', maxHeight: '82vh', overflow: 'auto', padding: 24, zIndex: 2000, boxShadow: '0 24px 64px rgba(20,24,40,0.18)', border: '1px solid ' + T.border }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.textPrimary }}>Report Details</h4>
            <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Icon d={ICONS.close} size={18} color={T.textSecondary} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Classification', value: selectedReport.classification || 'Unknown' },
              { label: 'Status', value: selectedReport.status || 'pending', isStatus: true, meta },
              { label: 'Weight', value: `${(selectedReport.weight || calculateTotalWeight(selectedReport) || 0.1).toFixed(2)} kg` },
              { label: 'Date Reported', value: new Date(selectedReport.scanDate || selectedReport.createdAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }), small: true },
            ].map(({ label, value, isStatus, meta: m, small }) => (
              <div key={label} style={{ background: T.pageBg, borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
                {isStatus
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: m.soft, color: m.color, textTransform: 'capitalize' }}><Icon d={m.icon} size={11} color={m.color} strokeWidth={2.2} />{value}</span>
                  : <div style={{ fontSize: small ? 12 : 14, fontWeight: 700, color: T.textPrimary }}>{value}</div>}
              </div>
            ))}
          </div>
          {selectedReport.detectedObjects?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Detected Items</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedReport.detectedObjects.map((obj, i) => (
                  <span key={i} style={{ background: T.accentSoft, color: T.textPrimary, border: `1px solid ${T.accent}25`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>{obj.label}</span>
                ))}
              </div>
            </div>
          )}
          {selectedReport.location?.address && (
            <div style={{ background: T.pageBg, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Location</div>
              <div style={{ fontSize: 13, color: T.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}><Icon d={ICONS.location} size={13} color={T.textMuted} />{selectedReport.location.address}</div>
            </div>
          )}
          <button onClick={() => setShowReportModal(false)} style={{ width: '100%', padding: '9px', borderRadius: 8, border: '1px solid ' + T.border, background: T.cardBg, color: T.textSecondary, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter','DM Sans',sans-serif" }}>Close</button>
        </div>
      </div>
    );
  };

  return renderReportModal();
};

// ==================== MAIN ADMIN DASHBOARD ====================
const AdminDashboard = () => {
  const [admin,               setAdmin]               = useState(null);
  const [adminRole,           setAdminRole]           = useState(null);
  const [activeSection,       setActiveSection]       = useState('dashboard');
  const [sidebarCollapsed,    setSidebarCollapsed]    = useState(false);
  const [showLogoutConfirm,   setShowLogoutConfirm]   = useState(false);
  const [error,               setError]               = useState(null);
  const [selectedMapLocation, setSelectedMapLocation] = useState(null);
  const [searchQuery,         setSearchQuery]         = useState('');
  const [showNotifications,   setShowNotifications]   = useState(false);
  const [notificationStats,   setNotificationStats]   = useState({ unread: 0 });

  const [southData,   setSouthData]   = useState({ totalReports: 0, totalWeight: 0, recycledReports: 0, processedReports: 0, pendingReports: 0, disposedReports: 0, mostCollected: [] });
  const [centralData, setCentralData] = useState({ totalReports: 0, totalWeight: 0, recycledReports: 0, processedReports: 0, pendingReports: 0, disposedReports: 0, mostCollected: [] });
  const [dashboardStats,      setDashboardStats]      = useState({ totalReports: 0, totalWeight: 0, recycledReports: 0, processedReports: 0 });
  const [classificationData,  setClassificationData]  = useState({});
  const [detectedObjectsData, setDetectedObjectsData] = useState({});
  const [userAnalytics,       setUserAnalytics]       = useState({ totalUsers: 0, activeUsers: 0, bannedUsers: 0, maleUsers: 0, femaleUsers: 0, usersThisMonth: 0, usersThisWeek: 0 });
  const [topLocations,        setTopLocations]        = useState([]);
  const [locationDetections,  setLocationDetections]  = useState([]);
  const [mapLocations,        setMapLocations]        = useState([]);
  const [loadingMap,          setLoadingMap]          = useState(true);

  const navigate = useNavigate();

  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_URL}${url}`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers }, ...options });
    const ct = res.headers.get('content-type');
    if (ct?.includes('text/html')) throw new Error('Server returned HTML instead of JSON.');
    if (!res.ok) { let msg = `HTTP ${res.status}`; try { const e = await res.json(); msg = e.message || msg; } catch {} throw new Error(msg); }
    return res.json();
  };

  const fetchNotificationStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/notifications/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setNotificationStats({ unread: data.unread || 0 });
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  const scatteredTaguigLocations = [
    { name: 'South Signal Phase 1',  lat: 14.5012, lng: 121.0505 }, { name: 'South Signal Phase 2',  lat: 14.5028, lng: 121.0521 },
    { name: 'South Signal Phase 3',  lat: 14.5045, lng: 121.0542 }, { name: 'South Signal Phase 4',  lat: 14.5061, lng: 121.0558 },
    { name: 'South Signal Phase 5',  lat: 14.5078, lng: 121.0575 }, { name: 'South Signal Purok 1',  lat: 14.5020, lng: 121.0515 },
    { name: 'South Signal Purok 2',  lat: 14.5040, lng: 121.0530 }, { name: 'South Signal Purok 3',  lat: 14.5065, lng: 121.0545 },
    { name: 'South Signal Proper',   lat: 14.5049, lng: 121.0537 }, { name: 'Central Bicutan Phase 1',lat: 14.5165, lng: 121.0560 },
    { name: 'Central Bicutan Phase 2',lat: 14.5180, lng: 121.0575 }, { name: 'Central Bicutan Phase 3',lat: 14.5195, lng: 121.0590 },
    { name: 'Central Bicutan Proper', lat: 14.5185, lng: 121.0580 }, { name: 'Central Bicutan Purok 1',lat: 14.5170, lng: 121.0555 },
    { name: 'Central Bicutan Purok 2',lat: 14.5190, lng: 121.0585 }, { name: 'Bagumbayan',             lat: 14.5382, lng: 121.0695 },
    { name: 'Bambang',               lat: 14.5350, lng: 121.0652 }, { name: 'Calzada',               lat: 14.5315, lng: 121.0620 },
    { name: 'Hagonoy',               lat: 14.5333, lng: 121.0542 }, { name: 'Ibayo-Tipas',           lat: 14.5378, lng: 121.0725 },
    { name: 'Ligid-Tipas',           lat: 14.5390, lng: 121.0710 }, { name: 'Lower Bicutan',         lat: 14.5105, lng: 121.0610 },
    { name: 'Maharlika',             lat: 14.5180, lng: 121.0675 }, { name: 'Napindan',              lat: 14.5400, lng: 121.0750 },
    { name: 'North Signal',          lat: 14.5215, lng: 121.0530 }, { name: 'Palingon',              lat: 14.5355, lng: 121.0585 },
    { name: 'Pinagsama',             lat: 14.5450, lng: 121.0600 }, { name: 'San Miguel',            lat: 14.5250, lng: 121.0650 },
    { name: 'Santa Ana',             lat: 14.5280, lng: 121.0575 }, { name: 'Tuktukan',              lat: 14.5220, lng: 121.0700 },
    { name: 'Upper Bicutan',         lat: 14.5080, lng: 121.0590 }, { name: 'Ususan',                lat: 14.5150, lng: 121.0725 },
    { name: 'Wawa',                  lat: 14.5305, lng: 121.0710 }, { name: 'East Rembo',            lat: 14.5600, lng: 121.0590 },
    { name: 'West Rembo',            lat: 14.5570, lng: 121.0570 }, { name: 'Pembo',                 lat: 14.5580, lng: 121.0540 },
    { name: 'Bonifacio Global City', lat: 14.5550, lng: 121.0450 }, { name: 'McKinley Hill',         lat: 14.5430, lng: 121.0410 },
    { name: 'Market! Market!',       lat: 14.5450, lng: 121.0490 }, { name: 'SM Aura Premier',       lat: 14.5480, lng: 121.0480 },
  ];

  let randomIndex = 0;
  const geocodeAddress = (address) => {
    const defaultCoords = { lat: 14.5117, lng: 121.0558 };
    if (!address) return defaultCoords;
    const lowerAddr = address.toLowerCase().trim();
    const specificMatches = [
      { keywords: ['air force', 'airforce'], coords: { lat: 14.5055, lng: 121.0525 } },
      { keywords: ['central', 'central signal'], coords: { lat: 14.5172, lng: 121.0555 } },
      { keywords: ['south signal'], coords: { lat: 14.5049, lng: 121.0537 } },
      { keywords: ['bicutan'], coords: { lat: 14.5185, lng: 121.0580 } },
      { keywords: ['bagumbayan'], coords: { lat: 14.5382, lng: 121.0695 } },
      { keywords: ['bambang'], coords: { lat: 14.5350, lng: 121.0652 } },
      { keywords: ['calzada'], coords: { lat: 14.5315, lng: 121.0620 } },
      { keywords: ['hagonoy'], coords: { lat: 14.5333, lng: 121.0542 } },
      { keywords: ['ibayo'], coords: { lat: 14.5378, lng: 121.0725 } },
      { keywords: ['ligid'], coords: { lat: 14.5390, lng: 121.0710 } },
      { keywords: ['maharlika'], coords: { lat: 14.5180, lng: 121.0675 } },
      { keywords: ['napindan'], coords: { lat: 14.5400, lng: 121.0750 } },
      { keywords: ['palingon'], coords: { lat: 14.5355, lng: 121.0585 } },
      { keywords: ['pinagsama'], coords: { lat: 14.5450, lng: 121.0600 } },
      { keywords: ['tuktukan'], coords: { lat: 14.5220, lng: 121.0700 } },
      { keywords: ['ususan'], coords: { lat: 14.5150, lng: 121.0725 } },
      { keywords: ['wawa'], coords: { lat: 14.5305, lng: 121.0710 } },
      { keywords: ['bgc', 'bonifacio global'], coords: { lat: 14.5550, lng: 121.0450 } },
      { keywords: ['mckinley'], coords: { lat: 14.5430, lng: 121.0410 } },
      { keywords: ['market market'], coords: { lat: 14.5450, lng: 121.0490 } },
      { keywords: ['sm aura'], coords: { lat: 14.5480, lng: 121.0480 } },
    ];
    for (const match of specificMatches) {
      for (const keyword of match.keywords) { if (lowerAddr.includes(keyword)) return match.coords; }
    }
    for (const loc of scatteredTaguigLocations) { if (lowerAddr.includes(loc.name.toLowerCase())) return { lat: loc.lat, lng: loc.lng }; }
    const randomLoc = scatteredTaguigLocations[randomIndex % scatteredTaguigLocations.length];
    randomIndex++;
    return { lat: randomLoc.lat, lng: randomLoc.lng };
  };

  const processBarangayData = (reports) => {
    let totalWeight = 0;
    reports.forEach(r => { totalWeight += calculateTotalWeight(r); });
    const itemsCount = {};
    reports.forEach(report => {
      if (report.detectedObjects && Array.isArray(report.detectedObjects)) {
        report.detectedObjects.forEach(obj => { const label = obj.label || 'Unknown'; itemsCount[label] = (itemsCount[label] || 0) + 1; });
      }
    });
    const mostCollected = Object.entries(itemsCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));
    return {
      totalReports: reports.length, totalWeight: totalWeight.toFixed(2),
      recycledReports: reports.filter(r => r.status === 'recycled').length,
      processedReports: reports.filter(r => r.status === 'processed').length,
      pendingReports: reports.filter(r => r.status === 'pending').length,
      disposedReports: reports.filter(r => r.status === 'disposed').length,
      mostCollected,
    };
  };

  const fetchAllData = async () => {
    try {
      setError(null); setLoadingMap(true); randomIndex = 0;
      const [wasteRes, usersRes] = await Promise.allSettled([fetchWithAuth('/api/waste-reports'), fetchWithAuth('/api/users/all-users')]);
      const allUsers = usersRes.status === 'fulfilled' ? (usersRes.value || []) : [];
      setUserAnalytics({
        totalUsers: allUsers.filter(u => u.status !== 'pending').length,
        activeUsers: allUsers.filter(u => u.status === 'active').length,
        bannedUsers: allUsers.filter(u => u.status === 'banned').length,
        maleUsers: allUsers.filter(u => u.gender?.toLowerCase() === 'male').length,
        femaleUsers: allUsers.filter(u => u.gender?.toLowerCase() === 'female').length,
        usersThisMonth: allUsers.filter(u => { const d = new Date(u.createdAt); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length,
        usersThisWeek: allUsers.filter(u => { const d = new Date(u.createdAt); const w = new Date(); w.setDate(w.getDate() - 7); return d >= w; }).length,
      });
      let wasteReports = wasteRes.status === 'fulfilled' ? (wasteRes.value.reports || []) : [];
      setSouthData(processBarangayData(wasteReports.filter(r => r.assignedBarangay === 'south_signal')));
      setCentralData(processBarangayData(wasteReports.filter(r => r.assignedBarangay === 'central_bicutan')));
      let totalWeight = 0;
      wasteReports.forEach(r => { totalWeight += calculateTotalWeight(r); });
      setDashboardStats({ totalReports: wasteReports.length, totalWeight: totalWeight.toFixed(2), recycledReports: wasteReports.filter(r => r.status === 'recycled').length, processedReports: wasteReports.filter(r => r.status === 'processed').length });
      const classification = {};
      wasteReports.forEach(r => { const t = r.classification || 'Unknown'; classification[t] = (classification[t] || 0) + 1; });
      setClassificationData(classification);
      const objectsCount = {};
      wasteReports.forEach(report => { if (report.detectedObjects && Array.isArray(report.detectedObjects)) { report.detectedObjects.forEach(obj => { const label = obj.label || 'Unknown'; objectsCount[label] = (objectsCount[label] || 0) + 1; }); } });
      setDetectedObjectsData(objectsCount);
      const userMap = new Map();
      allUsers.forEach(user => { userMap.set(user._id, user); });
      const locationMap = new Map();
      for (const report of wasteReports) {
        const user = userMap.get(report.user?._id || report.user);
        let address = report.location?.address || user?.address || '';
        if (address && address !== 'Not specified' && address !== '') {
          let cleanAddress = address.replace(/^\d+\s+/, '').trim();
          if (cleanAddress.length === 0) cleanAddress = address;
          const key = cleanAddress.toLowerCase().trim();
          const coords = geocodeAddress(cleanAddress);
          const detectionCount = report.detectedObjects?.length || 0;
          const weight = calculateTotalWeight(report);
          if (locationMap.has(key)) { const ex = locationMap.get(key); ex.reportCount += 1; ex.totalWeight += weight; ex.detectionCount += detectionCount; ex.reports.push(report); }
          else { locationMap.set(key, { id: key, address: cleanAddress, lat: coords.lat, lng: coords.lng, reportCount: 1, totalWeight: weight, detectionCount, reports: [report] }); }
        }
      }
      const locations = Array.from(locationMap.values());
      const sortedLocations = [...locations].sort((a, b) => b.reportCount - a.reportCount);
      setTopLocations(sortedLocations); setMapLocations(sortedLocations); setLoadingMap(false);
      setLocationDetections(sortedLocations.slice(0, 10).map((loc, idx) => ({ rank: idx + 1, name: loc.address.length > 35 ? loc.address.slice(0, 32) + '...' : loc.address, reports: loc.reportCount, fullAddress: loc.address })));
    } catch (err) { setError(`Failed to load data: ${err.message}`); setLoadingMap(false); }
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    if (!token || !adminData) { navigate('/admin/login'); return; }
    try { const parsed = JSON.parse(adminData); setAdmin(parsed); setAdminRole(parsed.role); fetchAllData(); fetchNotificationStats(); } catch { navigate('/admin/login'); }
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotificationStats, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => { localStorage.removeItem('adminToken'); localStorage.removeItem('adminData'); navigate('/admin/login'); };

  const handleProfileUpdate = async (profileForm) => {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('Authentication token not found.');
    let response;
    if (profileForm.profile) {
      const fd = new FormData();
      fd.append('profile', profileForm.profile);
      if (profileForm.email && profileForm.email !== admin.email) fd.append('email', profileForm.email);
      if (profileForm.password) fd.append('password', profileForm.password);
      response = await fetch(`${API_URL}/api/admin/profile`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd });
    } else {
      const upd = {};
      if (profileForm.email && profileForm.email !== admin.email) upd.email = profileForm.email;
      if (profileForm.password) upd.password = profileForm.password;
      response = await fetch(`${API_URL}/api/admin/profile`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(upd) });
    }
    const data = await response.json();
    if (response.ok && data.admin) { setAdmin(data.admin); setAdminRole(data.admin.role); localStorage.setItem('adminData', JSON.stringify(data.admin)); }
    else throw new Error(data.message || 'Failed to update profile');
  };

  const handleDeleteProfilePicture = async () => {
    await fetchWithAuth('/api/admin/profile/picture', { method: 'DELETE' });
    const d = await fetchWithAuth('/api/admin/profile');
    if (d.admin) { setAdmin(d.admin); setAdminRole(d.admin.role); localStorage.setItem('adminData', JSON.stringify(d.admin)); }
  };

  const handleLocationClick = (location) => {
    setSelectedMapLocation(location);
    if (window.mapInstance) { window.mapInstance.setView([location.lat, location.lng], 16); }
  };

  // Chart options
  const FONT = "'Inter','DM Sans',sans-serif";
  const baseTooltip = { backgroundColor: '#1B2030', titleFont: { size: 11, family: FONT, weight: '600' }, bodyFont: { size: 11, family: FONT }, padding: 10, cornerRadius: 8, displayColors: true, boxPadding: 4, titleColor: '#F4F6FB', bodyColor: '#D7DAE8' };
  const pieChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10.5, family: FONT }, color: T.textSecondary, usePointStyle: true, pointStyle: 'circle', boxWidth: 7, padding: 14 } }, tooltip: { ...baseTooltip, callbacks: { label: (ctx) => { const total = ctx.dataset.data.reduce((a, b) => a + b, 0); return ` ${ctx.label}: ${ctx.raw} (${((ctx.raw / total) * 100).toFixed(1)}%)`; } } } } };
  const barComparisonOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', align: 'end', labels: { font: { size: 11, family: FONT }, color: T.textSecondary, usePointStyle: true, pointStyle: 'circle', boxWidth: 8 } }, tooltip: baseTooltip }, scales: { y: { beginAtZero: true, grid: { color: T.borderSoft, drawTicks: false }, border: { display: false }, ticks: { font: { size: 10, family: FONT }, color: T.textMuted, padding: 6 } }, x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10, family: FONT }, color: T.textMuted, maxRotation: 35 } } } };
  const radarOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10, family: FONT }, color: T.textSecondary, usePointStyle: true, pointStyle: 'circle' } }, tooltip: baseTooltip }, scales: { r: { ticks: { display: false }, grid: { color: T.borderSoft }, angleLines: { color: T.borderSoft }, pointLabels: { font: { size: 9, family: FONT }, color: T.textSecondary } } } };
  const polarOptions  = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10, family: FONT }, color: T.textSecondary, usePointStyle: true, pointStyle: 'circle' } }, tooltip: baseTooltip }, scales: { r: { ticks: { display: false }, grid: { color: T.borderSoft } } } };

  // Chart data
  const classificationChartData = { labels: Object.keys(classificationData), datasets: [{ data: Object.values(classificationData), backgroundColor: CHART_COLORS.slice(0, Object.keys(classificationData).length), borderColor: '#fff', borderWidth: 2 }] };
  const mostUsedItems = Object.entries(detectedObjectsData).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const mostUsedChartData = { labels: mostUsedItems.map(([label]) => label.length > 15 ? label.slice(0, 12) + '…' : label), datasets: [{ label: 'Times Scanned', data: mostUsedItems.map(([, count]) => count), backgroundColor: T.accent, borderRadius: 6, maxBarThickness: 34 }] };
  const reportsComparisonData = { labels: ['South Signal', 'Central Bicutan'], datasets: [{ label: 'Total Reports', data: [southData.totalReports, centralData.totalReports], backgroundColor: T.southColor, borderRadius: 6, maxBarThickness: 56 }, { label: 'Recycled', data: [southData.recycledReports, centralData.recycledReports], backgroundColor: T.centralColor, borderRadius: 6, maxBarThickness: 56 }] };
  const weightComparisonData  = { labels: ['South Signal', 'Central Bicutan'], datasets: [{ label: 'Total Weight (kg)', data: [parseFloat(southData.totalWeight), parseFloat(centralData.totalWeight)], backgroundColor: [T.southColor, T.centralColor], borderRadius: 6, maxBarThickness: 64 }] };
  const statusComparisonData  = { labels: ['Recycled', 'Processed', 'Pending', 'Disposed'], datasets: [{ label: 'South Signal', data: [southData.recycledReports, southData.processedReports, southData.pendingReports, southData.disposedReports], backgroundColor: T.southColor, borderRadius: 6, maxBarThickness: 32 }, { label: 'Central Bicutan', data: [centralData.recycledReports, centralData.processedReports, centralData.pendingReports, centralData.disposedReports], backgroundColor: T.centralColor, borderRadius: 6, maxBarThickness: 32 }] };
  const userStatsData   = { labels: ['Total Users', 'Active', 'Banned', 'Male', 'Female', 'New (Month)', 'New (Week)'], datasets: [{ label: 'Users', data: [userAnalytics.totalUsers, userAnalytics.activeUsers, userAnalytics.bannedUsers, userAnalytics.maleUsers, userAnalytics.femaleUsers, userAnalytics.usersThisMonth, userAnalytics.usersThisWeek], backgroundColor: 'rgba(79,91,213,0.18)', borderColor: T.accent, borderWidth: 2, pointBackgroundColor: T.accent }] };
  const userGenderData  = { labels: ['Male', 'Female', 'Other'], datasets: [{ data: [userAnalytics.maleUsers, userAnalytics.femaleUsers, userAnalytics.totalUsers - (userAnalytics.maleUsers + userAnalytics.femaleUsers)], backgroundColor: [T.accent, T.warning, T.neutral], borderColor: '#fff', borderWidth: 2 }] };
  const userGrowthData  = { labels: ['Total Registered', 'Active This Month', 'Active This Week'], datasets: [{ label: 'User Growth', data: [userAnalytics.totalUsers, userAnalytics.usersThisMonth, userAnalytics.usersThisWeek], backgroundColor: [T.accent, T.info, T.success], borderRadius: 8 }] };

  // Nav items
  const navItems = [
    { id: 'dashboard',  label: 'Dashboard',     icon: ICONS.dashboard,  group: 'Overview'    },
    { id: 'analytics',  label: 'Analytics',     icon: ICONS.analytics,  group: 'Insights'    },
    { id: 'collection', label: 'Collection',    icon: ICONS.collection, group: 'Operations'  },
    { id: 'map',        label: 'Heat Map',      icon: ICONS.map,        group: 'Operations'  },
    { id: 'users',      label: 'Users',         icon: ICONS.users,      group: 'Management'  },
    { id: 'history',    label: 'History',       icon: ICONS.history,    group: 'Records'     },
    { id: 'waste',      label: 'Datasets',      icon: ICONS.waste,      group: 'Management'  },
    { id: 'messages',   label: 'Messages',      icon: ICONS.messages,   group: 'Management'  },
    { id: 'feedback',   label: 'Feedback',      icon: ICONS.feedback,   group: 'Support'     },
    { id: 'profile',    label: 'Admin Profile', icon: ICONS.profile,    group: 'Account'     },
  ];

  const navGroups = ['Overview', 'Insights', 'Operations', 'Records', 'Management', 'Support', 'Account'];

  const pageTitles = {
    dashboard:  { title: 'Barangay Comparison Dashboard', sub: 'Compare waste metrics between South Signal and Central Bicutan' },
    analytics:  { title: 'Waste & User Analytics', sub: 'Detailed breakdown of collection trends and user insights' },
    collection: { title: 'Collection Records', sub: 'Daily waste collection log and tracking' },
    map:        { title: 'Waste Heat Map', sub: 'Geographic visualization of collection activity across Taguig City' },
    users:      { title: 'User Management', sub: 'Manage residents and monitor account status' },
    history:    { title: 'Collection History', sub: 'Complete log of waste collection events' },
    waste:      { title: 'Waste Reports', sub: 'Manage and classify waste detection reports' },
    messages:   { title: 'Messages', sub: 'Resident communications and inquiries' },
    feedback:   { title: 'Feedback Management', sub: 'View and respond to user feedback' },
    profile:    { title: 'Admin Profile', sub: 'Manage your account and credentials' },
  };

  const adminInitials = admin?.email ? admin.email.split('@')[0].slice(0, 2).toUpperCase() : 'AD';
  const sidebarW = sidebarCollapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W;

  // Card styles
  const card = { background: T.cardBg, border: '1px solid ' + T.border, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 2px rgba(20,24,40,0.03)' };
  const chartGrid2 = { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 24 };
  const chartCard  = { ...card, padding: '20px 22px' };
  const chartCardTitle = { fontSize: 13, fontWeight: 700, color: T.textPrimary, marginBottom: 16, marginTop: 0, display: 'flex', alignItems: 'center', gap: 9 };
  const iconBadge = (c, soft) => ({ width: 26, height: 26, borderRadius: 8, background: soft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 });
  const chartContainer = { height: 280, marginTop: 4 };

  // Dashboard render
  const renderDashboard = () => {
    const totalBoth     = southData.totalReports + centralData.totalReports;
    const southPercent  = totalBoth > 0 ? (southData.totalReports   / totalBoth * 100).toFixed(1) : 0;
    const centralPercent= totalBoth > 0 ? (centralData.totalReports / totalBoth * 100).toFixed(1) : 0;
    const getItemIcon = (itemName) => { const n = itemName.toLowerCase(); if (n.includes('bottle')) return ICONS.bottle; if (n.includes('can')) return ICONS.can; if (n.includes('box') || n.includes('cardboard')) return ICONS.box; return ICONS.waste; };

    return (
      <>
        {/* Hero banner */}
        <div style={{ background: `linear-gradient(135deg, ${T.sidebarBg} 0%, #232A45 60%, #2E3658 100%)`, borderRadius: 18, padding: '30px 32px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', position: 'relative', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ position: 'absolute', right: -40, top: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(79,91,213,0.18)' }} />
          <div style={{ position: 'absolute', right: 120, bottom: -70, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(231,234,243,0.45)', marginBottom: 10, marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon d={ICONS.recycle} size={13} color="rgba(231,234,243,0.5)" strokeWidth={2.2} />TMFK Waste Innovations
            </p>
            <h2 style={{ fontSize: 25, fontWeight: 800, color: '#F4F6FB', margin: '0 0 8px', lineHeight: 1.25, letterSpacing: '-0.01em' }}>Barangay Comparison Dashboard</h2>
            <p style={{ fontSize: 13, color: 'rgba(231,234,243,0.5)', margin: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon d={ICONS.location} size={12} color="rgba(231,234,243,0.45)" strokeWidth={2} />South Signal Village</span>
              <span style={{ opacity: 0.3 }}>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon d={ICONS.building} size={12} color="rgba(231,234,243,0.45)" strokeWidth={2} />Central Bicutan</span>
              <span style={{ opacity: 0.3 }}>·</span>
              <span>Taguig City</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexShrink: 0, position: 'relative', zIndex: 1 }}>
            {[
              { label: 'Total Reports', value: (southData.totalReports + centralData.totalReports).toLocaleString(), icon: ICONS.layers },
              { label: 'Total Weight', value: `${(parseFloat(southData.totalWeight) + parseFloat(centralData.totalWeight)).toFixed(1)} kg`, icon: ICONS.weight },
              { label: 'Recycled', value: (southData.recycledReports + centralData.recycledReports).toLocaleString(), icon: ICONS.recycle },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)', borderRadius: 12, padding: '14px 20px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.08)', minWidth: 116 }}>
                <Icon d={icon} size={15} color="rgba(231,234,243,0.45)" strokeWidth={2} />
                <div style={{ fontSize: 22, fontWeight: 800, color: '#F4F6FB', lineHeight: 1, marginTop: 8 }}>{value}</div>
                <div style={{ fontSize: 10.5, color: 'rgba(231,234,243,0.4)', marginTop: 5, fontWeight: 600, letterSpacing: '0.04em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Barangay cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {[
            { data: southData,   color: T.southColor,   label: 'South Signal Village', icon: ICONS.location },
            { data: centralData, color: T.centralColor, label: 'Central Bicutan',       icon: ICONS.building },
          ].map(({ data, color, label, icon }) => (
            <div key={label} style={card}>
              <div style={{ padding: '14px 20px', background: color + '0C', borderBottom: `2px solid ${color}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon d={icon} size={14} color={color} strokeWidth={2} /></span>
                  {label}
                </div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                {[
                  { label: 'Total Reports',       val: data.totalReports.toLocaleString(), col: color },
                  { label: 'Total Weight',        val: `${data.totalWeight} kg`,           col: color },
                  { label: 'Recycled',            val: data.recycledReports,               col: T.success },
                  { label: 'Processed',           val: data.processedReports,              col: T.info },
                  { label: 'Pending / Disposed',  val: `${data.pendingReports} / ${data.disposedReports}`, col: T.textPrimary },
                ].map(({ label: l, val, col }) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid ' + T.borderSoft }}>
                    <span style={{ fontSize: 12.5, color: T.textSecondary, fontWeight: 500 }}>{l}</span>
                    <span style={{ fontSize: 17, fontWeight: 700, color: col }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Most collected */}
        <SectionHeading icon={ICONS.target}>Most Collected Items by Barangay</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {[
            { data: southData,   color: T.southColor,   label: 'South Signal – Top Items',    icon: ICONS.location },
            { data: centralData, color: T.centralColor, label: 'Central Bicutan – Top Items',  icon: ICONS.building },
          ].map(({ data, color, label, icon }) => (
            <div key={label} style={card}>
              <div style={{ padding: '12px 20px', background: T.pageBg, borderBottom: '1px solid ' + T.border, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: 7, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon d={icon} size={12} color={color} strokeWidth={2.2} /></span>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{label}</span>
              </div>
              <div style={{ padding: '14px 20px' }}>
                {data.mostCollected.length > 0
                  ? data.mostCollected.slice(0, 8).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid ' + T.borderSoft }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary, display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ width: 24, height: 24, borderRadius: 7, background: T.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon d={getItemIcon(item.name)} size={12} color={T.textSecondary} strokeWidth={2} /></span>
                        {item.name}
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: T.accent, background: T.accentSoft, padding: '3px 10px', borderRadius: 20, minWidth: 38, textAlign: 'center' }}>{item.count}×</span>
                    </div>
                  ))
                  : <div style={{ textAlign: 'center', padding: '20px', color: T.textMuted, fontSize: 13 }}>No data available</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <SectionHeading icon={ICONS.analytics}>Comparative Analysis</SectionHeading>
        <div style={chartGrid2}>
          <div style={chartCard}>
            <p style={chartCardTitle}><span style={iconBadge(T.southColor, T.southColor + '14')}><Icon d={ICONS.layers} size={13} color={T.southColor} strokeWidth={2.2} /></span>Reports &amp; Recycling</p>
            <div style={chartContainer}><Bar data={reportsComparisonData} options={barComparisonOptions} /></div>
          </div>
          <div style={chartCard}>
            <p style={chartCardTitle}><span style={iconBadge(T.accent, T.accentSoft)}><Icon d={ICONS.weight} size={13} color={T.accent} strokeWidth={2.2} /></span>Total Weight Collected</p>
            <div style={chartContainer}><Bar data={weightComparisonData} options={barComparisonOptions} /></div>
          </div>
        </div>
        <div style={chartGrid2}>
          <div style={chartCard}>
            <p style={chartCardTitle}><span style={iconBadge(T.success, T.successSoft)}><Icon d={ICONS.recycle} size={13} color={T.success} strokeWidth={2.2} /></span>Status Breakdown by Barangay</p>
            <div style={chartContainer}><Bar data={statusComparisonData} options={barComparisonOptions} /></div>
          </div>
          <div style={chartCard}>
            <p style={chartCardTitle}><span style={iconBadge(T.info, T.infoSoft)}><Icon d={ICONS.waste} size={13} color={T.info} strokeWidth={2.2} /></span>Waste Classification (Overall)</p>
            <div style={chartContainer}>{Object.keys(classificationData).length > 0 ? <Pie data={classificationChartData} options={pieChartOptions} /> : <div style={{ textAlign: 'center', paddingTop: 80, color: T.textMuted, fontSize: 13 }}>No data available</div>}</div>
          </div>
        </div>
        <div style={chartGrid2}>
          <div style={chartCard}>
            <p style={chartCardTitle}><span style={iconBadge(T.warning, T.warningSoft)}><Icon d={ICONS.box} size={13} color={T.warning} strokeWidth={2.2} /></span>Most Used Items (Overall)</p>
            <div style={chartContainer}>{mostUsedItems.length > 0 ? <Bar data={mostUsedChartData} options={barComparisonOptions} /> : <div style={{ textAlign: 'center', paddingTop: 80, color: T.textMuted, fontSize: 13 }}>No data available</div>}</div>
          </div>
          <div style={chartCard}>
            <p style={chartCardTitle}><span style={iconBadge(T.accent, T.accentSoft)}><Icon d={ICONS.dashboard} size={13} color={T.accent} strokeWidth={2.2} /></span>Distribution Overview</p>
            <div style={chartContainer}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                {[{ label: 'South Signal Share', percent: southPercent, color: T.southColor, icon: ICONS.location }, { label: 'Central Bicutan Share', percent: centralPercent, color: T.centralColor, icon: ICONS.building }].map(({ label, percent, color, icon }) => (
                  <div key={label} style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><Icon d={icon} size={12} color={color} strokeWidth={2} />{label}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: T.textPrimary }}>{percent}<span style={{ fontSize: 15, color: T.textMuted }}>%</span></div>
                    <div style={{ marginTop: 9, height: 6, background: T.borderSoft, borderRadius: 4, overflow: 'hidden' }}><div style={{ height: '100%', width: `${percent}%`, background: color, borderRadius: 4, transition: 'width 0.4s ease' }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <SectionHeading icon={ICONS.users}>User Analytics</SectionHeading>
        <div style={chartGrid2}>
          <div style={chartCard}>
            <p style={chartCardTitle}><span style={iconBadge(T.accent, T.accentSoft)}><Icon d={ICONS.users} size={13} color={T.accent} strokeWidth={2.2} /></span>User Overview</p>
            <div style={chartContainer}><Radar data={userStatsData} options={radarOptions} /></div>
          </div>
          <div style={chartCard}>
            <p style={chartCardTitle}><span style={iconBadge(T.info, T.infoSoft)}><Icon d={ICONS.profile} size={13} color={T.info} strokeWidth={2.2} /></span>Gender Distribution</p>
            <div style={chartContainer}><Pie data={userGenderData} options={pieChartOptions} /></div>
          </div>
        </div>
        <div style={chartGrid2}>
          <div style={chartCard}>
            <p style={chartCardTitle}><span style={iconBadge(T.success, T.successSoft)}><Icon d={ICONS.trendUp} size={13} color={T.success} strokeWidth={2.2} /></span>User Growth</p>
            <div style={chartContainer}><PolarArea data={userGrowthData} options={polarOptions} /></div>
          </div>
          <div style={{ ...card, padding: '20px 22px' }}>
            <p style={chartCardTitle}><span style={iconBadge(T.danger, T.dangerSoft)}><Icon d={ICONS.pin} size={13} color={T.danger} strokeWidth={2.2} /></span>Most Active Locations</p>
            {locationDetections.length > 0
              ? locationDetections.slice(0, 7).map((loc) => (
                <div key={loc.rank} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid ' + T.borderSoft, cursor: 'pointer' }}
                  onClick={() => { const location = topLocations.find(l => l.address === loc.fullAddress); if (location) handleLocationClick(location); }}>
                  <span style={{ fontWeight: 700, color: T.textMuted, width: 28, fontSize: 12 }}>{String(loc.rank).padStart(2, '0')}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: T.textSecondary, flex: 1 }}>{loc.name}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: T.danger, background: T.dangerSoft, padding: '3px 10px', borderRadius: 20, minWidth: 36, textAlign: 'center' }}>{loc.reports}</span>
                </div>
              ))
              : <div style={{ textAlign: 'center', padding: '30px', color: T.textMuted, fontSize: 13 }}>No collection data available yet.</div>}
          </div>
        </div>
      </>
    );
  };

  const renderMap = () => (
    <>
      <SectionHeading icon={ICONS.map}>Geographic Heat Map with Clustered Markers – Taguig City</SectionHeading>
      <div style={{ ...card, minHeight: 580, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 1000, display: 'flex', gap: 8 }}>
          {[
            { label: 'Reset View', icon: ICONS.target, onClick: () => { if (window.mapInstance && mapLocations.length > 0) { const bounds = L.latLngBounds(mapLocations.map(l => [l.lat, l.lng])); window.mapInstance.fitBounds(bounds, { padding: [50, 50] }); setSelectedMapLocation(null); } } },
            { label: 'Top Location', icon: ICONS.location, onClick: () => { if (window.mapInstance && topLocations.length > 0) { window.mapInstance.setView([topLocations[0].lat, topLocations[0].lng], 16); setSelectedMapLocation(topLocations[0]); } } },
          ].map(({ label, icon, onClick }) => (
            <button key={label} onClick={onClick} style={{ background: T.cardBg, border: '1px solid ' + T.border, borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: T.textSecondary, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 4px rgba(20,24,40,0.06)' }}>
              <Icon d={icon} size={13} color={T.textSecondary} strokeWidth={2} />{label}
            </button>
          ))}
        </div>

        <div style={{ position: 'absolute', bottom: 20, right: 20, background: 'rgba(255,255,255,0.97)', padding: '12px 16px', borderRadius: 10, boxShadow: '0 2px 12px rgba(20,24,40,0.08)', zIndex: 1000, fontSize: 12, border: '1px solid ' + T.border }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: T.textPrimary, fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}><Icon d={ICONS.alert} size={11} color={T.danger} strokeWidth={2} />Collection Intensity</div>
          <div style={{ width: 190, height: 8, background: `linear-gradient(to right, ${T.success}, ${T.warning}, #C97A2E, ${T.danger})`, borderRadius: 6, marginBottom: 6 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMuted }}><span>Low</span><span>Medium</span><span>High</span></div>
          <div style={{ marginTop: 10, fontSize: 10.5, color: T.textSecondary, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { label: 'Low: under 5 reports', color: T.success },
              { label: 'Medium: 5–10', color: T.warning },
              { label: 'High: 10–20', color: '#C97A2E' },
              { label: 'Critical: 20+', color: T.danger },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: row.color, flexShrink: 0 }} />{row.label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(255,255,255,0.97)', padding: '12px 16px', borderRadius: 10, boxShadow: '0 2px 12px rgba(20,24,40,0.08)', zIndex: 1000, fontSize: 12, border: '1px solid ' + T.border, maxWidth: 240, maxHeight: 380, overflowY: 'auto' }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: T.textPrimary, fontSize: 11, borderBottom: '1px solid ' + T.border, paddingBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><Icon d={ICONS.list} size={12} color={T.textPrimary} strokeWidth={2} />Top Collection Areas</div>
          {topLocations.slice(0, 8).map((loc, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11, cursor: 'pointer', padding: '6px 8px', borderRadius: 6, background: selectedMapLocation?.address === loc.address ? T.accentSoft : 'transparent', transition: 'background 0.15s' }}
              onClick={() => handleLocationClick(loc)}>
              <span style={{ color: T.textSecondary }}>{idx + 1}. {loc.address.length > 28 ? loc.address.slice(0, 25) + '...' : loc.address}</span>
              <span style={{ fontWeight: 700, color: T.danger, marginLeft: 8 }}>{loc.reportCount || 0}</span>
            </div>
          ))}
          {topLocations.length > 8 && <div style={{ marginTop: 8, textAlign: 'center', fontSize: 10, color: T.accent }}>+{topLocations.length - 8} more on map</div>}
        </div>

        <div style={{ position: 'absolute', bottom: 20, left: 20, background: 'rgba(255,255,255,0.97)', padding: '7px 12px', borderRadius: 8, fontSize: 11, color: T.textSecondary, zIndex: 1000, border: '1px solid ' + T.border, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon d={ICONS.map} size={12} color={T.textSecondary} strokeWidth={2} />
          {mapLocations.length} active collection points · Click clusters to expand
        </div>

        <div id="waste-map" style={{ height: '580px', width: '100%', borderRadius: '14px' }} />

        {loadingMap && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(255,255,255,0.95)', padding: '20px 28px', borderRadius: '12px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid ' + T.border, boxShadow: '0 4px 16px rgba(20,24,40,0.08)' }}>
            <Icon d={ICONS.refresh} size={20} color={T.textMuted} strokeWidth={2} />
            <span style={{ fontSize: 13, color: T.textMuted }}>Loading map data…</span>
          </div>
        )}
      </div>
      {!loadingMap && mapLocations.length > 0 && (
        <WasteHeatmap locations={mapLocations} adminRole={adminRole} onSelectLocation={setSelectedMapLocation} selectedLocation={selectedMapLocation} />
      )}
    </>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':  return renderDashboard();
      case 'analytics':  return <Analytics adminRole={adminRole} />;
      case 'collection': return <Collection barangayFilter={adminRole === 'southadmin' ? 'south_signal' : adminRole === 'centraladmin' ? 'central_signal' : null} />;
      case 'map':        return renderMap();
      case 'users':      return <UserManagement barangayFilter={adminRole === 'southadmin' ? 'south_signal' : adminRole === 'centraladmin' ? 'central_signal' : null} adminRole={adminRole} />;
      case 'history':    return <History barangayFilter={adminRole === 'southadmin' ? 'south_signal' : adminRole === 'centraladmin' ? 'central_signal' : null} />;
      case 'waste':      return <WasteManagement barangayFilter={adminRole === 'southadmin' ? 'south_signal' : adminRole === 'centraladmin' ? 'central_signal' : null} />;
      case 'messages':   return <Message barangayFilter={adminRole === 'southadmin' ? 'south_signal' : adminRole === 'centraladmin' ? 'central_signal' : null} />;
      case 'feedback':   return <FeedbackManagement barangayFilter={adminRole === 'southadmin' ? 'south_signal' : adminRole === 'centraladmin' ? 'central_signal' : null} adminRole={adminRole} />;
      case 'profile':    return <AdminProfiles admin={admin} onProfileUpdate={handleProfileUpdate} onDeleteProfilePicture={handleDeleteProfilePicture} />;
      default:           return renderDashboard();
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.pageBg, fontFamily: "'Inter','DM Sans','Segoe UI',sans-serif", color: T.textPrimary }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(27,32,48,0.12); border-radius: 4px; }
        .leaflet-container { z-index: 1; }
        .waste-cluster-popup .leaflet-popup-content-wrapper { border-radius: 12px; padding: 0; overflow: hidden; box-shadow: 0 8px 32px rgba(20,24,40,0.14); border: 1px solid #EEF0F6; font-family: 'Inter','DM Sans',sans-serif; }
        .waste-cluster-popup .leaflet-popup-content { margin: 0; }
        .waste-cluster-popup .leaflet-popup-tip-container { display: none; }
        .waste-cluster-popup .leaflet-popup-close-button { color: rgba(255,255,255,0.8) !important; font-size: 18px !important; padding: 6px 8px !important; top: 4px !important; right: 4px !important; }
        .leaflet-marker-icon { border: none !important; background: none !important; }
        .marker-cluster { background: none !important; border: none !important; }
        .marker-cluster div { background: none !important; border: none !important; }
        .tmfk-nav-item:hover { background: rgba(255,255,255,0.06) !important; color: #F4F6FB !important; }
        .tmfk-sidebar-admin:hover { background: rgba(255,255,255,0.05) !important; }
      `}</style>

      {/* Sidebar */}
      <aside style={{
        width: sidebarW, minHeight: '100vh',
        background: T.sidebarBg,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
        boxShadow: '4px 0 24px rgba(15,18,32,0.18)',
        transition: 'width 0.22s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        borderRight: '1px solid ' + T.sidebarBorder,
      }}>
        {/* Logo */}
        <div style={{ padding: sidebarCollapsed ? '20px 0' : '20px 16px', borderBottom: '1px solid ' + T.sidebarBorder, display: 'flex', alignItems: 'center', gap: 10, justifyContent: sidebarCollapsed ? 'center' : 'flex-start', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon d={ICONS.recycle} size={18} color="#F4F6FB" strokeWidth={2.2} />
          </div>
          {!sidebarCollapsed && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.sidebarTextActive, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.2 }}>TMFK</div>
              <div style={{ fontSize: 9, color: T.sidebarMuted, marginTop: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Waste Innovations</div>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(p => !p)} style={{ marginLeft: sidebarCollapsed ? 0 : 'auto', background: 'none', border: 'none', cursor: 'pointer', color: T.sidebarMuted, display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6, flexShrink: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = T.sidebarTextActive} onMouseLeave={e => e.currentTarget.style.color = T.sidebarMuted}>
            <Icon d={sidebarCollapsed ? ICONS.chevronRight : ICONS.chevronLeft} size={16} color="currentColor" strokeWidth={2.2} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: sidebarCollapsed ? '12px 4px' : '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {navGroups.map(group => {
            const items = navItems.filter(n => n.group === group);
            if (!items.length) return null;
            return (
              <div key={group} style={{ marginBottom: 18 }}>
                {!sidebarCollapsed && (
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.sidebarMuted, padding: '0 10px', marginBottom: 4 }}>{group}</div>
                )}
                {items.map(item => {
                  const active = activeSection === item.id;
                  return (
                    <div key={item.id} className="tmfk-nav-item"
                      onClick={() => setActiveSection(item.id)}
                      title={sidebarCollapsed ? item.label : ''}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, padding: sidebarCollapsed ? '9px 0' : '8px 10px', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', borderRadius: 8, cursor: 'pointer', marginBottom: 1, userSelect: 'none', transition: 'all 0.15s ease', fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? T.sidebarTextActive : T.sidebarText, background: active ? T.sidebarActive : 'transparent', borderLeft: active && !sidebarCollapsed ? `3px solid ${T.accent}` : '3px solid transparent' }}>
                      <Icon d={item.icon} size={15} color={active ? T.sidebarTextActive : T.sidebarText} strokeWidth={active ? 2.2 : 1.8} />
                      {!sidebarCollapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer: admin card + logout */}
        <div style={{ padding: sidebarCollapsed ? '12px 4px' : '12px 8px', borderTop: '1px solid ' + T.sidebarBorder, flexShrink: 0 }}>
          <div className="tmfk-sidebar-admin" onClick={() => setActiveSection('profile')}
            style={{ display: 'flex', alignItems: 'center', gap: 9, padding: sidebarCollapsed ? '10px 0' : '10px', borderRadius: 8, marginBottom: 8, cursor: 'pointer', transition: 'background 0.15s', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid ' + T.sidebarBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: T.sidebarTextActive, flexShrink: 0, overflow: 'hidden' }}>
              {admin?.profile ? <img src={admin.profile} alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{adminInitials}</span>}
            </div>
            {!sidebarCollapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: T.sidebarTextActive, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin?.email?.split('@')[0] || 'Admin'}</div>
                <div style={{ fontSize: 10, color: T.sidebarMuted, marginTop: 1 }}>{adminRole === 'southadmin' ? 'South Admin' : adminRole === 'centraladmin' ? 'Central Admin' : 'Super Admin'}</div>
              </div>
            )}
          </div>
          <button onClick={() => setShowLogoutConfirm(true)} title={sidebarCollapsed ? 'Sign Out' : ''}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(217,72,60,0.25)', background: 'rgba(217,72,60,0.08)', color: '#E37068', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter','DM Sans',sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,72,60,0.18)'; e.currentTarget.style.color = '#F4F6FB'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(217,72,60,0.08)'; e.currentTarget.style.color = '#E37068'; }}>
            <Icon d={ICONS.logout} size={13} color="currentColor" strokeWidth={2} />
            {!sidebarCollapsed && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: sidebarW, flex: 1, minHeight: '100vh', background: T.pageBg, transition: 'margin-left 0.22s cubic-bezier(.4,0,.2,1)' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', height: 64, borderBottom: '1px solid ' + T.border, background: T.topbarBg, position: 'sticky', top: 0, zIndex: 50, gap: 16 }}>
          {/* Page title */}
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>{pageTitles[activeSection]?.title}</h1>
            <p style={{ fontSize: 11.5, color: T.textMuted, margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pageTitles[activeSection]?.sub}</p>
          </div>

          {/* Search bar */}
          <div style={{ flex: 1, maxWidth: 360, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <Icon d={ICONS.search} size={15} color={T.textMuted} strokeWidth={2} />
            </div>
            <input
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid ' + T.border, borderRadius: 9, fontSize: 13, color: T.textPrimary, background: T.pageBg, outline: 'none', fontFamily: "'Inter','DM Sans',sans-serif", transition: 'border-color 0.15s, box-shadow 0.15s' }}
              onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accentSoft}`; }}
              onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {/* Date chip */}
            <div style={{ fontSize: 12, color: T.textSecondary, background: T.pageBg, border: '1px solid ' + T.border, borderRadius: 9, padding: '7px 12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon d={ICONS.calendar} size={13} color={T.textMuted} strokeWidth={1.8} />
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>

            {/* Bell with badge */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid ' + T.border, background: T.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
                <Icon d={ICONS.bell} size={16} color={T.textSecondary} strokeWidth={1.8} />
                {notificationStats.unread > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: T.danger,
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '2px 5px',
                    borderRadius: 20,
                    minWidth: 18,
                    textAlign: 'center'
                  }}>
                    {notificationStats.unread > 9 ? '9+' : notificationStats.unread}
                  </span>
                )}
              </button>
            </div>

            {/* Avatar */}
            <div onClick={() => setActiveSection('profile')} style={{ width: 36, height: 36, borderRadius: 9, background: T.accentSoft, border: `1px solid ${T.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: T.accent, cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}>
              {admin?.profile ? <img src={admin.profile} alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{adminInitials}</span>}
            </div>
          </div>
        </div>

        {/* Error bar */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.dangerSoft, border: '1px solid ' + T.danger + '30', borderRadius: 10, padding: '10px 16px', margin: '20px 28px 0', fontSize: 13, color: T.danger }}>
            <Icon d={ICONS.alert} size={15} color={T.danger} strokeWidth={2} />
            <span>{error}</span>
            <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: T.danger, cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setError(null)}>
              <Icon d={ICONS.close} size={15} color={T.danger} strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Page content */}
        <div style={{ padding: '24px 28px' }}>{renderSection()}</div>
      </main>

      {/* Notifications Panel */}
      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
        adminId={admin?._id}
      />

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(21,25,43,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowLogoutConfirm(false)}>
          <div style={{ background: T.cardBg, border: '1px solid ' + T.border, borderRadius: 16, padding: 32, width: 480, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(20,24,40,0.18)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: T.dangerSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon d={ICONS.logout} size={18} color={T.danger} strokeWidth={2} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary, margin: 0 }}>Confirm Sign Out</h3>
            </div>
            <p style={{ fontSize: 13.5, color: T.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>Are you sure you want to sign out from TMFK Waste Innovations Admin Panel?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowLogoutConfirm(false)} style={{ padding: '9px 18px', borderRadius: 9, border: '1px solid ' + T.border, background: 'transparent', color: T.textSecondary, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter','DM Sans',sans-serif" }}>Cancel</button>
              <button onClick={handleLogout} style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: T.danger, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter','DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 7 }}>
                <Icon d={ICONS.logout} size={14} color="#fff" strokeWidth={2.2} />Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;