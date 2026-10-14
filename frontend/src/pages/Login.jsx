import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@hrms.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (e, p) => {
    setEmail(e);
    setPassword(p);
    setError('');
  };

  return (
    <div className="auth-page-simple">
      <div className="auth-card-simple">
        <div className="auth-brand-badge-simple">H</div>
        <h1 className="auth-title-simple">Enterprise HRMS</h1>
        <p className="auth-subtitle-simple">Human Resource Management System Portal</p>

        {/* Quick test accounts */}
        <div className="quick-login-panel-simple">
          <div className="quick-login-label-simple">QUICK TEST SIGN IN</div>
          <div className="quick-pills-row-simple">
            <button 
              type="button" 
              className={`quick-pill-simple ${email === 'admin@hrms.com' ? 'active' : ''}`}
              onClick={() => handleQuickFill('admin@hrms.com', 'admin123')}
            >
              🔑 Admin
            </button>
            <button 
              type="button" 
              className={`quick-pill-simple ${email === 'hr@hrms.com' ? 'active' : ''}`}
              onClick={() => handleQuickFill('hr@hrms.com', 'hr123')}
            >
              💼 HR Manager
            </button>
            <button 
              type="button" 
              className={`quick-pill-simple ${email === 'shyam@hrms.com' ? 'active' : ''}`}
              onClick={() => handleQuickFill('shyam@hrms.com', 'shyam123')}
            >
              👤 Employee (Shyam)
            </button>
          </div>
        </div>

        {error && (
          <div className="auth-error-alert-simple">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input 
              id="login-email"
              type="email" 
              className="form-input" 
              placeholder="name@hrms.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input 
              id="login-password"
              type="password" 
              className="form-input" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
