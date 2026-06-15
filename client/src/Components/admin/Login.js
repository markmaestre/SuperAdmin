// src/components/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../Utils/Api';
import '../css/Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (token && adminData) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/admins/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and admin data in localStorage
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminData', JSON.stringify(data.admin));
        
        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background-pattern"></div>
      <div className="login-glow"></div>
      
      <div className="login-card">
        <div className="login-card-inner">
          <div className="login-header">
            <div className="login-badge">
              <span className="badge-dot"></span>
              Admin Access
            </div>
            <h1 className="login-title">
              <span className="title-text"> Back</span>
              <span className="title-underline"></span>
            </h1>
            <p className="login-subtitle">Enter your credentials to access the dashboard</p>
          </div>

          {error && (
            <div className="error-message">
              <div className="error-icon">!</div>
              <span className="error-text">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="admin@wastewise.com"
                  className="form-input"
                />
                <div className="input-border"></div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="form-input"
                />
                <div className="input-border"></div>
              </div>
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              <span className="button-text">
                {loading ? 'Authenticating...' : 'Login to Dashboard'}
              </span>
              <span className="button-arrow">→</span>
              <div className="button-glow"></div>
            </button>
          </form>

          <div className="login-footer">
            <div className="footer-divider"></div>
            <p className="footer-text">
              <span className="footer-icon">◆</span>
              Authorized Personnel Only
              <span className="footer-icon">◆</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;