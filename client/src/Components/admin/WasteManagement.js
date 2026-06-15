import React, { useState, useEffect, useCallback } from 'react';
import API_URL from '../Utils/Api';
import JSZip from 'jszip';
import {
  Recycle, Leaf, Trash2, AlertTriangle,
  Image as ImageIcon, ZoomIn, User, Calendar, Package,
  Hash, Download, X, ChevronRight, Loader2,
  FlaskConical, Battery, Smartphone, Lightbulb,
  Paintbrush, Wind, Apple, Utensils, Layers,
  LayoutGrid, FileWarning, Trash,
} from 'lucide-react';

/* ─── GLOBAL CSS ─── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity:0;transform:translateY(6px);} to {opacity:1;transform:translateY(0);} }
  @keyframes slideIn { from { opacity:0;transform:translateY(10px) scale(0.985);} to {opacity:1;transform:translateY(0) scale(1);} }
  @keyframes shake   { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-4px);} 75%{transform:translateX(4px);} }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  ::-webkit-scrollbar              { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track        { background: transparent; }
  ::-webkit-scrollbar-thumb        { background: #d4d4d8; border-radius: 99px; }

  .wm-root {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #0f172a;
    background: #f8fafc;
    min-height: 100%;
  }

  .wm-card {
    transition: box-shadow 0.15s ease, transform 0.15s ease, border-color 0.15s ease;
    cursor: pointer;
  }
  .wm-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.08) !important;
    border-color: #cbd5e1 !important;
  }
  .wm-card:hover .wm-card-img { transform: scale(1.04); }

  .wm-card-img { transition: transform 0.3s ease; }

  .wm-lightbox-img {
    animation: fadeUp 0.18s ease;
    max-width: 90vw;
    max-height: 88vh;
    object-fit: contain;
    border-radius: 10px;
    box-shadow: 0 40px 80px rgba(0,0,0,0.55);
  }

  .wm-filter-btn { transition: all 0.12s ease; cursor: pointer; }
  .wm-filter-btn:hover:not(.active) { background: #f1f5f9 !important; border-color: #cbd5e1 !important; }

  .wm-btn-ghost { transition: background 0.12s ease, color 0.12s ease; }
  .wm-btn-ghost:hover { background: #f1f5f9 !important; }

  .wm-delete-btn {
    transition: all 0.12s ease;
    opacity: 0;
  }
  .wm-card:hover .wm-delete-btn {
    opacity: 1;
  }
  .wm-delete-btn:hover {
    background: #fee2e2 !important;
    border-color: #fca5a5 !important;
    color: #dc2626 !important;
  }

  .wm-confirm-shake { animation: shake 0.3s ease; }
`;

/* ─── TOKENS ─── */
const T = {
  bg:           '#f8fafc',
  surface:      '#ffffff',
  surface2:     '#f1f5f9',
  border:       '#e2e8f0',
  border2:      '#f0f4f8',
  text:         '#0f172a',
  muted:        '#64748b',
  dim:          '#475569',
  green:        '#16a34a',
  greenLight:   '#f0fdf4',
  greenBorder:  '#bbf7d0',
  indigo:       '#4f46e5',
  indigoLight:  '#eef2ff',
  indigoBorder: '#c7d2fe',
  violet:       '#7c3aed',
  violetLight:  '#f5f3ff',
  violetBorder: '#ddd6fe',
  slate:        '#475569',
  slateLight:   '#f8fafc',
  slateBorder:  '#cbd5e1',
  red:          '#dc2626',
  redLight:     '#fef2f2',
  redBorder:    '#fecaca',
  amber:        '#d97706',
  amberLight:   '#fffbeb',
  amberBorder:  '#fde68a',
};

