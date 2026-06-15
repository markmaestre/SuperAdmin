import React, { useState, useEffect, useCallback, useRef } from 'react';
import API_URL from '../Utils/Api';

// ─── Inline SVG Icon System ───────────────────────────────────────────────────
const Svg = ({ children, size = 16, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'inline-block', flexShrink: 0, ...style }}>
    {children}
  </svg>
);

const Icons = {
  Megaphone:     ({ size, style }) => <Svg size={size} style={style}><path d="M3 11l19-9-9 19-2-8-8-2z"/></Svg>,
  Calendar:      ({ size, style }) => <Svg size={size} style={style}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Svg>,
  Broom:         ({ size, style }) => <Svg size={size} style={style}><path d="M9 3l2 2M5 7l4-4 10 10-4 4zM6 18l-3 3M9 21l-3-3 8-8"/></Svg>,
  AlertTriangle: ({ size, style }) => <Svg size={size} style={style}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Svg>,
  Recycle:       ({ size, style }) => <Svg size={size} style={style}><path d="M7 19H4.815a1.83 1.83 0 01-1.57-2.763L7.196 9.5"/><path d="M11 19h8.792a1.83 1.83 0 001.571-2.763l-2.475-4.285"/><path d="M15.196 6.5L12 2l-3.196 4.5"/><path d="M9 6.5l3-4.5 3 4.5"/></Svg>,
  Newspaper:     ({ size, style }) => <Svg size={size} style={style}><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 002 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6z"/></Svg>,
  Siren:         ({ size, style }) => <Svg size={size} style={style}><path d="M5 10.5V19a2 2 0 002 2h10a2 2 0 002-2v-8.5"/><path d="M12 2v2M4.93 4.93l1.41 1.41M19.07 4.93l-1.41 1.41M2 11h2M20 11h2"/><path d="M9 10a3 3 0 116 0v1H9v-1z"/></Svg>,
  FileText:      ({ size, style }) => <Svg size={size} style={style}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Svg>,
  Plus:          ({ size, style }) => <Svg size={size} style={style}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>,
  Edit:          ({ size, style }) => <Svg size={size} style={style}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>,
  Trash:         ({ size, style }) => <Svg size={size} style={style}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></Svg>,
  Eye:           ({ size, style }) => <Svg size={size} style={style}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Svg>,
  HeartFilled:   ({ size, style }) => <Svg size={size} style={style}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="currentColor" stroke="currentColor"/></Svg>,
  HeartOutline:  ({ size, style }) => <Svg size={size} style={style}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></Svg>,
  MessageSquare: ({ size, style }) => <Svg size={size} style={style}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></Svg>,
  Pin:           ({ size, style }) => <Svg size={size} style={style}><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17z"/></Svg>,
  Crown:         ({ size, style }) => <Svg size={size} style={style}><path d="M2 19h20M2 19l3-9 5 5 2-7 2 7 5-5 3 9"/></Svg>,
  Building:      ({ size, style }) => <Svg size={size} style={style}><path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18z"/><path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2"/><line x1="10" y1="6" x2="14" y2="6"/><line x1="10" y1="10" x2="14" y2="10"/></Svg>,
  MapPin:        ({ size, style }) => <Svg size={size} style={style}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></Svg>,
  User:          ({ size, style }) => <Svg size={size} style={style}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></Svg>,
  Send:          ({ size, style }) => <Svg size={size} style={style}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Svg>,
  X:             ({ size, style }) => <Svg size={size} style={style}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>,
  Filter:        ({ size, style }) => <Svg size={size} style={style}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></Svg>,
  Image:         ({ size, style }) => <Svg size={size} style={style}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></Svg>,
  Loader:        ({ size, style }) => <Svg size={size} style={style}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></Svg>,
  Share:         ({ size, style }) => <Svg size={size} style={style}><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></Svg>,
  ZoomIn:        ({ size, style }) => <Svg size={size} style={style}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></Svg>,
  Globe:         ({ size, style }) => <Svg size={size} style={style}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></Svg>,
  ChevronLeft:   ({ size, style }) => <Svg size={size} style={style}><polyline points="15 18 9 12 15 6"/></Svg>,
  ChevronRight:  ({ size, style }) => <Svg size={size} style={style}><polyline points="9 18 15 12 9 6"/></Svg>,
  MoreHoriz:     ({ size, style }) => <Svg size={size} style={style}><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></Svg>,
  BarChart:      ({ size, style }) => <Svg size={size} style={style}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Svg>,
  Clock:         ({ size, style }) => <Svg size={size} style={style}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Svg>,
  CheckCircle:   ({ size, style }) => <Svg size={size} style={style}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Svg>,
  Archive:       ({ size, style }) => <Svg size={size} style={style}><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></Svg>,
};

// ─── Category Config ──────────────────────────────────────────────────────────
const CATEGORY = {
  announcement: { Icon: Icons.Megaphone,     label: 'Announcement',  color: '#1877F2', bg: '#E7F0FD' },
  event:        { Icon: Icons.Calendar,      label: 'Event',         color: '#8B5CF6', bg: '#EDE9FE' },
  cleanup_drive:{ Icon: Icons.Broom,         label: 'Cleanup Drive', color: '#059669', bg: '#D1FAE5' },
  advisory:     { Icon: Icons.AlertTriangle, label: 'Advisory',      color: '#D97706', bg: '#FEF3C7' },
  recycling_tip:{ Icon: Icons.Recycle,       label: 'Recycling Tip', color: '#047857', bg: '#ECFDF5' },
  news:         { Icon: Icons.Newspaper,     label: 'News',          color: '#4F46E5', bg: '#EEF2FF' },
  alert:        { Icon: Icons.Siren,         label: 'Alert',         color: '#DC2626', bg: '#FEE2E2' },
  general:      { Icon: Icons.FileText,      label: 'General',       color: '#64748B', bg: '#F1F5F9' },
};

