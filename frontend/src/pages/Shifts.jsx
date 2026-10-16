import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, Plus, Edit2, Trash2, Users, Building2, X, Check,
  Sun, Moon, Wind, Wifi, ArrowRight, History, BarChart3, AlertTriangle,
  CheckCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SHIFT_ICONS = { GENERAL: <Sun size={16}/>, NIGHT: <Moon size={16}/>, FLEXIBLE: <Wind size={16}/>, REMOTE: <Wifi size={16}/> };
const SHIFT_COLORS = {
  GENERAL:  { bg: 'rgba(99,102,241,0.15)', text: '#818cf8', border: '#6366f1' },
  NIGHT:    { bg: 'rgba(30,27,75,0.5)',    text: '#a5b4fc', border: '#4f46e5' },
  FLEXIBLE: { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: '#10b981' },
  REMOTE:   { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: '#f59e0b' },
};

const TABS = ['Shifts', 'Assignments', 'Report'];

export default function Shifts({ showToast }) {
  const { currentUser } = useAuth();
  const isHrOrAdmin = currentUser?.role !== 'EMPLOYEE';

  const [activeTab, setActiveTab] = useState('Shifts');
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [editShift, setEditShift] = useState(null);
  const [shiftForm, setShiftForm] = useState({
    name: '', shift_type: 'GENERAL', start_time: '09:00', end_time: '18:00',
    grace_minutes: 15, overtime_after_hours: 8, description: ''
  });
  const [assignForm, setAssignForm] = useState({ shift_id: '', employee_id: '', department: '', assign_mode: 'employee' });
  const [saving, setSaving] = useState(false);

  const loadShifts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getShifts({ active_only: false });
      setShifts(data);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const data = await api.getEmployees({ is_active: true });
      setEmployees(data);
    } catch (e) { /* ignore */ }
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getShiftAttendanceReport({});
      setReportData(data);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadShifts();
    loadEmployees();
  }, [loadShifts, loadEmployees]);

  useEffect(() => {
    if (activeTab === 'Report') loadReport();
  }, [activeTab, loadReport]);

  const openCreateShift = () => {
    setEditShift(null);
    setShiftForm({ name: '', shift_type: 'GENERAL', start_time: '09:00', end_time: '18:00', grace_minutes: 15, overtime_after_hours: 8, description: '' });
    setShowShiftForm(true);
  };

  const openEditShift = (s) => {
    setEditShift(s);
    setShiftForm({
      name: s.name, shift_type: s.shift_type,
      start_time: s.start_time.substring(0, 5),
      end_time: s.end_time.substring(0, 5),
      grace_minutes: s.grace_minutes,
      overtime_after_hours: s.overtime_after_hours,
      description: s.description || ''
    });
    setShowShiftForm(true);
  };

  const handleSaveShift = async () => {
    if (!shiftForm.name || !shiftForm.start_time || !shiftForm.end_time) {
      showToast('Name, start time and end time are required', 'error'); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...shiftForm,
        grace_minutes: parseInt(shiftForm.grace_minutes),
        overtime_after_hours: parseFloat(shiftForm.overtime_after_hours)
      };
      if (!payload.description) delete payload.description;
      if (editShift) {
        await api.updateShift(editShift.id, payload);
        showToast('Shift updated', 'success');
      } else {
        await api.createShift(payload);
        showToast('Shift created', 'success');
      }
      setShowShiftForm(false);
      loadShifts();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDeleteShift = async (s) => {
    if (!window.confirm(`Deactivate shift "${s.name}"?`)) return;
    try {
      await api.deleteShift(s.id);
      showToast('Shift deactivated', 'success');
      loadShifts();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleAssign = async () => {
    if (!assignForm.shift_id) { showToast('Select a shift', 'error'); return; }
    if (assignForm.assign_mode === 'employee' && !assignForm.employee_id) { showToast('Select an employee', 'error'); return; }
    if (assignForm.assign_mode === 'department' && !assignForm.department) { showToast('Enter department name', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        shift_id: parseInt(assignForm.shift_id),
        ...(assignForm.assign_mode === 'employee' ? { employee_id: parseInt(assignForm.employee_id) } : { department: assignForm.department })
      };
      const result = await api.assignShift(payload);
      showToast(`Shift assigned to ${result.length} employee(s)`, 'success');
      setShowAssignForm(false);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  // Unique departments from employees
  const departments = [...new Set(employees.map(e => e.department))].filter(Boolean);

  return (
    <div className="page-container" style={{ padding: '4px 0' }}>
      {/* Top Toolbar: Segmented Tabs & Action Buttons */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '16px',
        padding: '14px 20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Left: Executive Segmented Tabs */}
        <div className="segmented-tabs">
          {(isHrOrAdmin ? TABS : ['Shifts']).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`segmented-tab ${activeTab === tab ? 'active' : ''}`}
            >
              {tab === 'Shifts' && <Clock size={15}/>}
              {tab === 'Assignments' && <Users size={15}/>}
              {tab === 'Report' && <CheckCircle size={15}/>}
              <span>{tab === 'Report' ? 'Attendance Report' : tab}</span>
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        {isHrOrAdmin && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className="btn-secondary"
              onClick={() => setShowAssignForm(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600
              }}
            >
              <Users size={15} style={{ color: '#2563eb' }}/> Assign Shift
            </button>
            <button
              className="btn-primary"
              onClick={openCreateShift}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700
              }}
            >
              <Plus size={16}/> New Shift
            </button>
          </div>
        )}
      </div>

      {/* SHIFTS TAB */}
      {activeTab === 'Shifts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {loading ? (
            <p style={{ color: '#64748b', fontSize: '14px', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>Loading shifts...</p>
          ) : shifts.length === 0 ? (
            <div style={{
              background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px',
              padding: '48px 20px', textAlign: 'center', gridColumn: '1/-1'
            }}>
              <Clock size={40} style={{ color: '#cbd5e1', marginBottom: '12px' }}/>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#334155' }}>No active shifts defined yet</div>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0' }}>
                {isHrOrAdmin ? 'Click "+ New Shift" to create standard work hours.' : 'Contact HR to configure shifts.'}
              </p>
            </div>
          ) : (
            shifts.map(s => {
              const colors = SHIFT_COLORS[s.shift_type] || SHIFT_COLORS.GENERAL;
              return (
                <div
                  key={s.id}
                  style={{
                    background: '#ffffff',
                    border: `1px solid ${colors.border || '#cbd5e1'}`,
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
                    opacity: s.is_active ? 1 : 0.6,
                    position: 'relative',
                    transition: 'all 0.18s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(15, 23, 42, 0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.04)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '10px',
                        background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: colors.text, border: `1px solid ${colors.border}`
                      }}>
                        {SHIFT_ICONS[s.shift_type]}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, color: '#0f172a', fontSize: '15px', fontWeight: 800 }}>{s.name}</h3>
                        <span style={{
                          fontSize: '11px', fontWeight: 800, color: colors.text,
                          background: colors.bg, padding: '2px 8px', borderRadius: '6px',
                          border: `1px solid ${colors.border}`, marginTop: '3px', display: 'inline-block'
                        }}>
                          {s.shift_type}
                        </span>
                      </div>
                    </div>

                    {isHrOrAdmin && s.is_active && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => openEditShift(s)}
                          style={{
                            background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px',
                            cursor: 'pointer', color: '#475569', padding: '5px 7px', display: 'flex', alignItems: 'center'
                          }}
                          title="Edit Shift"
                        >
                          <Edit2 size={13}/>
                        </button>
                        <button
                          onClick={() => handleDeleteShift(s)}
                          style={{
                            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px',
                            cursor: 'pointer', color: '#ef4444', padding: '5px 7px', display: 'flex', alignItems: 'center'
                          }}
                          title="Deactivate Shift"
                        >
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Times Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', letterSpacing: '0.4px', marginBottom: '2px' }}>START TIME</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{s.start_time?.substring(0,5)}</div>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', letterSpacing: '0.4px', marginBottom: '2px' }}>END TIME</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{s.end_time?.substring(0,5)}</div>
                    </div>
                  </div>

                  {/* Rules bar */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', fontSize: '12px', fontWeight: 600 }}>
                    <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                      ⏱ Grace: {s.grace_minutes}m
                    </span>
                    <span style={{ background: '#fffbeb', color: '#b45309', padding: '3px 8px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                      ⚡ OT after: {s.overtime_after_hours}h
                    </span>
                  </div>

                  {s.description && (
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '10px', marginBottom: 0, lineHeight: '1.4' }}>
                      {s.description}
                    </p>
                  )}

                  {!s.is_active && (
                    <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700, marginTop: '8px', display: 'block' }}>
                      ● Deactivated
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ASSIGNMENTS TAB */}
      {activeTab === 'Assignments' && (
        <div className="card">
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600 }}>Employee Shift Assignments</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th><th>Department</th><th>Shift</th><th>Type</th><th>Hours</th><th>Since</th>
                </tr>
              </thead>
              <tbody>
                {employees.filter(e => e.shift_assignments?.length > 0 || true).map(emp => {
                  const active = emp.shift_assignments?.find(a => !a.effective_to);
                  return active ? (
                    <tr key={emp.id}>
                      <td style={{ fontWeight: 500 }}>{emp.full_name || `${emp.first_name} ${emp.last_name}`}</td>
                      <td>{emp.department}</td>
                      <td>{active.shift_name || '—'}</td>
                      <td><span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', background: SHIFT_COLORS[active.shift_type]?.bg, color: SHIFT_COLORS[active.shift_type]?.text }}>{active.shift_type}</span></td>
                      <td>{active.start_time?.substring(0,5)} – {active.end_time?.substring(0,5)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{active.effective_from ? new Date(active.effective_from).toLocaleDateString() : '—'}</td>
                    </tr>
                  ) : null;
                })}
              </tbody>
            </table>
            {employees.every(e => !e.shift_assignments?.some(a => !a.effective_to)) && (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No active shift assignments. Use "Assign Shift" to get started.</div>
            )}
          </div>
        </div>
      )}

      {/* REPORT TAB */}
      {activeTab === 'Report' && (
        <div className="card">
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={18} style={{ color: 'var(--accent)' }}/>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600 }}>Shift-Wise Attendance Report</h3>
          </div>
          {loading ? <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading report...</div> :
           reportData.length === 0 ? <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No attendance records with shift data yet.</div> :
           <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th><th>Date</th><th>Shift</th><th>Check-In</th><th>Check-Out</th>
                  <th>Hours</th><th>OT Hours</th><th>Late</th><th>Early Out</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{r.employee_name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{r.date}</td>
                    <td>{r.shift_name !== 'N/A' ? <span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '4px', background: SHIFT_COLORS[r.shift_type]?.bg, color: SHIFT_COLORS[r.shift_type]?.text }}>{r.shift_name}</span> : '—'}</td>
                    <td style={{ fontSize: '12px' }}>{r.check_in ? new Date(r.check_in).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                    <td style={{ fontSize: '12px' }}>{r.check_out ? new Date(r.check_out).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                    <td>{r.working_hours?.toFixed(1)}h</td>
                    <td>{r.overtime_hours > 0 ? <span style={{ color: '#f59e0b', fontWeight: 600 }}>+{r.overtime_hours?.toFixed(1)}h</span> : '—'}</td>
                    <td>{r.is_late ? <span style={{ color: '#ef4444', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}><AlertTriangle size={12}/> {r.late_minutes}m</span> : <span style={{ color: '#10b981' }}>✓</span>}</td>
                    <td>{r.is_early_checkout ? <span style={{ color: '#f59e0b', fontSize: '12px' }}>Early</span> : '—'}</td>
                    <td><span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '4px', background: r.status === 'PRESENT' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: r.status === 'PRESENT' ? '#10b981' : '#ef4444' }}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
           </div>
          }
        </div>
      )}

      {/* Shift Form Modal */}
      {showShiftForm && (
        <div className="modal-backdrop" onClick={() => setShowShiftForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header">
              <h3>{editShift ? 'Edit Shift' : 'Create New Shift'}</h3>
              <button className="modal-close" onClick={() => setShowShiftForm(false)}><X size={18}/></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Shift Name *</label>
                <input className="form-control" placeholder="e.g. Morning General" value={shiftForm.name} onChange={e => setShiftForm(f => ({ ...f, name: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-control" value={shiftForm.shift_type} onChange={e => setShiftForm(f => ({ ...f, shift_type: e.target.value }))}>
                  {['GENERAL','NIGHT','FLEXIBLE','REMOTE'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <input type="time" className="form-control" value={shiftForm.start_time} onChange={e => setShiftForm(f => ({ ...f, start_time: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">End Time *</label>
                  <input type="time" className="form-control" value={shiftForm.end_time} onChange={e => setShiftForm(f => ({ ...f, end_time: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Grace (minutes)</label>
                  <input type="number" className="form-control" min={0} max={60} value={shiftForm.grace_minutes} onChange={e => setShiftForm(f => ({ ...f, grace_minutes: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">OT After (hours)</label>
                  <input type="number" className="form-control" min={4} max={12} step={0.5} value={shiftForm.overtime_after_hours} onChange={e => setShiftForm(f => ({ ...f, overtime_after_hours: e.target.value }))}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={2} placeholder="Optional description..." value={shiftForm.description} onChange={e => setShiftForm(f => ({ ...f, description: e.target.value }))}/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowShiftForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveShift} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {saving ? 'Saving...' : <><Check size={15}/> {editShift ? 'Update' : 'Create'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Form Modal */}
      {showAssignForm && (
        <div className="modal-backdrop" onClick={() => setShowAssignForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px', width: '90%' }}>
            <div className="modal-header">
              <h3>Assign Shift</h3>
              <button className="modal-close" onClick={() => setShowAssignForm(false)}><X size={18}/></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Shift *</label>
                <select className="form-control" value={assignForm.shift_id} onChange={e => setAssignForm(f => ({ ...f, shift_id: e.target.value }))}>
                  <option value="">— Select Shift —</option>
                  {shifts.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name} ({s.shift_type})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  {['employee','department'].map(m => (
                    <button key={m} onClick={() => setAssignForm(f => ({ ...f, assign_mode: m }))} style={{
                      flex: 1, padding: '8px', borderRadius: '7px', border: `1px solid ${assignForm.assign_mode === m ? 'var(--accent)' : 'var(--border)'}`,
                      background: assignForm.assign_mode === m ? 'rgba(99,102,241,0.15)' : 'var(--bg-subtle)',
                      color: assignForm.assign_mode === m ? '#818cf8' : 'var(--text-muted)',
                      cursor: 'pointer', fontSize: '13px', fontWeight: 500, textTransform: 'capitalize', transition: 'all 0.2s'
                    }}>
                      {m === 'employee' ? <Users size={14} style={{ marginRight: '5px' }}/> : <Building2 size={14} style={{ marginRight: '5px' }}/>}
                      {m}
                    </button>
                  ))}
                </div>
                {assignForm.assign_mode === 'employee' ? (
                  <select className="form-control" value={assignForm.employee_id} onChange={e => setAssignForm(f => ({ ...f, employee_id: e.target.value }))}>
                    <option value="">— Select Employee —</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.department})</option>)}
                  </select>
                ) : (
                  <select className="form-control" value={assignForm.department} onChange={e => setAssignForm(f => ({ ...f, department: e.target.value }))}>
                    <option value="">— Select Department —</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAssignForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAssign} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {saving ? 'Assigning...' : <><ArrowRight size={15}/> Assign</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
