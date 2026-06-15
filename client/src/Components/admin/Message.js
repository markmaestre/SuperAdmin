import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../Utils/Api';

/* ─── THEME TOKENS ───────────────────────────────────────────── */
const light = {
  bg:          '#F8FAFC',
  surface:     '#FFFFFF',
  surface2:    '#F1F5F9',
  surface3:    '#E2E8F0',
  border:      'rgba(15,23,42,0.08)',
  border2:     'rgba(15,23,42,0.05)',
  accent:      '#3B82F6',
  accentBg:    'rgba(59,130,246,0.08)',
  accentBdr:   'rgba(59,130,246,0.2)',
  green:       '#16A34A',
  greenBg:     'rgba(22,163,74,0.08)',
  red:         '#DC2626',
  redBg:       'rgba(220,38,38,0.08)',
  amber:       '#D97706',
  text:        '#0F172A',
  textSub:     '#475569',
  textMuted:   '#94A3B8',
  shadow:      '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
  shadowMd:    '0 4px 12px rgba(15,23,42,0.08)',
  sentBubble:  '#3B82F6',
  sentText:    '#FFFFFF',
  recvBubble:  '#FFFFFF',
  recvText:    '#0F172A',
};

const dark = {
  bg:          '#0D1117',
  surface:     '#161B22',
  surface2:    '#21262D',
  surface3:    '#30363D',
  border:      'rgba(255,255,255,0.08)',
  border2:     'rgba(255,255,255,0.04)',
  accent:      '#58A6FF',
  accentBg:    'rgba(88,166,255,0.1)',
  accentBdr:   'rgba(88,166,255,0.25)',
  green:       '#3FB950',
  greenBg:     'rgba(63,185,80,0.1)',
  red:         '#F85149',
  redBg:       'rgba(248,81,73,0.1)',
  amber:       '#E3B341',
  text:        '#E6EDF3',
  textSub:     '#8B949E',
  textMuted:   '#484F58',
  shadow:      '0 1px 3px rgba(0,0,0,0.3)',
  shadowMd:    '0 4px 16px rgba(0,0,0,0.4)',
  sentBubble:  '#1F6FEB',
  sentText:    '#FFFFFF',
  recvBubble:  '#21262D',
  recvText:    '#E6EDF3',
};

