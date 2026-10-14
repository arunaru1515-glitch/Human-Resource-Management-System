import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = api.getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.getMe();
        setCurrentUser({
          id: me.user_id,
          email: me.email,
          role: me.role,
          fullName: me.employee ? me.employee.full_name : me.role,
          employeeId: me.employee ? me.employee.id : null,
          employee: me.employee
        });
      } catch {
        api.clearAuth();
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const handleExpired = () => {
      setCurrentUser(null);
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    const user = {
      id: res.user_id,
      email: res.email,
      role: res.role,
      fullName: res.full_name,
      employeeId: res.employee_id
    };
    // Fetch full employee details if employee
    try {
      const me = await api.getMe();
      if (me.employee) {
        user.employee = me.employee;
        user.fullName = me.employee.full_name;
      }
    } catch {
      // fallback to login response
    }
    setCurrentUser(user);
    return user;
  };

  const logout = () => {
    api.clearAuth();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