const ADMIN = {
  southadmin:   { Icon: Icons.MapPin,    label: 'South Signal Admin',   color: '#1D4ED8', bg: '#DBEAFE' },
  centraladmin: { Icon: Icons.Building, label: 'Central Bicutan Admin', color: '#047857', bg: '#D1FAE5' },
  superadmin:   { Icon: Icons.Crown,    label: 'Super Admin',           color: '#92400E', bg: '#FEF3C7' },
  admin:        { Icon: Icons.User,     label: 'Admin',                 color: '#7C3AED', bg: '#EDE9FE' },
};

const getCat = (c) => CATEGORY[c] || CATEGORY.general;
const getAdm = (r) => ADMIN[r]    || ADMIN.admin;

const fmtDate = (d) => new Date(d).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' });
const fmtFull = (d) => new Date(d).toLocaleString('en-PH',    { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-PH', { month:'short', day:'numeric' });
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getAdminDisplayName = (post) =>
  post.adminName || post.admin?.fullName || post.admin?.username || 'Admin';
const getAdminRole = (post) =>
  post.adminRole || post.admin?.role || 'admin';

// ─── Image Lightbox ───────────────────────────────────────────────────────────
const Lightbox = ({ src, alt, onClose }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,.92)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out' }}>
      <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,.15)', border:'none', cursor:'pointer', color:'#fff', borderRadius:'50%', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', zIndex:2001 }}>
        <Icons.X size={20}/>
      </button>
      <img src={src} alt={alt} onClick={e => e.stopPropagation()} style={{ maxWidth:'95vw', maxHeight:'92vh', objectFit:'contain', borderRadius:8, cursor:'default', boxShadow:'0 8px 60px rgba(0,0,0,.6)' }}/>
    </div>
  );
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ role, adminName, size = 44 }) => {
  const adm = getAdm(role);
  const displayName = adminName || adm.label;
  const initials = displayName.slice(0, 2).toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:adm.bg, color:adm.color, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:size*0.34, flexShrink:0, border:`2px solid ${adm.color}22` }}>
      {initials}
    </div>
  );
};

// ─── Category Badge ───────────────────────────────────────────────────────────
const CatBadge = ({ category }) => {
  const cat = getCat(category);
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:cat.bg, color:cat.color, padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700, letterSpacing:'0.02em' }}>
      <cat.Icon size={10}/> {cat.label}
    </span>
  );
};

// ─── Field Label ──────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <label style={{ display:'block', marginBottom:5, fontSize:11, fontWeight:700, color:'#8A8A8A', textTransform:'uppercase', letterSpacing:'0.06em' }}>{children}</label>
);

const inputStyle = {
  width:'100%', padding:'9px 12px', border:'1px solid #E4E6EB', borderRadius:8,
  fontSize:14, color:'#1C1E21', background:'#F0F2F5', outline:'none',
  boxSizing:'border-box', fontFamily:'inherit',
};

