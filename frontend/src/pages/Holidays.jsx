import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Trash2, Edit2, Globe, MapPin, Star, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const TYPE_CONFIG = {
  NATIONAL: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    text: '#1d4ed8',
    pill: '#2563eb',
    icon: <Globe size={13}/>
  },
  REGIONAL: {
    bg: '#ecfdf5',
    border: '#a7f3d0',
    text: '#047857',
    pill: '#059669',
    icon: <MapPin size={13}/>
  },
  OPTIONAL: {
    bg: '#fffbeb',
    border: '#fde68a',
    text: '#b45309',
    pill: '#d97706',
    icon: <Star size={13}/>
  }
};

export default function Holidays({ showToast }) {
  const { currentUser } = useAuth();
  const isHrOrAdmin = currentUser?.role !== 'EMPLOYEE';

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'yearly'
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editHoliday, setEditHoliday] = useState(null);
  const [form, setForm] = useState({ name: '', date: '', holiday_type: 'NATIONAL', description: '', region: '' });
  const [saving, setSaving] = useState(false);

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const params = { year: viewYear, active_only: true };
      const data = await api.getHolidays(params);
      setHolidays(data);
    } catch (e) {
      if (showToast) showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [viewYear, showToast]);

  useEffect(() => { loadHolidays(); }, [loadHolidays]);

  const getHolidaysForDate = (year, month, day) => {
    const d = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return holidays.filter(h => h.date === d);
  };

  const buildMonthGrid = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = [];
    let day = 1;
    for (let row = 0; row < 6; row++) {
      const week = [];
      for (let col = 0; col < 7; col++) {
        const cellIndex = row * 7 + col;
        if (cellIndex < firstDay || day > daysInMonth) {
          week.push(null);
        } else {
          week.push(day++);
        }
      }
      grid.push(week);
      if (day > daysInMonth) break;
    }
    return grid;
  };

  const openCreate = () => {
    setEditHoliday(null);
    setForm({ name: '', date: '', holiday_type: 'NATIONAL', description: '', region: '' });
    setShowForm(true);
  };

  const openEdit = (h) => {
    setEditHoliday(h);
    setForm({
      name: h.name,
      date: h.date,
      holiday_type: h.holiday_type,
      description: h.description || '',
      region: h.region || ''
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.date) {
      if (showToast) showToast('Name and date are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.region) delete payload.region;
      if (!payload.description) delete payload.description;
      if (editHoliday) {
        await api.updateHoliday(editHoliday.id, payload);
        if (showToast) showToast('Holiday updated successfully', 'success');
      } else {
        await api.createHoliday(payload);
        if (showToast) showToast('Holiday created & employees notified', 'success');
      }
      setShowForm(false);
      loadHolidays();
    } catch (e) {
      if (showToast) showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (h) => {
    if (!window.confirm(`Deactivate "${h.name}"?`)) return;
    try {
      await api.deleteHoliday(h.id);
      if (showToast) showToast('Holiday deactivated', 'success');
      loadHolidays();
    } catch (e) {
      if (showToast) showToast(e.message, 'error');
    }
  };

  const monthHolidays = holidays.filter(h => {
    const d = new Date(h.date);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });

  const grid = buildMonthGrid(viewYear, viewMonth);

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Unified Executive Controls & Navigation Bar */}
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
        {/* Left: Month/Year Navigator & Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => {
                if (viewMode === 'monthly') {
                  setViewMonth(m => m === 0 ? 11 : m - 1);
                  if (viewMonth === 0) setViewYear(y => y - 1);
                } else {
                  setViewYear(y => y - 1);
                }
              }}
              title="Previous"
              style={{
                width: '32px', height: '32px', background: '#f8fafc', border: '1px solid #cbd5e1',
                borderRadius: '8px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <ChevronLeft size={16}/>
            </button>

            <div style={{
              minWidth: viewMode === 'monthly' ? '170px' : '100px',
              textAlign: 'center', fontSize: '16px', fontWeight: 800, color: '#0f172a'
            }}>
              {viewMode === 'monthly' ? `${MONTHS[viewMonth]} ${viewYear}` : `Year ${viewYear}`}
            </div>

            <button
              onClick={() => {
                if (viewMode === 'monthly') {
                  setViewMonth(m => m === 11 ? 0 : m + 1);
                  if (viewMonth === 11) setViewYear(y => y + 1);
                } else {
                  setViewYear(y => y + 1);
                }
              }}
              title="Next"
              style={{
                width: '32px', height: '32px', background: '#f8fafc', border: '1px solid #cbd5e1',
                borderRadius: '8px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <ChevronRight size={16}/>
            </button>
          </div>

          <span style={{
            fontSize: '11px', fontWeight: 700, background: '#eff6ff', color: '#2563eb',
            border: '1px solid #bfdbfe', borderRadius: '12px', padding: '2px 9px'
          }}>
            {holidays.length} HOLIDAYS IN {viewYear}
          </span>
        </div>

        {/* Center: Legend Badges */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
            <div
              key={type}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '3px 10px', borderRadius: '20px',
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                color: cfg.text, fontSize: '11px', fontWeight: 800, letterSpacing: '0.3px'
              }}
            >
              {cfg.icon}
              <span>{type}</span>
            </div>
          ))}
        </div>

        {/* Right: View Mode & Add Holiday Button */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="segmented-tabs">
            {['monthly', 'yearly'].map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`segmented-tab ${viewMode === m ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: '12.5px' }}
              >
                {m === 'monthly' ? 'Monthly View' : '12-Month'}
              </button>
            ))}
          </div>

          {isHrOrAdmin && (
            <button
              className="btn-primary"
              onClick={openCreate}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700
              }}
            >
              <Plus size={15}/> Add Holiday
            </button>
          )}
        </div>
      </div>

      {viewMode === 'monthly' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
          {/* Calendar Grid Card */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)'
          }}>
            {/* Header days */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
              background: '#f8fafc', borderBottom: '2px solid #e2e8f0'
            }}>
              {DAYS.map((d, idx) => (
                <div
                  key={d}
                  style={{
                    textAlign: 'center', padding: '12px 0',
                    fontSize: '12px', fontWeight: 800,
                    color: idx === 0 || idx === 6 ? '#ef4444' : '#475569',
                    letterSpacing: '0.4px'
                  }}
                >
                  {d.toUpperCase()}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {grid.map((week, wi) => (
              <div
                key={wi}
                style={{
                  display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                  borderBottom: wi < grid.length - 1 ? '1px solid #e2e8f0' : 'none'
                }}
              >
                {week.map((day, di) => {
                  const dayHolidays = day ? getHolidaysForDate(viewYear, viewMonth, day) : [];
                  const isToday = day && viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
                  const isWeekend = di === 0 || di === 6;

                  return (
                    <div
                      key={di}
                      style={{
                        minHeight: '100px', padding: '10px',
                        borderRight: di < 6 ? '1px solid #e2e8f0' : 'none',
                        background: !day ? '#f8fafc' : isToday ? '#eff6ff' : dayHolidays.length > 0 ? '#faf5ff' : '#ffffff',
                        position: 'relative', transition: 'background 0.15s ease'
                      }}
                    >
                      {day && (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '28px', height: '28px', borderRadius: '50%',
                              fontSize: '13px', fontWeight: isToday ? 800 : 700,
                              background: isToday ? '#2563eb' : 'transparent',
                              color: isToday ? '#ffffff' : isWeekend ? '#ef4444' : '#1e293b'
                            }}>
                              {day}
                            </span>
                            {isToday && (
                              <span style={{ fontSize: '10px', fontWeight: 800, color: '#2563eb', background: '#dbeafe', padding: '1px 6px', borderRadius: '4px' }}>
                                TODAY
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {dayHolidays.map(h => {
                              const cfg = TYPE_CONFIG[h.holiday_type] || TYPE_CONFIG.NATIONAL;
                              return (
                                <div
                                  key={h.id}
                                  onClick={() => openEdit(h)}
                                  style={{
                                    padding: '4px 8px', borderRadius: '6px',
                                    fontSize: '11px', fontWeight: 700,
                                    background: cfg.bg, color: cfg.text,
                                    border: `1px solid ${cfg.border}`,
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                                  }}
                                  title={`${h.name} (${h.holiday_type})`}
                                >
                                  {cfg.icon}
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Month Holidays Side Panel */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ color: '#0f172a', fontSize: '15px', fontWeight: 800, margin: 0 }}>
                {MONTHS[viewMonth]} Holidays
              </h3>
              <span style={{
                fontSize: '12px', fontWeight: 700,
                background: '#eff6ff', color: '#2563eb',
                border: '1px solid #bfdbfe', borderRadius: '12px', padding: '2px 10px'
              }}>
                {monthHolidays.length} Days
              </span>
            </div>

            {loading ? (
              <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Loading holidays...</p>
            ) : monthHolidays.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 12px' }}>
                <Calendar size={36} style={{ color: '#cbd5e1', marginBottom: '10px' }}/>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#334155' }}>No holidays this month</div>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0' }}>Standard work schedule applies.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {monthHolidays.map(h => {
                  const cfg = TYPE_CONFIG[h.holiday_type] || TYPE_CONFIG.NATIONAL;
                  return (
                    <div
                      key={h.id}
                      style={{
                        padding: '14px 16px', borderRadius: '12px',
                        background: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: cfg.pill }}>
                            {cfg.icon}
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                            {h.name}
                          </span>
                        </div>

                        {isHrOrAdmin && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => openEdit(h)}
                              title="Edit Holiday"
                              style={{
                                background: '#ffffff', border: '1px solid #cbd5e1',
                                borderRadius: '6px', cursor: 'pointer', color: '#475569',
                                padding: '5px 7px', display: 'flex', alignItems: 'center'
                              }}
                            >
                              <Edit2 size={13}/>
                            </button>
                            <button
                              onClick={() => handleDelete(h)}
                              title="Deactivate"
                              style={{
                                background: '#fef2f2', border: '1px solid #fecaca',
                                borderRadius: '6px', cursor: 'pointer', color: '#ef4444',
                                padding: '5px 7px', display: 'flex', alignItems: 'center'
                              }}
                            >
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        )}
                      </div>

                      <div style={{
                        fontSize: '12px', fontWeight: 700,
                        color: cfg.text, marginTop: '6px'
                      }}>
                        📅 {new Date(h.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>

                      {h.region && (
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                          📍 Region: <strong>{h.region}</strong>
                        </div>
                      )}

                      {h.description && (
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>
                          {h.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Yearly 12-month Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
          {MONTHS.map((month, mi) => {
            const monthHols = holidays.filter(h => {
              const d = new Date(h.date);
              return d.getFullYear() === viewYear && d.getMonth() === mi;
            });

            return (
              <div
                key={mi}
                onClick={() => { setViewMonth(mi); setViewMode('monthly'); }}
                style={{
                  background: '#ffffff', border: '1px solid #cbd5e1',
                  borderRadius: '14px', padding: '18px', cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(15,23,42,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>{month}</span>
                  {monthHols.length > 0 && (
                    <span style={{
                      fontSize: '11px', fontWeight: 800,
                      background: '#eff6ff', color: '#2563eb',
                      border: '1px solid #bfdbfe', borderRadius: '10px', padding: '2px 8px'
                    }}>
                      {monthHols.length} {monthHols.length === 1 ? 'holiday' : 'holidays'}
                    </span>
                  )}
                </div>

                {monthHols.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>No holidays recorded</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {monthHols.slice(0, 3).map(h => {
                      const cfg = TYPE_CONFIG[h.holiday_type] || TYPE_CONFIG.NATIONAL;
                      return (
                        <div
                          key={h.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '4px 8px', borderRadius: '6px', background: cfg.bg,
                            border: `1px solid ${cfg.border}`
                          }}
                        >
                          <span style={{ color: cfg.text, flexShrink: 0 }}>{cfg.icon}</span>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {h.name}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: cfg.text, flexShrink: 0 }}>
                            {new Date(h.date).getDate()}
                          </span>
                        </div>
                      );
                    })}
                    {monthHols.length > 3 && (
                      <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, marginTop: '2px' }}>
                        +{monthHols.length - 3} more holidays
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog */}
      {showForm && (
        <div
          className="modal-backdrop"
          onClick={() => setShowForm(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px'
          }}
        >
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '500px',
              width: '100%',
              borderRadius: '16px',
              background: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(15, 23, 42, 0.08)',
              overflow: 'hidden',
              border: '1px solid #cbd5e1'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  border: '1px solid #bfdbfe', color: '#2563eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Calendar size={18}/>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {editHoliday ? 'Edit Company Holiday' : 'Add New Company Holiday'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                    {editHoliday ? 'Update schedule and notify workforce' : 'Schedule a new official company or regional holiday'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: '#f1f5f9', border: 'none', borderRadius: '8px',
                  width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#64748b', transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
              >
                <X size={18}/>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', background: '#ffffff' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                  Holiday Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  className="form-control"
                  placeholder="e.g. Diwali / Republic Day / Founder's Day"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                    Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                    Holiday Type
                  </label>
                  <select
                    className="form-control"
                    value={form.holiday_type}
                    onChange={e => setForm(f => ({ ...f, holiday_type: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none'
                    }}
                  >
                    <option value="NATIONAL">National / Company-Wide</option>
                    <option value="REGIONAL">Regional</option>
                    <option value="OPTIONAL">Optional / Restricted</option>
                  </select>
                </div>
              </div>

              {form.holiday_type === 'REGIONAL' && (
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                    Region Name
                  </label>
                  <input
                    className="form-control"
                    placeholder="e.g. South Region, Tamil Nadu, Karnataka"
                    value={form.region}
                    onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none'
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                  Description <span style={{ color: '#94a3b8', fontWeight: 500 }}>(optional)</span>
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Brief note or celebration details..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', resize: 'vertical'
                  }}
                />
              </div>

              <div style={{
                padding: '10px 14px',
                background: '#eff6ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
                fontSize: '12px',
                color: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Globe size={16} style={{ flexShrink: 0 }}/>
                <span>Adding this holiday will notify all active employees via the Notification Center.</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              borderTop: '1px solid #e2e8f0',
              padding: '16px 24px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              background: '#f8fafc'
            }}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '9px 18px', borderRadius: '8px',
                  border: '1px solid #cbd5e1', background: '#ffffff',
                  color: '#475569', fontWeight: 700, fontSize: '13px', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '9px 20px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Saving...' : <><Check size={16}/> {editHoliday ? 'Update Holiday' : 'Create Holiday'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
