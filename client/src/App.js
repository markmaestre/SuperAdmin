// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomeDashboard from './Components/dashboard/HomeDashboard';
import Login from './Components/admin/Login';
import AdminDashboard from './Components/admin/AdminDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* HomeDashboard as the default route */}
          <Route path="/" element={<HomeDashboard />} />
          <Route path="/home" element={<HomeDashboard />} />
          
          {/* Admin routes */}
          <Route path="/Login" element={<Login />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;