import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, ArrowRight, Eye, EyeOff, Mail, ShieldCheck } from 'lucide-react';
import DotMatrixBackground from './DotMatrixBackground';
import { authApi } from '../api/authApi';
import { profilesApi } from '../api/profilesApi';
import '../Auth.css';

const ForgotPasswordModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (event) => {
    event.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return setError('Enter the email connected to your TaskRay account.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return setError('Enter a valid email address.');

    setLoading(true);
    setError('');
    try {
      await authApi.resetPasswordForEmail(cleanEmail);
    } finally {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="forgot-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        className="forgot-modal"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.26, ease: 'easeOut' }}
      >
        {!sent ? (
          <form onSubmit={handleSend}>
            <div className="forgot-modal-icon"><Mail size={22} /></div>
            <h2>Reset password</h2>
            <p>Enter your account email and TaskRay will send a secure link to create a new password.</p>
            {error && <div className="modern-error forgot-error">{error}</div>}

            <div className="modern-form-group">
              <label><User size={13} /> Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="modern-input"
                autoFocus
                autoComplete="email"
              />
            </div>

            <div className="forgot-hint">
              <ShieldCheck size={15} />
              <span>The link expires automatically and only works from the email we send.</span>
            </div>

            <div className="forgot-modal-actions">
              <button type="button" className="forgot-cancel-btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="forgot-send-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </div>
          </form>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
            <div className="forgot-modal-icon success"><Mail size={22} /></div>
            <h2 style={{ marginBottom: 8 }}>Check your inbox</h2>
            <p>If that email exists, a reset link has been sent. Open it in this browser to choose your new password.</p>
            <button className="forgot-send-btn" style={{ width: '100%', marginTop: 20 }} onClick={onClose}>Done</button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

function Login({ onLogin, onSwitchToSignup }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await authApi.signInWithGoogle();
    } catch {
      setError('Google login failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!formData.username.trim() || !formData.password.trim()) return;

    setLoading(true);
    try {
      const data = await authApi.signInWithUsername(formData);
      const fullProfile = await profilesApi.getById(data.user.id);
      if (formData.username.trim().toLowerCase() === 'admin_29' && fullProfile?.role !== 'admin') {
        await authApi.signOut();
        throw new Error("You're not an admin.");
      }

      onLogin({ ...data.user, ...fullProfile });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <DotMatrixBackground />
      <div className="modern-auth-container">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.52, ease: 'easeOut' }}
          className="modern-auth-card"
        >
          <div className="modern-logo">
            <img src="/taskray_logo.png" alt="TaskRay" />
            <span className="logo-text">TaskRay</span>
          </div>

          <div className="modern-header">
            <h1>Welcome back</h1>
            <p>No account? <button onClick={onSwitchToSignup} className="modern-link-btn">Sign up free</button></p>
          </div>

          <div className="modern-social-grid">
            <button className="modern-social-btn" onClick={handleGoogleLogin} disabled={googleLoading}>
              <svg width="17" height="17" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{googleLoading ? 'Redirecting...' : 'Continue with Google'}</span>
            </button>
          </div>

          <div className="modern-divider">
            <div className="divider-line" /><span className="divider-text">or</span><div className="divider-line" />
          </div>

          <form onSubmit={handleSubmit} className="modern-form">
            {error && (
              <motion.div className="modern-error" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                {error}
              </motion.div>
            )}

            <div className="modern-form-group">
              <label><User size={13} /> Username or email</label>
              <input
                type="text"
                placeholder="username or you@example.com"
                value={formData.username}
                onChange={(event) => setFormData({ ...formData, username: event.target.value })}
                className={`modern-input${focusedField === 'username' ? ' input-focused' : ''}`}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                autoComplete="email"
              />
            </div>

            <div className="modern-form-group">
              <div className="label-row">
                <label><Lock size={13} /> Password</label>
                <button type="button" className="forgot-link" onClick={() => setShowForgot(true)}>Forgot password?</button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                  className={`modern-input${focusedField === 'password' ? ' input-focused' : ''}`}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  style={{ paddingRight: '42px' }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: showPassword ? '#38bdf8' : 'rgba(203,213,225,0.72)',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 0.2s',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="modern-submit-btn" disabled={loading}>
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight size={15} />
            </button>
          </form>
        </motion.div>
      </div>

      <AnimatePresence>
        {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      </AnimatePresence>
    </>
  );
}

export default Login;
