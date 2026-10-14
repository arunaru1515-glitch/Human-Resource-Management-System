import React, { useState, useEffect } from 'react';
import { UserPlus, Upload, UserX, Search } from 'lucide-react';
import Modal from '../components/Modal';
import api from '../services/api';

const Employees = ({ showToast }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDocOpen, setIsDocOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Form states
  const [newEmp, setNewEmp] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    department: 'Engineering',
    designation: '',
    base_salary: 50000,
    joining_date: new Date().toISOString().split('T')[0]
  });

  const [docType, setDocType] = useState('RESUME');
  const [docFile, setDocFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const list = await api.getEmployees();
      setEmployees(list || []);
    } catch (err) {
      showToast && showToast('Failed to load employees: ' + err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parts = (newEmp.full_name || '').trim().split(/\s+/);
      const first_name = parts[0] || 'Employee';
      const last_name = parts.slice(1).join(' ') || parts[0] || 'Staff';
      const salary = parseFloat(newEmp.base_salary) || 50000;

      await api.createEmployee({
        first_name,
        last_name,
        full_name: newEmp.full_name.trim(),
        email: newEmp.email.trim(),
        password: newEmp.password || 'Company@2026',
        role: newEmp.role || 'EMPLOYEE',
        department: newEmp.department || 'Engineering',
        designation: newEmp.designation || 'Staff',
        basic_salary: salary,
        base_salary: salary,
        joining_date: newEmp.joining_date || new Date().toISOString().split('T')[0]
      });
      showToast && showToast('Employee onboarded successfully!', 'success');
      setIsAddOpen(false);
      setNewEmp({
        full_name: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
        department: 'Engineering',
        designation: '',
        base_salary: 50000,
        joining_date: new Date().toISOString().split('T')[0]
      });
      loadEmployees();
    } catch (err) {
      showToast && showToast('Failed to create employee: ' + err.message, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!docFile || !selectedEmp) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('document_type', docType);
      formData.append('file', docFile);

      await api.uploadDocument(selectedEmp.id, formData);
      showToast && showToast('Document uploaded successfully!', 'success');
      setIsDocOpen(false);
      setDocFile(null);
    } catch (err) {
      showToast && showToast('Failed to upload document: ' + err.message, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}?`)) return;
    try {
      await api.deactivateEmployee(id);
      showToast && showToast(`Employee "${name}" deactivated`, 'success');
      loadEmployees();
    } catch (err) {
      showToast && showToast('Failed to deactivate: ' + err.message, 'danger');
    }
  };

  const filtered = employees.filter(emp => {
    const q = searchTerm.toLowerCase();
    const fullName = (emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`).trim();
    const email = emp.email || (emp.user && emp.user.email) || '';
    const code = emp.employee_code || '';
    const matchQuery = !q || 
      fullName.toLowerCase().includes(q) || 
      code.toLowerCase().includes(q) || 
      email.toLowerCase().includes(q);
    const matchDept = !selectedDept || emp.department === selectedDept;
    return matchQuery && matchDept;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-block">
          <h1>Employees Directory</h1>
          <p>View, onboard, and manage organization staff profiles</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
          <UserPlus size={16} />
          Onboard New Employee
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="search-box">
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search by name, ID, or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ minWidth: '180px' }}>
          <select 
            className="form-select" 
            value={selectedDept} 
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Base Salary</th>
                <th>Joining Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="empty-state">Loading employees...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">No employee records found</td></tr>
              ) : (
                filtered.map(emp => (
                  <tr key={emp.id}>
                    <td><strong>{emp.employee_code}</strong></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Employee'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {emp.email || (emp.user ? emp.user.email : '')}
                      </div>
                    </td>
                    <td>{emp.department || '--'}</td>
                    <td>{emp.designation || '--'}</td>
                    <td>₹{(emp.base_salary || emp.basic_salary || emp.gross_salary || 0).toLocaleString()}</td>
                    <td>{emp.joining_date || '--'}</td>
                    <td>
                      <span className={`badge ${emp.is_active ? 'badge-success' : 'badge-neutral'}`}>
                        {emp.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setSelectedEmp(emp);
                            setIsDocOpen(true);
                          }}
                          title="Upload Docs"
                        >
                          <Upload size={14} /> Docs
                        </button>
                        {emp.is_active && (
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeactivate(emp.id, emp.full_name)}
                            title="Deactivate"
                          >
                            <UserX size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Employee Modal */}
      <Modal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        title="Onboard New Employee"
        maxWidth="680px"
      >
        <form onSubmit={handleCreateEmployee}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. John Doe" 
                  value={newEmp.full_name}
                  onChange={(e) => setNewEmp({ ...newEmp, full_name: e.target.value })}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="john@hrms.com" 
                  value={newEmp.email}
                  onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••" 
                  value={newEmp.password}
                  onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role *</label>
                <select 
                  className="form-select"
                  value={newEmp.role}
                  onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="HR">HR Manager</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Engineering" 
                  value={newEmp.department}
                  onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Designation *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Full Stack Developer" 
                  value={newEmp.designation}
                  onChange={(e) => setNewEmp({ ...newEmp, designation: e.target.value })}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Base Monthly Salary (₹) *</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="50000" 
                  min="0"
                  value={newEmp.base_salary}
                  onChange={(e) => setNewEmp({ ...newEmp, base_salary: e.target.value })}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Joining Date *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={newEmp.joining_date}
                  onChange={(e) => setNewEmp({ ...newEmp, joining_date: e.target.value })}
                  required 
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Upload Document Modal */}
      <Modal 
        isOpen={isDocOpen} 
        onClose={() => setIsDocOpen(false)} 
        title="Upload Employee Document"
      >
        <form onSubmit={handleUploadDoc}>
          <div className="modal-body">
            <p className="text-muted mb-3">
              Upload verification documents for: <strong>{selectedEmp?.full_name}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">Document Type *</label>
              <select 
                className="form-select"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                <option value="RESUME">Resume / CV</option>
                <option value="ID_PROOF">National ID / Passport</option>
                <option value="CONTRACT">Offer Letter / Employment Contract</option>
                <option value="CERTIFICATE">Academic / Professional Certificate</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Select File (PDF, PNG, JPG) *</label>
              <input 
                type="file" 
                className="form-input" 
                onChange={(e) => setDocFile(e.target.files[0])}
                required 
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsDocOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Employees;