/* ─── CLASSIFICATION CONFIG ─── */
const CLASSIFICATION_CONFIG = {
  'recyclable':     { category:'Recyclable',    subcategory:'General Recyclable',    color:T.green,  bg:T.greenLight,  border:T.greenBorder,  Icon:Recycle,       order:1 },
  'plastic':        { category:'Recyclable',    subcategory:'Plastic',               color:T.green,  bg:T.greenLight,  border:T.greenBorder,  Icon:Package,       order:1 },
  'plastic bottle': { category:'Recyclable',    subcategory:'Plastic Bottle',        color:T.green,  bg:T.greenLight,  border:T.greenBorder,  Icon:Package,       order:1 },
  'plastic bag':    { category:'Recyclable',    subcategory:'Plastic Bag',           color:T.green,  bg:T.greenLight,  border:T.greenBorder,  Icon:Package,       order:1 },
  'plastic cup':    { category:'Recyclable',    subcategory:'Plastic Cup',           color:T.green,  bg:T.greenLight,  border:T.greenBorder,  Icon:Package,       order:1 },
  'glass':          { category:'Recyclable',    subcategory:'Glass',                 color:T.green,  bg:T.greenLight,  border:T.greenBorder,  Icon:Recycle,       order:1 },
  'glass bottle':   { category:'Recyclable',    subcategory:'Glass Bottle',          color:T.green,  bg:T.greenLight,  border:T.greenBorder,  Icon:Recycle,       order:1 },
  'metal':          { category:'Recyclable',    subcategory:'Metal',                 color:T.green,  bg:T.greenLight,  border:T.greenBorder,  Icon:Layers,        order:1 },
  'metal can':      { category:'Recyclable',    subcategory:'Metal Can',             color:T.green,  bg:T.greenLight,  border:T.greenBorder,  Icon:Layers,        order:1 },
  'aluminum':       { category:'Recyclable',    subcategory:'Aluminum',              color:T.green,  bg:T.greenLight,  border:T.greenBorder,  Icon:Layers,        order:1 },
  'aluminum can':   { category:'Recyclable',    subcategory:'Aluminum Can',          color:T.green,  bg:T.greenLight,  border:T.greenBorder,  Icon:Layers,        order:1 },
  'paper':          { category:'Recyclable',    subcategory:'Paper',                 color:T.green,  bg:T.greenLight,  border:T.greenBorder,  Icon:Package,       order:1 },
  'cardboard':      { category:'Recyclable',    subcategory:'Cardboard',             color:T.green,  bg:T.greenLight,  border:T.greenBorder,  Icon:Package,       order:1 },
  'carton':         { category:'Recyclable',    subcategory:'Carton',                color:T.green,  bg:T.greenLight,  border:T.greenBorder,  Icon:Package,       order:1 },
  'biodegradable':  { category:'Biodegradable', subcategory:'General Biodegradable', color:T.violet, bg:T.violetLight, border:T.violetBorder, Icon:Leaf,          order:2 },
  'organic':        { category:'Biodegradable', subcategory:'Organic Waste',         color:T.violet, bg:T.violetLight, border:T.violetBorder, Icon:Leaf,          order:2 },
  'food':           { category:'Biodegradable', subcategory:'Food Waste',            color:T.violet, bg:T.violetLight, border:T.violetBorder, Icon:Utensils,      order:2 },
  'food waste':     { category:'Biodegradable', subcategory:'Food Waste',            color:T.violet, bg:T.violetLight, border:T.violetBorder, Icon:Utensils,      order:2 },
  'vegetable':      { category:'Biodegradable', subcategory:'Vegetable Scraps',      color:T.violet, bg:T.violetLight, border:T.violetBorder, Icon:Leaf,          order:2 },
  'fruit':          { category:'Biodegradable', subcategory:'Fruit Scraps',          color:T.violet, bg:T.violetLight, border:T.violetBorder, Icon:Apple,         order:2 },
  'yard waste':     { category:'Biodegradable', subcategory:'Yard Waste',            color:T.violet, bg:T.violetLight, border:T.violetBorder, Icon:Leaf,          order:2 },
  'residual':       { category:'Residual',      subcategory:'General Residual',      color:T.slate,  bg:T.slateLight,  border:T.slateBorder,  Icon:Trash2,        order:3 },
  'non-recyclable': { category:'Residual',      subcategory:'Non-Recyclable',        color:T.slate,  bg:T.slateLight,  border:T.slateBorder,  Icon:Trash2,        order:3 },
  'diaper':         { category:'Residual',      subcategory:'Diaper',                color:T.slate,  bg:T.slateLight,  border:T.slateBorder,  Icon:Trash2,        order:3 },
  'sanitary':       { category:'Residual',      subcategory:'Sanitary Waste',        color:T.slate,  bg:T.slateLight,  border:T.slateBorder,  Icon:Trash2,        order:3 },
  'special':        { category:'Special Waste', subcategory:'General Special Waste', color:T.red,    bg:T.redLight,    border:T.redBorder,    Icon:AlertTriangle, order:4 },
  'special waste':  { category:'Special Waste', subcategory:'Special Waste',         color:T.red,    bg:T.redLight,    border:T.redBorder,    Icon:AlertTriangle, order:4 },
  'hazardous':      { category:'Special Waste', subcategory:'Hazardous Waste',       color:T.red,    bg:T.redLight,    border:T.redBorder,    Icon:AlertTriangle, order:4 },
  'electronic':     { category:'Special Waste', subcategory:'E-Waste',              color:T.red,    bg:T.redLight,    border:T.redBorder,    Icon:Smartphone,    order:4 },
  'e-waste':        { category:'Special Waste', subcategory:'E-Waste',              color:T.red,    bg:T.redLight,    border:T.redBorder,    Icon:Smartphone,    order:4 },
  'battery':        { category:'Special Waste', subcategory:'Battery',               color:T.red,    bg:T.redLight,    border:T.redBorder,    Icon:Battery,       order:4 },
  'chemical':       { category:'Special Waste', subcategory:'Chemical Waste',        color:T.red,    bg:T.redLight,    border:T.redBorder,    Icon:FlaskConical,  order:4 },
  'medical':        { category:'Special Waste', subcategory:'Medical Waste',         color:T.red,    bg:T.redLight,    border:T.redBorder,    Icon:FileWarning,   order:4 },
  'bulb':           { category:'Special Waste', subcategory:'Light Bulb',            color:T.red,    bg:T.redLight,    border:T.redBorder,    Icon:Lightbulb,     order:4 },
  'light bulb':     { category:'Special Waste', subcategory:'Light Bulb',            color:T.red,    bg:T.redLight,    border:T.redBorder,    Icon:Lightbulb,     order:4 },
  'paint':          { category:'Special Waste', subcategory:'Paint',                 color:T.red,    bg:T.redLight,    border:T.redBorder,    Icon:Paintbrush,    order:4 },
  'aerosol':        { category:'Special Waste', subcategory:'Aerosol Can',           color:T.red,    bg:T.redLight,    border:T.redBorder,    Icon:Wind,          order:4 },
};

