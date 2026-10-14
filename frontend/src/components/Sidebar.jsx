import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CalendarDays, 
  Banknote, 
  FileSpreadsheet, 
  ShieldCheck, 
  UserCheck, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { currentUser, logout } = useAuth();
  if (!currentUser) return null;

  const role = currentUser.role;
  const isAdmin = role === 'ADMIN';
  const isHrOrAdmin = role === 'ADMIN' || role === 'HR';
  const isEmployee = role === 'EMPLOYEE';

  const firstLetter = (currentUser.fullName || currentUser.role || 'U').charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">H</div>
        <div className="sidebar-brand-name">Enterprise HRMS</div>
      </div>

      <nav className="sidebar-nav">
        {isHrOrAdmin && (
          <>
            <div className="sidebar-section-label">Management</div>
            <button 
              className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>

            <button 
              className={`sidebar-link ${activeTab === 'employees' ? 'active' : ''}`}
              onClick={() => setActiveTab('employees')}
            >
              <Users size={18} />
              <span>Employees</span>
            </button>

            <button 
              className={`sidebar-link ${activeTab === 'attendance' ? 'active' : ''}`}
              onClick={() => setActiveTab('attendance')}
            >
              <Clock size={18} />
              <span>Attendance</span>
            </button>

            <button 
              className={`sidebar-link ${activeTab === 'checkin' ? 'active' : ''}`}
              onClick={() => setActiveTab('checkin')}
            >
              <Clock size={18} />
              <span>Daily Check-In</span>
            </button>
          </>
        )}

        {isEmployee && (
          <>
            <div className="sidebar-section-label">My Workspace</div>
            <button 
              className={`sidebar-link ${activeTab === 'portal' ? 'active' : ''}`}
              onClick={() => setActiveTab('portal')}
            >
              <UserCheck size={18} />
              <span>My Workspace</span>
            </button>
            <button 
              className={`sidebar-link ${activeTab === 'checkin' ? 'active' : ''}`}
              onClick={() => setActiveTab('checkin')}
            >
              <Clock size={18} />
              <span>Daily Check-In</span>
            </button>
          </>
        )}

        <div className="sidebar-section-label">Operations</div>
        <button 
          className={`sidebar-link ${activeTab === 'leaves' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaves')}
        >
          <CalendarDays size={18} />
          <span>Leave Management</span>
        </button>

        <button 
          className={`sidebar-link ${activeTab === 'payroll' ? 'active' : ''}`}
          onClick={() => setActiveTab('payroll')}
        >
          <Banknote size={18} />
          <span>Payroll & Slips</span>
        </button>

        {isHrOrAdmin && (
          <button 
            className={`sidebar-link ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <FileSpreadsheet size={18} />
            <span>Reports & Export</span>
          </button>
        )}

        {isAdmin && (
          <button 
            className={`sidebar-link ${activeTab === 'audit-logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit-logs')}
          >
            <ShieldCheck size={18} />
            <span>System Audit Logs</span>
          </button>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-info">
          <div className="sidebar-avatar">{firstLetter}</div>
          <div className="sidebar-user-meta">
            <span className="sidebar-user-name">{currentUser.fullName || currentUser.email}</span>
            <span className="sidebar-user-role">{currentUser.role}</span>
          </div>
        </div>
        <button className="btn-sidebar-logout" onClick={logout} title="Sign Out">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
