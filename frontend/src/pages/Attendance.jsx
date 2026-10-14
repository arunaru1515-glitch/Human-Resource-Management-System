import React, { useState, useEffect } from 'react';
import { Edit3, Calendar } from 'lucide-react';
import Modal from '../components/Modal';
import api from '../services/api';

const Attendance = ({ showToast }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  // Override Modal
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [overrideData, setOverrideData] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    check_in: '09:00',
    check_out: '18:00',
    status: 'PRESENT',
    remarks: 'Manual Admin Correction'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAttendance();
  }, [dateFilter]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFilter) {
        params.start_date = dateFilter;
        params.end_date = dateFilter;
      }
      const list = await api.getAttendanceHistory(params);
      setRecords(list || []);
    } catch (err) {
      showToast && showToast('Failed to load attendance: ' + err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const openOverrideModal = async () => {
    try {
      const empList = await api.getEmployees();
      setEmployees(empList || []);
      if (empList && empList.length > 0) {
        setOverrideData(prev => ({ ...prev, employee_id: empList[0].id }));
      }
      setIsOverrideOpen(true);
    } catch (err) {
      showToast && showToast('Failed to load employees for override', 'danger');
    }
  };

  const handleApplyOverride = async (e) => {
    e.preventDefault();
    if (!overrideData.employee_id) {
      showToast && showToast('Please select an employee', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employee_id: parseInt(overrideData.employee_id),
        date: overrideData.date,
        check_in: overrideData.check_in ? `${overrideData.date}T${overrideData.check_in}:00` : null,
        check_out: overrideData.check_out ? `${overrideData.date}T${overrideData.check_out}:00` : null,
        status: overrideData.status,
        remarks: overrideData.remarks
      };

      await api.overrideAttendance(payload);
      showToast && showToast('Attendance overridden successfully!', 'success');
      setIsOverrideOpen(false);
      loadAttendance();
    } catch (err) {
      showToast && showToast('Failed to apply override: ' + err.message, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    return !q || 
      r.employee_name?.toLowerCase().includes(q) || 
      r.employee_code?.toLowerCase().includes(q);
  });

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

  const getStatusBadge = (status) => {
    if (status === 'PRESENT') return 'badge-success';
    if (status === 'HALF_DAY') return 'badge-warning';
    if (status === 'ABSENT') return 'badge-danger';
    return 'badge-neutral';
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-block">
          <h1>Attendance Management</h1>
          <p>Daily employee check-in logs, total working hours, and admin corrections</p>
        </div>
        <button className="btn btn-primary" onClick={openOverrideModal}>
          <Edit3 size={16} />
          Manual Attendance Override
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div style={{ minWidth: '180px' }}>
          <label className="form-label" style={{ marginBottom: '2px' }}>Filter Date</label>
          <input 
            type="date" 
            className="form-input" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <div className="search-box" style={{ marginTop: '18px' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search employee name or code..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Emp Code</th>
                <th>Employee Name</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="empty-state">Loading attendance records...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">No attendance records for this date</td></tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.employee_code}</strong></td>
                    <td>{r.employee_name}</td>
                    <td>{r.date}</td>
                    <td>{formatTime(r.check_in || r.check_in_time)}</td>
                    <td>{formatTime(r.check_out || r.check_out_time)}</td>
                    <td><strong>{(r.working_hours ?? r.total_hours) ? `${(r.working_hours ?? r.total_hours).toFixed(1)} hrs` : (r.check_in || r.check_in_time ? 'Tracking...' : '--')}</strong></td>
                    <td>
                      <span className={`badge ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <span className="text-muted" style={{ fontSize: '12px' }}>
                        {r.remarks || (r.is_overridden ? 'Admin override' : 'Normal clock')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Modal */}
      <Modal 
        isOpen={isOverrideOpen} 
        onClose={() => setIsOverrideOpen(false)} 
        title="Admin Attendance Override"
      >
        <form onSubmit={handleApplyOverride}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Employee *</label>
              <select 
                className="form-select"
                value={overrideData.employee_id}
                onChange={(e) => setOverrideData({ ...overrideData, employee_id: e.target.value })}
                required
              >
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.employee_code} - {e.full_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input 
                type="date" 
                className="form-input" 
                value={overrideData.date}
                onChange={(e) => setOverrideData({ ...overrideData, date: e.target.value })}
                required
              />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Check-In Time</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={overrideData.check_in}
                  onChange={(e) => setOverrideData({ ...overrideData, check_in: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Check-Out Time</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={overrideData.check_out}
                  onChange={(e) => setOverrideData({ ...overrideData, check_out: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status *</label>
              <select 
                className="form-select"
                value={overrideData.status}
                onChange={(e) => setOverrideData({ ...overrideData, status: e.target.value })}
              >
                <option value="PRESENT">PRESENT</option>
                <option value="HALF_DAY">HALF_DAY</option>
                <option value="ABSENT">ABSENT</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Reason / Remarks</label>
              <textarea 
                className="form-textarea" 
                placeholder="e.g. Biometric machine error / Approved site visit"
                value={overrideData.remarks}
                onChange={(e) => setOverrideData({ ...overrideData, remarks: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsOverrideOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Applying...' : 'Apply Override'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Attendance;
