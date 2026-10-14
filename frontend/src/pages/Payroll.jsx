import React, { useState, useEffect } from 'react';
import { Banknote, FileText, CheckCircle, Lock } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Payroll = ({ showToast }) => {
  const { currentUser } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPayrolls();
  }, [month, year]);

  const loadPayrolls = async () => {
    setLoading(true);
    try {
      const params = { month: parseInt(month), year: parseInt(year) };
      if (currentUser?.role === 'EMPLOYEE') {
        params.employee_id = currentUser.employeeId;
      }
      const list = await api.getPayrolls(params);
      setPayrolls(list || []);
    } catch (err) {
      showToast && showToast('Failed to load payroll: ' + err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    if (!window.confirm(`Process monthly payroll for Month ${month}, Year ${year}?`)) return;

    setProcessing(true);
    try {
      const res = await api.generatePayroll(parseInt(month), parseInt(year));
      const count = Array.isArray(res) ? res.length : (res?.total_processed ?? 0);
      showToast && showToast(`Payroll processed for ${count} employees!`, 'success');
      loadPayrolls();
    } catch (err) {
      showToast && showToast('Failed to process payroll: ' + err.message, 'danger');
    } finally {
      setProcessing(false);
    }
  };

  const handleSimulateCredit = async (id) => {
    try {
      await api.simulateCredit(id);
      showToast && showToast('Salary credited successfully!', 'success');
      loadPayrolls();
    } catch (err) {
      showToast && showToast('Failed to credit salary: ' + err.message, 'danger');
    }
  };

  const handleLockPayroll = async (id) => {
    if (!window.confirm('Lock this payroll record? Once locked, it cannot be modified.')) return;
    try {
      await api.lockPayroll(id);
      showToast && showToast('Payroll record locked!', 'success');
      loadPayrolls();
    } catch (err) {
      showToast && showToast('Failed to lock payroll: ' + err.message, 'danger');
    }
  };

  const handleDownloadSlip = async (payrollId, empCode) => {
    try {
      showToast && showToast('Generating ReportLab PDF payslip...', 'info');
      const slips = await api.getSalarySlips();
      const slip = slips.find(s => s.payroll_id === payrollId);

      if (slip) {
        await api.downloadSalarySlip(slip.id, `Payslip_${empCode}_${month}_${year}.pdf`);
        showToast && showToast('Salary slip downloaded successfully!', 'success');
      } else {
        showToast && showToast('Salary slip record not ready. Please process payroll first.', 'warning');
      }
    } catch (err) {
      showToast && showToast('Failed to download slip: ' + err.message, 'danger');
    }
  };

  const isHrOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'HR';
  const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div>
      <div className="page-header">
        <div className="page-title-block">
          <h1>{isHrOrAdmin ? 'Payroll & Salary Slips' : 'My Salary Slips'}</h1>
          <p>
            {isHrOrAdmin 
              ? 'Attendance-based monthly payroll processing, salary credit simulation, and PDF slip downloads'
              : 'View your monthly payslip records, salary statements, and download official PDF slips'}
          </p>
        </div>
        {isHrOrAdmin && (
          <button 
            className="btn btn-primary" 
            onClick={handleGeneratePayroll}
            disabled={processing}
          >
            <Banknote size={16} />
            {processing ? 'Processing...' : 'Process Monthly Payroll'}
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div style={{ minWidth: '160px' }}>
          <label className="form-label" style={{ marginBottom: '2px', fontWeight: 600 }}>Select Month</label>
          <select 
            className="form-select" 
            value={month} 
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>
        <div style={{ minWidth: '120px' }}>
          <label className="form-label" style={{ marginBottom: '2px', fontWeight: 600 }}>Select Year</label>
          <select 
            className="form-select" 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '16px 20px', marginBottom: 0, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="card-title" style={{ fontSize: '16px', fontWeight: 700 }}>
              Salary Statement for {monthNames[parseInt(month)]} {year}
            </div>
            <div className="card-subtitle" style={{ fontSize: '13px' }}>
              Official monthly payroll record & ReportLab PDF download
            </div>
          </div>
          <span className="badge badge-primary" style={{ fontSize: '12.5px', padding: '6px 12px' }}>
            Period: {monthNames[parseInt(month)]} {year}
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pay Period</th>
                <th>Emp Code</th>
                <th>Employee Name</th>
                <th>Base Salary</th>
                <th>Days Worked</th>
                <th>Loss of Pay (LOP)</th>
                <th>Net Take-Home</th>
                <th>Status</th>
                {isHrOrAdmin && <th>Lock</th>}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isHrOrAdmin ? 10 : 9} className="empty-state">Loading payroll records...</td></tr>
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan={isHrOrAdmin ? 10 : 9} className="empty-state">
                    No payroll records found for {monthNames[parseInt(month)]} {year}.
                    {isHrOrAdmin ? ' Click "Process Monthly Payroll" above to compute.' : ' Payroll has not been processed for this period yet.'}
                  </td>
                </tr>
              ) : (
                payrolls.map(p => (
                  <tr key={p.id}>
                    <td>
                      <span className="badge badge-info" style={{ fontWeight: 600 }}>
                        {monthNames[p.month]} {p.year}
                      </span>
                    </td>
                    <td><strong>{p.employee_code}</strong></td>
                    <td>{p.employee_name}</td>
                    <td>₹{(p.basic_salary ?? p.base_salary ?? 0).toLocaleString()}</td>
                    <td>
                      <strong>{p.present_days || 0}</strong> / {p.total_working_days ?? p.working_days ?? 30} days
                    </td>
                    <td style={{ color: (p.lop_days ?? p.loss_of_pay_days) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {(p.lop_days ?? p.loss_of_pay_days ?? 0)} days
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '14.5px' }}>
                      ₹{(p.net_salary || 0).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                        {p.status === 'PAID' ? 'PAID / CREDITED' : p.status}
                      </span>
                    </td>
                    {isHrOrAdmin && (
                      <td>
                        <span className={`badge ${p.is_locked ? 'badge-neutral' : 'badge-info'}`}>
                          {p.is_locked ? '🔒 Locked' : 'Open'}
                        </span>
                      </td>
                    )}
                    <td>
                      <div className="flex gap-2">
                        {isHrOrAdmin && p.status === 'PENDING' && !p.is_locked && (
                          <button 
                            className="btn btn-outline btn-sm"
                            onClick={() => handleSimulateCredit(p.id)}
                            title="Simulate Credit"
                          >
                            Credit
                          </button>
                        )}
                        {isHrOrAdmin && !p.is_locked && (
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleLockPayroll(p.id)}
                            title="Lock"
                          >
                            <Lock size={12} />
                          </button>
                        )}
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleDownloadSlip(p.id, p.employee_code)}
                        >
                          <FileText size={14} /> Download PDF
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
    </div>
  );
};

export default Payroll;
