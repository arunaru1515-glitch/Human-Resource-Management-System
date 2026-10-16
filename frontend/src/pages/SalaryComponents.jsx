import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Plus, Edit2, Trash2, X, Check,
  TrendingUp, TrendingDown, Settings, UserCog, RefreshCw,
  Banknote, Award
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const TYPE_CONFIG = {
  EARNING:   { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <TrendingUp size={14}/>,   label: 'Earning' },
  DEDUCTION: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: <TrendingDown size={14}/>, label: 'Deduction' },
};

const TABS = ['Components', 'Revise Compensation'];

export default function SalaryComponents({ showToast }) {
  const { currentUser } = useAuth();
  const isHrOrAdmin = currentUser?.role !== 'EMPLOYEE';

  const [activeTab, setActiveTab] = useState('Components');
  const [components, setComponents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Component form
  const [showForm, setShowForm] = useState(false);
  const [editComp, setEditComp] = useState(null);
  const [form, setForm] = useState({
    name: '', component_type: 'EARNING', description: '',
    is_percentage: false, amount: 0, percentage: 0, is_variable: false
  });
  const [saving, setSaving] = useState(false);

  // Compensation revision
  const [reviseForm, setReviseForm] = useState({
    employee_id: '', basic_salary: '', hra: '', allowances: '', deductions: '', bonus: '', revision_note: ''
  });
  const [revising, setRevising] = useState(false);
  const [selectedEmpData, setSelectedEmpData] = useState(null);

  const loadComponents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getSalaryComponents({ active_only: false });
      setComponents(data);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const data = await api.getEmployees({ is_active: true });
      setEmployees(data);
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    loadComponents();
    loadEmployees();
  }, [loadComponents, loadEmployees]);

  // When employee selected for revision, auto-fill current salary
  useEffect(() => {
    if (reviseForm.employee_id) {
      const emp = employees.find(e => e.id === parseInt(reviseForm.employee_id));
      if (emp) {
        setSelectedEmpData(emp);
        setReviseForm(f => ({
          ...f,
          basic_salary: emp.basic_salary ?? '',
          hra: emp.hra ?? '',
          allowances: emp.allowances ?? '',
          deductions: emp.deductions ?? '',
          bonus: '',
          revision_note: ''
        }));
      }
    } else {
      setSelectedEmpData(null);
    }
  }, [reviseForm.employee_id, employees]);

  const openCreate = () => {
    setEditComp(null);
    setForm({ name: '', component_type: 'EARNING', description: '', is_percentage: false, amount: 0, percentage: 0, is_variable: false });
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditComp(c);
    setForm({
      name: c.name, component_type: c.component_type, description: c.description || '',
      is_percentage: c.is_percentage, amount: c.amount, percentage: c.percentage, is_variable: c.is_variable
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name) { showToast('Component name is required', 'error'); return; }
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) || 0, percentage: parseFloat(form.percentage) || 0 };
      if (!payload.description) delete payload.description;
      if (editComp) {
        await api.updateSalaryComponent(editComp.id, payload);
        showToast('Component updated', 'success');
      } else {
        await api.createSalaryComponent(payload);
        showToast('Component created', 'success');
      }
      setShowForm(false);
      loadComponents();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Deactivate "${c.name}"?`)) return;
    try {
      await api.deleteSalaryComponent(c.id);
      showToast('Component deactivated', 'success');
      loadComponents();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleRevise = async () => {
    if (!reviseForm.employee_id) { showToast('Select an employee', 'error'); return; }
    setRevising(true);
    try {
      const payload = {
        employee_id: parseInt(reviseForm.employee_id),
        basic_salary: reviseForm.basic_salary !== '' ? parseFloat(reviseForm.basic_salary) : undefined,
        hra: reviseForm.hra !== '' ? parseFloat(reviseForm.hra) : undefined,
        allowances: reviseForm.allowances !== '' ? parseFloat(reviseForm.allowances) : undefined,
        deductions: reviseForm.deductions !== '' ? parseFloat(reviseForm.deductions) : undefined,
        revision_note: reviseForm.revision_note || undefined
      };
      const result = await api.reviseCompensation(payload);
      showToast(`Compensation updated for ${result.employee_name}. New gross: ₹${result.new_gross_salary?.toLocaleString('en-IN')}`, 'success');
      loadEmployees();
      setReviseForm(f => ({ ...f, revision_note: '', employee_id: '' }));
      setSelectedEmpData(null);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setRevising(false); }
  };

  const earnings = components.filter(c => c.component_type === 'EARNING');
  const deductions = components.filter(c => c.component_type === 'DEDUCTION');

  const newGross = selectedEmpData
    ? (parseFloat(reviseForm.basic_salary) || 0) + (parseFloat(reviseForm.hra) || 0) + (parseFloat(reviseForm.allowances) || 0)
    : 0;
  const oldGross = selectedEmpData ? selectedEmpData.gross_salary : 0;

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
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`segmented-tab ${activeTab === tab ? 'active' : ''}`}
            >
              {tab === 'Components' && <Banknote size={15}/>}
              {tab === 'Revise Compensation' && <Award size={15}/>}
              <span>{tab}</span>
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        {isHrOrAdmin && activeTab === 'Components' && (
          <button
            className="btn-primary"
            onClick={openCreate}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700
            }}
          >
            <Plus size={16}/> Add Component
          </button>
        )}
      </div>

      {/* COMPONENTS TAB */}
      {activeTab === 'Components' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Earnings Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16}/>
                </div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '15px', fontWeight: 800 }}>Earnings & Allowances</h3>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '2px 10px' }}>
                {earnings.length} Active
              </span>
            </div>

            {loading ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '30px' }}>Loading earnings...</p>
            ) : earnings.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '36px', textAlign: 'center' }}>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>No earning components created yet.</p>
              </div>
            ) : (
              earnings.map(c => (
                <div
                  key={c.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '14px',
                    padding: '16px 18px',
                    marginBottom: '12px',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                    opacity: c.is_active ? 1 : 0.6,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 23, 42, 0.07)'; e.currentTarget.style.borderColor = '#10b981'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.03)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: '#ecfdf5', border: '1px solid #a7f3d0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669'
                      }}>
                        <TrendingUp size={16}/>
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '14.5px', color: '#0f172a' }}>{c.name}</div>
                        <div style={{ fontSize: '12.5px', color: '#059669', fontWeight: 700, marginTop: '2px' }}>
                          {c.is_percentage ? `${c.percentage}% of gross salary` : `₹${c.amount?.toLocaleString('en-IN')} fixed`}
                          {c.is_variable && (
                            <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                              VARIABLE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isHrOrAdmin && c.is_active && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => openEdit(c)}
                          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#475569', padding: '5px 7px', display: 'flex', alignItems: 'center' }}
                          title="Edit Component"
                        >
                          <Edit2 size={13}/>
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', color: '#ef4444', padding: '5px 7px', display: 'flex', alignItems: 'center' }}
                          title="Deactivate Component"
                        >
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    )}
                  </div>

                  {c.description && (
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0 0', lineHeight: '1.4' }}>
                      {c.description}
                    </p>
                  )}
                  {!c.is_active && (
                    <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 700, marginTop: '6px', display: 'block' }}>
                      ● Deactivated
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Deductions Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingDown size={16}/>
                </div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '15px', fontWeight: 800 }}>Deductions & Levies</h3>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '12px', padding: '2px 10px' }}>
                {deductions.length} Active
              </span>
            </div>

            {loading ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '30px' }}>Loading deductions...</p>
            ) : deductions.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '36px', textAlign: 'center' }}>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>No deduction components created yet.</p>
              </div>
            ) : (
              deductions.map(c => (
                <div
                  key={c.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '14px',
                    padding: '16px 18px',
                    marginBottom: '12px',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                    opacity: c.is_active ? 1 : 0.6,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 23, 42, 0.07)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.03)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: '#fef2f2', border: '1px solid #fecaca',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444'
                      }}>
                        <TrendingDown size={16}/>
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '14.5px', color: '#0f172a' }}>{c.name}</div>
                        <div style={{ fontSize: '12.5px', color: '#dc2626', fontWeight: 700, marginTop: '2px' }}>
                          {c.is_percentage ? `${c.percentage}% of gross salary` : `₹${c.amount?.toLocaleString('en-IN')} fixed`}
                          {c.is_variable && (
                            <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                              VARIABLE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isHrOrAdmin && c.is_active && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => openEdit(c)}
                          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#475569', padding: '5px 7px', display: 'flex', alignItems: 'center' }}
                          title="Edit Component"
                        >
                          <Edit2 size={13}/>
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', color: '#ef4444', padding: '5px 7px', display: 'flex', alignItems: 'center' }}
                          title="Deactivate Component"
                        >
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    )}
                  </div>

                  {c.description && (
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0 0', lineHeight: '1.4' }}>
                      {c.description}
                    </p>
                  )}
                  {!c.is_active && (
                    <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 700, marginTop: '6px', display: 'block' }}>
                      ● Deactivated
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* REVISE COMPENSATION TAB */}
      {activeTab === 'Revise Compensation' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px', alignItems: 'start' }}>
          {/* Form */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <UserCog size={20} style={{ color: 'var(--accent)' }}/>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>Revise Employee Compensation</h3>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Select Employee *</label>
              <select className="form-control" value={reviseForm.employee_id} onChange={e => setReviseForm(f => ({ ...f, employee_id: e.target.value }))}>
                <option value="">— Select Employee —</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.department})</option>
                ))}
              </select>
            </div>

            {selectedEmpData && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Basic Salary (₹)</label>
                    <input type="number" className="form-control" min={0} step={500}
                      value={reviseForm.basic_salary}
                      onChange={e => setReviseForm(f => ({ ...f, basic_salary: e.target.value }))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">HRA (₹)</label>
                    <input type="number" className="form-control" min={0} step={100}
                      value={reviseForm.hra}
                      onChange={e => setReviseForm(f => ({ ...f, hra: e.target.value }))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Allowances (₹)</label>
                    <input type="number" className="form-control" min={0} step={100}
                      value={reviseForm.allowances}
                      onChange={e => setReviseForm(f => ({ ...f, allowances: e.target.value }))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Other Deductions (₹)</label>
                    <input type="number" className="form-control" min={0}
                      value={reviseForm.deductions}
                      onChange={e => setReviseForm(f => ({ ...f, deductions: e.target.value }))}/>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Revision Note</label>
                  <textarea className="form-control" rows={2} placeholder="Reason for revision (e.g. annual appraisal)..."
                    value={reviseForm.revision_note}
                    onChange={e => setReviseForm(f => ({ ...f, revision_note: e.target.value }))}/>
                </div>
                <button className="btn-primary" onClick={handleRevise} disabled={revising} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {revising ? <><RefreshCw size={15} className="spin"/> Processing...</> : <><Check size={15}/> Apply Compensation Revision</>}
                </button>
              </>
            )}
            {!selectedEmpData && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Select an employee above to view and revise their compensation
              </div>
            )}
          </div>

          {/* Preview panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Current employee info */}
            {selectedEmpData && (
              <div className="card" style={{ padding: '18px' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Current Compensation</h4>
                {[
                  ['Basic Salary', selectedEmpData.basic_salary],
                  ['HRA', selectedEmpData.hra],
                  ['Allowances', selectedEmpData.allowances],
                  ['Other Deductions', selectedEmpData.deductions],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>₹{(val || 0).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: '14px', fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-primary)' }}>Current Gross</span>
                  <span style={{ color: 'var(--accent)' }}>₹{oldGross.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {/* New gross preview */}
            {selectedEmpData && (reviseForm.basic_salary !== '' || reviseForm.hra !== '' || reviseForm.allowances !== '') && (
              <div className="card" style={{ padding: '18px', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.05)' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '13px', color: '#818cf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Preview After Revision</h4>
                {[
                  ['Basic Salary', parseFloat(reviseForm.basic_salary) || 0],
                  ['HRA', parseFloat(reviseForm.hra) || 0],
                  ['Allowances', parseFloat(reviseForm.allowances) || 0],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>₹{val.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px', fontSize: '14px', fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-primary)' }}>New Gross</span>
                  <span style={{ color: '#10b981' }}>₹{newGross.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ fontSize: '12px', color: newGross >= oldGross ? '#10b981' : '#ef4444', textAlign: 'right' }}>
                  {newGross >= oldGross ? '▲' : '▼'} {Math.abs(newGross - oldGross).toLocaleString('en-IN')} ({newGross >= oldGross ? '+' : ''}{oldGross > 0 ? (((newGross - oldGross) / oldGross) * 100).toFixed(1) : 0}%)
                </div>
              </div>
            )}

            {/* Info card */}
            <div className="card" style={{ padding: '16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '6px' }}>ℹ️ Note</strong>
                Compensation changes take effect on the <strong>next payroll generation</strong>. This action is fully audit-logged and irreversible without another revision.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Component Form Modal */}
      {showForm && (
        <div
          className="modal-backdrop"
          onClick={() => setShowForm(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px'
          }}
        >
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '500px', width: '100%', borderRadius: '16px', background: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)', overflow: 'hidden', border: '1px solid #cbd5e1'
            }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' }}>
                  <Banknote size={18}/>
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  {editComp ? 'Edit Salary Component' : 'Add New Salary Component'}
                </h3>
              </div>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18}/>
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                  Component Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  className="form-control"
                  placeholder="e.g. Performance Bonus / Internet Allowance"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
                  Classification
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['EARNING','DEDUCTION'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, component_type: t }))}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px',
                        border: form.component_type === t ? `2px solid ${TYPE_CONFIG[t].color}` : '1px solid #cbd5e1',
                        background: form.component_type === t ? TYPE_CONFIG[t].bg : '#ffffff',
                        color: form.component_type === t ? TYPE_CONFIG[t].color : '#64748b',
                        cursor: 'pointer', fontSize: '13px', fontWeight: 700, transition: 'all 0.15s ease',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                    >
                      {TYPE_CONFIG[t].icon} {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
                  Calculation Method
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[false, true].map(isP => (
                    <button
                      key={String(isP)}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, is_percentage: isP }))}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px',
                        border: form.is_percentage === isP ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: form.is_percentage === isP ? '#eff6ff' : '#ffffff',
                        color: form.is_percentage === isP ? '#1d4ed8' : '#64748b',
                        cursor: 'pointer', fontSize: '13px', fontWeight: 700, transition: 'all 0.15s ease'
                      }}
                    >
                      {isP ? '% Percentage of Gross' : '₹ Fixed Amount'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                  {form.is_percentage ? 'Percentage Rate (%)' : 'Fixed Amount (₹)'} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  min={0}
                  step={form.is_percentage ? 0.1 : 100}
                  value={form.is_percentage ? form.percentage : form.amount}
                  onChange={e => form.is_percentage
                    ? setForm(f => ({ ...f, percentage: e.target.value }))
                    : setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder={form.is_percentage ? 'e.g. 10' : 'e.g. 5000'}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <input
                  type="checkbox"
                  id="is_variable"
                  checked={form.is_variable}
                  onChange={e => setForm(f => ({ ...f, is_variable: e.target.checked }))}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="is_variable" style={{ fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  Variable Component (computed dynamically based on monthly payroll settings)
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                  Description <span style={{ color: '#94a3b8', fontWeight: 500 }}>(optional)</span>
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Optional note for employees on their pay slips..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : <><Check size={16}/> {editComp ? 'Update Component' : 'Create Component'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
