import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  Timer, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CheckIn = ({ showToast }) => {
  const { currentUser } = useAuth();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Real-time clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }));
      setDateStr(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
    setDataLoading(true);
    try {
      // 1. Today's attendance
      const today = await api.getTodayAttendance();
      setTodayRecord(today);

      // 2. Attendance history
      const list = await api.getAttendanceHistory();
      setHistory(list ? list.slice(0, 7) : []);
    } catch (err) {
      console.warn('Attendance load error:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      const rec = await api.checkIn();
      setTodayRecord(rec);
      showToast && showToast('Checked in successfully! Have a productive day.', 'success');
      loadAttendanceData();
    } catch (err) {
      showToast && showToast(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      const rec = await api.checkOut();
      setTodayRecord(rec);
      showToast && showToast('Checked out successfully! Shift logged.', 'success');
      loadAttendanceData();
    } catch (err) {
      showToast && showToast(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '--:--';
    try {
      let dateObj;
      if (typeof ts === 'string') {
        const iso = ts.includes('T') ? ts : ts.replace(' ', 'T');
        const utcIso = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
        dateObj = new Date(utcIso);
      } else {
        dateObj = new Date(ts);
      }
      if (isNaN(dateObj.getTime())) {
        return typeof ts === 'string' ? ts.substring(11, 16) : '--:--';
      }
      return dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '--:--';
    }
  };

  const checkInVal = todayRecord?.check_in || todayRecord?.check_in_time;
  const checkOutVal = todayRecord?.check_out || todayRecord?.check_out_time;
  const isCheckedIn = Boolean(todayRecord?.has_checked_in || checkInVal);
  const isCheckedOut = Boolean(todayRecord?.has_checked_out || checkOutVal);

  return (
    <div className="checkin-page-container">
      
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-block">
          <h1>Daily Check-In & Time Tracker</h1>
          <p>Record your official working hours, check-in timestamps, and view daily punch history</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-info">
            <MapPin size={12} /> Office HQ / Remote
          </span>
          <span className="badge badge-primary">
            Shift: 09:00 AM - 06:00 PM
          </span>
        </div>
      </div>

      {/* Main Check-In Grid */}
      <div className="checkin-grid">
        
        {/* Left: Big Interactive Digital Punch Card */}
        <div className="card punch-card">
          <div className="punch-card-header">
            <span className="punch-status-tag">
              <span className={`dot-indicator ${isCheckedOut ? 'dot-info' : isCheckedIn ? 'dot-success' : 'dot-warning'}`}></span>
              {isCheckedOut ? 'SHIFT COMPLETED' : isCheckedIn ? 'ON DUTY (ACTIVE)' : 'NOT CLOCKED IN'}
            </span>
            <span className="text-muted" style={{ fontSize: '13px' }}>Enterprise HRMS Biometric Engine</span>
          </div>

          <div className="punch-display">
            <div className="punch-digital-time">{timeStr || '--:--:--'}</div>
            <div className="punch-date">{dateStr || 'Loading date...'}</div>
          </div>

          {/* Today's Punch Stats Metrics */}
          <div className="punch-metrics-bar">
            <div className="punch-metric-item">
              <span className="punch-metric-label">Check-In Time</span>
              <span className="punch-metric-val text-success">
                {formatTime(checkInVal)}
              </span>
            </div>

            <div className="punch-metric-divider"></div>

            <div className="punch-metric-item">
              <span className="punch-metric-label">Check-Out Time</span>
              <span className="punch-metric-val text-danger">
                {formatTime(checkOutVal)}
              </span>
            </div>

            <div className="punch-metric-divider"></div>

            <div className="punch-metric-item">
              <span className="punch-metric-label">Total Duration</span>
              <span className="punch-metric-val text-primary">
                {(todayRecord?.working_hours ?? todayRecord?.total_hours) ? `${(todayRecord.working_hours ?? todayRecord.total_hours).toFixed(1)} hrs` : (isCheckedIn ? 'Tracking...' : '0.0 hrs')}
              </span>
            </div>
          </div>

          {/* Interactive Button */}
          <div className="punch-action-area">
            {!isCheckedIn ? (
              <button 
                className="btn btn-clock-in btn-lg punch-btn" 
                onClick={handleClockIn}
                disabled={loading}
              >
                <Clock size={22} />
                <span>{loading ? 'Registering Check-In...' : 'Clock In Now'}</span>
              </button>
            ) : !isCheckedOut ? (
              <button 
                className="btn btn-clock-out btn-lg punch-btn" 
                onClick={handleClockOut}
                disabled={loading}
              >
                <Clock size={22} />
                <span>{loading ? 'Registering Check-Out...' : 'Clock Out Now'}</span>
              </button>
            ) : (
              <div className="punch-completed-box">
                <CheckCircle size={28} className="text-success" />
                <div>
                  <h4>Daily Attendance Completed</h4>
                  <p>You have logged out for today. See you tomorrow!</p>
                </div>
              </div>
            )}
          </div>

          <div className="punch-security-footnote">
            <ShieldCheck size={14} />
            <span>Duplicate check-in prevention active & time verified against server timestamp</span>
          </div>
        </div>

        {/* Right: Shift Policies & Quick Overview */}
        <div className="checkin-sidebar-info">
          
          {/* Shift Details Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Timer size={18} /> Shift Schedule
              </div>
            </div>
            <div className="shift-schedule-list">
              <div className="shift-item">
                <span className="text-muted">Standard Working Hours</span>
                <strong>9 Hours / Day (incl. 1hr Break)</strong>
              </div>
              <div className="shift-item">
                <span className="text-muted">Grace Period</span>
                <strong>15 Minutes (till 09:15 AM)</strong>
              </div>
              <div className="shift-item">
                <span className="text-muted">Half-Day Threshold</span>
                <strong>Under 4.5 Hours Worked</strong>
              </div>
              <div className="shift-item">
                <span className="text-muted">Today's Logged Status</span>
                <span className={`badge ${todayRecord?.status === 'PRESENT' ? 'badge-success' : 'badge-neutral'}`}>
                  {todayRecord?.status || 'PENDING'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <div className="card-title">
                <AlertCircle size={18} /> Attendance Policy
              </div>
            </div>
            <p className="text-muted" style={{ fontSize: '13px', lineHeight: 1.6 }}>
              Please remember to clock out before leaving. In case of missed punches due to technical issues, reach out to HR or request a manual override through management.
            </p>
          </div>

        </div>

      </div>

      {/* Full Attendance History Table Card */}
      <div className="card" style={{ marginTop: '24px', padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '16px 20px', marginBottom: 0 }}>
          <div>
            <div className="card-title">Recent Attendance History</div>
            <div className="card-subtitle">Your logged check-in and check-out logs for the past 7 days</div>
          </div>
        </div>
        <div className="table-responsive" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {dataLoading ? (
                <tr><td colSpan="6" className="empty-state">Loading attendance history...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan="6" className="empty-state">No attendance records logged yet</td></tr>
              ) : (
                history.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.date}</strong></td>
                    <td>{formatTime(r.check_in || r.check_in_time)}</td>
                    <td>{formatTime(r.check_out || r.check_out_time)}</td>
                    <td><strong>{(r.working_hours ?? r.total_hours) ? `${(r.working_hours ?? r.total_hours).toFixed(1)} hrs` : (r.check_in || r.check_in_time ? 'Tracking...' : '--')}</strong></td>
                    <td>
                      <span className={`badge ${r.status === 'PRESENT' ? 'badge-success' : r.status === 'HALF_DAY' ? 'badge-warning' : 'badge-neutral'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <span className="text-muted" style={{ fontSize: '12.5px' }}>
                        {r.remarks || (r.is_overridden ? 'Admin adjusted' : 'Regular biometrics')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default CheckIn;