/* ─── CSS ────────────────────────────────────────────────────── */
const buildCSS = (t) => `
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.msg-root {
  font-family: 'Geist', 'Inter', system-ui, sans-serif;
  background: ${t.bg};
  color: ${t.text};
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  min-height: 600px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid ${t.border};
  box-shadow: ${t.shadowMd};
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: ${t.textMuted}; }

@keyframes slideUp   { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
@keyframes spin      { to { transform:rotate(360deg); } }
@keyframes pulse     { 0%,100% { opacity:1; } 50% { opacity:.5; } }
@keyframes msgIn     { from { opacity:0; transform:scale(.95) translateY(4px); } to { opacity:1; transform:scale(1) translateY(0); } }
@keyframes shimmer   { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }

.conv-item {
  display: flex; align-items: center; gap: 11px;
  padding: 11px 14px; cursor: pointer;
  border-bottom: 1px solid ${t.border2};
  transition: background 0.12s; position: relative;
  animation: slideUp 0.25s ease both;
}
.conv-item:hover { background: ${t.surface2}; }
.conv-item.active { background: ${t.accentBg}; }
.conv-item.active::before {
  content: ''; position: absolute; left: 0; top: 8px; bottom: 8px;
  width: 3px; background: ${t.accent}; border-radius: 0 3px 3px 0;
}

.msg-bubble { animation: msgIn 0.18s ease both; max-width: 100%; word-break: break-word; }
.msg-row { display: flex; align-items: flex-end; gap: 7px; margin-bottom: 8px; }
.msg-row.sent  { justify-content: flex-end; }
.msg-row.recv  { justify-content: flex-start; }
.msg-row:hover .msg-actions { opacity: 1 !important; }

.msg-input {
  flex: 1; background: ${t.surface2};
  border: 1px solid ${t.border}; border-radius: 12px;
  color: ${t.text}; font-family: inherit; font-size: 13.5px;
  padding: 10px 14px; outline: none; transition: border-color 0.15s;
  resize: none; line-height: 1.5;
}
.msg-input:focus { border-color: ${t.accent}; }
.msg-input::placeholder { color: ${t.textMuted}; }

.send-btn {
  display: flex; align-items: center; justify-content: center;
  width: 42px; height: 42px; background: ${t.accent};
  border: none; border-radius: 11px; color: #fff; cursor: pointer;
  transition: opacity 0.15s, transform 0.1s; flex-shrink: 0;
}
.send-btn:hover:not(:disabled) { opacity: .88; transform: scale(1.04); }
.send-btn:active:not(:disabled) { transform: scale(.96); }
.send-btn:disabled { opacity: .4; cursor: not-allowed; }

.search-input {
  width: 100%; background: ${t.surface2};
  border: 1px solid ${t.border}; border-radius: 9px;
  color: ${t.text}; font-family: inherit; font-size: 12.5px;
  padding: 8px 11px 8px 32px; outline: none; transition: border-color 0.15s;
}
.search-input:focus { border-color: ${t.accent}; }
.search-input::placeholder { color: ${t.textMuted}; }

.badge {
  font-size: 10px; font-weight: 600;
  border-radius: 6px; padding: 2px 6px;
  letter-spacing: 0.02em; white-space: nowrap;
}

.skeleton {
  background: linear-gradient(90deg, ${t.surface2} 25%, ${t.surface3} 50%, ${t.surface2} 75%);
  background-size: 400px 100%; animation: shimmer 1.5s infinite; border-radius: 6px;
}

.icon-btn {
  background: none; border: 1px solid ${t.border}; border-radius: 8px;
  color: ${t.textSub}; cursor: pointer; display: flex; align-items: center;
  justify-content: center; padding: 7px; transition: all 0.12s;
}
.icon-btn:hover { background: ${t.surface2}; border-color: ${t.border}; color: ${t.text}; }
.icon-btn.danger:hover { background: ${t.redBg}; border-color: ${t.red}33; color: ${t.red}; }

.theme-btn {
  background: ${t.surface2}; border: 1px solid ${t.border}; border-radius: 20px;
  color: ${t.textSub}; cursor: pointer; display: flex; align-items: center;
  gap: 5px; padding: 5px 10px; font-size: 12px; font-family: inherit;
  transition: all 0.12s;
}
.theme-btn:hover { background: ${t.surface3}; color: ${t.text}; }

.filter-select {
  width: 100%; background: ${t.surface2}; border: 1px solid ${t.border};
  border-radius: 8px; color: ${t.text}; font-family: inherit; font-size: 12px;
  padding: 7px 10px; outline: none; cursor: pointer; margin-bottom: 10px;
}

.attachment-preview {
  display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;
}
.attachment-img {
  width: 80px; height: 80px; border-radius: 8px;
  object-fit: cover; border: 1px solid ${t.border};
  cursor: pointer;
}
.attachment-doc {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: ${t.surface2};
  border-radius: 8px; border: 1px solid ${t.border};
  cursor: pointer;
  text-decoration: none;
}
.msg-attachments {
  display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;
}
.msg-image {
  max-width: 200px; max-height: 150px; border-radius: 12px;
  cursor: pointer; border: 1px solid ${t.border};
}
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.9); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
}
.modal-image {
  max-width: 90vw; max-height: 90vh;
  object-fit: contain;
}
.modal-close {
  position: absolute; top: 20px; right: 20px;
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px; color: white; width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.15s;
}
.modal-close:hover { background: rgba(255,255,255,0.2); }
.msg-actions {
  display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s;
}
.remove-file-btn {
  position: absolute; top: -8px; right: -8px;
  background: ${t.red}; color: white;
  border: none; border-radius: 50%;
  width: 20px; height: 20px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: opacity 0.15s;
}
.remove-file-btn:hover { opacity: 0.85; }
`;

