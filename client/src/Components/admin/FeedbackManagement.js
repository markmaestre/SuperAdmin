import React, { useState, useEffect } from 'react';
import API_URL from '../Utils/Api';
import '../css/Feedback.css';
import {
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Star,
  Reply,
  Pencil,
  Send,
  Inbox,
  Loader2,
  MessagesSquare,
} from 'lucide-react';

const FeedbackManagement = () => {
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [adminReply, setAdminReply] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFeedbackData();
  }, [currentPage]);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      const [feedbackResponse, statsResponse] = await Promise.all([
        fetch(`${API_URL}/api/feedback/all?page=${currentPage}&limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/feedback/stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (feedbackResponse.ok && statsResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        const statsData = await statsResponse.json();
        setFeedback(feedbackData.feedback);
        setStats(statsData);
        setTotalPages(feedbackData.pages || 1);
      } else {
        throw new Error('Failed to fetch feedback data');
      }
    } catch (error) {
      setMessage('Error fetching feedback data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (feedbackId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/feedback/${feedbackId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'resolved' }),
      });

      if (response.ok) {
        setFeedback(feedback.map(item =>
          item._id === feedbackId ? { ...item, status: 'resolved' } : item
        ));
        setMessage('Feedback resolved successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to resolve feedback');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  const handleReplySubmit = async (feedbackId) => {
    if (!adminReply.trim()) {
      setMessage('Please enter a reply message');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/feedback/${feedbackId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'replied',
          adminReply: adminReply.trim(),
        }),
      });

      if (response.ok) {
        setFeedback(feedback.map(item =>
          item._id === feedbackId
            ? { ...item, status: 'replied', adminReply: adminReply.trim(), updatedAt: new Date().toISOString() }
            : item
        ));
        setReplyingTo(null);
        setAdminReply('');
        setMessage('Reply sent successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to send reply');
      }
    } catch (error) {
      setMessage('Error sending reply: ' + error.message);
    }
  };

  const filteredFeedback = feedback.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.user?.username?.toLowerCase().includes(term) ||
      item.user?.email?.toLowerCase().includes(term) ||
      item.message?.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term)
    );
  });

  const getInitials = (name) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const renderStars = (rating) => (
    <div className="fb-stars">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          size={13}
          className={star <= rating ? 'fb-star filled' : 'fb-star'}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="fb-loading">
        <Loader2 className="fb-spinner" size={28} />
        <p>Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="fb-page">
      <div className="fb-layout">

        {/* Left sidebar */}
        <aside className="fb-sidebar">
          <p className="fb-eyebrow">Feedback</p>
          <h1 className="fb-title">Remarkable Client Journeys</h1>
          <p className="fb-description">
            Discover the remarkable client journeys that showcase your commitment to excellence.
            See how you've transformed experiences through your service.
          </p>

          {stats && (
            <div className="fb-metrics">
              <div className="fb-metric-card">
                <MessagesSquare size={16} className="fb-metric-icon" />
                <div>
                  <p className="fb-metric-label">Total feedback</p>
                  <p className="fb-metric-value">{stats.totalFeedback}</p>
                </div>
              </div>
              <div className="fb-metric-card">
                <Star size={16} className="fb-metric-icon star" />
                <div>
                  <p className="fb-metric-label">Average rating</p>
                  <p className="fb-metric-value">
                    {stats.averageRating?.toFixed(1) || '0.0'}
                    <span className="fb-metric-sub">/5</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Right feed */}
        <div className="fb-feed">

          {/* Search */}
          <div className="fb-search-wrapper">
            <Search size={15} className="fb-search-icon" />
            <input
              type="text"
              className="fb-search"
              placeholder="Search by user, email, message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="fb-search-clear" onClick={() => setSearchTerm('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {message && (
            <div className={`fb-alert ${message.includes('Error') ? 'fb-alert-error' : 'fb-alert-success'}`}>
              {message.includes('Error')
                ? <AlertCircle size={15} />
                : <CheckCircle2 size={15} />}
              <span>{message}</span>
            </div>
          )}

          {/* Feedback cards */}
          <div className="fb-list">
            {filteredFeedback.length === 0 ? (
              <div className="fb-empty">
                <Inbox size={40} className="fb-empty-icon" />
                <h3>No feedback found</h3>
                <p>{searchTerm ? 'Try adjusting your search' : 'No submissions yet'}</p>
              </div>
            ) : (
              filteredFeedback.map(item => (
                <div key={item._id} className={`fb-card ${item.status === 'resolved' ? 'fb-card-resolved' : ''}`}>

                  {/* Card header */}
                  <div className="fb-card-header">
                    <div className="fb-user">
                      <div className="fb-avatar">
                        {item.user?.profile
                          ? <img src={item.user.profile} alt={item.user.username} />
                          : <span>{getInitials(item.user?.username || 'U')}</span>
                        }
                      </div>
                      <div className="fb-user-info">
                        <strong className="fb-username">{item.user?.username || 'Unknown User'}</strong>
                        <span className="fb-useremail">@{item.user?.username?.toLowerCase().replace(/\s/g, '') || item.user?.email}</span>
                      </div>
                    </div>
                    <div className="fb-card-meta">
                      {renderStars(item.rating)}
                      <span className="fb-date">
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Message */}
                  <p className="fb-message">{item.message}</p>

                  {/* Category pill */}
                  {item.category && (
                    <span className="fb-category">{item.category}</span>
                  )}

                  {/* Admin reply bubble */}
                  {item.adminReply && (
                    <div className="fb-reply-bubble">
                      <p className="fb-reply-label">Admin reply</p>
                      <p className="fb-reply-text">{item.adminReply}</p>
                    </div>
                  )}

                  {/* Reply form */}
                  {replyingTo === item._id && (
                    <div className="fb-reply-form">
                      <textarea
                        className="fb-textarea"
                        rows={3}
                        value={adminReply}
                        onChange={(e) => setAdminReply(e.target.value)}
                        placeholder="Write a professional, helpful reply..."
                      />
                      <div className="fb-reply-actions">
                        <button
                          className="fb-btn fb-btn-primary"
                          onClick={() => handleReplySubmit(item._id)}
                          disabled={!adminReply.trim()}
                        >
                          <Send size={13} />
                          {item.adminReply ? 'Update reply' : 'Send reply'}
                        </button>
                        <button
                          className="fb-btn fb-btn-ghost"
                          onClick={() => { setReplyingTo(null); setAdminReply(''); }}
                        >
                          <X size={13} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Card footer actions */}
                  {item.status !== 'resolved' && (
                    <div className="fb-card-actions">
                      <button
                        className="fb-btn fb-btn-outline"
                        onClick={() => {
                          setReplyingTo(replyingTo === item._id ? null : item._id);
                          setAdminReply(item.adminReply || '');
                        }}
                      >
                        {item.adminReply ? <Pencil size={13} /> : <Reply size={13} />}
                        {item.adminReply ? 'Edit reply' : 'Reply'}
                      </button>
                      <button
                        className="fb-btn fb-btn-ghost"
                        onClick={() => handleResolve(item._id)}
                      >
                        <CheckCircle2 size={13} />
                        Resolve
                      </button>
                    </div>
                  )}

                  {item.status === 'resolved' && (
                    <div className="fb-resolved-badge">
                      <CheckCircle2 size={13} />
                      Resolved
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="fb-pagination">
              <button
                className="fb-btn fb-btn-outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft size={15} />
                Previous
              </button>
              <span className="fb-page-info">Page {currentPage} of {totalPages}</span>
              <button
                className="fb-btn fb-btn-outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackManagement;