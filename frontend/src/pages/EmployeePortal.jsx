import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CalendarPlus, 
  FileText, 
  ArrowRight, 
  User, 
  ShieldCheck,
  CalendarCheck
} from 'lucide-react';
import Modal from '../components/Modal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const EmployeePortal = ({ onNavigate, showToast }) => {
  const { currentUser } = useAuth();
  
  // Data states
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [balances, setBalances] = useState(null);
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Leave Modal
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [newLeave, setNewLeave] = useState({
    leave_type: 'CASUAL',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: ''
  });
  const [submittingLeave, setSubmittingLeave] = useState(false);

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    setLoading(true);
    try {
      const today = await api.getTodayAttendance();
      setTodayRecord(today);

      const hist = await api.getAttendanceHistory();
      setHistory(hist ? hist.slice(0, 5) : []);

      const bal = await api.getLeaveBalance();
      setBalances(bal);

      const sl = await api.getSalarySlips();
      setSlips(sl || []);
    } catch (err) {
      console.warn('Portal data fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (new Date(newLeave.start_date) > new Date(newLeave.end_date)) {
      showToast && showToast('Start date cannot be after end date', 'warning');
      return;
    }

    setSubmittingLeave(true);
    try {
      await api.applyLeave(newLeave);
      showToast && showToast('Leave request submitted to HR!', 'success');
      setIsLeaveModalOpen(false);
      setNewLeave({
        leave_type: 'CASUAL',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        reason: ''
      });
      loadPortalData();
    } catch (err) {
      showToast && showToast('Failed to apply for leave: ' + err.message, 'danger');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleDownloadSlip = async (slipId, month, year) => {
    try {
      showToast && showToast('Downloading PDF salary slip...', 'info');
      await api.downloadSalarySlip(slipId, `SalarySlip_${month}_${year}.pdf`);
      showToast && showToast('Download complete!', 'success');
    } catch (err) {
      showToast && showToast('Failed to download slip: ' + err.message, 'danger');
    }
  };

  const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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
    <div>
      {/* Welcome Hero Banner */}
      <div className="portal-welcome-banner">
        <div>
          <h2>Welcome back, {currentUser?.fullName || 'Employee'} 👋</h2>
          <p>Access your personal workforce hub, leave quotas, and official payslips</p>
          <div className="portal-employee-meta">
            <span className="portal-meta-tag">
              ID: {currentUser?.employee?.employee_code || 'EMP-004'}
            </span>
            <span className="portal-meta-tag">
              Dept: {currentUser?.employee?.department || 'Engineering'}
            </span>
            <span className="portal-meta-tag">
              Role: {currentUser?.employee?.designation || 'Staff'}
            </span>
          </div>
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary"
            onClick={() => onNavigate && onNavigate('checkin')}
          >
            <Clock size={16} /> Open Daily Check-In
          </button>
          <button 
            className="btn btn-outline" 
            style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
            onClick={() => setIsLeaveModalOpen(true)}
          >
            <CalendarPlus size={16} /> Request Leave
          </button>
        </div>
      </div>

      {/* Row 1: Quick Status Card & Leave Balances */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Today's Punch Summary Card */}
        <div className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header">
              <div>
                <div className="card-title">
                  <CalendarCheck size={18} /> Today's Attendance Status
                </div>
                <div className="card-subtitle">Current shift biometrics</div>
              </div>
              <span className={`badge ${isCheckedOut ? 'badge-info' : isCheckedIn ? 'badge-success' : 'badge-warning'}`}>
                {isCheckedOut ? 'Completed' : isCheckedIn ? 'Clocked In' : 'Not Clocked In'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '16px 0' }}>
              <div style={{ padding: '12px', background: 'var(--bg-app)', borderRadius: '8px' }}>
                <span className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Check In</span>
                <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px', color: 'var(--success)' }}>
                  {formatTime(checkInVal)}
                </div>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-app)', borderRadius: '8px' }}>
                <span className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Check Out</span>
                <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px', color: 'var(--danger)' }}>
                  {formatTime(checkOutVal)}
                </div>
              </div>
            </div>
          </div>

          <button 
            className="btn btn-outline" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => onNavigate && onNavigate('checkin')}
          >
            <span>Go to Dedicated Check-In Screen</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Leave Balances Grid */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Annual Leave Quota</div>
              <div className="card-subtitle">Remaining balance for current year</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => setIsLeaveModalOpen(true)}>
              Apply Leave
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="balance-card">
              <div className="balance-type">Casual Leave</div>
              <div className="balance-number">{balances?.casual_leave_remaining ?? 12}</div>
              <div className="balance-subtext">Remaining days</div>
            </div>
            <div className="balance-card">
              <div className="balance-type">Sick Leave</div>
              <div className="balance-number">{balances?.sick_leave_remaining ?? 10}</div>
              <div className="balance-subtext">Remaining days</div>
            </div>
            <div className="balance-card">
              <div className="balance-type">Paid Leave</div>
              <div className="balance-number">{balances?.paid_leave_remaining ?? 15}</div>
              <div className="balance-subtext">Remaining days</div>
            </div>
            <div className="balance-card">
              <div className="balance-type">Loss of Pay</div>
              <div className="balance-number" style={{ color: 'var(--danger)' }}>
                {balances?.unpaid_leave_taken ?? 0}
              </div>
              <div className="balance-subtext">Days deducted</div>
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Attendance Feed & Payslips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Recent Attendance */}
        <div className="card" style={{ marginBottom: 0, padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '16px 20px', marginBottom: 0 }}>
            <div>
              <div className="card-title">Recent Attendance Log</div>
              <div className="card-subtitle">Last 5 check-in records</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate && onNavigate('checkin')}>
              View Full History
            </button>
          </div>
          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>In</th>
                  <th>Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state">No attendance logs found</td></tr>
                ) : (
                  history.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.date}</strong></td>
                      <td>{formatTime(r.check_in || r.check_in_time)}</td>
                      <td>{formatTime(r.check_out || r.check_out_time)}</td>
                      <td>{(r.working_hours ?? r.total_hours) ? `${(r.working_hours ?? r.total_hours).toFixed(1)} hrs` : (r.check_in || r.check_in_time ? 'Tracking...' : '--')}</td>
                      <td>
                        <span className={`badge ${r.status === 'PRESENT' ? 'badge-success' : 'badge-neutral'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Salary Slips */}
        <div className="card" style={{ marginBottom: 0, padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '16px 20px', marginBottom: 0 }}>
            <div>
              <div className="card-title">My Salary Slips</div>
              <div className="card-subtitle">Official ReportLab PDF payslips</div>
            </div>
          </div>
          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Net Amount</th>
                  <th>Status</th>
                  <th>Slip</th>
                </tr>
              </thead>
              <tbody>
                {slips.length === 0 ? (
                  <tr><td colSpan="4" className="empty-state">No salary slips generated yet</td></tr>
                ) : (
                  slips.map(s => (
                    <tr key={s.id}>
                      <td><strong>{monthNames[s.month]} {s.year}</strong></td>
                      <td><strong>₹{(s.net_salary || 0).toLocaleString()}</strong></td>
                      <td><span className="badge badge-success">Generated</span></td>
                      <td>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleDownloadSlip(s.id, s.month, s.year)}
                        >
                          <FileText size={14} /> Download PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Apply Leave Modal */}
      <Modal 
        isOpen={isLeaveModalOpen} 
        onClose={() => setIsLeaveModalOpen(false)} 
        title="Apply for Time Off"
      >
        <form onSubmit={handleApplyLeave}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Leave Type *</label>
              <select 
                className="form-select"
                value={newLeave.leave_type}
                onChange={(e) => setNewLeave({ ...newLeave, leave_type: e.target.value })}
                required
              >
                <option value="CASUAL">Casual Leave (Paid)</option>
                <option value="SICK">Sick Leave (Paid)</option>
                <option value="PAID">Annual Paid Leave</option>
                <option value="UNPAID">Unpaid Leave (Loss of Pay)</option>
              </select>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={newLeave.start_date}
                  onChange={(e) => setNewLeave({ ...newLeave, start_date: e.target.value })}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={newLeave.end_date}
                  onChange={(e) => setNewLeave({ ...newLeave, end_date: e.target.value })}
                  required 
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Reason *</label>
              <textarea 
                className="form-textarea" 
                placeholder="Explain your reason for leave..." 
                value={newLeave.reason}
                onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                required 
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsLeaveModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submittingLeave}>
              {submittingLeave ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeePortal;
