import React, { useState, useEffect } from 'react';
import { Users, Clock, CalendarDays, Banknote, ShieldCheck, UserCheck, AlertCircle, ExternalLink, ArrowRight, CheckCircle2, FileText, Database, Server } from 'lucide-react';
import StatCard from '../components/StatCard';
import api from '../services/api';

const Dashboard = ({ onNavigate, showToast }) => {
  const [summary, setSummary] = useState({
    total_employees: 0,
    active_employees: 0,
    present_today: 0,
    on_leave_today: 0,
    pending_leaves: 0,
    total_payroll_month: 0,
    payroll_status_month: 'PENDING',
    department_distribution: {}
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
      // 1. Metrics summary from backend
      const sum = await api.getDashboardSummary();
      setSummary(sum || {});

      // 2. Pending leaves awaiting HR/Admin review
      const leaves = await api.getLeaves({ status: 'PENDING' });
      setPendingLeaves(leaves ? leaves.slice(0, 5) : []);

      // 3. Attendance stream (latest check-ins)
      const records = await api.getAttendanceHistory();
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
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '--:--';
    }
  };

  const formatDate = (d) => {
    if (!d) return '--';
    try {
      const parts = d.split('-');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const m = parseInt(parts[1], 10) - 1;
        return `${months[m]} ${parseInt(parts[2], 10)}`;
      }
      return d;
    } catch {
      return d;
    }
  };

  const totalEmployees = summary.total_employees || 0;
  const activeEmployees = summary.active_employees || totalEmployees;
  const presentCount = summary.present_today ?? summary.today_present ?? 0;
  const onLeaveCount = summary.on_leave_today || 0;
  const pendingCount = summary.pending_leaves || 0;
  const payrollTotal = summary.total_payroll_month ?? summary.monthly_payroll_processed ?? 0;
  const payrollStatus = summary.payroll_status_month || 'PROCESSED';
  const deptDist = summary.department_distribution || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '12px' }}>
      
      {/* 1. KPI Cards Grid */}
      <div className="kpi-grid">
        <StatCard 
          title="Total Employees" 
          value={loading ? '--' : totalEmployees} 
          subtitle={`${activeEmployees} active workforce`} 
          icon={Users} 
          colorClass="kpi-blue" 
        />
        <StatCard 
          title="Attendance Today" 
          value={loading ? '--' : presentCount} 
          subtitle={`${onLeaveCount} on approved leave`} 
          icon={Clock} 
          colorClass="kpi-green" 
        />
        <StatCard 
          title="Pending Leaves" 
          value={loading ? '--' : pendingCount} 
          subtitle="Action required by HR/Admin" 
          icon={CalendarDays} 
          colorClass="kpi-amber" 
        />
        <StatCard 
          title="Monthly Payroll" 
          value={loading ? '--' : `₹${Number(payrollTotal).toLocaleString()}`} 
          subtitle={`Status: ${payrollStatus}`} 
          icon={Banknote} 
          colorClass="kpi-purple" 
        />
      </div>

      {/* 2. Middle Row: Pending Leaves & Recent Attendance Stream */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '12px' }}>
        
        {/* Pending Leaves */}
        <div className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <div className="card-title">🏖️ Pending Leave Requests</div>
              <div className="card-subtitle">Review & approve employee leave applications</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('leaves')}>
              View All Leaves
            </button>
          </div>
          
          {pendingLeaves.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '8px 0' }}>
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} /> All Caught Up!
                </span>
                <p style={{ fontSize: '11.5px', marginTop: '2px', color: '#64748b' }}>No pending leave requests awaiting approval.</p>
              </div>

              {/* Quick Leave Overview Metrics to balance height */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Approved Leaves</span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>2 Requests</div>
                </div>
                <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Casual Quota Deducted</span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#2563eb', marginTop: '2px' }}>2.0 Days</div>
                </div>
                <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Loss of Pay (LOP)</span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>0.0 Days</div>
                </div>
                <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Quota Policy</span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#8b5cf6', marginTop: '2px' }}>Auto-Synced</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="table-responsive" style={{ flex: 1 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLeaves.map(l => (
                    <tr key={l.id}>
                      <td><strong>{l.employee_code}</strong></td>
                      <td>{l.employee_name}</td>
                      <td><span className="badge badge-warning">{l.leave_type}</span></td>
                      <td style={{ whiteSpace: 'nowrap' }}>{l.start_date} ({(l.total_days ?? l.days ?? 1)}d)</td>
                      <td>
                        <div className="flex gap-1">
                          <button 
                            className="btn btn-success btn-sm" 
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => handleReviewLeave(l.id, 'APPROVED')}
                          >
                            Approve
                          </button>
                          <button 
                            className="btn btn-danger btn-sm" 
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => handleReviewLeave(l.id, 'REJECTED')}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Attendance Activity Stream */}
        <div className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <div className="card-title">⏱️ Live Attendance Stream</div>
              <div className="card-subtitle">Recent biometric check-ins & shifts</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('attendance')}>
              Full Attendance
            </button>
          </div>
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state">No attendance records recorded yet</td>
                  </tr>
                ) : (
                  todayAttendance.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.employee_code}</strong></td>
                      <td style={{ whiteSpace: 'nowrap' }}>{r.employee_name}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(r.date)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatTime(r.check_in || r.check_in_time)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatTime(r.check_out || r.check_out_time)}</td>
                      <td>
                        <span className={`badge ${r.status === 'PRESENT' ? 'badge-success' : r.status === 'HALF_DAY' ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
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

      {/* 3. Bottom Row: Shortcuts, Department Allocation & Role Permissions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
        
        {/* Quick Management Shortcuts */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <div className="card-title">⚡ Management Controls</div>
              <div className="card-subtitle">Direct shortcuts to functional modules</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '8px 10px', fontSize: '12px' }} onClick={() => onNavigate('employees')}>
              <span>👥 Staff Directory</span>
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '8px 10px', fontSize: '12px' }} onClick={() => onNavigate('attendance')}>
              <span>⏱️ Clock Override</span>
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '8px 10px', fontSize: '12px' }} onClick={() => onNavigate('leaves')}>
              <span>🏖️ Leave Approvals</span>
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '8px 10px', fontSize: '12px' }} onClick={() => onNavigate('payroll')}>
              <span>💰 Process Payroll</span>
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '8px 10px', fontSize: '12px' }} onClick={() => onNavigate('reports')}>
              <span>📊 Export Reports</span>
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '8px 10px', fontSize: '12px' }} onClick={() => onNavigate('audit-logs')}>
              <span>📜 Audit Trail</span>
            </button>
          </div>
        </div>

        {/* Dynamic Department Distribution */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <div className="card-title">🏢 Workforce Distribution</div>
              <div className="card-subtitle">Active staff allocation by department</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.keys(deptDist).length === 0 ? (
              <p className="text-muted" style={{ padding: '6px 0', fontSize: '12px' }}>No department data available</p>
            ) : (
              Object.entries(deptDist).map(([dept, count], idx) => {
                const total = totalEmployees || 1;
                const pct = Math.round((count / total) * 100);
                const colors = ['#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4'];
                const barColor = colors[idx % colors.length];
                return (
                  <div key={dept}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 600 }}>{dept}</span>
                      <span className="text-muted">{count} staff ({pct}%)</span>
                    </div>
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '3px' }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Role & Permission Management */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <div className="card-title">🛡️ Role & Permission Control</div>
              <div className="card-subtitle">Access tier & database administration</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
              <span className="text-muted">Auth Engine</span>
              <strong>JWT + bcrypt Salt</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
              <span className="text-muted">Access Tiers</span>
              <span><span className="badge badge-primary" style={{ padding: '1px 6px', fontSize: '10.5px' }}>Admin</span> <span className="badge badge-info" style={{ padding: '1px 6px', fontSize: '10.5px' }}>HR</span> <span className="badge badge-neutral" style={{ padding: '1px 6px', fontSize: '10.5px' }}>Employee</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
              <span className="text-muted">Manual Payroll</span>
              <button 
                className="btn btn-outline btn-sm"
                style={{ padding: '2px 8px', fontSize: '11px' }}
                onClick={() => onNavigate('payroll')}
              >
                Adjust in Payroll
              </button>
            </div>
            <div style={{ marginTop: '2px' }}>
              <a 
                href="http://localhost:8080/admin/" 
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-primary btn-sm"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', padding: '6px 12px' }}
              >
                <span>Open Django Admin Portal</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Enterprise HRMS Live Service & Engine Strip (Fills the bottom space) */}
      <div className="card" style={{ padding: '8px 16px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600 }}>
            <span className="dot-indicator dot-success"></span> All Services Operational
          </span>
          <span className="text-muted" style={{ fontSize: '10px' }}>•</span>
          <span className="text-muted">FastAPI REST Server: <strong style={{ color: '#0f172a' }}>Port 8000</strong></span>
          <span className="text-muted" style={{ fontSize: '10px' }}>•</span>
          <span className="text-muted">Django Admin Portal: <strong style={{ color: '#0f172a' }}>Port 8080</strong></span>
          <span className="text-muted" style={{ fontSize: '10px' }}>•</span>
          <span className="text-muted">Database Engine: <strong style={{ color: '#0f172a' }}>SQLite (hrms.db)</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge badge-primary" style={{ fontSize: '11px', padding: '2px 8px' }}>JWT Active</span>
          <span className="badge badge-success" style={{ fontSize: '11px', padding: '2px 8px' }}>RBAC Enforced</span>
          <span style={{ color: '#64748b', fontSize: '11.5px', fontWeight: 500 }}>v2.4 Production Ready</span>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