/* ─── SVG ICONS ──────────────────────────────────────────────── */
const Ic = ({ d, size = 16, color = 'currentColor', sw = 1.8, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ display:'block', flexShrink:0 }}>
    {Array.isArray(d) ? d.map((p,i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);

const P = {
  msg:        "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  send:       "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  search:     "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  trash:      ["M3 6h18","M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"],
  check:      "M20 6L9 17l-5-5",
  checks:     ["M18 6L7 17l-4-4","M22 10l-5 5-2-2"],
  x:          ["M18 6L6 18","M6 6l12 12"],
  alert:      ["M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z","M12 9v4","M12 17h.01"],
  pin:        ["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z","M12 13a3 3 0 100-6 3 3 0 000 6z"],
  spin:       "M21 12a9 9 0 11-6.2-8.6",
  moon:       ["M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"],
  sun:        ["M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42","M12 17a5 5 0 100-10 5 5 0 000 10z"],
  refresh:    "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  inbox:      ["M22 12h-6l-2 3h-4l-2-3H2","M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"],
  attach:     ["M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"],
  edit:       ["M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7","M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"],
  file:       ["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z","M14 2v6h6","M16 13H8","M16 17H8","M10 9H8"],
  image:      ["M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2h18a2 2 0 012 2v14z","M23 15l-4-4-6 6-4-4-6 6","M6.5 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"],
  noSearch:   ["M10 10m-7 0a7 7 0 1014 0 7 7 0 10-14 0","M21 21l-6-6","M7 10h6","M10 7v6"],
  mailOpen:   ["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z","M9 22V12h6v10"],
  zoomIn:     ["M11 8v6M8 11h6","M11 3a8 8 0 100 16 8 8 0 000-16z","M21 21l-4.35-4.35"],
};

/* ─── HELPERS ────────────────────────────────────────────────── */
const avatarPalette = ['#3B82F6','#8B5CF6','#EC4899','#14B8A6','#F59E0B','#22C55E','#EF4444','#06B6D4','#F97316','#6366F1'];
const avatarColor = (id = '') => avatarPalette[parseInt(id.slice(-4)||'0',16) % avatarPalette.length];

const displayName = (u) => {
  if (!u) return 'Unknown';
  return u.fullName || u.username || (u.email ? u.email.split('@')[0] : 'Unknown');
};
const initial = (u) => displayName(u).charAt(0).toUpperCase();

const fmtRelative = (ts) => {
  if (!ts) return '';
  const m = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m/60)}h`;
  if (m < 10080) return `${Math.floor(m/1440)}d`;
  return new Date(ts).toLocaleDateString('en-US', { month:'short', day:'numeric' });
};

const fmtTime = (ts) => {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true });
};

const roleMeta = (role, t) => ({
  admin:        { label:'Super Admin',   bg:'rgba(245,158,11,0.12)',  color: t.amber },
  southadmin:   { label:'South Admin',   bg: t.accentBg,              color: t.accent },
  centraladmin: { label:'Central Admin', bg: t.greenBg,               color: t.green  },
  user:         { label:'Resident',      bg:'rgba(139,92,246,0.1)',   color:'#8B5CF6' },
}[role] || { label: role || 'Unknown', bg: t.surface2, color: t.textSub });

/* ─── SUB COMPONENTS ─────────────────────────────────────────── */
const Avatar = ({ user, size = 40, showOnline = false, t }) => (
  <div style={{ width:size, height:size, borderRadius:'50%', background: avatarColor(user?._id||''),
    display:'flex', alignItems:'center', justifyContent:'center',
    fontWeight:700, fontSize:size*0.38, color:'#fff', flexShrink:0, position:'relative' }}>
    {user?.profile
      ? <img src={user.profile} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/>
      : initial(user)}
    {showOnline && (
      <div style={{ position:'absolute', bottom:0, right:0,
        width:size*0.28, height:size*0.28, borderRadius:'50%',
        background: t.green, border:`2px solid ${t.surface}` }}/>
    )}
  </div>
);

const ConvSkeleton = ({ t }) => (
  <div style={{ padding:'11px 14px', display:'flex', gap:11, alignItems:'center' }}>
    <div className="skeleton" style={{ width:44, height:44, borderRadius:'50%', flexShrink:0 }}/>
    <div style={{ flex:1, display:'flex', flexDirection:'column', gap:7 }}>
      <div className="skeleton" style={{ height:11, width:'55%' }}/>
      <div className="skeleton" style={{ height:10, width:'75%' }}/>
    </div>
  </div>
);

/* ─── MAIN ───────────────────────────────────────────────────── */
const Message = () => {
  const [isDark, setIsDark]                 = useState(true);
  const [conversations, setConversations]   = useState([]);
  const [messages, setMessages]             = useState([]);
  const [selectedUser, setSelectedUser]     = useState(null);
  const [newMessage, setNewMessage]         = useState('');
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchResults, setSearchResults]   = useState([]);
  const [loadingConvs, setLoadingConvs]     = useState(true);
  const [loadingMsgs, setLoadingMsgs]       = useState(false);
  const [searchLoading, setSearchLoading]   = useState(false);
  const [sending, setSending]               = useState(false);
  const [error, setError]                   = useState('');
  const [currentUser, setCurrentUser]       = useState(null);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [filterBarangay, setFilterBarangay] = useState('all');
  const [selectedFiles, setSelectedFiles]   = useState([]);
  const [uploading, setUploading]           = useState(false);
  const [previewImage, setPreviewImage]     = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText]             = useState('');

  const messagesEndRef  = useRef(null);
  const selectedUserRef = useRef(null);
  const inputRef        = useRef(null);
  const fileInputRef    = useRef(null);
  const navigate        = useNavigate();

  const t = isDark ? dark : light;

  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  const token  = () => localStorage.getItem('adminToken');
  const myId   = () => {
    try { const d = JSON.parse(localStorage.getItem('adminData')||'{}'); return d._id||d.id; } catch { return null; }
  };
  const hdrs = useCallback(() => ({
    'Authorization': `Bearer ${token()}`,
  }), []);

  /* boot */
  useEffect(() => {
    if (!token()) { navigate('/admin/login'); return; }
    try { setCurrentUser(JSON.parse(localStorage.getItem('adminData')||'{}')); } catch {}
    fetchConversations();
    fetchUnread();
    setupSocketListeners();
  }, []);

  const setupSocketListeners = () => {
    // Socket.IO implementation placeholder — using polling fallback
  };

  /* poll */
  useEffect(() => {
    const iv = setInterval(() => {
      if (!token()) return;
      fetchUnread();
      fetchConversations(true);
      if (selectedUserRef.current) silentRefreshMsgs(selectedUserRef.current._id);
    }, 8000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  /* ─── API ─── */
  const fetchUnread = async () => {
    try {
      const r = await fetch(`${API_URL}/api/messages/unread/count`, { headers: hdrs() });
      if (r.ok) { const d = await r.json(); setUnreadCount(d.unreadCount||0); }
    } catch {}
  };

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingConvs(true);
    try {
      const r = await fetch(`${API_URL}/api/messages/conversations`, { headers: hdrs() });
      if (r.ok) {
        const data = await r.json();
        setConversations(data);
        if (!silent) setError('');
      } else {
        if (!silent) setError('Could not load conversations.');
      }
    } catch(e) {
      if (!silent) setError('Network error.');
    } finally {
      if (!silent) setLoadingConvs(false);
    }
  };

  const fetchMessages = async (userId) => {
    setLoadingMsgs(true);
    setMessages([]);
    try {
      const r = await fetch(`${API_URL}/api/messages/conversation/${userId}`, { headers: hdrs() });
      if (r.ok) {
        const data = await r.json();
        setMessages(data);
        markRead(userId);
        fetchUnread();
      } else {
        setError('Failed to load messages.');
      }
    } catch { setError('Network error loading messages.'); }
    finally { setLoadingMsgs(false); }
  };

  const silentRefreshMsgs = async (userId) => {
    try {
      const r = await fetch(`${API_URL}/api/messages/conversation/${userId}`, { headers: hdrs() });
      if (r.ok) {
        const data = await r.json();
        setMessages(prev => prev.length !== data.length ? data : prev);
      }
    } catch {}
  };

  const markRead = async (id) => {
    try { await fetch(`${API_URL}/api/messages/read/${id}`, { method:'PUT', headers: hdrs() }); }
    catch {}
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    const txt = newMessage.trim();
    if ((!txt && selectedFiles.length === 0) || !selectedUser || sending || uploading) return;

    setSending(true);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('receiverId', selectedUser._id);
      if (txt) formData.append('text', txt);

      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('attachments', selectedFiles[i]);
      }

      const r = await fetch(`${API_URL}/api/messages/send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token()}` },
        body: formData
      });

      if (r.ok) {
        const data = await r.json();
        setMessages(prev => [...prev, data.message]);
        fetchConversations(true);
        setNewMessage('');
        setSelectedFiles([]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }), 80);
      } else {
        const err = await r.json();
        setError(err.message || 'Failed to send.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setSending(false);
      setUploading(false);
      inputRef.current?.focus();
    }
  };

  const editMessage = async (messageId, newText) => {
    try {
      const r = await fetch(`${API_URL}/api/messages/edit/${messageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: newText })
      });

      if (r.ok) {
        const data = await r.json();
        setMessages(prev => prev.map(msg =>
          msg._id === messageId ? data.message : msg
        ));
        fetchConversations(true);
        setEditingMessage(null);
        setEditText('');
      } else {
        const err = await r.json();
        setError(err.message || 'Failed to edit message');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;

    try {
      const r = await fetch(`${API_URL}/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token()}` }
      });

      if (r.ok) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
        fetchConversations(true);
      } else {
        setError('Could not delete message.');
      }
    } catch (err) {
      setError('Network error.');
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') ||
                          file.type === 'application/pdf' ||
                          file.type.includes('word') ||
                          file.type.includes('document');
      const isValidSize = file.size <= 50 * 1024 * 1024;
      return isValidType && isValidSize;
    });
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const searchUsers = async (q) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/messages/search?q=${encodeURIComponent(q)}`, { headers: hdrs() });
      if (r.ok) {
        const data = await r.json();
        setSearchResults(data.filter(u => u._id !== myId()));
      }
    } catch {}
    finally { setSearchLoading(false); }
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setSearchQuery('');
    setSearchResults([]);
    setError('');
    fetchMessages(user._id);
    setConversations(prev =>
      prev.map(c => c.user._id === user._id ? {...c, unread:false, unreadCount:0} : c)
    );
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const filteredConvs = filterBarangay === 'all'
    ? conversations
    : conversations.filter(c => (c.user?.barangay||'').toLowerCase().includes(filterBarangay.toLowerCase()));

  const currentUserId = myId();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  /* ─── Render Message with Attachments and Actions ─── */
  const renderMessageWithAttachments = (msg, idx) => {
    const isSent = msg.senderId === currentUserId;
    const hasAttachments = msg.attachments && msg.attachments.length > 0;
    const hasText = msg.text && msg.text.trim();
    const isEditing = editingMessage?._id === msg._id;

    if (!hasText && !hasAttachments) return null;

    return (
      <div key={msg._id || idx} className={`msg-row ${isSent ? 'sent' : 'recv'}`}>
        {!isSent && (
          <div style={{ width: 28, flexShrink: 0 }}>
            <Avatar user={selectedUser} size={28} t={t}/>
          </div>
        )}

        <div className="msg-bubble">
          <div style={{
            padding: '9px 13px',
            borderRadius: isSent ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            background: isSent ? t.sentBubble : t.recvBubble,
            border: isSent ? 'none' : `1px solid ${t.border}`,
            boxShadow: t.shadow,
            position: 'relative'
          }}>

            {/* Edit Mode */}
            {isEditing ? (
              <div>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{
                    width: '100%',
                    background: t.surface2,
                    border: `1px solid ${t.border}`,
                    borderRadius: 8,
                    color: t.text,
                    padding: 8,
                    fontSize: 13.5,
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  rows={2}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setEditingMessage(null); setEditText(''); }}
                    style={{
                      padding: '4px 10px',
                      background: t.surface3,
                      border: `1px solid ${t.border}`,
                      borderRadius: 6,
                      color: t.text,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 5
                    }}
                  >
                    <Ic d={P.x} size={11} color={t.textSub}/>
                    Cancel
                  </button>
                  <button
                    onClick={() => editMessage(msg._id, editText)}
                    style={{
                      padding: '4px 10px',
                      background: t.accent,
                      border: 'none',
                      borderRadius: 6,
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 5
                    }}
                  >
                    <Ic d={P.check} size={11} color="#fff"/>
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Text Message */}
                {hasText && (
                  <div style={{ fontSize: 13.5, lineHeight: 1.55, color: isSent ? t.sentText : t.recvText }}>
                    {msg.text}
                    {msg.isEdited && (
                      <span style={{ fontSize: 10, marginLeft: 6, opacity: 0.6 }}>(edited)</span>
                    )}
                  </div>
                )}

                {/* Attachments */}
                {hasAttachments && (
                  <div className="msg-attachments">
                    {msg.attachments.map((att, i) => (
                      att.type === 'image' ? (
                        <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={att.thumbnailUrl || att.url}
                            alt={att.originalName}
                            className="msg-image"
                            onClick={() => setPreviewImage(att.url)}
                          />
                          <div style={{
                            position: 'absolute', bottom: 6, right: 6,
                            background: 'rgba(0,0,0,0.5)', borderRadius: 6,
                            padding: '3px 5px', display: 'flex', alignItems: 'center',
                            gap: 3, cursor: 'pointer'
                          }} onClick={() => setPreviewImage(att.url)}>
                            <Ic d={P.zoomIn} size={11} color="#fff"/>
                          </div>
                        </div>
                      ) : (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="attachment-doc"
                          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                          <Ic d={P.file} size={16} color={t.accent}/>
                          <span style={{ fontSize: 12, color: t.text }}>{att.originalName}</span>
                        </a>
                      )
                    ))}
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4,
              fontSize: 10, color: isSent ? 'rgba(255,255,255,0.5)' : t.textMuted }}>
              <span>{fmtTime(msg.timestamp)}</span>
              {isSent && (
                <Ic d={msg.read ? P.checks : P.check}
                  size={11} color={msg.read ? (isDark ? '#93C5FD' : '#60A5FA') : 'rgba(255,255,255,0.45)'}/>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons — only for sent messages, not in edit mode */}
        {isSent && !isEditing && (
          <div className="msg-actions">
            <button
              className="icon-btn"
              onClick={() => { setEditingMessage(msg); setEditText(msg.text); }}
              style={{ padding: 5 }}
              title="Edit message"
            >
              <Ic d={P.edit} size={12} color={t.textSub}/>
            </button>
            <button
              className="icon-btn danger"
              onClick={() => deleteMessage(msg._id)}
              style={{ padding: 5 }}
              title="Delete message"
            >
              <Ic d={P.trash} size={12} color={t.red}/>
            </button>
          </div>
        )}
      </div>
    );
  };

  /* ─── RENDER ─── */
  return (
    <>
      <style>{buildCSS(t)}</style>
      <div className="msg-root">

        {/* TOP BAR */}
        <div style={{ padding:'12px 18px', borderBottom:`1px solid ${t.border}`,
          background:t.surface, display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:t.accentBg,
              border:`1px solid ${t.accentBdr}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Ic d={P.msg} size={16} color={t.accent}/>
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:15, fontWeight:600, color:t.text }}>Messages</span>
                {unreadCount > 0 && (
                  <span style={{ background:t.accent, color:'#fff', fontSize:10, fontWeight:700,
                    borderRadius:20, padding:'2px 7px', animation:'pulse 2s infinite' }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              {currentUser && (
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:t.green }}/>
                  <span style={{ fontSize:11, color:t.textMuted, overflow:'hidden',
                    textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {currentUser.email}
                  </span>
                  <span className="badge" style={{ background:roleMeta(currentUser.role,t).bg, color:roleMeta(currentUser.role,t).color }}>
                    {roleMeta(currentUser.role,t).label}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
            <button className="theme-btn" onClick={() => setIsDark(d => !d)} title="Toggle theme">
              <Ic d={isDark ? P.sun : P.moon} size={13} color={t.textSub}/>
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>
            <button className="icon-btn" onClick={() => fetchConversations()} title="Refresh">
              <Ic d={P.refresh} size={14} color={t.textSub}/>
            </button>
          </div>
        </div>

        {/* ERROR BAR */}
        {error && (
          <div style={{ display:'flex', alignItems:'center', gap:10, background:t.redBg,
            borderBottom:`1px solid ${t.red}22`, padding:'9px 18px',
            fontSize:12.5, color:t.red, flexShrink:0 }}>
            <Ic d={P.alert} size={14} color={t.red}/>
            <span style={{ flex:1 }}>{error}</span>
            <button onClick={() => setError('')} style={{ background:'none', border:'none',
              color:t.red, cursor:'pointer', display:'flex', padding:2 }}>
              <Ic d={P.x} size={14} color={t.red}/>
            </button>
          </div>
        )}

        {/* LAYOUT */}
        <div style={{ display:'flex', flex:1, minHeight:0, overflow:'hidden' }}>

          {/* ── SIDEBAR ── */}
          <div style={{ width:288, minWidth:288, display:'flex', flexDirection:'column',
            background:t.surface, borderRight:`1px solid ${t.border}`, overflow:'hidden' }}>

            <div style={{ padding:'12px 12px 10px', borderBottom:`1px solid ${t.border}`, flexShrink:0 }}>
              {currentUser?.role === 'admin' && (
                <select className="filter-select" value={filterBarangay}
                  onChange={e => setFilterBarangay(e.target.value)}>
                  <option value="all">All Barangays</option>
                  <option value="South Signal">South Signal</option>
                  <option value="Central Bicutan">Central Bicutan</option>
                </select>
              )}
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)',
                  pointerEvents:'none', display:'flex' }}>
                  <Ic d={P.search} size={13} color={t.textMuted}/>
                </span>
                <input className="search-input" placeholder="Search residents…"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    searchUsers(e.target.value);
                    if (!e.target.value) { setSearchResults([]); setError(''); }
                  }}/>
              </div>
            </div>

            <div style={{ padding:'8px 14px', display:'flex', alignItems:'center',
              justifyContent:'space-between', flexShrink:0 }}>
              <span style={{ fontSize:10, fontWeight:600, color:t.textMuted,
                textTransform:'uppercase', letterSpacing:'0.07em' }}>
                {searchQuery ? 'Results' : 'Conversations'}
              </span>
              <span style={{ fontSize:10, color:t.textMuted }}>
                {searchQuery ? searchResults.length : filteredConvs.length}
              </span>
            </div>

            <div style={{ flex:1, overflowY:'auto' }}>
              {loadingConvs && !searchQuery && [0,1,2,3].map(i => <ConvSkeleton key={i} t={t}/>)}

              {searchLoading && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'14px',
                  fontSize:12, color:t.textSub }}>
                  <div style={{ animation:'spin 0.8s linear infinite', display:'flex' }}>
                    <Ic d={P.spin} size={13} color={t.textSub}/>
                  </div>
                  Searching…
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && searchQuery && searchResults.map((u, i) => (
                <div key={u._id} className={`conv-item${selectedUser?._id === u._id ? ' active' : ''}`}
                  style={{ animationDelay:`${i*0.04}s` }} onClick={() => selectUser(u)}>
                  <Avatar user={u} size={42} showOnline t={t}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:t.text,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                        {displayName(u)}
                      </span>
                      <span className="badge" style={{ background:roleMeta(u.role,t).bg, color:roleMeta(u.role,t).color }}>
                        {roleMeta(u.role,t).label}
                      </span>
                    </div>
                    <div style={{ fontSize:11, color:t.textMuted, overflow:'hidden',
                      textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>
                    {u.barangay && (
                      <div style={{ display:'flex', alignItems:'center', gap:3, marginTop:3 }}>
                        <Ic d={P.pin} size={9} color={t.textMuted}/>
                        <span style={{ fontSize:10, color:t.textMuted }}>{u.barangay}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {!searchLoading && searchQuery && searchResults.length === 0 && (
                <div style={{ padding:'32px 16px', textAlign:'center' }}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
                    <div style={{ width:48, height:48, borderRadius:14, background:t.surface2,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      border:`1px solid ${t.border}` }}>
                      <Ic d={P.noSearch} size={22} color={t.textMuted}/>
                    </div>
                  </div>
                  <p style={{ fontSize:13, color:t.textSub, fontWeight:500 }}>No users found</p>
                  <p style={{ fontSize:11, color:t.textMuted, marginTop:4 }}>Try a different name or email</p>
                </div>
              )}

              {!searchQuery && !loadingConvs && (
                filteredConvs.length === 0 ? (
                  <div style={{ padding:'48px 16px', textAlign:'center',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                    <div style={{ width:48, height:48, borderRadius:14, background:t.surface2,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      border:`1px solid ${t.border}` }}>
                      <Ic d={P.inbox} size={22} color={t.textMuted}/>
                    </div>
                    <p style={{ fontSize:13, fontWeight:600, color:t.textSub }}>No conversations yet</p>
                    <p style={{ fontSize:11.5, color:t.textMuted }}>Search for a resident to message</p>
                  </div>
                ) : (
                  filteredConvs.map((conv, i) => {
                    const isActive  = selectedUser?._id === conv.user._id;
                    const hasUnread = conv.unread || conv.unreadCount > 0;
                    const hasAttachment = conv.lastMessage?.hasAttachment;
                    const lastMsgText = conv.lastMessage?.text ||
                      (hasAttachment ? 'Attachment' : '');
                    return (
                      <div key={conv.user._id}
                        className={`conv-item${isActive ? ' active' : ''}`}
                        style={{ animationDelay:`${i*0.05}s` }}
                        onClick={() => selectUser(conv.user)}>
                        <div style={{ position:'relative', flexShrink:0 }}>
                          <Avatar user={conv.user} size={42} t={t}/>
                          {hasUnread && (
                            <div style={{ position:'absolute', top:0, right:0,
                              width:11, height:11, borderRadius:'50%',
                              background:t.accent, border:`2px solid ${t.surface}`,
                              animation:'pulse 2s infinite' }}/>
                          )}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center',
                            justifyContent:'space-between', marginBottom:3 }}>
                            <span style={{ fontSize:13, fontWeight: hasUnread ? 700 : 500,
                              color: hasUnread ? t.text : t.textSub,
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                              {displayName(conv.user)}
                            </span>
                            <span style={{ fontSize:10, color:t.textMuted, marginLeft:6, flexShrink:0 }}>
                              {fmtRelative(conv.lastMessage?.timestamp)}
                            </span>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                            <span style={{ fontSize:11.5, color: hasUnread ? t.textSub : t.textMuted,
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1,
                              display:'flex', alignItems:'center', gap:4 }}>
                              {hasAttachment && !conv.lastMessage?.text && (
                                <Ic d={P.attach} size={10} color={t.textMuted}/>
                              )}
                              {lastMsgText?.substring(0,44)}{lastMsgText?.length > 44 ? '…' : ''}
                            </span>
                            {conv.unreadCount > 0 && (
                              <span style={{ background:t.accent, color:'#fff', fontSize:9, fontWeight:700,
                                borderRadius:20, padding:'2px 6px', marginLeft:6, flexShrink:0 }}>
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>

          {/* ── CHAT AREA ── */}
          {selectedUser ? (
            <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, background:t.bg }}>

              {/* chat header */}
              <div style={{ background:t.surface, borderBottom:`1px solid ${t.border}`,
                padding:'11px 18px', display:'flex', alignItems:'center', gap:12, flexShrink:0,
                boxShadow: t.shadow }}>
                <Avatar user={selectedUser} size={40} showOnline t={t}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:14, fontWeight:600, color:t.text }}>
                      {displayName(selectedUser)}
                    </span>
                    <span className="badge"
                      style={{ background:roleMeta(selectedUser.role,t).bg,
                        color:roleMeta(selectedUser.role,t).color }}>
                      {roleMeta(selectedUser.role,t).label}
                    </span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10,
                    fontSize:11, color:t.textMuted }}>
                    {selectedUser.email && <span>{selectedUser.email}</span>}
                    {selectedUser.barangay && (
                      <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                        <Ic d={P.pin} size={9} color={t.textMuted}/>
                        {selectedUser.barangay}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:5,
                  background:t.greenBg, border:`1px solid ${t.green}33`,
                  borderRadius:20, padding:'4px 10px', fontSize:11, color:t.green }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:t.green }}/>
                  Online
                </div>
              </div>

              {/* messages */}
              <div style={{ flex:1, overflowY:'auto', padding:'18px',
                display:'flex', flexDirection:'column', gap:5 }}>

                {loadingMsgs ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {[200,140,180,120].map((w,i) => (
                      <div key={i} style={{ display:'flex', justifyContent: i%2===0 ? 'flex-start':'flex-end' }}>
                        <div className="skeleton" style={{ height:36, width:w, borderRadius:12 }}/>
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
                    justifyContent:'center', height:'100%', gap:12, color:t.textMuted }}>
                    <div style={{ width:60, height:60, borderRadius:18, background:t.surface,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      border:`1px solid ${t.border}` }}>
                      <Ic d={P.mailOpen} size={26} color={t.textMuted}/>
                    </div>
                    <p style={{ fontSize:14, fontWeight:600, color:t.textSub }}>No messages yet</p>
                    <p style={{ fontSize:12, color:t.textMuted }}>Say hello to {displayName(selectedUser)}</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => renderMessageWithAttachments(msg, idx))
                )}
                <div ref={messagesEndRef}/>
              </div>

              {/* File Preview */}
              {selectedFiles.length > 0 && (
                <div className="attachment-preview" style={{ padding:'8px 14px', background:t.surface2, borderTop:`1px solid ${t.border}` }}>
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} style={{ position:'relative', display:'inline-block' }}>
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt="preview" className="attachment-img" />
                      ) : (
                        <div className="attachment-doc">
                          <Ic d={P.file} size={16} color={t.accent}/>
                          <span style={{ fontSize: 11, color: t.text }}>{file.name.substring(0, 20)}</span>
                        </div>
                      )}
                      <button
                        className="remove-file-btn"
                        onClick={() => removeFile(idx)}
                        title="Remove file"
                      >
                        <Ic d={P.x} size={10} color="#fff" sw={2.5}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* input bar */}
              <div style={{ background:t.surface, borderTop:`1px solid ${t.border}`,
                padding:'11px 14px', display:'flex', alignItems:'flex-end', gap:10, flexShrink:0 }}>

                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  multiple
                  accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileSelect}
                />

                <button className="icon-btn" onClick={() => fileInputRef.current?.click()} title="Attach file">
                  <Ic d={P.attach} size={16} color={t.textSub}/>
                </button>

                <textarea
                  ref={inputRef}
                  className="msg-input"
                  rows={1}
                  placeholder={`Message ${displayName(selectedUser)}…`}
                  value={newMessage}
                  onChange={e => {
                    setNewMessage(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                  }}
                  onKeyDown={handleKeyDown}
                  style={{ height:'auto' }}
                />
                <button className="send-btn" onClick={sendMessage}
                  disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending || uploading}
                  title="Send (Enter)">
                  {(sending || uploading)
                    ? <div style={{ animation:'spin 0.7s linear infinite', display:'flex' }}>
                        <Ic d={P.spin} size={16} color="#fff"/>
                      </div>
                    : <Ic d={P.send} size={15} color="#fff" sw={2}/>
                  }
                </button>
              </div>
            </div>
          ) : (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
              background:t.bg }}>
              <div style={{ textAlign:'center', display:'flex', flexDirection:'column',
                alignItems:'center', gap:16, animation:'fadeIn 0.3s ease' }}>
                <div style={{ width:88, height:88, borderRadius:24,
                  background:t.accentBg, border:`1px solid ${t.accentBdr}`,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Ic d={P.msg} size={38} color={t.accent} sw={1.5}/>
                </div>
                <div>
                  <h3 style={{ fontSize:17, fontWeight:600, color:t.text, marginBottom:6 }}>
                    Select a conversation
                  </h3>
                  <p style={{ fontSize:13, color:t.textMuted }}>
                    Pick a resident from the sidebar to start messaging
                  </p>
                </div>
                {unreadCount > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:8,
                    background:t.accentBg, border:`1px solid ${t.accentBdr}`,
                    borderRadius:12, padding:'9px 16px', fontSize:12.5,
                    color:t.accent, fontWeight:500 }}>
                    <Ic d={P.msg} size={14} color={t.accent}/>
                    {unreadCount} unread message{unreadCount !== 1 ? 's' : ''} waiting
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <button className="modal-close" onClick={() => setPreviewImage(null)}>
            <Ic d={P.x} size={18} color="#fff" sw={2}/>
          </button>
          <img src={previewImage} alt="Preview" className="modal-image" />
        </div>
      )}
    </>
  );
};

export default Message;