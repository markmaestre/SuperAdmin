import React, { useState, useRef, useEffect } from 'react';
import API_URL from '../Utils/Api';

/* ─────────────────────────────────────────────────────────────
   ICON
───────────────────────────────────────────────────────────── */
const Icon = ({ d, size = 16, color = 'currentColor', strokeWidth = 1.8, spin = false }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, display: 'block', animation: spin ? 'spin 0.8s linear infinite' : 'none' }}
  >
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  save:    "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8",
  check:   ["M22 11.08V12a10 10 0 11-5.93-9.14", "M22 4L12 14.01l-3-3"],
  checkCircle: ["M22 11.08V12a10 10 0 11-5.93-9.14", "M22 4L12 14.01l-3-3"],
  x:       "M18 6L6 18M6 6l12 12",
  alert:   ["M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z","M12 9v4","M12 17h.01"],
  spinner: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
  eye:     ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 9a3 3 0 100 6 3 3 0 000-6z"],
  eyeOff:  ["M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94","M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19","M1 1l22 22"],
  upload:  ["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M17 8l-5-5-5 5","M12 3v12"],
  trash:   ["M3 6h18","M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"],
  user:    ["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2","M12 11a4 4 0 100-8 4 4 0 000 8z"],
  lock:    ["M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z","M7 11V7a5 5 0 0110 0v4"],
};

/* ─────────────────────────────────────────────────────────────
   SAVED BADGE — fades in then out
───────────────────────────────────────────────────────────── */
const SavedBadge = ({ visible, text = 'Saved!' }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 13, color: '#059669', fontWeight: 500,
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(4px)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    pointerEvents: 'none',
  }}>
    <Icon d={ICONS.check} size={14} color="#059669" strokeWidth={2.5} />
    {text}
  </span>
);

/* ─────────────────────────────────────────────────────────────
   SECTION TITLE
───────────────────────────────────────────────────────────── */
const SectionTitle = ({ children }) => (
  <h3 style={{
    fontSize: 11, fontWeight: 700, color: '#9ca3af',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    margin: '0 0 16px 0', paddingBottom: 12,
    borderBottom: '1px solid #e5e7eb',
  }}>{children}</h3>
);

/* ─────────────────────────────────────────────────────────────
   FIELD WRAPPER
───────────────────────────────────────────────────────────── */
const Field = ({ label, children, hint }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{
      display: 'block', fontSize: 12, fontWeight: 600,
      color: '#6b7280', marginBottom: 6, letterSpacing: '0.03em',
    }}>{label}</label>
    {children}
    {hint && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{hint}</p>}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
