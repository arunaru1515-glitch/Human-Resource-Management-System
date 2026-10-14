// Centralized API Service for HRMS FastAPI Backend
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = {
  getToken() {
    return localStorage.getItem('hrms_token');
  },

  setAuth(token, user) {
    localStorage.setItem('hrms_token', token);
    localStorage.setItem('hrms_user', JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem('hrms_token');
    localStorage.removeItem('hrms_user');
  },

  getUser() {
    const u = localStorage.getItem('hrms_user');
    return u ? JSON.parse(u) : null;
  },

  async request(endpoint, options = {}) {
    const headers = options.headers || {};
    const token = this.getToken();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      this.clearAuth();
      window.dispatchEvent(new CustomEvent('auth:expired'));
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      let errorMsg = 'Request failed';
      try {
        const err = await response.json();
        if (Array.isArray(err.detail)) {
          errorMsg = err.detail.map(d => `${d.loc ? d.loc.slice(1).join('.') + ': ' : ''}${d.msg}`).join(', ');
        } else if (typeof err.detail === 'string') {
          errorMsg = err.detail;
        } else if (err.message) {
          errorMsg = err.message;
        } else {
          errorMsg = JSON.stringify(err);
        }
      } catch {
        errorMsg = await response.text();
      }
      throw new Error(errorMsg);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/pdf') || contentType.includes('text/csv')) {
      return response.blob();
    }

    return response.json();
  },

  // Auth
  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setAuth(res.access_token, {
      id: res.user_id,
      email: res.email,
      role: res.role,
      fullName: res.full_name,
      employeeId: res.employee_id
    });
    return res;
  },

  async getMe() {
    return this.request('/auth/me');
  },

  // Employees
  async getEmployees(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/employees${query ? '?' + query : ''}`);
  },

  async createEmployee(data) {
    return this.request('/employees', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deactivateEmployee(id) {
    return this.request(`/employees/${id}`, {
      method: 'DELETE'
    });
  },

  async uploadDocument(employeeId, formData) {
    return this.request(`/employees/${employeeId}/documents`, {
      method: 'POST',
      body: formData
    });
  },

  // Attendance
  async getTodayAttendance(employeeId = null) {
    const q = employeeId ? `?employee_id=${employeeId}` : '';
    return this.request(`/attendance/today${q}`);
  },

  async checkIn() {
    return this.request('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({})
    });
  },

  async checkOut() {
    return this.request('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify({})
    });
  },

  async getAttendanceHistory(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/attendance/history${query ? '?' + query : ''}`);
  },

  async overrideAttendance(data) {
    return this.request('/attendance/override', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Leaves
  async getLeaveBalance(employeeId = null) {
    const q = employeeId ? `?employee_id=${employeeId}` : '';
    return this.request(`/leaves/balance${q}`);
  },

  async applyLeave(data) {
    return this.request('/leaves/apply', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getLeaves(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/leaves${query ? '?' + query : ''}`);
  },

  async reviewLeave(leaveId, status, comment = '') {
    return this.request(`/leaves/${leaveId}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, comment })
    });
  },

  // Payroll
  async getPayrolls(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/payroll${query ? '?' + query : ''}`);
  },

  async generatePayroll(month, year, employeeId = null) {
    return this.request('/payroll/generate', {
      method: 'POST',
      body: JSON.stringify({ month, year, employee_id: employeeId })
    });
  },

  async simulateCredit(payrollId) {
    return this.request(`/payroll/${payrollId}/simulate-credit`, {
      method: 'POST'
    });
  },

  async lockPayroll(payrollId) {
    return this.request(`/payroll/${payrollId}/lock`, {
      method: 'POST'
    });
  },

  // Salary Slips
  async getSalarySlips(employeeId = null) {
    const q = employeeId ? `?employee_id=${employeeId}` : '';
    return this.request(`/salary-slips${q}`);
  },

  async downloadSalarySlip(slipId, filename) {
    const blob = await this.request(`/salary-slips/${slipId}/download`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `SalarySlip_${slipId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  },

  // Reports
  async getDashboardSummary() {
    return this.request('/reports/dashboard-summary');
  },

  async exportReport(type, params = {}, filename = 'report.csv') {
    const query = new URLSearchParams(params).toString();
    const blob = await this.request(`/reports/${type}/export?${query}`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  },

  // Notifications & Audit Logs
  async getNotifications() {
    return this.request('/notifications');
  },

  async getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/audit-logs${query ? '?' + query : ''}`);
  }
};

export default api;