// ─── Dropdown Menu ────────────────────────────────────────────────────────────
const DropMenu = ({ items, onClose }) => {
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return (
    <div ref={ref} style={{ position:'absolute', right:0, top:'calc(100% + 4px)', background:'#fff', border:'1px solid #E4E6EB', borderRadius:10, boxShadow:'0 4px 20px rgba(0,0,0,.13)', zIndex:200, minWidth:160, overflow:'hidden' }}>
      {items.map((item, i) => (
        <button key={i} onClick={() => { item.action(); onClose(); }}
          style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 14px', background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, color:item.danger?'#DC2626':'#1C1E21', textAlign:'left', transition:'background .1s' }}
          onMouseEnter={e => e.currentTarget.style.background = item.danger ? '#FEE2E2' : '#F0F2F5'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          {item.icon} {item.label}
        </button>
      ))}
    </div>
  );
};

// ─── Reaction Button ──────────────────────────────────────────────────────────
const ReactionBtn = ({ icon, label, count, active, color, onClick, loading }) => (
  <button onClick={onClick} style={{ display:'inline-flex', alignItems:'center', gap:5, background:active?`${color}15`:'transparent', color:active?color:'#65676B', border:'none', cursor:'pointer', padding:'6px 10px', borderRadius:8, fontSize:13, fontWeight:active?700:500, transition:'all .15s', flex:1, justifyContent:'center' }}>
    {loading ? <Icons.Loader size={15} style={{ animation:'spin 1s linear infinite' }}/> : icon}
    {label}{count > 0 ? ` · ${count}` : ''}
  </button>
);

// ─── Post Row Actions — own component so hooks are never inside .map() ────────
const PostRowActions = ({ post, onView, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div style={{ width:40, flexShrink:0, position:'relative' }}>
      <button
        onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
        style={{ background:'none', border:'none', cursor:'pointer', color:'#65676B', padding:6, borderRadius:8, display:'flex', alignItems:'center', width:'100%', justifyContent:'center' }}
        onMouseEnter={e => e.currentTarget.style.background = '#F0F2F5'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
        <Icons.MoreHoriz size={18}/>
      </button>
      {menuOpen && (
        <DropMenu onClose={() => setMenuOpen(false)} items={[
          { label:'View',   icon:<Icons.Eye size={13}/>,  action:() => onView(post) },
          { label:'Edit',   icon:<Icons.Edit size={13}/>, action:() => onEdit(post) },
          { label:'Delete', icon:<Icons.Trash size={13}/>,action:() => onDelete(post._id), danger:true },
        ]}/>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Post = ({ adminRole, currentUser }) => {
  const [posts,             setPosts]             = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState(null);
  const [showCreateModal,   setShowCreateModal]   = useState(false);
  const [editingPost,       setEditingPost]       = useState(null);
  const [selectedPost,      setSelectedPost]      = useState(null);
  const [showViewModal,     setShowViewModal]     = useState(false);
  const [commentText,       setCommentText]       = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likingPost,        setLikingPost]        = useState(null);
  const [activeTab,         setActiveTab]         = useState('all');
  const [categoryFilter,    setCategoryFilter]    = useState('');
  const [lightbox,          setLightbox]          = useState(null);
  const [currentPage,       setCurrentPage]       = useState(1);
  const [formData,          setFormData]          = useState({ title:'', content:'', category:'announcement', image:null, status:'draft', isPinned:false });
  const [imagePreview,      setImagePreview]      = useState(null);

  const POSTS_PER_PAGE = 8;
  const FF = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,sans-serif';

  const openLightbox  = useCallback((src, alt) => setLightbox({ src, alt }), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  // ── Fetch ──
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      let url = `${API_URL}/api/posts?`;
      if (categoryFilter) url += `category=${categoryFilter}&`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, [categoryFilter]);

  // ── Form helpers ──
  const resetForm = () => {
    setFormData({ title:'', content:'', category:'announcement', image:null, status:'draft', isPinned:false });
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData(f => ({ ...f, image:file }));
    const r = new FileReader();
    r.onloadend = () => setImagePreview(r.result);
    r.readAsDataURL(file);
  };

  const removeImage = () => { setFormData(f => ({ ...f, image:null })); setImagePreview(null); };

  // ── CRUD ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const body  = new FormData();
      body.append('title',    formData.title);
      body.append('content',  formData.content);
      body.append('category', formData.category);
      body.append('status',   formData.status);
      body.append('isPinned', formData.isPinned);
      if (formData.image) body.append('image', formData.image);
      const url    = editingPost ? `${API_URL}/api/posts/${editingPost._id}` : `${API_URL}/api/posts`;
      const method = editingPost ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body });
      if (!res.ok) throw new Error('Failed to save post');
      await fetchPosts();
      setShowCreateModal(false); setEditingPost(null); resetForm();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res   = await fetch(`${API_URL}/api/posts/${postId}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to delete post');
      await fetchPosts();
      if (selectedPost?._id === postId) { setShowViewModal(false); setSelectedPost(null); }
    } catch (err) { setError(err.message); }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({ title:post.title, content:post.content, category:post.category, image:null, status:post.status, isPinned:post.isPinned });
    setImagePreview(post.image || null);
    setShowCreateModal(true);
    if (showViewModal) setShowViewModal(false);
  };

  // ── View — with fallback to existing post data if API call fails ──
  const handleView = async (post) => {
    // Show modal immediately with data we already have
    setSelectedPost(post);
    setShowViewModal(true);
    setCommentText('');

    // Then try to fetch full details (with comments, accurate view count, etc.)
    try {
      const token = localStorage.getItem('adminToken');
      const res   = await fetch(`${API_URL}/api/posts/${post._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return; // silently keep the data we already showed
      const data = await res.json();
      // Support both { post: {...} } and direct object responses
      const fullPost = data.post || data;
      if (fullPost && fullPost._id) setSelectedPost(fullPost);
    } catch {
      // Network error — modal already open with list data, so just continue
    }
  };

  const handleLike = async (postId) => {
    try {
      setLikingPost(postId);
      const token = localStorage.getItem('adminToken');
      const res   = await fetch(`${API_URL}/api/posts/${postId}/like`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to like/unlike post');
      const data  = await res.json();
      const patch = (p) => p._id === postId
        ? { ...p, likes: data.liked ? [...(p.likes||[]), currentUser?._id] : (p.likes||[]).filter(id => id !== currentUser?._id), likeCount: data.likes }
        : p;
      setPosts(prev => prev.map(patch));
      if (selectedPost?._id === postId) setSelectedPost(prev => patch(prev));
    } catch (err) { setError(err.message); }
    finally { setLikingPost(null); }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      setSubmittingComment(true);
      const token = localStorage.getItem('adminToken');
      const res   = await fetch(`${API_URL}/api/posts/${selectedPost._id}/comment`, {
        method:'POST',
        headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ content:commentText }),
      });
      if (!res.ok) throw new Error('Failed to add comment');
      const data = await res.json();
      setSelectedPost(prev => ({ ...prev, comments:[...(prev.comments||[]), data.comment], commentCount:(prev.comments?.length||0)+1 }));
      setCommentText('');
    } catch (err) { setError(err.message); }
    finally { setSubmittingComment(false); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res   = await fetch(`${API_URL}/api/posts/${selectedPost._id}/comment/${commentId}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to delete comment');
      setSelectedPost(prev => ({ ...prev, comments:prev.comments.filter(c => c._id !== commentId), commentCount:(prev.comments?.length||1)-1 }));
    } catch (err) { setError(err.message); }
  };

  // ── Helpers ──
  const isAdmin          = () => ['southadmin','centraladmin','superadmin','admin'].includes(adminRole);
  const hasUserLiked     = (p) => p.likes?.includes(currentUser?._id);
  const canDeleteComment = (uid) => currentUser?._id === uid || isAdmin();

  const getBarangayName = () => {
    if (adminRole === 'southadmin')   return 'South Signal Village';
    if (adminRole === 'centraladmin') return 'Central Bicutan';
    return 'Community';
  };

  // ── Tabs ──
  const TABS = [
    { key:'all',       label:'All' },
    { key:'published', label:'Published' },
    { key:'draft',     label:'Drafts' },
    { key:'pinned',    label:'Pinned' },
  ];

  const filteredPosts = posts.filter(p => {
    if (activeTab === 'published') return p.status === 'published';
    if (activeTab === 'draft')     return p.status === 'draft';
    if (activeTab === 'pinned')    return p.isPinned;
    return true;
  });

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const pagedPosts = filteredPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  const tabCounts = {
    all:       posts.length,
    published: posts.filter(p => p.status === 'published').length,
    draft:     posts.filter(p => p.status === 'draft').length,
    pinned:    posts.filter(p => p.isPinned).length,
  };

  // ── Quick actions ──
  const QUICK_ACTIONS = [
    { icon:<Icons.Edit size={22}/>,    label:'Edit Post',     sub:'Update your content,\nmedia or settings.',   action:() => selectedPost ? handleEdit(selectedPost) : null, enabled:!!selectedPost },
    { icon:<Icons.Clock size={22}/>,   label:'Schedule Post', sub:'Plan your posts\nfor the best time.',        action:() => {}, enabled:true },
    { icon:<Icons.BarChart size={22}/>,label:'View Insights', sub:'Track performance\nand engagement.',         action:() => {}, enabled:true },
    { icon:<Icons.Trash size={22}/>,   label:'Delete Post',   sub:'Remove posts you\nno longer need.',          action:() => selectedPost ? handleDelete(selectedPost._id) : null, enabled:!!selectedPost, danger:true },
  ];

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:280, gap:10, color:'#8A8A8A', fontFamily:FF }}>
      <Icons.Loader size={26} style={{ animation:'spin 1s linear infinite', color:'#1877F2' }}/>
      <span style={{ fontSize:13 }}>Loading posts…</span>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ background:'#F4F6F8', minHeight:'100vh', fontFamily:FF }}>
      <style>{`
        @keyframes spin    { from{transform:rotate(0)}    to{transform:rotate(360deg)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .pm-modal { scrollbar-width:thin; }
        .tab-btn  { background:none; border:none; cursor:pointer; padding:10px 18px; font-size:14px; font-weight:600; color:#65676B; border-bottom:2.5px solid transparent; transition:all .15s; white-space:nowrap; }
        .tab-btn.active   { color:#1877F2; border-bottom-color:#1877F2; }
        .tab-btn:hover:not(.active) { color:#1C1E21; }
        .pg-btn { width:32px; height:32px; border-radius:8px; border:1.5px solid #E4E6EB; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:600; color:#65676B; transition:all .15s; }
        .pg-btn:hover  { border-color:#1877F2; color:#1877F2; }
        .pg-btn.active { background:#1877F2; color:#fff; border-color:#1877F2; }
        .qa-card { display:flex; flex-direction:column; align-items:center; gap:8px; padding:16px 12px; background:#fff; border-radius:12px; border:1.5px solid #E4E6EB; cursor:pointer; transition:all .15s; flex:1; min-width:0; }
        .qa-card:hover { border-color:#1877F2; box-shadow:0 2px 10px rgba(24,119,242,.1); transform:translateY(-1px); }
        .qa-card.disabled { opacity:0.5; cursor:not-allowed; }
        .qa-card.disabled:hover { border-color:#E4E6EB; transform:none; box-shadow:none; }
        .qa-card.danger:hover { border-color:#DC2626; box-shadow:0 2px 10px rgba(220,38,38,.1); }
      `}</style>

      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={closeLightbox}/>}

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 20px' }}>

        {/* ── Page header ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:'#1C1E21' }}>Posts</h1>
            <p style={{ margin:'2px 0 0', fontSize:13, color:'#65676B' }}>Manage your {getBarangayName()} announcements</p>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              style={{ ...inputStyle, width:'auto', padding:'8px 32px 8px 12px', fontSize:13, fontWeight:600, appearance:'none', cursor:'pointer', background:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2365676B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") right 10px center no-repeat #fff`, border:'1.5px solid #E4E6EB', borderRadius:8 }}>
              <option value="">All Categories</option>
              {Object.entries(CATEGORY).map(([v,{label}]) => <option key={v} value={v}>{label}</option>)}
            </select>
            {isAdmin() && (
              <button onClick={() => { setEditingPost(null); resetForm(); setShowCreateModal(true); }}
                style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#1877F2', color:'#fff', border:'none', padding:'9px 16px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:700, boxShadow:'0 1px 4px rgba(24,119,242,.35)' }}>
                <Icons.Plus size={14}/> Create Post
              </button>
            )}
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#FEE2E2', color:'#DC2626', padding:'9px 14px', borderRadius:10, marginBottom:14, fontSize:13 }}>
            <span style={{ display:'flex', alignItems:'center', gap:6 }}><Icons.AlertTriangle size={13}/>{error}</span>
            <button onClick={() => setError(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626' }}><Icons.X size={13}/></button>
          </div>
        )}

        {/* ── Main table card ── */}
        <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 4px rgba(0,0,0,.08)', overflow:'hidden', marginBottom:20 }}>

          {/* Tabs */}
          <div style={{ display:'flex', alignItems:'center', borderBottom:'1.5px solid #F0F2F5', padding:'0 8px', overflowX:'auto' }}>
            {TABS.map(tab => (
              <button key={tab.key} className={`tab-btn${activeTab===tab.key?' active':''}`}
                onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}>
                {tab.label}
                {tabCounts[tab.key] > 0 && (
                  <span style={{ marginLeft:6, background:activeTab===tab.key?'#E7F0FD':'#F0F2F5', color:activeTab===tab.key?'#1877F2':'#65676B', fontSize:11, fontWeight:700, padding:'1px 6px', borderRadius:10 }}>
                    {tabCounts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Column headers - FIXED ALIGNMENT */}
          <div style={{ display:'flex', alignItems:'center', padding:'10px 20px', background:'#F8F9FA', borderBottom:'1px solid #F0F2F5' }}>
            <div style={{ width:88, flexShrink:0, textAlign:'left' }}/>
            <div style={{ flex:1, textAlign:'left', fontSize:11, fontWeight:700, color:'#8A8A8A', textTransform:'uppercase', letterSpacing:'0.05em' }}>Post</div>
            <div style={{ width:80, textAlign:'center', fontSize:11, fontWeight:700, color:'#8A8A8A', textTransform:'uppercase', letterSpacing:'0.05em' }}>Reach</div>
            <div style={{ width:110, textAlign:'center', fontSize:11, fontWeight:700, color:'#8A8A8A', textTransform:'uppercase', letterSpacing:'0.05em' }}>Engagement</div>
            {isAdmin() && <div style={{ width:40, flexShrink:0 }}/>}
          </div>

          {/* Post rows */}
          {pagedPosts.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 24px' }}>
              <Icons.FileText size={44} style={{ color:'#BCC0C4', display:'block', margin:'0 auto 12px' }}/>
              <p style={{ margin:0, fontSize:15, fontWeight:700, color:'#1C1E21' }}>No posts here yet</p>
              <p style={{ margin:'4px 0 0', fontSize:13, color:'#65676B' }}>Try a different tab or create your first post.</p>
            </div>
          ) : (
            <div style={{ animation:'fadeIn .25s ease' }}>
              {pagedPosts.map(post => {
                const cat        = getCat(post.category);
                const likeCount  = post.likeCount  || post.likes?.length    || 0;
                const cmtCount   = post.commentCount || post.comments?.length || 0;
                const views      = post.views || 0;
                const adminRole_ = getAdminRole(post);
                const adminName  = getAdminDisplayName(post);

                return (
                  <div key={post._id} style={{ display:'flex', alignItems:'center', padding:'14px 20px', borderBottom:'1px solid #F4F6F8', transition:'background .12s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#FAFBFC'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>

                    {/* Thumbnail */}
                    <div style={{ width:72, height:56, borderRadius:8, overflow:'hidden', flexShrink:0, marginRight:16, background:'#F0F2F5', display:'flex', alignItems:'center', justifyContent:'center', cursor:post.image?'zoom-in':'default' }}
                      onClick={() => post.image && openLightbox(post.image, post.title)}>
                      {post.image
                        ? <img src={post.image} alt={post.title} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                        : <cat.Icon size={22} style={{ color:cat.color }}/>
                      }
                    </div>

                    {/* Info - FIXED LEFT ALIGNMENT */}
                    <div style={{ flex:1, minWidth:0, marginRight:16, cursor:'pointer', textAlign:'left' }} onClick={() => handleView(post)}>
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3, flexWrap:'wrap', justifyContent:'flex-start' }}>
                        {post.isPinned && (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:3, background:'#FEF3C7', color:'#92400E', padding:'1px 5px', borderRadius:20, fontSize:10, fontWeight:700 }}>
                            <Icons.Pin size={8}/> Pinned
                          </span>
                        )}
                        {post.status === 'draft' && isAdmin() && (
                          <span style={{ background:'#F3F4F6', color:'#6B7280', padding:'1px 6px', borderRadius:20, fontSize:10, fontWeight:700 }}>Draft</span>
                        )}
                        <CatBadge category={post.category}/>
                      </div>
                      <div style={{ fontWeight:700, fontSize:14, color:'#1C1E21', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:2, textAlign:'left' }}>
                        {post.title}
                      </div>
                      <div style={{ fontSize:12, color:'#65676B', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:4, textAlign:'left' }}>
                        {post.content.slice(0,100)}{post.content.length > 100 ? '…' : ''}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:5, justifyContent:'flex-start' }}>
                        <Avatar role={adminRole_} adminName={adminName} size={16}/>
                        <span style={{ fontSize:11, color:'#8A8A8A' }}>{adminName}</span>
                        <span style={{ color:'#D0D3D9', fontSize:9 }}>·</span>
                        <Icons.Calendar size={10} style={{ color:'#8A8A8A' }}/>
                        <span style={{ fontSize:11, color:'#8A8A8A' }}>{fmtDate(post.createdAt)}</span>
                      </div>
                    </div>

                    {/* Reach - CENTER ALIGNED */}
                    <div style={{ width:80, textAlign:'center', flexShrink:0 }}>
                      <div style={{ fontSize:16, fontWeight:800, color:'#1C1E21' }}>
                        {views >= 1000 ? `${(views/1000).toFixed(1)}K` : views}
                      </div>
                      <div style={{ fontSize:11, color:'#8A8A8A' }}>views</div>
                    </div>

                    {/* Engagement - CENTER ALIGNED */}
                    <div style={{ width:110, textAlign:'center', flexShrink:0 }}>
                      <div style={{ fontSize:16, fontWeight:800, color:'#1C1E21' }}>{likeCount + cmtCount}</div>
                      <div style={{ fontSize:11, color:'#8A8A8A', display:'flex', justifyContent:'center', alignItems:'center', gap:6, marginTop:1 }}>
                        <span style={{ display:'flex', alignItems:'center', gap:2 }}><Icons.HeartFilled size={10} style={{ color:'#E0245E' }}/>{likeCount}</span>
                        <span style={{ display:'flex', alignItems:'center', gap:2 }}><Icons.MessageSquare size={10} style={{ color:'#1877F2' }}/>{cmtCount}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {isAdmin() && (
                      <PostRowActions
                        post={post}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:6, padding:'16px 20px', borderTop:'1px solid #F0F2F5' }}>
              <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}>
                <Icons.ChevronLeft size={14}/>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pg = i + 1;
                if (totalPages > 5 && currentPage > 3) pg = currentPage - 2 + i;
                if (pg > totalPages) return null;
                return (
                  <button key={pg} className={`pg-btn${currentPage===pg?' active':''}`} onClick={() => setCurrentPage(pg)}>
                    {pg}
                  </button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && <span style={{ color:'#8A8A8A', fontSize:13 }}>…</span>}
              {totalPages > 5 && currentPage < totalPages - 1 && (
                <button className={`pg-btn${currentPage===totalPages?' active':''}`} onClick={() => setCurrentPage(totalPages)}>
                  {totalPages}
                </button>
              )}
              <button className="pg-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}>
                <Icons.ChevronRight size={14}/>
              </button>
            </div>
          )}
        </div>

        {/* ── Quick Actions bar - FIXED FUNCTIONALITY ── */}
        <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 4px rgba(0,0,0,.08)', padding:'20px 24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:'#1C1E21' }}>Manage your posts</h3>
            {selectedPost && (
              <span style={{ fontSize:11, color:'#65676B', background:'#F0F2F5', padding:'4px 8px', borderRadius:20 }}>
                Selected: "{selectedPost.title?.slice(0,30)}"
              </span>
            )}
          </div>
          <div style={{ display:'flex', gap:12 }}>
            {QUICK_ACTIONS.map((qa, i) => (
              <div 
                key={i} 
                className={`qa-card${qa.danger?' danger':''}${!qa.enabled ? ' disabled' : ''}`} 
                onClick={() => qa.enabled && qa.action && qa.action()}
                style={{ cursor: qa.enabled ? 'pointer' : 'not-allowed', opacity: qa.enabled ? 1 : 0.5 }}
              >
                <div style={{ width:44, height:44, borderRadius:12, background:qa.danger?'#FEE2E2':'#E7F0FD', display:'flex', alignItems:'center', justifyContent:'center', color:qa.danger?'#DC2626':'#1877F2' }}>
                  {qa.icon}
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:qa.danger?'#DC2626':'#1C1E21', marginBottom:2 }}>{qa.label}</div>
                  <div style={{ fontSize:11, color:'#8A8A8A', lineHeight:1.4, whiteSpace:'pre-line' }}>{qa.sub}</div>
                  {!qa.enabled && qa.label === 'Edit Post' && (
                    <div style={{ fontSize:10, color:'#DC2626', marginTop:4 }}>Select a post first</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════ CREATE / EDIT MODAL - FIXED ALIGNMENT ════════════ */}
      {showCreateModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:12 }}
          onClick={() => setShowCreateModal(false)}>
          <div className="pm-modal" onClick={e => e.stopPropagation()}
            style={{ background:'#fff', borderRadius:14, padding:22, width:'100%', maxWidth:540, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 8px 40px rgba(0,0,0,.22)', fontFamily:FF, textAlign:'left' }}>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, paddingBottom:14, borderBottom:'1px solid #E4E6EB' }}>
              <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:'#1C1E21' }}>
                {editingPost ? 'Edit Post' : 'Create Announcement'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background:'#F0F2F5', border:'none', cursor:'pointer', color:'#65676B', borderRadius:'50%', width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icons.X size={15}/>
              </button>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:16 }}>
              <Avatar role={adminRole} adminName={currentUser?.fullName||currentUser?.username||'Admin'} size={38}/>
              <div>
                <span style={{ fontWeight:700, fontSize:13, color:'#1C1E21' }}>{currentUser?.fullName||currentUser?.username||'Admin'}</span>
                <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:1 }}>
                  <Icons.Globe size={10} style={{ color:'#65676B' }}/>
                  <span style={{ fontSize:11, color:'#65676B' }}>{getBarangayName()}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:12 }}>
                <Label>Title *</Label>
                <input type="text" value={formData.title} required placeholder="What's the announcement about?"
                  onChange={e => setFormData(f => ({...f, title:e.target.value}))} style={inputStyle}/>
              </div>
              <div style={{ marginBottom:12 }}>
                <Label>Content *</Label>
                <textarea value={formData.content} required rows={5} placeholder="Share details with residents…"
                  onChange={e => setFormData(f => ({...f, content:e.target.value}))}
                  style={{...inputStyle, resize:'vertical', lineHeight:1.6}}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                <div>
                  <Label>Category</Label>
                  <select value={formData.category} onChange={e => setFormData(f => ({...f, category:e.target.value}))} style={{...inputStyle, cursor:'pointer'}}>
                    {Object.entries(CATEGORY).map(([v,{label}]) => <option key={v} value={v}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Status</Label>
                  <select value={formData.status} onChange={e => setFormData(f => ({...f, status:e.target.value}))} style={{...inputStyle, cursor:'pointer'}}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <Label>Photo / Image (optional)</Label>
                <label style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 12px', border:'1.5px dashed #BCC0C4', borderRadius:8, cursor:'pointer', background:'#F8F8F8' }}>
                  <Icons.Image size={16} style={{ color:'#65676B' }}/>
                  <span style={{ fontSize:13, color:'#65676B' }}>{formData.image ? formData.image.name : 'Add a photo to your post'}</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display:'none' }}/>
                </label>
                {imagePreview && (
                  <div style={{ marginTop:8, position:'relative', display:'inline-block' }}>
                    <img src={imagePreview} alt="Preview"
                      style={{ width:110, height:80, objectFit:'cover', borderRadius:6, border:'1px solid #E4E6EB', cursor:'zoom-in' }}
                      onClick={() => openLightbox(imagePreview, 'Preview')}/>
                    <button type="button" onClick={removeImage}
                      style={{ position:'absolute', top:-7, right:-7, background:'#DC2626', color:'#fff', border:'none', borderRadius:'50%', width:20, height:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>
                      <Icons.X size={10}/>
                    </button>
                  </div>
                )}
              </div>
              <div style={{ marginBottom:16, padding:'10px 12px', background:'#F0F2F5', borderRadius:8, textAlign:'left' }}>
                <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}
                  onClick={() => setFormData(f => ({...f, isPinned:!f.isPinned}))}>
                  <div style={{ width:36, height:20, background:formData.isPinned?'#1877F2':'#BCC0C4', borderRadius:10, position:'relative', transition:'background .2s', flexShrink:0 }}>
                    <div style={{ position:'absolute', top:2, left:formData.isPinned?18:2, width:16, height:16, background:'#fff', borderRadius:'50%', transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.3)' }}/>
                  </div>
                  <div>
                    <span style={{ fontSize:13, fontWeight:700, color:'#1C1E21', display:'flex', alignItems:'center', gap:5 }}><Icons.Pin size={13}/> Pin to top</span>
                    <span style={{ fontSize:11, color:'#65676B', display:'block' }}>Pinned posts stay at the top of the feed</span>
                  </div>
                </label>
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:14, borderTop:'1px solid #E4E6EB' }}>
                <button type="button" onClick={() => setShowCreateModal(false)}
                  style={{ padding:'8px 16px', borderRadius:8, border:'1.5px solid #E4E6EB', background:'#fff', color:'#65676B', cursor:'pointer', fontSize:13, fontWeight:700 }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ padding:'8px 20px', borderRadius:8, border:'none', background:'#1877F2', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>
                  {editingPost ? 'Save Changes' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════ VIEW MODAL - FIXED ALIGNMENT ════════════ */}
      {showViewModal && selectedPost && (() => {
        const adminRoleFromPost = getAdminRole(selectedPost);
        const adm       = getAdm(adminRoleFromPost);
        const adminName = getAdminDisplayName(selectedPost);
        const liked     = hasUserLiked(selectedPost);
        const likeCount = selectedPost.likeCount || selectedPost.likes?.length || 0;
        return (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:12 }}
            onClick={() => setShowViewModal(false)}>
            <div className="pm-modal" onClick={e => e.stopPropagation()}
              style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:600, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 8px 40px rgba(0,0,0,.22)', fontFamily:FF, textAlign:'left' }}>

              {selectedPost.isPinned && (
                <div style={{ background:'#FEF3C7', padding:'6px 18px', fontSize:11, fontWeight:700, color:'#92400E', display:'flex', alignItems:'center', gap:5 }}>
                  <Icons.Pin size={10}/> Pinned Post
                </div>
              )}

              <div style={{ padding:18 }}>
                {/* Author row */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div style={{ display:'flex', gap:9, alignItems:'center' }}>
                    <Avatar role={adminRoleFromPost} adminName={adminName} size={42}/>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                        <span style={{ fontWeight:700, fontSize:14, color:'#1C1E21' }}>{adminName}</span>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:3, background:adm.bg, color:adm.color, padding:'1px 6px', borderRadius:10, fontSize:11, fontWeight:700 }}>
                          <adm.Icon size={9}/> {adm.label}
                        </span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                        <span style={{ fontSize:11, color:'#65676B' }}>{fmtFull(selectedPost.createdAt)}</span>
                        <span style={{ color:'#BCC0C4', fontSize:9 }}>·</span>
                        <CatBadge category={selectedPost.category}/>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    {isAdmin() && (
                      <>
                        <button onClick={() => { setShowViewModal(false); handleEdit(selectedPost); }}
                          style={{ background:'#F0F2F5', border:'none', cursor:'pointer', color:'#65676B', borderRadius:8, padding:'6px 10px', display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:600 }}>
                          <Icons.Edit size={13}/> Edit
                        </button>
                        <button onClick={() => handleDelete(selectedPost._id)}
                          style={{ background:'#FEE2E2', border:'none', cursor:'pointer', color:'#DC2626', borderRadius:8, padding:'6px 10px', display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:600 }}>
                          <Icons.Trash size={13}/> Delete
                        </button>
                      </>
                    )}
                    <button onClick={() => setShowViewModal(false)}
                      style={{ background:'#F0F2F5', border:'none', cursor:'pointer', color:'#65676B', borderRadius:'50%', width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Icons.X size={15}/>
                    </button>
                  </div>
                </div>

                <h2 style={{ margin:'0 0 8px', fontSize:18, fontWeight:800, color:'#1C1E21', lineHeight:1.3, textAlign:'left' }}>{selectedPost.title}</h2>
                <p style={{ margin:'0 0 12px', fontSize:14, color:'#3E4147', lineHeight:1.7, whiteSpace:'pre-wrap', textAlign:'left' }}>{selectedPost.content}</p>

                {selectedPost.image && (
                  <div style={{ borderRadius:10, overflow:'hidden', marginBottom:12, cursor:'zoom-in' }}
                    onClick={() => openLightbox(selectedPost.image, selectedPost.title)}>
                    <img src={selectedPost.image} alt={selectedPost.title} style={{ width:'100%', maxHeight:320, objectFit:'cover', display:'block' }}/>
                  </div>
                )}

                <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderTop:'1px solid #E4E6EB', borderBottom:'1px solid #E4E6EB', marginBottom:4 }}>
                  {likeCount > 0 && (
                    <span style={{ fontSize:13, color:'#65676B', display:'flex', alignItems:'center', gap:4 }}>
                      <Icons.HeartFilled size={13} style={{ color:'#E0245E' }}/>{likeCount} like{likeCount!==1?'s':''}
                    </span>
                  )}
                  <span style={{ fontSize:13, color:'#65676B', marginLeft:'auto', display:'flex', alignItems:'center', gap:4 }}>
                    <Icons.Eye size={12}/>{selectedPost.views || 0} views
                  </span>
                </div>

                <div style={{ display:'flex', padding:'2px 0 10px', gap:2, borderBottom:'1px solid #E4E6EB' }}>
                  <ReactionBtn
                    icon={liked ? <Icons.HeartFilled size={16} style={{ color:'#E0245E' }}/> : <Icons.HeartOutline size={16}/>}
                    label={liked?'Liked':'Like'} count={0} active={liked} color="#E0245E"
                    onClick={() => handleLike(selectedPost._id)}
                    loading={likingPost === selectedPost._id}
                  />
                  <ReactionBtn icon={<Icons.MessageSquare size={16}/>} label="Comment" count={0} active={false} color="#1877F2" onClick={() => {}}/>
                </div>

                {/* Comments - FIXED LEFT ALIGNMENT */}
                {selectedPost.comments?.length > 0 && (
                  <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:6 }}>
                    {selectedPost.comments.map((comment, idx) => (
                      <div key={comment._id || idx} style={{ display:'flex', gap:8, alignItems:'flex-start', textAlign:'left' }}>
                        <Avatar role={comment.user?.role} adminName={comment.user?.fullName||comment.user?.username} size={30}/>
                        <div style={{ flex:1, background:'#F0F2F5', borderRadius:10, padding:'7px 10px' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                            <span style={{ fontWeight:700, fontSize:12, color:'#1C1E21' }}>{comment.user?.fullName||comment.user?.username||'User'}</span>
                            {canDeleteComment(comment.user?._id) && (
                              <button onClick={() => handleDeleteComment(comment._id)}
                                style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', display:'inline-flex', alignItems:'center', gap:2, padding:'2px 4px', borderRadius:4, fontSize:11 }}>
                                <Icons.Trash size={9}/>
                              </button>
                            )}
                          </div>
                          <p style={{ margin:0, fontSize:13, color:'#3E4147', lineHeight:1.5, textAlign:'left' }}>{comment.content}</p>
                          <span style={{ fontSize:10, color:'#BCC0C4', marginTop:3, display:'block', textAlign:'left' }}>{timeAgo(comment.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment - FIXED LEFT ALIGNMENT */}
                <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:12 }}>
                  <Avatar role={adminRole} adminName={currentUser?.fullName||currentUser?.username} size={32}/>
                  <div style={{ flex:1, display:'flex', gap:6, alignItems:'flex-end', background:'#F0F2F5', borderRadius:20, padding:'7px 10px' }}>
                    <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
                      placeholder="Write a comment…" rows={1}
                      style={{ flex:1, background:'none', border:'none', outline:'none', resize:'none', fontSize:13, color:'#1C1E21', fontFamily:FF, lineHeight:1.5, minHeight:20 }}
                      onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); handleAddComment(); } }}/>
                    <button onClick={handleAddComment} disabled={submittingComment||!commentText.trim()}
                      style={{ background:'none', border:'none', cursor:commentText.trim()?'pointer':'default', color:commentText.trim()?'#1877F2':'#BCC0C4', flexShrink:0, padding:0 }}>
                      {submittingComment
                        ? <Icons.Loader size={16} style={{ animation:'spin 1s linear infinite' }}/>
                        : <Icons.Send size={16}/>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Post;