const AdminProfiles = ({ admin, onAdminUpdate, onProfileUpdate, onDeleteProfilePicture }) => {
  /* ── username / display name ── */
  const defaultUsername = admin?.username || admin?.email?.split('@')[0] || 'Admin';
  const [username,     setUsername]     = useState(defaultUsername);
  const [usernameSave, setUsernameSave] = useState(false);
  const [savingUser,   setSavingUser]   = useState(false);

  /* ── email ── */
  const [email,      setEmail]      = useState(admin?.email || '');
  const [emailSave,  setEmailSave]  = useState(false);
  const [savingEmail,setSavingEmail] = useState(false);

  /* ── password ── */
  const [password,   setPassword]   = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [pwSave,     setPwSave]     = useState(false);
  const [savingPw,   setSavingPw]   = useState(false);

  /* ── photo ── */
  const [photoSrc,       setPhotoSrc]       = useState(admin?.profile || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showConfirmDel, setShowConfirmDel] = useState(false);

  /* ── toast ── */
  const [toast,    setToast]    = useState(null);
  const toastTimer = useRef(null);

  const token = localStorage.getItem('adminToken');

  /* sync when admin prop changes */
  useEffect(() => {
    const u = admin?.username || admin?.email?.split('@')[0] || 'Admin';
    setUsername(u);
    setEmail(admin?.email || '');
    setPhotoSrc(admin?.profile || null);
  }, [admin]);

  const showToast = (msg, success = true) => {
    setToast({ msg, success });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  const flashBadge = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 2500);
  };

  /* ── Save username ── */
  const saveUsername = async () => {
    if (!username.trim()) return;
    setSavingUser(true);
    try {
      const formData = new FormData();
      formData.append('username', username.trim());
      const res = await fetch(`${API_URL}/api/admins/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();
      if (onAdminUpdate) onAdminUpdate(data.admin);
      if (onProfileUpdate) onProfileUpdate(data.admin);
      flashBadge(setUsernameSave);
      showToast('Username updated');
    } catch (err) {
      showToast(err.message || 'Failed to update username', false);
    } finally {
      setSavingUser(false);
    }
  };

  /* ── Save email ── */
  const saveEmail = async () => {
    if (!email.trim()) return;
    setSavingEmail(true);
    try {
      const formData = new FormData();
      formData.append('email', email.trim());
      const res = await fetch(`${API_URL}/api/admins/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();
      if (onAdminUpdate) onAdminUpdate(data.admin);
      if (onProfileUpdate) onProfileUpdate(data.admin);
      flashBadge(setEmailSave);
      showToast('Email updated');
    } catch (err) {
      setEmail(admin?.email || '');
      showToast(err.message || 'Failed to update email', false);
    } finally {
      setSavingEmail(false);
    }
  };

  /* ── Save password ── */
  const savePassword = async () => {
    if (password.length < 8) { showToast('Password must be at least 8 characters', false); return; }
    setSavingPw(true);
    try {
      const formData = new FormData();
      formData.append('password', password);
      const res = await fetch(`${API_URL}/api/admins/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();
      if (onAdminUpdate) onAdminUpdate(data.admin);
      setPassword('');
      flashBadge(setPwSave);
      showToast('Password updated');
    } catch (err) {
      showToast(err.message || 'Failed to update password', false);
    } finally {
      setSavingPw(false);
    }
  };

  /* ── Photo upload ── */
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('File must be under 5 MB', false); return; }
    if (!file.type.startsWith('image/')) { showToast('Only image files are allowed', false); return; }

    const preview = URL.createObjectURL(file);
    setPhotoSrc(preview);
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('profile', file);
      const res = await fetch(`${API_URL}/api/admins/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();
      if (data.admin?.profile) setPhotoSrc(data.admin.profile);
      if (onAdminUpdate) onAdminUpdate(data.admin);
      if (onProfileUpdate) onProfileUpdate(data.admin);
      showToast('Profile photo updated');
    } catch (err) {
      setPhotoSrc(admin?.profile || null);
      showToast(err.message || 'Failed to upload photo', false);
    } finally {
      setUploadingPhoto(false);
    }
  };

  /* ── Delete photo ── */
  const handleDeletePhoto = async () => {
    setShowConfirmDel(false);
    setPhotoSrc(null);
    try {
      const res = await fetch(`${API_URL}/api/admins/profile/picture`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();
      if (onAdminUpdate) onAdminUpdate(data.admin);
      if (onDeleteProfilePicture) onDeleteProfilePicture();
      showToast('Profile photo removed');
    } catch (err) {
      setPhotoSrc(admin?.profile || null);
      showToast(err.message || 'Failed to remove photo', false);
    }
  };

  const initials = (username || 'A').charAt(0).toUpperCase();

  /* ─────── shared styles ─────── */
  const inputStyle = (focused) => ({
    width: '100%', padding: '9px 12px',
    border: `1.5px solid ${focused ? '#10b981' : '#e5e7eb'}`,
    borderRadius: 8, fontSize: 14, color: '#111827',
    outline: 'none', background: '#fff', boxSizing: 'border-box',
    boxShadow: focused ? '0 0 0 3px rgba(16,185,129,0.1)' : 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  });

  const btnSave = (disabled) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 8, border: 'none',
    background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap', transition: 'opacity 0.15s',
  });

  /* ─── focus state helpers ─── */
  const [focusUser, setFocusUser]   = useState(false);
  const [focusEmail, setFocusEmail] = useState(false);
  const [focusPw,   setFocusPw]    = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes apSpin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input[type="file"] { display: none; }
      `}</style>

      <div style={{
        display: 'flex', justifyContent: 'center', padding: '0 24px',
        fontFamily: "'DM Sans','Segoe UI',sans-serif", color: '#111827',
      }}>
        <div style={{ maxWidth: 560, width: '100%', paddingBottom: 48 }}>

          {/* ── HEADER: avatar + name + subtitle ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            marginBottom: 28, paddingBottom: 24,
            borderBottom: '1px solid #e5e7eb',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: '#ecfdf5', border: '1.5px solid #a7f3d0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: '#059669',
              overflow: 'hidden', flexShrink: 0, position: 'relative',
            }}>
              {photoSrc
                ? <img src={photoSrc} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span>{initials}</span>
              }
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 2px' }}>{username || 'Admin'}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Profile settings</p>
            </div>
          </div>

          {/* ── PERSONAL ── */}
          <div style={{ marginBottom: 32 }}>
            <SectionTitle>Personal</SectionTitle>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, marginTop: -8 }}>
              Edit your username and profile picture
            </p>

            {/* Username */}
            <Field label="Username">
              <FocusInput
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Your username"
                onKeyDown={e => e.key === 'Enter' && saveUsername()}
              />
            </Field>

            {/* Save username row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <button
                onClick={saveUsername}
                disabled={savingUser || !username.trim()}
                style={btnSave(savingUser || !username.trim())}
              >
                {savingUser
                  ? <Icon d={ICONS.spinner} size={14} color="#fff" spin />
                  : <Icon d={ICONS.save} size={14} color="#fff" strokeWidth={2} />
                }
                Save changes
              </button>
              <SavedBadge visible={usernameSave} />
            </div>

            {/* Photo section */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 20,
              padding: '16px 0', borderTop: '1px solid #f3f4f6',
            }}>
              {/* Avatar preview */}
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: '#ecfdf5', border: '1.5px solid #a7f3d0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, color: '#059669',
                overflow: 'hidden', flexShrink: 0, position: 'relative',
              }}>
                {photoSrc
                  ? <img src={photoSrc} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span>{initials}</span>
                }
                {uploadingPhoto && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.82)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon d={ICONS.spinner} size={18} color="#10b981" strokeWidth={2} spin />
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {/* Upload */}
                  <input
                    type="file" id="photo-upload"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handlePhotoChange}
                  />
                  <label
                    htmlFor="photo-upload"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '7px 14px', borderRadius: 8,
                      border: '1.5px solid #10b981', background: '#fff',
                      color: '#10b981', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <Icon d={ICONS.upload} size={14} color="#10b981" strokeWidth={2.5} />
                    Upload picture
                  </label>

                  {/* Delete */}
                  {photoSrc && (
                    <button
                      onClick={() => setShowConfirmDel(true)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '7px 14px', borderRadius: 8,
                        border: '1px solid #fca5a5', background: '#fff',
                        color: '#ef4444', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <Icon d={ICONS.trash} size={14} color="#ef4444" strokeWidth={2} />
                      Delete picture
                    </button>
                  )}
                </div>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                  PNG, JPEG or GIF · Max 5 MB
                </p>
              </div>
            </div>

            {/* Confirm delete */}
            {showConfirmDel && (
              <div style={{
                marginTop: 12, padding: '14px 18px', borderRadius: 10,
                background: '#fef2f2', border: '1px solid #fca5a5',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#991b1b', marginBottom: 2 }}>Remove profile picture?</p>
                  <p style={{ fontSize: 12, color: '#b91c1c' }}>This action cannot be undone.</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => setShowConfirmDel(false)}
                    style={{
                      padding: '7px 14px', borderRadius: 8,
                      border: '1px solid #e5e7eb', background: '#fff',
                      color: '#6b7280', fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeletePhoto}
                    style={{
                      padding: '7px 14px', borderRadius: 8, border: 'none',
                      background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── ACCOUNT SECURITY ── */}
          <div>
            <SectionTitle>Account security</SectionTitle>

            {/* Email */}
            <Field label="Email">
              <FocusInput
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter email address"
                onKeyDown={e => e.key === 'Enter' && saveEmail()}
              />
            </Field>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <button
                onClick={saveEmail}
                disabled={savingEmail || !email.trim()}
                style={btnSave(savingEmail || !email.trim())}
              >
                {savingEmail
                  ? <Icon d={ICONS.spinner} size={14} color="#fff" spin />
                  : <Icon d={ICONS.save} size={14} color="#fff" strokeWidth={2} />
                }
                Save email
              </button>
              <SavedBadge visible={emailSave} text="Email saved!" />
            </div>

            {/* Password */}
            <Field label="New password" hint="Minimum 8 characters">
              <div style={{ position: 'relative' }}>
                <FocusInput
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  style={{ paddingRight: 40 }}
                  onKeyDown={e => e.key === 'Enter' && savePassword()}
                />
                <button
                  onClick={() => setShowPw(p => !p)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center',
                  }}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  <Icon d={showPw ? ICONS.eyeOff : ICONS.eye} size={15} color="#9ca3af" />
                </button>
              </div>
            </Field>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={savePassword}
                disabled={savingPw || password.length < 8}
                style={btnSave(savingPw || password.length < 8)}
              >
                {savingPw
                  ? <Icon d={ICONS.spinner} size={14} color="#fff" spin />
                  : <Icon d={ICONS.lock} size={14} color="#fff" strokeWidth={2} />
                }
                Update password
              </button>
              <SavedBadge visible={pwSave} text="Password updated!" />
            </div>
          </div>
        </div>
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '11px 16px', borderRadius: 10,
          background: '#fff',
          border: `1px solid ${toast.success ? '#a7f3d0' : '#fca5a5'}`,
          color: toast.success ? '#065f46' : '#991b1b',
          fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          zIndex: 99999,
          animation: 'slideUp 0.25s ease',
        }}>
          <Icon
            d={toast.success ? ICONS.check : ICONS.alert}
            size={15}
            color={toast.success ? '#10b981' : '#ef4444'}
            strokeWidth={2}
          />
          {toast.msg}
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: 4 }}
          >
            <Icon d={ICONS.x} size={13} color="#9ca3af" strokeWidth={2.5} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

/* ─────────────────────────────────────────────────────────────
   FOCUS INPUT — handles focus border internally
───────────────────────────────────────────────────────────── */
const FocusInput = ({ style: extraStyle, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={{
        width: '100%', padding: '9px 12px',
        border: `1.5px solid ${focused ? '#10b981' : '#e5e7eb'}`,
        borderRadius: 8, fontSize: 14, color: '#111827',
        outline: 'none', background: '#fff', boxSizing: 'border-box',
        boxShadow: focused ? '0 0 0 3px rgba(16,185,129,0.1)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        ...extraStyle,
      }}
    />
  );
};

export default AdminProfiles;