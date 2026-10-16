import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import EmployeePortal from './pages/EmployeePortal';
import CheckIn from './pages/CheckIn';
import Holidays from './pages/Holidays';
import Shifts from './pages/Shifts';
import SalaryComponents from './pages/SalaryComponents';

function App() {
  const { currentUser, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);

  // Toast System
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Sync default tab when user changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'EMPLOYEE') {
        setActiveTab('portal');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-app)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Loading Enterprise HRMS...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  // Titles mapping
  const pageMeta = {
    dashboard: { 
      title: 'Dashboard Overview', 
      subtitle: 'Real-time organization metrics & employee activity',
      points: ['Organization Metrics', 'Active Headcount', 'Live Stream']
    },
    employees: { 
      title: 'Employees Directory', 
      subtitle: 'View, onboard, and manage organization staff profiles',
      points: ['Staff Profiles', 'Quick Onboarding', 'Department Filter']
    },
    attendance: { 
      title: 'Attendance Management', 
      subtitle: 'Daily employee check-in logs and admin overrides',
      points: ['Punch Logs', 'Admin Overrides', 'Date Range Search']
    },
    leaves: { 
      title: 'Leave Management', 
      subtitle: 'Review, approve, and track employee leave requests and quotas',
      points: ['Quota Review', 'Pending Approvals', 'Time-off Requests']
    },
    payroll: { 
      title: 'Payroll & Salary Slips', 
      subtitle: 'Process monthly payroll with advanced earnings & deductions breakdown',
      points: ['Advanced Computation', 'Bonus & Overtime', 'PDF Slips']
    },
    reports: { 
      title: 'Reports & Analytics', 
      subtitle: 'Export organization data into CSV formats for compliance',
      points: ['CSV Exports', 'Audit Compliance', 'Filterable Logs']
    },
    'audit-logs': { 
      title: 'System Audit Trail', 
      subtitle: 'Immutable logs of security operations and data mutations',
      points: ['Immutable Logs', 'Security Actions', 'Mutation Tracking']
    },
    portal: { 
      title: 'Employee Workspace', 
      subtitle: 'View personal profile, leave balance quotas, and salary slips',
      points: ['Personal Workspace', 'Leave Quotas', 'Salary Slips']
    },
    checkin: { 
      title: 'Daily Check-In & Time Tracker', 
      subtitle: 'Biometric time tracker, working hours, and shift logs',
      points: ['Biometric Tracker', 'Shift Compliance', 'Overtime Tracking']
    },
    holidays: {
      title: 'Holiday & Calendar',
      subtitle: 'Company-wide holiday calendar with monthly and yearly views',
      points: ['National Holidays', 'Regional Holidays', 'Optional Holidays']
    },
    shifts: {
      title: 'Shift & Work Schedules',
      subtitle: 'Define work shifts and manage employee schedule assignments',
      points: ['Shift Definitions', 'Employee Assignments', 'Attendance Report']
    },
    'salary-components': {
      title: 'Salary Components & Compensation',
      subtitle: 'Configure earnings/deductions and revise employee compensation',
      points: ['Pay Components', 'Compensation Revision', 'Audit Logged']
    }
  };

  const currentMeta = pageMeta[activeTab] || { title: 'Enterprise HRMS', subtitle: '', points: [] };

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} showToast={showToast} />;
      case 'employees':
        return <Employees showToast={showToast} />;
      case 'attendance':
        return <Attendance showToast={showToast} />;
      case 'leaves':
        return <Leaves showToast={showToast} />;
      case 'payroll':
        return <Payroll showToast={showToast} />;
      case 'reports':
        return <Reports showToast={showToast} />;
      case 'audit-logs':
        return <AuditLogs showToast={showToast} />;
      case 'portal':
        return <EmployeePortal onNavigate={setActiveTab} showToast={showToast} />;
      case 'checkin':
        return <CheckIn showToast={showToast} />;
      case 'holidays':
        return <Holidays showToast={showToast} />;
      case 'shifts':
        return <Shifts showToast={showToast} />;
      case 'salary-components':
        return <SalaryComponents showToast={showToast} />;
      default:
        return <Dashboard onNavigate={setActiveTab} showToast={showToast} />;
    }
  };

  return (
    <div className="app-wrapper">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="main-wrapper">
        <Navbar 
          title={currentMeta.title} 
          subtitle={currentMeta.subtitle} 
          points={currentMeta.points}
          activeTab={activeTab}
        />
        
        <main className="content-body">
          {renderPage()}
        </main>
      </div>

      {/* Global Toast Container */}
      <div id="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
