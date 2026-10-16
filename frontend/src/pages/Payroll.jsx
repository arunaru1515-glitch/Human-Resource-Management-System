import React, { useState, useEffect } from 'react';
import {
  Banknote, FileText, Lock, CheckCircle, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Zap, Award, Clock, X
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MONTH_NAMES = ["","January","February","March","April","May","June",
                     "July","August","September","October","November","December"];

const STATUS_CONFIG = {
  DRAFT:     { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: 'Draft' },
  PROCESSED: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Processed' },
  LOCKED:    { color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  label: 'Locked' },
  PAID:      { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Paid' },
};

function PayslipDrawer({ payroll, onClose, onDownload }) {
  if (!payroll) return null;
  const gross = payroll.gross_salary || 0;
  const earnings = [
    { label: 'Basic Salary',           value: payroll.basic_salary || 0 },
    { label: 'House Rent Allowance',    value: payroll.hra || 0 },
    { label: 'Allowances',             value: payroll.allowances || 0 },
    { label: 'Bonus',                  value: payroll.bonus || 0 },
    { label: 'Overtime Pay (1.5x)',    value: payroll.overtime_pay || 0 },
    { label: 'Performance Allowance',  value: payroll.performance_allowance || 0 },
  ].filter(e => e.value > 0);

  const deductions = [
    { label: 'Loss of Pay Deduction',  value: payroll.lop_deduction || 0 },
    { label: 'TDS (Income Tax 5%)',    value: payroll.tax_deduction || 0 },
    { label: 'PF Contribution (12%)',  value: payroll.pf_deduction || 0 },
    { label: 'Professional Tax',       value: payroll.professional_tax || 0 },
    { label: 'Other Deductions',       value: payroll.other_deductions || 0 },
  ].filter(d => d.value > 0);

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px', maxWidth: '95vw',
      background: 'var(--bg-card)', borderLeft: '1px solid var(--border)',
      boxShadow: '-20px 0 60px rgba(0,0,0,0.4)', zIndex: 9000,
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
      animation: 'slideInRight 0.25s ease'
    }}>
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700 }}>Pay Slip Details</h3>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>{payroll.employee_name} · {MONTH_NAMES[payroll.month]} {payroll.year}</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20}/></button>
      </div>

      <div style={{ padding: '20px', flex: 1 }}>
        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Days Present', value: payroll.present_days || 0, unit: 'days', color: '#10b981' },
            { label: 'Leave Days', value: payroll.approved_leave_days || 0, unit: 'days', color: '#f59e0b' },
            { label: 'LOP Days', value: payroll.lop_days || 0, unit: 'days', color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-subtle)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Earnings */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <TrendingUp size={14} style={{ color: '#10b981' }}/>
            <span style={{ fontWeight: 600, fontSize: '13px', color: '#10b981' }}>Earnings</span>
          </div>
          {earnings.map(e => (
            <div key={e.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{e.label}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>₹{e.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px', fontSize: '14px', fontWeight: 700 }}>
            <span style={{ color: 'var(--text-primary)' }}>Gross Earnings</span>
            <span style={{ color: '#10b981' }}>₹{gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Deductions */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <TrendingDown size={14} style={{ color: '#ef4444' }}/>
            <span style={{ fontWeight: 600, fontSize: '13px', color: '#ef4444' }}>Deductions</span>
          </div>
          {deductions.map(d => (
            <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{d.label}</span>
              <span style={{ color: '#ef4444', fontWeight: 500 }}>-₹{d.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px', fontSize: '14px', fontWeight: 700 }}>
            <span style={{ color: 'var(--text-primary)' }}>Total Deductions</span>
            <span style={{ color: '#ef4444' }}>-₹{(payroll.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Net Pay */}
        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)', borderRadius: '12px', padding: '18px', border: '1px solid rgba(99,102,241,0.3)', textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Take-Home Pay</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#818cf8' }}>₹{(payroll.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          {payroll.is_credited && (
            <div style={{ fontSize: '11px', color: '#10b981', marginTop: '6px' }}>
              ✓ Credited · Ref: {payroll.payment_reference}
            </div>
          )}
        </div>

        {/* Status & Badges */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {payroll.status && (
            <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, background: STATUS_CONFIG[payroll.status]?.bg, color: STATUS_CONFIG[payroll.status]?.color }}>
              {STATUS_CONFIG[payroll.status]?.label}
            </span>
          )}
          {payroll.is_locked && <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>🔒 Locked</span>}
          {(payroll.overtime_pay || 0) > 0 && <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>⚡ OT Paid</span>}
          {(payroll.bonus || 0) > 0 && <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}>🎁 Bonus</span>}
        </div>

        <button className="btn-primary" onClick={() => onDownload(payroll.id, payroll.employee_code)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <FileText size={15}/> Download PDF Salary Slip
        </button>
      </div>
    </div>
  );
}

const Payroll = ({ showToast }) => {
  const { currentUser } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  // Advanced generate options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bonus, setBonus] = useState(0);
  const [performanceAllowance, setPerformanceAllowance] = useState(0);

  const isHrOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'HR';

  useEffect(() => { loadPayrolls(); }, [month, year]);

  const loadPayrolls = async () => {
    setLoading(true);
    try {
      const params = { month: parseInt(month), year: parseInt(year) };
      if (currentUser?.role === 'EMPLOYEE') params.employee_id = currentUser.employeeId;
      const list = await api.getPayrolls(params);
      setPayrolls(list || []);
    } catch (err) {
      showToast && showToast('Failed to load payroll: ' + err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    if (!window.confirm(`Process payroll for ${MONTH_NAMES[parseInt(month)]} ${year}? Bonus: ₹${bonus}, Perf. Allowance: ₹${performanceAllowance}`)) return;
    setProcessing(true);
    try {
      const res = await api.generatePayroll(parseInt(month), parseInt(year), null, parseFloat(bonus) || 0, parseFloat(performanceAllowance) || 0);
      const count = Array.isArray(res) ? res.length : 0;
      showToast && showToast(`Payroll processed for ${count} employees!`, 'success');
      setShowAdvanced(false);
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
      showToast && showToast('Failed: ' + err.message, 'danger');
    }
  };

  const handleLockPayroll = async (id) => {
    if (!window.confirm('Lock this payroll? Cannot be modified after locking.')) return;
    try {
      await api.lockPayroll(id);
      showToast && showToast('Payroll locked!', 'success');
      loadPayrolls();
    } catch (err) {
      showToast && showToast('Failed: ' + err.message, 'danger');
    }
  };

  const handleDownloadSlip = async (payrollId, empCode) => {
    try {
      showToast && showToast('Generating PDF salary slip...', 'info');
      const slips = await api.getSalarySlips();
      const slip = slips.find(s => s.payroll_id === payrollId);
      if (slip) {
        await api.downloadSalarySlip(slip.id, `Payslip_${empCode}_${month}_${year}.pdf`);
        showToast && showToast('Slip downloaded!', 'success');
      } else {
        showToast && showToast('Slip not ready. Process payroll first.', 'warning');
      }
    } catch (err) {
      showToast && showToast('Failed: ' + err.message, 'danger');
    }
  };

  // Summary stats
  const totalNet = payrolls.reduce((s, p) => s + (p.net_salary || 0), 0);
  const totalOT = payrolls.reduce((s, p) => s + (p.overtime_pay || 0), 0);
  const totalBonus = payrolls.reduce((s, p) => s + (p.bonus || 0), 0);

  return (
    <div className="page-container" style={{ padding: '4px 0' }}>
      {/* Top Filter & Action Control Card */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Left: Period Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Payroll Cycle:</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              className="form-control"
              value={month}
              onChange={e => setMonth(e.target.value)}
              style={{
                minWidth: '150px',
                padding: '8px 14px',
                fontSize: '13.5px',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#0f172a'
              }}
            >
              {MONTH_NAMES.slice(1).map((m, i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>

            <select
              className="form-control"
              value={year}
              onChange={e => setYear(e.target.value)}
              style={{
                minWidth: '110px',
                padding: '8px 14px',
                fontSize: '13.5px',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#0f172a'
              }}
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Actions */}
        {isHrOrAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn-secondary"
              onClick={() => setShowAdvanced(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600
              }}
            >
              <Zap size={14} style={{ color: '#f59e0b' }}/>
              Advanced Settings {showAdvanced ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </button>

            <button
              className="btn-primary"
              onClick={handleGeneratePayroll}
              disabled={processing}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700
              }}
            >
              <Banknote size={16}/>
              {processing ? 'Processing...' : 'Process Payroll'}
            </button>
          </div>
        )}
      </div>

      {/* Advanced options panel */}
      {isHrOrAdmin && showAdvanced && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #bfdbfe',
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: '#eff6ff', color: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Award size={16}/>
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>Global Adjustments for {MONTH_NAMES[parseInt(month)]} {year}</span>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Applied company-wide across all employee salary statements</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                Performance Bonus (₹) — per employee
              </label>
              <input
                type="number"
                className="form-control"
                min={0}
                step={500}
                value={bonus}
                onChange={e => setBonus(e.target.value)}
                placeholder="0"
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                Performance Allowance (₹) — per employee
              </label>
              <input
                type="number"
                className="form-control"
                min={0}
                step={500}
                value={performanceAllowance}
                onChange={e => setPerformanceAllowance(e.target.value)}
                placeholder="0"
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
              />
            </div>
          </div>

          <div style={{
            marginTop: '14px', padding: '10px 14px',
            background: '#f8fafc', borderRadius: '8px',
            border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569'
          }}>
            ℹ️ Statutory rules auto-applied: <strong>TDS (5%)</strong>, <strong>PF (12% of basic)</strong>, <strong>Professional Tax (₹200)</strong>, and <strong>Overtime (1.5× hourly wage)</strong> computed from biometric shift logs.
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      {isHrOrAdmin && payrolls.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {[
            {
              label: 'Payees Processed',
              value: `${payrolls.length} Employees`,
              icon: '👥',
              bg: '#eff6ff',
              border: '#bfdbfe',
              text: '#1d4ed8'
            },
            {
              label: 'Total Net Disbursed',
              value: `₹${totalNet.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              icon: '💰',
              bg: '#ecfdf5',
              border: '#a7f3d0',
              text: '#047857'
            },
            {
              label: 'Total Overtime Paid',
              value: `₹${totalOT.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              icon: '⚡',
              bg: '#fffbeb',
              border: '#fde68a',
              text: '#b45309'
            },
            {
              label: 'Total Bonus Awarded',
              value: `₹${totalBonus.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              icon: '🎁',
              bg: '#faf5ff',
              border: '#e9d5ff',
              text: '#7e22ce'
            },
          ].map(s => (
            <div
              key={s.label}
              style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: '14px',
                padding: '16px 20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: s.text }}>
                  {s.value}
                </div>
              </div>
              <span style={{ fontSize: '26px' }}>{s.icon}</span>
            </div>
          ))}
        </div>
      )}

      {/* Payroll Data Table Card */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>
              Salary Statement — {MONTH_NAMES[parseInt(month)]} {year}
            </span>
          </div>
          <span style={{
            fontSize: '12px',
            fontWeight: 700,
            background: '#eff6ff',
            color: '#2563eb',
            border: '1px solid #bfdbfe',
            borderRadius: '12px',
            padding: '2px 10px'
          }}>
            {payrolls.length} employee record(s)
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 800, color: '#475569' }}>Employee</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 800, color: '#475569' }}>Gross</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 800, color: '#475569' }}>Bonus</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 800, color: '#475569' }}>OT Pay</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 800, color: '#475569' }}>PF (12%)</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 800, color: '#475569' }}>Prof. Tax</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 800, color: '#475569' }}>LOP</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 800, color: '#475569' }}>Net Take-Home</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 800, color: '#475569' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 800, color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Loading payroll records...
                  </td>
                </tr>
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                    <Banknote size={40} style={{ color: '#cbd5e1', marginBottom: '12px' }}/>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#334155' }}>
                      No payroll records found for {MONTH_NAMES[parseInt(month)]} {year}
                    </div>
                    {isHrOrAdmin && (
                      <p style={{ color: '#94a3b8', fontSize: '12px', margin: '6px 0 0' }}>
                        Click "Process Payroll" above to run computation for this period.
                      </p>
                    )}
                  </td>
                </tr>
              ) : payrolls.map(p => {
                const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.DRAFT;
                return (
                  <tr
                    key={p.id}
                    style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                    onClick={() => setSelectedPayroll(p)}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>{p.employee_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{p.employee_code} · {p.department}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>
                      ₹{(p.gross_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '12px 16px', color: (p.bonus || 0) > 0 ? '#7e22ce' : '#94a3b8', fontWeight: (p.bonus || 0) > 0 ? 700 : 500 }}>
                      {(p.bonus || 0) > 0 ? `₹${p.bonus.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: (p.overtime_pay || 0) > 0 ? '#b45309' : '#94a3b8', fontWeight: (p.overtime_pay || 0) > 0 ? 700 : 500 }}>
                      {(p.overtime_pay || 0) > 0 ? `₹${p.overtime_pay.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569', fontSize: '13px' }}>
                      ₹{(p.pf_deduction || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569', fontSize: '13px' }}>
                      ₹{(p.professional_tax || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px 16px', color: (p.lop_days || 0) > 0 ? '#ef4444' : '#94a3b8', fontWeight: (p.lop_days || 0) > 0 ? 700 : 500, fontSize: '13px' }}>
                      {(p.lop_days || 0) > 0 ? `${p.lop_days} days` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 800, fontSize: '14.5px', color: '#059669' }}>
                        ₹{(p.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '11px',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontWeight: 700,
                        background: p.is_credited ? '#ecfdf5' : '#fffbeb',
                        color: p.is_credited ? '#047857' : '#b45309',
                        border: `1px solid ${p.is_credited ? '#a7f3d0' : '#fde68a'}`
                      }}>
                        {p.is_credited ? 'Credited' : statusCfg.label}
                        {p.is_locked && ' 🔒'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                        {isHrOrAdmin && !p.is_locked && !p.is_credited && (
                          <button
                            onClick={() => handleSimulateCredit(p.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '7px',
                              fontSize: '12px',
                              fontWeight: 700,
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#047857',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                            title="Simulate Bank Transfer"
                          >
                            <CheckCircle size={13}/> Credit
                          </button>
                        )}

                        {isHrOrAdmin && !p.is_locked && (
                          <button
                            onClick={() => handleLockPayroll(p.id)}
                            style={{
                              padding: '6px 9px',
                              borderRadius: '7px',
                              fontSize: '12px',
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#475569',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                            title="Lock Payroll Record"
                          >
                            <Lock size={13}/>
                          </button>
                        )}

                        <button
                          onClick={() => handleDownloadSlip(p.id, p.employee_code)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '7px',
                            fontSize: '12px',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            border: 'none',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                          }}
                        >
                          <FileText size={13}/> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip Details Drawer */}
      {selectedPayroll && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 8999 }}
            onClick={() => setSelectedPayroll(null)}
          />
          <PayslipDrawer payroll={selectedPayroll} onClose={() => setSelectedPayroll(null)} onDownload={handleDownloadSlip}/>
        </>
      )}
    </div>
  );
};

export default Payroll;
