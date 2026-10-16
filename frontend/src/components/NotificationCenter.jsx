import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Megaphone, Filter } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const TYPE_CONFIG = {
  LEAVE_APPLICATION:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Leave' },
  LEAVE_APPROVAL:      { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Approved' },
  LEAVE_REJECTION:     { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: 'Rejected' },
  PAYROLL_GENERATED:   { color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  label: 'Payroll' },
  SALARY_SLIP:         { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  label: 'Slip' },
  ATTENDANCE_ALERT:    { color: '#f97316', bg: 'rgba(249,115,22,0.12)',  label: 'Attendance' },
  SHIFT_CHANGE:        { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   label: 'Shift' },
  HOLIDAY_ANNOUNCEMENT:{ color: '#84cc16', bg: 'rgba(132,204,22,0.12)', label: 'Holiday' },
  ADMIN_ANNOUNCEMENT:  { color: '#ec4899', bg: 'rgba(236,72,153,0.12)', label: 'Announce' },
  ONBOARDING:          { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Welcome' },
  SYSTEM:              { color: '#64748b', bg: 'rgba(100,116,139,0.12)', label: 'System' },
};

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationCenter({ onUnreadCountChange }) {
  const { currentUser } = useAuth();
  const isHrOrAdmin = currentUser?.role !== 'EMPLOYEE';
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [loading, setLoading] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcast, setBroadcast] = useState({ title: '', message: '', department: '', notification_type: 'ADMIN_ANNOUNCEMENT' });
  const [sending, setSending] = useState(false);
  const [employees, setEmployees] = useState([]);
  const panelRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter === 'unread' ? { unread_only: true } : {};
      const data = await api.getNotifications(params);
      setNotifications(data);
    } catch (e) { /* silent */ }
    finally { setLoading(false); }
  }, [filter]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const data = await api.getUnreadCount();
      setUnreadCount(data.unread_count);
      if (onUnreadCountChange) onUnreadCountChange(data.unread_count);
    } catch (e) { /* silent */ }
  }, [onUnreadCountChange]);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  useEffect(() => {
    if (open) loadNotifications();
  }, [open, loadNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMarkRead = async (n) => {
    if (n.is_read) return;
    try {
      await api.markNotificationRead(n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      setUnreadCount(c => Math.max(0, c - 1));
      if (onUnreadCountChange) onUnreadCountChange(Math.max(0, unreadCount - 1));
    } catch (e) { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(x => ({ ...x, is_read: true })));
      setUnreadCount(0);
      if (onUnreadCountChange) onUnreadCountChange(0);
    } catch (e) { /* silent */ }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(x => x.id !== id));
    } catch (e) { /* silent */ }
  };

  const handleBroadcast = async () => {
    if (!broadcast.title || !broadcast.message) return;
    setSending(true);
    try {
      const res = await api.broadcastNotification({
        title: broadcast.title,
        message: broadcast.message,
        department: broadcast.department || undefined,
        notification_type: broadcast.notification_type
      });
      setShowBroadcast(false);
      setBroadcast({ title: '', message: '', department: '', notification_type: 'ADMIN_ANNOUNCEMENT' });
      // success
    } catch (e) { /* silent */ }
    finally { setSending(false); }
  };

  // Load departments for broadcast
  useEffect(() => {
    if (showBroadcast) {
      api.getEmployees({ is_active: true }).then(data => setEmployees(data)).catch(() => {});
    }
  }, [showBroadcast]);
  const departments = [...new Set(employees.map(e => e.department))].filter(Boolean);

  const displayed = notifications;

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative',
          background: open ? '#1e293b' : '#f8fafc',
          border: open ? '2px solid #3b82f6' : '1px solid #cbd5e1',
          borderRadius: '12px', width: '42px', height: '42px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: open ? '#ffffff' : '#1e293b',
          boxShadow: open ? '0 0 0 3px rgba(59, 130, 246, 0.25)' : '0 1px 2px rgba(0,0,0,0.05)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        title="Notification Center"
      >
        <Bell size={20} style={{ color: open ? '#38bdf8' : '#334155' }}/>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-6px', right: '-6px',
            background: '#ef4444',
            color: '#ffffff', borderRadius: '50%',
            width: '20px', height: '20px',
            fontSize: '11px', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 5px rgba(239, 68, 68, 0.5)',
            border: '2px solid #ffffff'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Backdrop Click-away */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 99998, background: 'rgba(15, 23, 42, 0.25)',
            backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.15s ease'
          }}
        />
      )}

      {/* Luxury Floating Notification Panel */}
      {open && (
        <div style={{
          position: 'fixed', top: '70px', right: '24px', width: '480px', maxWidth: 'calc(100vw - 48px)',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '18px',
          boxShadow: '0 25px 60px -10px rgba(15, 23, 42, 0.35), 0 10px 25px -5px rgba(15, 23, 42, 0.18)',
          zIndex: 99999, overflow: 'hidden',
          animation: 'fadeInDown 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderBottom: '1px solid #334155',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            color: '#ffffff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Bell size={18} style={{ color: '#60a5fa' }}/>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '16px', color: '#ffffff', letterSpacing: '-0.2px' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{
                      fontSize: '11px', fontWeight: 800,
                      background: '#ef4444', color: '#ffffff',
                      borderRadius: '999px', padding: '2px 8px',
                      boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                    }}>
                      {unreadCount} UNREAD
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>Workforce activity & status alerts</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isHrOrAdmin && (
                <button
                  onClick={() => { setShowBroadcast(true); setOpen(false); }}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    border: '1px solid #60a5fa', borderRadius: '8px',
                    color: '#ffffff', cursor: 'pointer', padding: '6px 12px',
                    fontSize: '12px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: '5px',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)'
                  }}
                >
                  <Megaphone size={13}/> Broadcast
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  style={{
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
                    cursor: 'pointer', color: '#e2e8f0', display: 'flex', alignItems: 'center',
                    padding: '6px 10px', fontSize: '11px', fontWeight: 600, gap: '4px'
                  }}
                >
                  <CheckCheck size={14}/> Read All
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer',
                  color: '#94a3b8', padding: '6px', display: 'flex', alignItems: 'center',
                  borderRadius: '8px'
                }}
              >
                <X size={18}/>
              </button>
            </div>
          </div>

          {/* Filter Pills Bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setFilter('all')}
                style={{
                  padding: '5px 14px', borderRadius: '20px', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 700,
                  border: filter === 'all' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  background: filter === 'all' ? '#2563eb' : '#ffffff',
                  color: filter === 'all' ? '#ffffff' : '#475569',
                  boxShadow: filter === 'all' ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                style={{
                  padding: '5px 14px', borderRadius: '20px', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 700,
                  border: filter === 'unread' ? '1px solid #ef4444' : '1px solid #cbd5e1',
                  background: filter === 'unread' ? '#ef4444' : '#ffffff',
                  color: filter === 'unread' ? '#ffffff' : '#475569',
                  boxShadow: filter === 'unread' ? '0 2px 6px rgba(239, 68, 68, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Unread ({unreadCount})
              </button>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{displayed.length} notifications</span>
          </div>

          {/* Scrollable Notification List */}
          <div style={{ maxHeight: '440px', overflowY: 'auto', background: '#ffffff' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                <div style={{ display: 'inline-block', width: '22px', height: '22px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '8px' }}/>
                <div>Loading notifications...</div>
              </div>
            ) : displayed.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%', background: '#f1f5f9',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px'
                }}>
                  <Bell size={26} style={{ color: '#94a3b8' }}/>
                </div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>You're all caught up!</div>
                <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0 0' }}>No pending alerts at the moment.</p>
              </div>
            ) : displayed.map(n => {
              const cfg = TYPE_CONFIG[n.notification_type] || TYPE_CONFIG.SYSTEM;
              return (
                <div
                  key={n.id}
                  onClick={() => handleMarkRead(n)}
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid #f1f5f9',
                    background: !n.is_read ? '#f8faff' : '#ffffff',
                    cursor: 'pointer', display: 'flex', gap: '14px', alignItems: 'flex-start',
                    transition: 'all 0.15s ease', position: 'relative'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = !n.is_read ? '#eff6ff' : '#f8fafc'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = !n.is_read ? '#f8faff' : '#ffffff'; }}
                >
                  {/* Left accent bar for unread */}
                  {!n.is_read && (
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: '4px', background: '#2563eb'
                    }}/>
                  )}

                  {/* Type Badge */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                    background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${cfg.color}35`, boxShadow: '0 2px 5px rgba(0,0,0,0.04)'
                  }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: cfg.color, letterSpacing: '0.4px' }}>
                      {cfg.label.slice(0, 4).toUpperCase()}
                    </span>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px', fontWeight: !n.is_read ? 700 : 600,
                      color: !n.is_read ? '#0f172a' : '#334155',
                      marginBottom: '4px', lineHeight: '1.3'
                    }}>
                      {n.title}
                    </div>
                    <div style={{
                      fontSize: '12px', color: '#475569', lineHeight: '1.5',
                      wordBreak: 'break-word'
                    }}>
                      {n.message}
                    </div>
                    <div style={{
                      fontSize: '11px', color: '#94a3b8', marginTop: '6px',
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                      <span style={{ fontWeight: 500 }}>{timeAgo(n.created_at)}</span>
                      {n.is_broadcast && (
                        <span style={{
                          fontSize: '10px', fontWeight: 800,
                          background: '#fdf2f8', color: '#db2777', border: '1px solid #fbcfe8',
                          padding: '1px 6px', borderRadius: '4px'
                        }}>
                          BROADCAST
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions on hover/touch */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                    {!n.is_read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMarkRead(n); }}
                        title="Mark as read"
                        style={{
                          background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px',
                          cursor: 'pointer', color: '#059669', padding: '4px 6px', display: 'flex', alignItems: 'center'
                        }}
                      >
                        <Check size={12}/>
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(n.id, e)}
                      title="Delete"
                      style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px',
                        cursor: 'pointer', color: '#94a3b8', padding: '4px 6px', display: 'flex', alignItems: 'center'
                      }}
                    >
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcast && (
        <div className="modal-backdrop" onClick={() => setShowBroadcast(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Megaphone size={18}/> Send Broadcast</h3>
              <button className="modal-close" onClick={() => setShowBroadcast(false)}><X size={18}/></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-control" placeholder="Announcement title..." value={broadcast.title} onChange={e => setBroadcast(b => ({ ...b, title: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Message *</label>
                <textarea className="form-control" rows={3} placeholder="Type your message..." value={broadcast.message} onChange={e => setBroadcast(b => ({ ...b, message: e.target.value }))}/>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Department (optional)</label>
                  <select className="form-control" value={broadcast.department} onChange={e => setBroadcast(b => ({ ...b, department: e.target.value }))}>
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-control" value={broadcast.notification_type} onChange={e => setBroadcast(b => ({ ...b, notification_type: e.target.value }))}>
                    <option value="ADMIN_ANNOUNCEMENT">Admin Announcement</option>
                    <option value="SYSTEM">System Notice</option>
                    <option value="HOLIDAY_ANNOUNCEMENT">Holiday Notice</option>
                  </select>
                </div>
              </div>
              <div style={{ padding: '10px', background: 'rgba(236,72,153,0.08)', borderRadius: '8px', border: '1px solid rgba(236,72,153,0.2)', fontSize: '12px', color: 'var(--text-muted)' }}>
                📢 This will notify {broadcast.department ? `all employees in ${broadcast.department}` : 'all active employees'}.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowBroadcast(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleBroadcast} disabled={sending || !broadcast.title || !broadcast.message} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {sending ? 'Sending...' : <><Megaphone size={14}/> Send Broadcast</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
