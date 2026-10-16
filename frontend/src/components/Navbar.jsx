import React from 'react';
import { 
  LogOut, 
  Clock, 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  CalendarDays, 
  Banknote, 
  FileSpreadsheet, 
  ShieldCheck, 
  UserCheck,
  Globe,
  Clock4
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';

const Navbar = ({ title, subtitle, points = [], activeTab }) => {
  const { currentUser, logout } = useAuth();
  if (!currentUser) return null;

  const renderIcon = () => {
    switch (activeTab) {
      case 'checkin': return <Clock size={22} />;
      case 'dashboard': return <LayoutDashboard size={22} />;
      case 'employees': return <Users size={22} />;
      case 'attendance': return <CalendarCheck size={22} />;
      case 'leaves': return <CalendarDays size={22} />;
      case 'payroll': return <Banknote size={22} />;
      case 'reports': return <FileSpreadsheet size={22} />;
      case 'audit-logs': return <ShieldCheck size={22} />;
      case 'portal': return <UserCheck size={22} />;
      case 'holidays': return <Globe size={22} />;
      case 'shifts': return <Clock4 size={22} />;
      default: return <Clock size={22} />;
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Prominent Page Icon */}
        <div className="topbar-page-iconbox">
          {renderIcon()}
        </div>

        {/* Title & Clean Intermediate Subtitle Points */}
        <div className="topbar-header-info">
          <div className="topbar-title-row">
            <h1 className="topbar-title">{title}</h1>
          </div>

          {/* Clean Text Points with Subtle Bullet Separators */}
          {points && points.length > 0 ? (
            <div className="topbar-points-text">
              {points.map((pt, idx) => (
                <React.Fragment key={idx}>
                  <span>{pt}</span>
                  {idx < points.length - 1 && <span className="topbar-dot-sep">•</span>}
                </React.Fragment>
              ))}
            </div>
          ) : subtitle ? (
            <div className="topbar-subtitle">{subtitle}</div>
          ) : null}
        </div>
      </div>

      <div className="topbar-right">
        {/* Notification Center */}
        <NotificationCenter />

        <span className="badge-role">{currentUser.role}</span>
        <button className="btn-topbar-logout" onClick={logout}>
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
