import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search } from 'lucide-react';
import api from '../services/api';

const AuditLogs = ({ showToast }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const list = await api.getAuditLogs();
      setLogs(list || []);
    } catch (err) {
      showToast && showToast('Failed to load audit trail: ' + err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    if (!action) return 'badge-neutral';
    const a = action.toUpperCase();
    if (a.includes('CREATE') || a.includes('INSERT') || a.includes('APPROVE') || a.includes('LOGIN')) return 'badge-success';
    if (a.includes('DELETE') || a.includes('REJECT') || a.includes('DEACTIVATE')) return 'badge-danger';
    if (a.includes('UPDATE') || a.includes('OVERRIDE')) return 'badge-warning';
    return 'badge-info';
  };

  const formatDateTime = (ts) => {
    if (!ts) return '--';
    try {
      const iso = ts.includes('T') ? ts : ts.replace(' ', 'T');
      const d = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z');
      return !isNaN(d.getTime()) ? d.toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true
      }) : iso.substring(0, 19).replace('T', ' ');
    } catch {
      return '--';
    }
  };

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    const entityVal = l.entity || l.entity_type || '';
    return !q || 
      (l.user_email && l.user_email.toLowerCase().includes(q)) ||
      (l.action && l.action.toLowerCase().includes(q)) ||
      (entityVal && entityVal.toLowerCase().includes(q)) ||
      (l.details && l.details.toLowerCase().includes(q));
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title-block">
          <h1>System Audit Logs</h1>
          <p>Immutable audit trail of authentication, data mutations, and administrative operations</p>
        </div>
      </div>

      <div className="filter-toolbar">
        <div className="search-box">
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search by user email, action, entity type..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User Email</th>
                <th>Action</th>
                <th>Entity Type</th>
                <th>Entity ID</th>
                <th>IP Address</th>
                <th>Details / Payload</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="empty-state">Loading audit logs...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">No audit logs recorded</td></tr>
              ) : (
                filtered.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDateTime(l.created_at || l.timestamp)}
                    </td>
                    <td><strong>{l.user_email || 'System'}</strong></td>
                    <td>
                      <span className={`badge ${getActionBadge(l.action)}`}>
                        {l.action}
                      </span>
                    </td>
                    <td><strong>{l.entity || l.entity_type || '--'}</strong></td>
                    <td>{l.entity_id || '--'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {l.ip_address || '127.0.0.1'}
                    </td>
                    <td 
                      style={{ fontSize: '12.5px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={l.details || ''}
                    >
                      {l.details || '--'}
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

export default AuditLogs;
