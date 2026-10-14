import React, { useState, useEffect } from 'react';
import { CalendarPlus, Check, X } from 'lucide-react';
import Modal from '../components/Modal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Leaves = ({ showToast }) => {
  const { currentUser } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modal
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [newLeave, setNewLeave] = useState({
    leave_type: 'CASUAL',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Balances
      const bal = await api.getLeaveBalance(currentUser?.employeeId);
      setBalances(bal);

      // 2. Leaves list
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (currentUser?.role === 'EMPLOYEE') params.employee_id = currentUser.employeeId;

      const list = await api.getLeaves(params);
      setLeaves(list || []);
    } catch (err) {
      showToast && showToast('Failed to load leaves: ' + err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status) => {
    const comment = window.prompt(`Enter remarks for ${status.toLowerCase()} (optional):`, '');
    if (comment === null) return;

    try {
      await api.reviewLeave(id, status, comment || `${status} by ${currentUser?.role}`);
      showToast && showToast(`Leave request ${status.toLowerCase()}!`, 'success');
      loadData();
    } catch (err) {
      showToast && showToast(`Failed to update leave: ${err.message}`, 'danger');
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (new Date(newLeave.start_date) > new Date(newLeave.end_date)) {
      showToast && showToast('Start date cannot be after end date', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await api.applyLeave(newLeave);
      showToast && showToast('Leave request submitted successfully!', 'success');
      setIsApplyOpen(false);
      setNewLeave({
        leave_type: 'CASUAL',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        reason: ''
      });
      loadData();
    } catch (err) {
      showToast && showToast('Failed to apply for leave: ' + err.message, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const isHrOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'HR';

  const getLeaveBadge = (status) => {
    if (status === 'APPROVED') return 'badge-success';
    if (status === 'REJECTED') return 'badge-danger';
    if (status === 'PENDING') return 'badge-warning';
    return 'badge-neutral';
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-block">
          <h1>Leave Management</h1>
          <p>Track leave quotas, review pending applications, and request time off</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsApplyOpen(true)}>
          <CalendarPlus size={16} />
          Apply for Leave
        </button>
      </div>

      {/* Leave Balances Grid */}
      <div className="leave-balances-grid">
        <div className="balance-card">
          <div className="balance-type">Casual Leave</div>
          <div className="balance-number">{balances?.casual_available ?? balances?.casual_leave_remaining ?? 12}</div>
          <div className="balance-subtext">Remaining days</div>
        </div>
        <div className="balance-card">
          <div className="balance-type">Sick Leave</div>
          <div className="balance-number">{balances?.sick_available ?? balances?.sick_leave_remaining ?? 10}</div>
          <div className="balance-subtext">Remaining days</div>
        </div>
        <div className="balance-card">
          <div className="balance-type">Paid Leave</div>
          <div className="balance-number">{balances?.paid_available ?? balances?.paid_leave_remaining ?? 15}</div>
          <div className="balance-subtext">Remaining days</div>
        </div>
        <div className="balance-card">
          <div className="balance-type">Loss of Pay (LOP)</div>
          <div className="balance-number" style={{ color: 'var(--danger)' }}>
            {balances?.lop_days ?? balances?.unpaid_leave_taken ?? 0}
          </div>
          <div className="balance-subtext">Days deducted</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-toolbar">
        <div style={{ minWidth: '200px' }}>
          <select 
            className="form-select" 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING (Action Required)</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Leaves Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Emp Code</th>
                <th>Employee Name</th>
                <th>Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Status</th>
                <th>Remarks / Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="empty-state">Loading leave requests...</td></tr>
              ) : leaves.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">No leave applications found</td></tr>
              ) : (
                leaves.map(l => (
                  <tr key={l.id}>
                    <td><strong>{l.employee_code}</strong></td>
                    <td>{l.employee_name}</td>
                    <td><span className="badge badge-primary">{l.leave_type}</span></td>
                    <td>{l.start_date}</td>
                    <td>{l.end_date}</td>
                    <td><strong>{(l.total_days ?? l.days ?? 1)} days</strong></td>
                    <td>
                      <span className={`badge ${getLeaveBadge(l.status)}`}>
                        {l.status}
                      </span>
                    </td>
                    <td>
                      {isHrOrAdmin && l.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => handleReview(l.id, 'APPROVED')}
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleReview(l.id, 'REJECTED')}
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '12px' }}>
                          {l.admin_remarks || (l.status === 'PENDING' ? 'Awaiting review' : 'Processed')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Modal 
        isOpen={isApplyOpen} 
        onClose={() => setIsApplyOpen(false)} 
        title="Apply for Leave"
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
                placeholder="Provide context for your leave request..." 
                value={newLeave.reason}
                onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsApplyOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Leaves;
