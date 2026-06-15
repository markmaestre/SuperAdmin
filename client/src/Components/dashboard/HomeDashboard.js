import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import {
  FaSignInAlt,
  FaShieldAlt,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaTimesCircle,
  FaCheckCircle,
  FaUserShield,
  FaFingerprint,
} from "react-icons/fa";
import API_URL from '../Utils/Api';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:           #080B14;
    --bg-panel:     #0E1426;
    --bg-card:      #131A30;
    --accent:       #3DD6F5;
    --accent-soft:  rgba(61,214,245,0.12);
    --gold:         #F0B429;
    --success:      #34D399;
    --white:        #FFFFFF;
    --muted:        rgba(255,255,255,0.45);
    --muted-2:      rgba(255,255,255,0.30);
    --border:       rgba(255,255,255,0.08);
    --danger:       #f06060;
    --input-bg:     rgba(255,255,255,0.04);
    --input-border: rgba(255,255,255,0.10);
  }

  body {
    font-family: 'Sora', sans-serif;
    background: var(--bg);
    color: var(--white);
    overflow: hidden;
    height: 100vh;
  }

  /* ── PAGE LAYOUT ── */
  .tmfk-page {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100vw;
    position: relative;
    overflow: hidden;
    background: var(--bg);
    padding: 24px;
  }

  .tmfk-page::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(61,214,245,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(61,214,245,0.035) 1px, transparent 1px);
    background-size: 42px 42px;
    pointer-events: none;
  }

  .tmfk-page::after {
    content: '';
    position: absolute;
    top: -22%;
    left: -12%;
    width: 60%;
    height: 80%;
    background: radial-gradient(circle, rgba(61,214,245,0.10), transparent 65%);
    pointer-events: none;
  }

  /* ── SHELL ── */
  .tmfk-shell {
    position: relative;
    z-index: 2;
    display: flex;
    width: 100%;
    max-width: 960px;
    min-height: 600px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 40px 100px rgba(0,0,0,0.55);
    animation: shellIn 0.6s cubic-bezier(0.34,1.4,0.64,1) both;
  }
  @keyframes shellIn {
    from { opacity: 0; transform: translateY(28px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .tmfk-shell.shake { animation: shellIn 0.6s cubic-bezier(0.34,1.4,0.64,1) both, shellShake 0.5s cubic-bezier(0.36,0.07,0.19,0.97) 0.6s both; }
  @keyframes shellShake {
    0%,100% { transform: translateX(0); }
    10%,50%,90% { transform: translateX(-8px); }
    30%,70% { transform: translateX(8px); }
  }

  /* ── SIDE PANEL ── */
  .tmfk-side {
    flex: 1.15;
    position: relative;
    background: var(--bg-panel);
    border-right: 1px solid var(--border);
    padding: 48px 44px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }

  .tmfk-side-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(61,214,245,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(61,214,245,0.06) 1px, transparent 1px);
    background-size: 28px 28px;
    -webkit-mask-image: radial-gradient(circle at 28% 18%, black 0%, transparent 68%);
    mask-image: radial-gradient(circle at 28% 18%, black 0%, transparent 68%);
    pointer-events: none;
  }

  .tmfk-side-top { position: relative; z-index: 1; }

  .tmfk-logo-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 30px;
  }

  .tmfk-logo-img {
    width: 42px;
    height: 42px;
    object-fit: contain;
    border-radius: 10px;
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--border);
    padding: 6px;
  }

  .tmfk-brand {
    font-size: 17px;
    font-weight: 700;
    color: var(--white);
    letter-spacing: 0.03em;
    line-height: 1.1;
  }

  .tmfk-brand span {
    display: block;
    font-size: 10px;
    font-weight: 400;
    color: var(--accent);
    letter-spacing: 0.16em;
    text-transform: uppercase;
    margin-top: 3px;
  }

  .tmfk-clearance {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border: 1px solid rgba(240,180,41,0.35);
    background: rgba(240,180,41,0.08);
    border-radius: 999px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 24px;
  }

  .tmfk-side-title {
    font-size: 26px;
    font-weight: 600;
    line-height: 1.35;
    max-width: 300px;
    margin-bottom: 12px;
    letter-spacing: -0.01em;
  }

  .tmfk-side-sub {
    font-size: 13px;
    line-height: 1.7;
    color: var(--muted);
    max-width: 300px;
  }

  /* ── TERMINAL ── */
  .tmfk-terminal {
    position: relative;
    z-index: 1;
    margin-top: 32px;
    padding: 16px 18px;
    background: rgba(0,0,0,0.30);
    border: 1px solid var(--border);
    border-radius: 12px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11.5px;
  }

  .tmfk-terminal-line {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 4px 0;
    color: var(--muted-2);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0;
    animation: termLineIn 0.4s ease forwards;
  }
  .tmfk-terminal-line:nth-child(1) { animation-delay: 0.6s; }
  .tmfk-terminal-line:nth-child(2) { animation-delay: 0.95s; }
  .tmfk-terminal-line:nth-child(3) { animation-delay: 1.3s; }
  .tmfk-terminal-line:nth-child(4) { animation-delay: 1.65s; }
  .tmfk-terminal-line:nth-child(5) { animation-delay: 2s; }
  @keyframes termLineIn { to { opacity: 1; } }

  .tmfk-terminal-cmd {
    color: var(--accent);
    text-transform: none;
    letter-spacing: 0.02em;
  }
  .tmfk-prompt { font-weight: 700; color: var(--accent); }

  .tmfk-terminal-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--success);
    flex-shrink: 0;
    animation: termDot 2s ease infinite;
  }
  @keyframes termDot {
    0%,100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.45); opacity: 1; }
    50%     { box-shadow: 0 0 0 4px rgba(52,211,153,0); opacity: 0.65; }
  }

  .tmfk-terminal-status {
    margin-left: auto;
    color: var(--success);
  }

  .tmfk-terminal-cursor {
    display: inline-block;
    width: 7px; height: 13px;
    margin-left: 3px;
    background: var(--accent);
    animation: termCursor 1s steps(1) infinite;
    vertical-align: middle;
  }
  @keyframes termCursor { 50% { opacity: 0; } }

  /* ── MAIN PANEL ── */
  .tmfk-main {
    flex: 1;
    padding: 48px 46px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    z-index: 1;
  }

  .tmfk-main-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    align-self: flex-start;
    padding: 6px 12px;
    border: 1px solid var(--border);
    border-radius: 999px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 24px;
  }
  .tmfk-main-badge svg { color: var(--accent); }

  .tmfk-main h1 {
    font-size: 24px;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin-bottom: 6px;
  }

  .tmfk-main-sub {
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 32px;
    line-height: 1.6;
  }

  /* ── FORM ── */
  .tmfk-form-group { margin-bottom: 16px; }

  .tmfk-form-group label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 7px;
  }

  .tmfk-input-wrap { position: relative; }

  .tmfk-input-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
    font-size: 13px;
    display: flex;
    align-items: center;
    pointer-events: none;
  }

  .tmfk-input-wrap input {
    width: 100%;
    padding: 12px 42px 12px 40px;
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: 10px;
    font-size: 13.5px;
    font-family: 'Sora', sans-serif;
    color: var(--white);
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
  }

  .tmfk-input-wrap input::placeholder { color: rgba(255,255,255,0.22); }

  .tmfk-input-wrap input:focus {
    border-color: var(--accent);
    background: var(--accent-soft);
    box-shadow: 0 0 0 3px rgba(61,214,245,0.12);
  }

  .tmfk-check-icon {
    position: absolute;
    right: 13px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--success);
    font-size: 13px;
    display: flex;
    align-items: center;
  }

  .tmfk-pw-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(255,255,255,0.75);
    font-size: 14px;
    display: flex;
    align-items: center;
    padding: 4px;
    border-radius: 6px;
    transition: color 0.18s;
  }
  .tmfk-pw-toggle:hover { color: var(--accent); }

  /* ── WRONG PASSWORD TOAST ── */
  .tmfk-toast {
    position: fixed;
    top: 28px;
    left: 50%;
    transform: translateX(-50%) translateY(-20px);
    z-index: 999;
    background: #150D0D;
    border: 1px solid rgba(240,96,96,0.45);
    border-radius: 14px;
    padding: 14px 22px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.5);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.28s ease, transform 0.32s cubic-bezier(0.34,1.4,0.64,1);
    white-space: nowrap;
  }
  .tmfk-toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
    pointer-events: auto;
  }
  .tmfk-toast-icon {
    width: 30px; height: 30px; flex-shrink: 0;
    border-radius: 50%;
    background: rgba(240,96,96,0.18);
    border: 1.5px solid rgba(240,96,96,0.5);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    animation: tmfk-wobble 0.5s ease 0.1s both;
  }
  @keyframes tmfk-wobble {
    0%   { transform: rotate(0deg) scale(1); }
    25%  { transform: rotate(-12deg) scale(1.15); }
    50%  { transform: rotate(10deg) scale(0.95); }
    75%  { transform: rotate(-6deg) scale(1.05); }
    100% { transform: rotate(0deg) scale(1); }
  }
  .tmfk-toast-title {
    font-size: 13px; font-weight: 700;
    color: #f9a0a0; margin-bottom: 1px;
  }
  .tmfk-toast-sub { font-size: 11px; color: rgba(249,160,160,0.6); }
  .tmfk-toast-bar {
    position: absolute;
    bottom: 0; left: 0;
    height: 3px;
    background: linear-gradient(90deg, #f06060, #f9a0a0);
    border-radius: 0 0 14px 14px;
    width: 100%;
    transform-origin: left;
  }
  .tmfk-toast.show .tmfk-toast-bar { animation: tmfk-shrink 3s linear forwards; }
  @keyframes tmfk-shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }

  /* password input red flash on error */
  .tmfk-input-wrap input.error-flash {
    border-color: rgba(240,96,96,0.7) !important;
    background: rgba(240,96,96,0.07) !important;
    animation: inputFlash 0.4s ease;
  }
  @keyframes inputFlash {
    0%,100% { box-shadow: none; }
    50% { box-shadow: 0 0 0 3px rgba(240,96,96,0.2); }
  }

  /* ── SUBMIT ── */
  .tmfk-submit {
    width: 100%;
    margin-top: 6px;
    padding: 13px;
    background: var(--accent);
    color: #06222C;
    border: none;
    border-radius: 10px;
    font-size: 13.5px;
    font-weight: 700;
    font-family: 'Sora', sans-serif;
    letter-spacing: 0.04em;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.18s, transform 0.18s, box-shadow 0.18s;
  }
  .tmfk-submit:hover:not(:disabled) {
    background: #6de5f8;
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(61,214,245,0.30);
  }
  .tmfk-submit:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

  /* ── SPINNER ── */
  .tmfk-spinner {
    width: 16px; height: 16px; flex-shrink: 0;
    border-radius: 50%;
    border: 2.5px solid rgba(6,34,44,0.25);
    border-top-color: #06222C;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── FOOTER NOTE ── */
  .tmfk-footer-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 24px;
    padding-top: 18px;
    border-top: 1px solid var(--border);
    font-size: 11px;
    color: var(--muted);
  }
  .tmfk-footer-note svg { color: var(--accent); flex-shrink: 0; }

  /* ── PAGE LOADER ── */
  .tmfk-loader {
    position: fixed; inset: 0; z-index: 9999;
    background: var(--bg);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 18px;
    transition: opacity 0.5s, visibility 0.5s;
  }
  .tmfk-loader.hidden { opacity: 0; visibility: hidden; pointer-events: none; }
  .tmfk-loader-logo {
    width: 64px; height: 64px; object-fit: contain;
    animation: pulse 1s ease infinite alternate;
  }
  @keyframes pulse {
    from { opacity: 0.5; transform: scale(0.94); }
    to   { opacity: 1;   transform: scale(1.04); }
  }
  .tmfk-loader-bar {
    width: 160px; height: 3px;
    background: rgba(255,255,255,0.08);
    border-radius: 2px; overflow: hidden;
  }
  .tmfk-loader-fill {
    height: 100%; background: var(--accent);
    border-radius: 2px; transition: width 0.12s linear;
  }
  .tmfk-loader-text {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; letter-spacing: 0.2em;
    color: rgba(255,255,255,0.28); text-transform: uppercase;
  }

  /* ── FOCUS VISIBILITY ── */
  .tmfk-submit:focus-visible,
  .tmfk-pw-toggle:focus-visible,
  .tmfk-input-wrap input:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 880px) {
    .tmfk-side { display: none; }
    .tmfk-shell { max-width: 440px; min-height: auto; max-height: 100vh; overflow-y: auto; }
    .tmfk-main { padding: 40px 30px; }
  }

  @media (max-width: 480px) {
    .tmfk-shell { margin: 16px; max-width: calc(100% - 32px); border-radius: 18px; }
    .tmfk-main { padding: 34px 22px; }
  }

  /* ── REDUCED MOTION ── */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [shakeCard, setShakeCard] = useState(false);
  const [flashInput, setFlashInput] = useState(false);
  const toastTimer = React.useRef(null);
  const navigate = useNavigate();

  const triggerError = (msg) => {
    setError(msg);
    setShowToast(false);
    setShakeCard(false);
    setFlashInput(false);
    // micro delay so re-triggering resets animations
    setTimeout(() => {
      setShowToast(true);
      setShakeCard(true);
      setFlashInput(true);
    }, 20);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setShowToast(false);
    }, 3200);
    setTimeout(() => setShakeCard(false), 520);
    setTimeout(() => setFlashInput(false), 450);
  };

  useEffect(() => {
    let prog = 0;
    const tick = setInterval(() => {
      prog += Math.random() * 18 + 8;
      if (prog >= 100) {
        prog = 100;
        clearInterval(tick);
        setTimeout(() => setPageLoaded(true), 350);
      }
      setLoaderProgress(Math.min(prog, 100));
    }, 120);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    if (token && adminData) {
      try {
        const { role } = JSON.parse(adminData);
        if (['admin', 'southadmin', 'centraladmin'].includes(role)) {
          navigate('/admin/dashboard');
        } else {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
        }
      } catch {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/admins/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        const { role } = data.admin;
        if (['admin', 'southadmin', 'centraladmin'].includes(role)) {
          localStorage.setItem('adminToken', data.token);
          localStorage.setItem('adminData', JSON.stringify(data.admin));
          navigate('/admin/dashboard');
        } else {
          triggerError('Unauthorized role. Please contact system administrator.');
        }
      } else {
        triggerError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch {
      triggerError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>

      {/* Page loader */}
      <div className={`tmfk-loader${pageLoaded ? ' hidden' : ''}`}>
        <img src="/TMFK.png" alt="TMFK" className="tmfk-loader-logo" />
        <div className="tmfk-loader-bar">
          <div className="tmfk-loader-fill" style={{ width: `${loaderProgress}%` }} />
        </div>
        <div className="tmfk-loader-text">Initializing Secure Session</div>
      </div>

      {/* Access denied toast */}
      <div className={`tmfk-toast${showToast ? ' show' : ''}`}>
        <div className="tmfk-toast-icon"><FaTimesCircle size={15} color="#f06060" /></div>
        <div>
          <div className="tmfk-toast-title">Access denied</div>
          <div className="tmfk-toast-sub">{error || 'Wrong credentials'}</div>
        </div>
        <div className="tmfk-toast-bar" />
      </div>

      {/* Page */}
      <div className="tmfk-page">
        <div className={`tmfk-shell${shakeCard ? ' shake' : ''}`}>

          {/* Side panel — system identity + status */}
          <div className="tmfk-side">
            <div className="tmfk-side-grid" />

            <div className="tmfk-side-top">
              <div className="tmfk-logo-wrap">
                <img src="/TMFK.png" alt="TMFK" className="tmfk-logo-img" />
                <div className="tmfk-brand">
                  TMFK
                  <span>Waste Innovations</span>
                </div>
              </div>

              <div className="tmfk-clearance">
                <FaUserShield size={11} />
                Clearance Level 5 — Super Admin
              </div>

              <h2 className="tmfk-side-title">Operations Control Portal</h2>
              <p className="tmfk-side-sub">
                Centralized command access for TMFK's waste management infrastructure.
                Sign in to manage operations, personnel, and system records.
              </p>
            </div>

            <div className="tmfk-terminal">
              <div className="tmfk-terminal-line tmfk-terminal-cmd">
                <span className="tmfk-prompt">$</span>&nbsp;tmfk-portal --status
              </div>
              <div className="tmfk-terminal-line">
                <span className="tmfk-terminal-dot" />
                <span>network</span>
                <span className="tmfk-terminal-status">online</span>
              </div>
              <div className="tmfk-terminal-line">
                <span className="tmfk-terminal-dot" />
                <span>database</span>
                <span className="tmfk-terminal-status">synced</span>
              </div>
              <div className="tmfk-terminal-line">
                <span className="tmfk-terminal-dot" />
                <span>security layer</span>
                <span className="tmfk-terminal-status">encrypted</span>
              </div>
              <div className="tmfk-terminal-line tmfk-terminal-cmd">
                <span className="tmfk-prompt">&gt;</span>&nbsp;awaiting credentials
                <span className="tmfk-terminal-cursor" />
              </div>
            </div>
          </div>

          {/* Main panel — login form */}
          <div className="tmfk-main">
            <div className="tmfk-main-badge">
              <FaFingerprint size={11} />
              Restricted Access
            </div>

            <h1>Administrator Sign In</h1>
            <p className="tmfk-main-sub">Enter your credentials to access the control portal.</p>

            <form onSubmit={handleLogin}>
              <div className="tmfk-form-group">
                <label htmlFor="tmfk-email">Email</label>
                <div className="tmfk-input-wrap">
                  <span className="tmfk-input-icon"><FaEnvelope size={12} /></span>
                  <input
                    id="tmfk-email"
                    type="email"
                    name="email"
                    placeholder="admin@taguig.gov.ph"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                  {formData.email && (
                    <span className="tmfk-check-icon"><FaCheckCircle size={13} /></span>
                  )}
                </div>
              </div>

              <div className="tmfk-form-group">
                <label htmlFor="tmfk-password">Password</label>
                <div className="tmfk-input-wrap">
                  <span className="tmfk-input-icon"><FaLock size={12} /></span>
                  <input
                    id="tmfk-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                    className={flashInput ? 'error-flash' : ''}
                  />
                  <button
                    type="button"
                    className="tmfk-pw-toggle"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="tmfk-submit" disabled={loading}>
                {loading
                  ? <><span className="tmfk-spinner" /> Signing in...</>
                  : <><FaSignInAlt size={13} /> Sign in</>
                }
              </button>
            </form>

            <div className="tmfk-footer-note">
              <FaShieldAlt size={11} />
              Secured connection — authorized personnel only
            </div>
          </div>

        </div>
      </div>
    </>
  );
}