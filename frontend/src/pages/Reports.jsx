import React, { useState } from 'react';
import { FileSpreadsheet, Clock, CalendarDays, Banknote, Download } from 'lucide-react';
import api from '../services/api';

const Reports = ({ showToast }) => {
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  // Attendance filter
  const [attStart, setAttStart] = useState(firstDayOfMonth);
  const [attEnd, setAttEnd] = useState(today);

  // Leave filter
  const [leaveStart, setLeaveStart] = useState(firstDayOfMonth);
  const [leaveEnd, setLeaveEnd] = useState(today);
  const [leaveStatus, setLeaveStatus] = useState('');

  // Payroll filter
  const [payMonth, setPayMonth] = useState(new Date().getMonth() + 1);
  const [payYear, setPayYear] = useState(new Date().getFullYear());

  const handleExportAttendance = async () => {
    try {
      showToast && showToast('Exporting Attendance CSV...', 'info');
      await api.exportReport('attendance', { start_date: attStart, end_date: attEnd }, `attendance_${attStart}_to_${attEnd}.csv`);
      showToast && showToast('Attendance report exported!', 'success');
    } catch (err) {
      showToast && showToast('Failed to export attendance: ' + err.message, 'danger');
    }
  };

  const handleExportLeaves = async () => {
    try {
      showToast && showToast('Exporting Leave CSV...', 'info');
      const params = { start_date: leaveStart, end_date: leaveEnd };
      if (leaveStatus) params.status = leaveStatus;
      await api.exportReport('leaves', params, `leaves_${leaveStart}_to_${leaveEnd}.csv`);
      showToast && showToast('Leave report exported!', 'success');
    } catch (err) {
      showToast && showToast('Failed to export leaves: ' + err.message, 'danger');
    }
  };

  const handleExportPayroll = async () => {
    try {
      showToast && showToast('Exporting Payroll CSV...', 'info');
      await api.exportReport('payroll', { month: payMonth, year: payYear }, `payroll_${payMonth}_${payYear}.csv`);
      showToast && showToast('Payroll report exported!', 'success');
    } catch (err) {
      showToast && showToast('Failed to export payroll: ' + err.message, 'danger');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-block">
          <h1>Reports & Data Export</h1>
          <p>Generate compliant CSV data exports for attendance, leaves, and salary payroll</p>
        </div>
      </div>

      <div className="reports-grid">

        {/* 1. Attendance Report Card */}
        <div className="report-export-card">
          <div>
            <div className="report-export-header">
              <div className="report-export-icon">
                <Clock size={22} />
              </div>
              <div>
                <h3 className="report-export-title">Attendance Report</h3>
                <p className="report-export-desc">Export daily check-ins, clock-out timestamps, working hours, and statuses.</p>
              </div>
            </div>
            <div className="form-grid mb-3">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Start Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={attStart}
                  onChange={(e) => setAttStart(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">End Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={attEnd}
                  onChange={(e) => setAttEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleExportAttendance} style={{ width: '100%', marginTop: '16px' }}>
            <Download size={16} />
            Export Attendance CSV
          </button>
        </div>

        {/* 2. Leave Utilization Card */}
        <div className="report-export-card">
          <div>
            <div className="report-export-header">
              <div className="report-export-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
                <CalendarDays size={22} />
              </div>
              <div>
                <h3 className="report-export-title">Leave Utilization Report</h3>
                <p className="report-export-desc">Export all casual, sick, paid, and unpaid leave requests with approval status.</p>
              </div>
            </div>
            <div className="form-grid mb-3">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Status Filter</label>
                <select 
                  className="form-select"
                  value={leaveStatus}
                  onChange={(e) => setLeaveStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="APPROVED">Approved Only</option>
                  <option value="PENDING">Pending Only</option>
                  <option value="REJECTED">Rejected Only</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Start Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={leaveStart}
                  onChange={(e) => setLeaveStart(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">End Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={leaveEnd}
                  onChange={(e) => setLeaveEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleExportLeaves} style={{ width: '100%', marginTop: '16px' }}>
            <Download size={16} />
            Export Leave CSV
          </button>
        </div>

        {/* 3. Payroll Summary Card */}
        <div className="report-export-card">
          <div>
            <div className="report-export-header">
              <div className="report-export-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
                <Banknote size={22} />
              </div>
              <div>
                <h3 className="report-export-title">Payroll Summary Report</h3>
                <p className="report-export-desc">Export monthly salary computations, allowances, deductions, and net payouts.</p>
              </div>
            </div>
            <div className="form-grid mb-3">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Month</label>
                <select 
                  className="form-select"
                  value={payMonth}
                  onChange={(e) => setPayMonth(e.target.value)}
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
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Year</label>
                <select 
                  className="form-select"
                  value={payYear}
                  onChange={(e) => setPayYear(e.target.value)}
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleExportPayroll} style={{ width: '100%', marginTop: '16px' }}>
            <Download size={16} />
            Export Payroll CSV
          </button>
        </div>

      </div>
    </div>
  );
};

export default Reports;
