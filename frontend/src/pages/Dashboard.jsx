import React, { useState, useEffect } from 'react';
import { Users, Clock, CalendarDays, Banknote } from 'lucide-react';
import StatCard from '../components/StatCard';
import api from '../services/api';

const Dashboard = ({ onNavigate, showToast }) => {
  const [summary, setSummary] = useState({
    total_employees: 0,
    today_present: 0,
    pending_leaves: 0,
    monthly_payroll_processed: 0
  });
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // 1. Metrics summary
      const sum = await api.getDashboardSummary();
      setSummary(sum || {});

      // 2. Pending leaves
      const leaves = await api.getLeaves({ status: 'PENDING' });
      setPendingLeaves(leaves ? leaves.slice(0, 5) : []);

      // 3. Today's attendance
      const today = new Date().toISOString().split('T')[0];
      const records = await api.getAttendanceHistory({ start_date: today, end_date: today });
      setTodayAttendance(records ? records.slice(0, 5) : []);
    } catch (err) {
      showToast && showToast('Failed to load dashboard data: ' + err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewLeave = async (id, status) => {
    try {
      await api.reviewLeave(id, status, `Quick ${status.toLowerCase()} from dashboard`);
      showToast && showToast(`Leave request ${status.toLowerCase()} successfully!`, 'success');
      loadDashboard();
    } catch (err) {
      showToast && showToast(`Failed to update leave: ${err.message}`, 'danger');
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

  return (
    <div>
      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <StatCard 
          title="Total Employees" 
          value={loading ? '--' : summary.total_employees} 
          subtitle="Active workforce" 
          icon={Users} 
          colorClass="kpi-blue" 
        />
        <StatCard 
          title="Today Present" 
          value={loading ? '--' : summary.today_present} 
          subtitle="Clocked in today" 
          icon={Clock} 
          colorClass="kpi-green" 
        />
        <StatCard 
          title="Pending Leaves" 
          value={loading ? '--' : summary.pending_leaves} 
          subtitle="Awaiting review" 
          icon={CalendarDays} 
          colorClass="kpi-amber" 
        />
        <StatCard 
          title="Monthly Payroll" 
          value={loading ? '--' : `₹${(summary.monthly_payroll_processed || 0).toLocaleString()}`} 
          subtitle="Processed current month" 
          icon={Banknote} 
          colorClass="kpi-purple" 
        />
      </div>

      {/* 2-Column Split: Pending Leaves & Today's Attendance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* Pending Leaves */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Pending Leave Requests</div>
              <div className="card-subtitle">Action required on employee requests</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('leaves')}>
              View All Leaves
            </button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="pending-leaves-tbody">
                {pendingLeaves.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state">No pending leave requests</td>
                  </tr>
                ) : (
                  pendingLeaves.map(l => (
                    <tr key={l.id}>
                      <td><strong>{l.employee_code}</strong></td>
                      <td>{l.employee_name}</td>
                      <td><span className="badge badge-warning">{l.leave_type}</span></td>
                      <td>{l.start_date} to {l.end_date} ({(l.total_days ?? l.days ?? 1)}d)</td>
                      <td>
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-success btn-sm" 
                            onClick={() => handleReviewLeave(l.id, 'APPROVED')}
                          >
                            Approve
                          </button>
                          <button 
                            className="btn btn-danger btn-sm" 
                            onClick={() => handleReviewLeave(l.id, 'REJECTED')}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Today's Attendance Feed */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Today's Check-in Log</div>
              <div className="card-subtitle">Real-time attendance stream</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('attendance')}>
              Full Attendance
            </button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>Employee</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state">No check-in records for today yet</td>
                  </tr>
                ) : (
                  todayAttendance.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.employee_code}</strong></td>
                      <td>{r.employee_name}</td>
                      <td>{formatTime(r.check_in || r.check_in_time)}</td>
                      <td>{formatTime(r.check_out || r.check_out_time)}</td>
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

      </div>

      {/* Quick Action Shortcuts & Organization Health */}
      <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Quick Operations Card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <div className="card-title">⚡ Quick Management Shortcuts</div>
              <div className="card-subtitle">Frequently used administrative actions</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '12px' }} onClick={() => onNavigate('employees')}>
              <span>👥 Onboard Staff</span>
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '12px' }} onClick={() => onNavigate('attendance')}>
              <span>⏱️ Clock Override</span>
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '12px' }} onClick={() => onNavigate('payroll')}>
              <span>💰 Run Payroll</span>
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '12px' }} onClick={() => onNavigate('reports')}>
              <span>📊 Export Reports</span>
            </button>
          </div>
        </div>

        {/* Workforce & Department Distribution */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <div className="card-title">🏢 Workforce Distribution</div>
              <div className="card-subtitle">Department allocation across organization</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Engineering & Tech</span>
                <span className="text-muted">75% (3 members)</span>
              </div>
              <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '75%', height: '100%', background: 'var(--primary)' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Human Resources & Ops</span>
                <span className="text-muted">25% (1 member)</span>
              </div>
              <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '25%', height: '100%', background: 'var(--success)' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & System Info */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <div className="card-title">🔒 System Environment</div>
              <div className="card-subtitle">Core engine and active integrations</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-light)' }}>
              <span className="text-muted">REST API Backend</span>
              <strong>FastAPI (Python 3.11)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-light)' }}>
              <span className="text-muted">Admin Engine</span>
              <strong>Django Admin (Port 8080)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">PDF Payslip Engine</span>
              <strong>ReportLab Canvas</strong>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