const getCategory = (classification) => {
  const key = (classification || '').toLowerCase().trim();
  return CLASSIFICATION_CONFIG[key] || {
    category:'Unclassified', subcategory:'Unknown',
    color:T.muted, bg:T.surface2, border:T.border,
    Icon:Package, order:5,
  };
};

const fmt = (d) => new Date(d).toLocaleDateString('en-US', {
  year:'numeric', month:'short', day:'numeric',
});

/* ─── ZIP DOWNLOAD ─── */
const downloadImagesInFolders = async (reportsByCategory) => {
  const zip = new JSZip();
  let count = 0;
  for (const [cat, reports] of Object.entries(reportsByCategory)) {
    if (!reports.length) continue;
    const folder = zip.folder(cat.replace(/[\\/:*?"<>|]/g, '_'));
    for (const report of reports) {
      if (!report.image) continue;
      try {
        const blob = await fetch(report.image).then(r => r.blob());
        folder.file(`${report._id.slice(-8)}.jpg`, blob);
        count++;
      } catch {}
    }
  }
  if (!count) return false;
  const zipBlob = await zip.generateAsync({ type:'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `waste_images_${new Date().toISOString().slice(0,10)}.zip`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return count;
};

/* ─── LIGHTBOX ─── */
const Lightbox = ({ src, onClose }) => {
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0,
      background:'rgba(0,0,0,0.9)',
      backdropFilter:'blur(16px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:99999, padding:24, cursor:'zoom-out',
    }}>
      <button onClick={onClose} style={{
        position:'fixed', top:20, right:20,
        width:36, height:36, borderRadius:8,
        background:'rgba(255,255,255,0.1)',
        border:'1px solid rgba(255,255,255,0.2)',
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', color:'rgba(255,255,255,0.85)',
      }}>
        <X size={16} />
      </button>
      <img src={src} alt="Full view" className="wm-lightbox-img" onClick={e => e.stopPropagation()} />
    </div>
  );
};

/* ─── DELETE CONFIRM MODAL ─── */
const DeleteConfirmModal = ({ report, onConfirm, onCancel, loading }) => {
  const cat = getCategory(report.classification);
  return (
    <div onClick={onCancel} style={{
      position:'fixed', inset:0,
      background:'rgba(0,0,0,0.4)',
      backdropFilter:'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:99998, padding:24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:T.surface,
        border:`1px solid ${T.border}`,
        borderRadius:14,
        width:420, maxWidth:'100%',
        padding:28,
        animation:'slideIn 0.18s ease',
        boxShadow:'0 24px 64px rgba(0,0,0,0.18)',
      }}>
        <div style={{
          width:48, height:48, borderRadius:12,
          background:T.redLight, border:`1px solid ${T.redBorder}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          marginBottom:16,
        }}>
          <Trash size={22} color={T.red} />
        </div>
        <h3 style={{ fontSize:16, fontWeight:600, color:T.text, marginBottom:6 }}>
          Delete this record?
        </h3>
        <p style={{ fontSize:13, color:T.muted, lineHeight:1.6, marginBottom:20 }}>
          This will permanently remove the <strong style={{ color:cat.color }}>{cat.subcategory}</strong> record
          and its image. This action cannot be undone.
        </p>
        {report.image && (
          <div style={{
            borderRadius:8, overflow:'hidden',
            border:`1px solid ${T.border}`,
            marginBottom:20, height:120,
          }}>
            <img src={report.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
        )}
        <div style={{ display:'flex', gap:10 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex:1, padding:'9px 0', borderRadius:8,
              border:`1px solid ${T.border}`,
              background:T.surface, color:T.dim,
              fontSize:13, fontWeight:500, cursor:'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex:1, padding:'9px 0', borderRadius:8,
              border:`1px solid ${T.redBorder}`,
              background:T.red, color:'#fff',
              fontSize:13, fontWeight:500,
              cursor:loading ? 'not-allowed' : 'pointer',
              opacity:loading ? 0.6 : 1,
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            }}
          >
            {loading
              ? <><Loader2 size={13} style={{ animation:'spin 0.75s linear infinite' }} /> Deleting…</>
              : <><Trash size={13} /> Delete record</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── IMAGE CARD ─── */
const ImageCard = ({ report, onClick, onDelete }) => {
  const cat = getCategory(report.classification);
  const CatIcon = cat.Icon;

  return (
    <div
      className="wm-card"
      style={{
        background:T.surface,
        border:`1px solid ${T.border}`,
        borderRadius:12,
        overflow:'hidden',
        position:'relative',
      }}
    >
      {/* Delete button — top right, visible on hover */}
      <button
        className="wm-delete-btn"
        onClick={(e) => { e.stopPropagation(); onDelete(report); }}
        title="Delete record"
        style={{
          position:'absolute', top:10, right:10,
          zIndex:10,
          width:30, height:30, borderRadius:7,
          background:'rgba(255,255,255,0.92)',
          border:`1px solid ${T.border}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', color:T.muted,
          backdropFilter:'blur(4px)',
        }}
      >
        <Trash size={13} />
      </button>

      {/* Image — clickable to open detail modal */}
      <div
        onClick={() => onClick(report)}
        style={{
          width:'100%', height:196,
          background:T.surface2,
          position:'relative', overflow:'hidden',
          cursor:'pointer',
        }}
      >
        {report.image ? (
          <img
            src={report.image}
            alt={report.classification || 'Waste'}
            className="wm-card-img"
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
          />
        ) : (
          <div style={{
            width:'100%', height:'100%',
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            gap:8, color:T.muted,
          }}>
            <ImageIcon size={26} strokeWidth={1.5} />
            <span style={{ fontSize:11 }}>No image</span>
          </div>
        )}
        {/* Category badge */}
        <div style={{
          position:'absolute', top:10, left:10,
          display:'inline-flex', alignItems:'center', gap:5,
          padding:'4px 9px', borderRadius:6,
          fontSize:11, fontWeight:600,
          background:'rgba(255,255,255,0.92)',
          color:cat.color,
          border:`1px solid ${cat.border}`,
          backdropFilter:'blur(6px)',
        }}>
          <CatIcon size={11} />
          {cat.category}
        </div>
      </div>

      {/* Info row — clickable to open detail modal */}
      <div onClick={() => onClick(report)} style={{ padding:'11px 14px', cursor:'pointer' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
          <span style={{
            fontSize:11, fontWeight:600,
            color:cat.color,
            background:cat.bg,
            padding:'2px 7px',
            borderRadius:4,
            border:`1px solid ${cat.border}`,
            maxWidth:'62%',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>
            {cat.subcategory}
          </span>
          <span style={{ fontSize:11, color:T.muted, whiteSpace:'nowrap' }}>
            {fmt(report.scanDate)}
          </span>
        </div>
        <div style={{ marginTop:5, fontSize:11, color:T.muted, display:'flex', alignItems:'center', gap:4 }}>
          <Hash size={10} />
          <span style={{ fontFamily:'monospace' }}>{report._id?.slice(-8)}</span>
        </div>
      </div>
    </div>
  );
};

/* ─── SINGLE IMAGE DOWNLOAD ─── */
const downloadImage = async (url, filename) => {
  try {
    const blob = await fetch(url).then(r => r.blob());
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob), download: filename,
    });
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  } catch { alert('Failed to download. Please try again.'); }
};

/* ─── FILTER TABS ─── */
const FILTER_CONFIG = [
  { id:'all',           label:'All',          Icon:LayoutGrid,    color:T.indigo, bg:T.indigoLight, border:T.indigoBorder },
  { id:'Recyclable',    label:'Recyclable',   Icon:Recycle,       color:T.green,  bg:T.greenLight,  border:T.greenBorder  },
  { id:'Biodegradable', label:'Biodegradable',Icon:Leaf,          color:T.violet, bg:T.violetLight, border:T.violetBorder },
  { id:'Residual',      label:'Residual',     Icon:Trash2,        color:T.slate,  bg:T.slateLight,  border:T.slateBorder  },
  { id:'Special Waste', label:'Special',      Icon:AlertTriangle, color:T.red,    bg:T.redLight,    border:T.redBorder    },
];

/* ─── MAIN COMPONENT ─── */
const WasteManagement = () => {
  const [reports, setReports]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [selectedReport, setSelected]   = useState(null);
  const [showDetail, setShowDetail]     = useState(false);
  const [lightboxSrc, setLightbox]      = useState(null);
  const [activeFilter, setFilter]       = useState('all');
  const [downloading, setDownloading]   = useState(false);
  const [toDelete, setToDelete]         = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [toast, setToast]               = useState(null);

  useEffect(() => { fetchReports(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const authFetch = async (url, opts = {}) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found.');
    const res = await fetch(`${API_URL}${url}`, {
      method: opts.method || 'GET',
      headers: { Authorization:`Bearer ${token}`, 'Content-Type':'application/json', ...opts.headers },
      ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
    });
    if (res.status === 401) throw new Error('Session expired.');
    if (res.status === 403) throw new Error('Access denied.');
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || e.message || `HTTP ${res.status}`); }
    return res.json();
  };

  const fetchReports = async () => {
    try {
      setLoading(true); setError(null);
      const data = await authFetch('/api/waste-reports?limit=500');
      if (data.success) setReports(data.reports || []);
      else throw new Error(data.error || 'Unknown error');
    } catch (e) { setError(e.message); setReports([]); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await authFetch(`/api/waste-reports/${toDelete._id}`, { method:'DELETE' });
      setReports(prev => prev.filter(r => r._id !== toDelete._id));
      if (selectedReport?._id === toDelete._id) { setShowDetail(false); setSelected(null); }
      showToast('Record deleted successfully.');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const filteredReports = activeFilter === 'all'
    ? reports
    : reports.filter(r => getCategory(r.classification).category === activeFilter);

  const countOf = (id) =>
    id === 'all' ? reports.length
    : reports.filter(r => getCategory(r.classification).category === id).length;

  const groupByCategory = (list) =>
    list.reduce((acc, r) => {
      const c = getCategory(r.classification).category;
      (acc[c] = acc[c] || []).push(r);
      return acc;
    }, {});

  const handleDownloadAll = async () => {
    if (downloading) return;
    const withImages = filteredReports.filter(r => r.image);
    if (!withImages.length) { showToast('No images to export.', 'error'); return; }
    setDownloading(true);
    try {
      const count = await downloadImagesInFolders(groupByCategory(withImages));
      if (count) showToast(`Exported ${count} image${count !== 1 ? 's' : ''} successfully.`);
      else showToast('No images could be downloaded.', 'error');
    } catch { showToast('Export failed. Please try again.', 'error'); }
    finally { setDownloading(false); }
  };

  const selectedCat = selectedReport ? getCategory(selectedReport.classification) : null;

  return (
    <div className="wm-root" style={{ padding:'28px 32px' }}>
      <style>{GLOBAL_CSS}</style>

      {/* LIGHTBOX */}
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightbox(null)} />}

      {/* DELETE CONFIRM */}
      {toDelete && (
        <DeleteConfirmModal
          report={toDelete}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          loading={deleting}
        />
      )}

      {/* TOAST */}
      {toast && (
        <div style={{
          position:'fixed', bottom:24, right:24, zIndex:99990,
          display:'flex', alignItems:'center', gap:10,
          padding:'11px 16px', borderRadius:10,
          background: toast.type === 'error' ? T.red : '#0f172a',
          color:'#fff',
          fontSize:13, fontWeight:500,
          boxShadow:'0 8px 32px rgba(0,0,0,0.2)',
          animation:'slideIn 0.18s ease',
        }}>
          {toast.type === 'error' ? <AlertTriangle size={14} /> : <span style={{ fontSize:14 }}>✓</span>}
          {toast.msg}
        </div>
      )}

      {/* ERROR BANNER */}
      {error && (
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'10px 14px', borderRadius:8, marginBottom:20,
          background:T.redLight, border:`1px solid ${T.redBorder}`,
          color:T.red, fontSize:13,
        }}>
          <AlertTriangle size={14} />
          <span style={{ flex:1 }}>{error}</span>
          <button onClick={() => setError(null)} className="wm-btn-ghost" style={{
            background:'none', border:'none', cursor:'pointer',
            color:T.red, padding:4, borderRadius:4, display:'flex',
          }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* HEADER */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        gap:16, marginBottom:24, flexWrap:'wrap',
      }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:T.text, letterSpacing:'-0.02em', lineHeight:1.2 }}>
            Waste Segregation Dataset
          </h1>
          <p style={{ fontSize:13, color:T.muted, marginTop:4 }}>
            {reports.length.toLocaleString()} total records
          </p>
        </div>

        {/* Category summary pills */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {FILTER_CONFIG.slice(1).map(f => (
            <div key={f.id} style={{
              display:'inline-flex', alignItems:'center', gap:5,
              padding:'4px 10px', borderRadius:6,
              background:f.bg, border:`1px solid ${f.border}`,
              fontSize:12, fontWeight:500, color:f.color,
            }}>
              <f.Icon size={11} />
              {countOf(f.id).toLocaleString()}
            </div>
          ))}
        </div>
      </div>

      {/* FILTER BAR + EXPORT */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        gap:12, marginBottom:20,
        paddingBottom:16, borderBottom:`1px solid ${T.border}`,
        flexWrap:'wrap',
      }}>
        {/* Filter tabs */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {FILTER_CONFIG.map(f => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                className={`wm-filter-btn${isActive ? ' active' : ''}`}
                onClick={() => setFilter(f.id)}
                style={{
                  display:'inline-flex', alignItems:'center', gap:6,
                  padding:'6px 13px', borderRadius:7,
                  border:`1px solid ${isActive ? f.color : T.border}`,
                  background:isActive ? f.color : T.surface,
                  color:isActive ? '#fff' : T.dim,
                  fontSize:13, fontWeight:500,
                }}
              >
                <f.Icon size={13} />
                {f.label}
                <span style={{
                  fontSize:11, fontWeight:600,
                  background:isActive ? 'rgba(255,255,255,0.22)' : T.surface2,
                  borderRadius:5, padding:'1px 6px',
                  color:isActive ? 'rgba(255,255,255,0.9)' : T.muted,
                }}>
                  {countOf(f.id)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Export button */}
        {filteredReports.length > 0 && (
          <button
            onClick={handleDownloadAll}
            disabled={downloading}
            style={{
              display:'inline-flex', alignItems:'center', gap:6,
              padding:'6px 14px', borderRadius:7,
              border:`1px solid ${T.border}`,
              background:T.surface, color:T.dim,
              fontSize:13, fontWeight:500,
              cursor:downloading ? 'not-allowed' : 'pointer',
              opacity:downloading ? 0.55 : 1,
              transition:'all 0.12s',
              flexShrink:0,
            }}
          >
            {downloading
              ? <Loader2 size={13} style={{ animation:'spin 0.75s linear infinite' }} />
              : <Download size={13} />
            }
            {downloading ? 'Exporting…' : `Export (${filteredReports.filter(r=>r.image).length})`}
          </button>
        )}
      </div>

      {/* GRID */}
      {loading ? (
        <div style={{
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          padding:'80px 0', gap:12,
        }}>
          <Loader2 size={24} color={T.green} style={{ animation:'spin 0.75s linear infinite' }} />
          <span style={{ fontSize:13, color:T.muted }}>Loading records…</span>
        </div>
      ) : filteredReports.length === 0 ? (
        <div style={{
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          padding:'72px 0', gap:10,
          background:T.surface, borderRadius:12,
          border:`1px solid ${T.border}`,
        }}>
          <div style={{
            width:48, height:48, borderRadius:10,
            background:T.surface2, border:`1px solid ${T.border}`,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <ImageIcon size={22} color={T.muted} strokeWidth={1.5} />
          </div>
          <p style={{ fontSize:14, fontWeight:600, color:T.text }}>No records found</p>
          <p style={{ fontSize:13, color:T.muted }}>
            {activeFilter !== 'all' ? `No ${activeFilter} waste records yet.` : 'No waste reports yet.'}
          </p>
        </div>
      ) : (
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))',
          gap:14,
        }}>
          {filteredReports.map(report => (
            <ImageCard
              key={report._id}
              report={report}
              onClick={(r) => { setSelected(r); setShowDetail(true); }}
              onDelete={(r) => setToDelete(r)}
            />
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetail && selectedReport && selectedCat && (
        <div
          onClick={() => setShowDetail(false)}
          style={{
            position:'fixed', inset:0,
            background:'rgba(0,0,0,0.35)',
            backdropFilter:'blur(6px)',
            display:'flex', alignItems:'center', justifyContent:'center',
            zIndex:9999, padding:24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:T.surface,
              border:`1px solid ${T.border}`,
              borderRadius:14,
              width:560, maxWidth:'100%', maxHeight:'92vh',
              display:'flex', flexDirection:'column',
              animation:'slideIn 0.18s ease',
              boxShadow:'0 24px 64px rgba(0,0,0,0.15)',
              overflow:'hidden',
            }}
          >
            {/* Modal header */}
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'15px 20px',
              borderBottom:`1px solid ${T.border}`,
              flexShrink:0,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{
                  width:32, height:32, borderRadius:7,
                  background:selectedCat.bg, border:`1px solid ${selectedCat.border}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <selectedCat.Icon size={15} color={selectedCat.color} />
                </div>
                <div>
                  <h3 style={{ fontSize:14, fontWeight:600, color:T.text, lineHeight:1.2 }}>
                    {selectedReport.classification || 'Unknown'}
                  </h3>
                  <p style={{ fontSize:11, color:T.muted, marginTop:1 }}>
                    {selectedCat.category} · {selectedCat.subcategory}
                  </p>
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button
                  onClick={() => { setToDelete(selectedReport); setShowDetail(false); }}
                  title="Delete record"
                  style={{
                    width:30, height:30, borderRadius:6,
                    border:`1px solid ${T.border}`,
                    background:T.surface,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    cursor:'pointer', color:T.muted,
                    transition:'all 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.redLight; e.currentTarget.style.borderColor = T.redBorder; e.currentTarget.style.color = T.red; }}
                  onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                >
                  <Trash size={13} />
                </button>
                <button
                  onClick={() => setShowDetail(false)}
                  className="wm-btn-ghost"
                  style={{
                    width:30, height:30, borderRadius:6,
                    border:`1px solid ${T.border}`,
                    background:T.surface,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    cursor:'pointer', color:T.muted,
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding:20, overflowY:'auto', flex:1 }}>
              {selectedReport.image ? (
                <>
                  <div
                    onClick={() => setLightbox(selectedReport.image)}
                    style={{
                      cursor:'zoom-in', borderRadius:8, overflow:'hidden',
                      border:`1px solid ${T.border}`, position:'relative',
                    }}
                  >
                    <img
                      src={selectedReport.image}
                      alt={selectedReport.classification}
                      style={{ width:'100%', maxHeight:300, objectFit:'contain', display:'block', background:T.surface2 }}
                    />
                    <div style={{
                      position:'absolute', bottom:10, right:10,
                      display:'flex', alignItems:'center', gap:5,
                      background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)',
                      borderRadius:5, padding:'3px 8px',
                      fontSize:11, color:'rgba(255,255,255,0.85)',
                    }}>
                      <ZoomIn size={11} />
                      Click to zoom
                    </div>
                  </div>
                  <button
                    onClick={() => downloadImage(
                      selectedReport.image,
                      `${selectedReport.classification || 'waste'}_${selectedReport._id.slice(-8)}.jpg`
                    )}
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                      padding:'8px 0', borderRadius:7, width:'100%', marginTop:10,
                      border:`1px solid ${T.greenBorder}`,
                      background:T.greenLight, color:T.green,
                      fontSize:13, fontWeight:500, cursor:'pointer',
                    }}
                  >
                    <Download size={13} />
                    Download image
                  </button>
                </>
              ) : (
                <div style={{
                  width:'100%', height:220, background:T.surface2,
                  borderRadius:8, display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center',
                  gap:8, color:T.muted, border:`1px solid ${T.border}`,
                }}>
                  <ImageIcon size={28} strokeWidth={1.5} />
                  <span style={{ fontSize:12 }}>No image</span>
                </div>
              )}

              {/* Meta grid */}
              <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  { icon:User,     label:'User',       value:selectedReport.user?.username || selectedReport.userEmail || 'Anonymous' },
                  { icon:Calendar, label:'Scanned',    value:fmt(selectedReport.scanDate) },
                  { icon:Hash,     label:'Record ID',  value:selectedReport._id?.slice(-8), mono:true },
                  { icon:Package,  label:'Purpose',    value:'Segregation Dataset' },
                ].map(({ icon:MetaIcon, label, value, mono }) => (
                  <div key={label} style={{
                    background:T.surface2, borderRadius:7,
                    padding:'10px 12px', border:`1px solid ${T.border2}`,
                  }}>
                    <div style={{
                      display:'flex', alignItems:'center', gap:5,
                      fontSize:10, fontWeight:600, color:T.muted,
                      textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4,
                    }}>
                      <MetaIcon size={10} />
                      {label}
                    </div>
                    <div style={{
                      fontSize:13, fontWeight:500, color:T.text,
                      fontFamily:mono ? 'monospace' : 'inherit',
                    }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Detected objects */}
              {selectedReport.detectedObjects?.length > 0 && (
                <div style={{
                  marginTop:10, background:T.surface2,
                  borderRadius:7, padding:'10px 12px',
                  border:`1px solid ${T.border2}`,
                }}>
                  <div style={{
                    fontSize:10, fontWeight:600, color:T.muted,
                    textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8,
                  }}>
                    Detected objects
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {selectedReport.detectedObjects.map((obj, i) => (
                      <span key={i} style={{
                        background:T.surface, border:`1px solid ${T.border}`,
                        borderRadius:4, padding:'2px 8px',
                        fontSize:11, color:T.dim,
                      }}>
                        {obj.label}
                        {obj.confidence && (
                          <span style={{ color:T.muted, marginLeft:4 }}>
                            {Math.round(obj.confidence * 100)}%
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{
              padding:'12px 20px',
              borderTop:`1px solid ${T.border}`,
              background:T.surface2,
              display:'flex', alignItems:'center', justifyContent:'space-between',
              flexShrink:0,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:T.muted }}>
                <selectedCat.Icon size={11} color={selectedCat.color} />
                <span style={{ color:selectedCat.color, fontWeight:600 }}>{selectedCat.category}</span>
                <ChevronRight size={10} />
                <span>{selectedCat.subcategory}</span>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                style={{
                  padding:'6px 14px', borderRadius:6,
                  border:`1px solid ${T.border}`,
                  background:T.surface, color:T.dim,
                  fontSize:12, fontWeight:500, cursor:'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WasteManagement;