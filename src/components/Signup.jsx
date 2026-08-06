import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AtSign, ArrowLeft, ArrowRight, Eye, EyeOff, MailCheck, RefreshCw } from 'lucide-react';
import DotMatrixBackground from './DotMatrixBackground';
import { authApi } from '../api/authApi';
import { profilesApi } from '../api/profilesApi';
import '../Auth.css';

const PENDING_SIGNUP_KEY = 'taskray-pending-signup';

const readPendingSignup = () => {
  try { return JSON.parse(sessionStorage.getItem(PENDING_SIGNUP_KEY)) || null; }
  catch { return null; }
};

const cleanVerificationInput = (value) => {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.replace(/\D/g, '').slice(0, 8);
};

function Signup({ onSignup, onSwitchToLogin }) {
  const [pendingSignup] = useState(readPendingSignup);
  const [formData, setFormData] = useState({
    name: pendingSignup?.name || '', username: pendingSignup?.username || '',
    email: pendingSignup?.email || '', password: '', confirmPassword: ''
  });
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focusedField, setFocusedField]   = useState(null);
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [verificationStep, setVerificationStep] = useState(Boolean(pendingSignup?.email));
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState(pendingSignup?.email || '');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(pendingSignup?.email ? 60 : 0);

  const rememberPendingSignup = () => {
    const pending = {
      name: formData.name.trim(),
      username: formData.username.trim().toLowerCase(),
      email: formData.email.trim().toLowerCase(),
    };
    sessionStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(pending));
    return pending;
  };

  useEffect(() => {
    if (!verificationStep || resendSeconds <= 0) return undefined;
    const timer = window.setTimeout(() => setResendSeconds(seconds => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [verificationStep, resendSeconds]);

  const validatePassword = (pw) => {
    if (pw.length < 10)                                           return 'Password must be at least 10 characters';
    if (!/[A-Z]/.test(pw))                                        return 'Password must contain at least 1 uppercase letter';
    if (!/[0-9]/.test(pw))                                        return 'Password must contain at least 1 number';
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw))         return 'Password must contain at least 1 special character';
    return null;
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true); setError('');
    try {
      await authApi.signInWithGoogle();
    } catch {
      setError('Google signup failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim())                                      return setError('Username is required');
    if (formData.username.trim().length < 3)                            return setError('Username must be at least 3 characters');
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim()))              return setError('Username: letters, numbers, underscores only');
    if (formData.password !== formData.confirmPassword)                  return setError("Passwords don't match");
    const pwErr = validatePassword(formData.password);
    if (pwErr) return setError(pwErr);

    setLoading(true);
    try {
      const data = await authApi.signUpWithEmail(formData);
      if (data.session) {
        sessionStorage.removeItem(PENDING_SIGNUP_KEY);
        onSignup({
          ...data.user,
          name: formData.name.trim(),
          username: formData.username.trim().toLowerCase(),
          email: formData.email.trim(),
        });
      } else {
        const pending = rememberPendingSignup();
        setPendingEmail(pending.email);
        setVerificationStep(true);
        setResendSeconds(60);
        setLoading(false);
      }

    } catch (err) {
      if (/rate limit|too many/i.test(err.message || '')) {
        const pending = rememberPendingSignup();
        setPendingEmail(pending.email);
        setVerificationStep(true);
        setResendSeconds(60);
        setError('Email limit reached. Enter the latest code you received, or wait before resending.');
      } else {
        setError(err.message || 'Signup failed. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    const isLink = /^https?:\/\//i.test(verificationCode.trim());
    if (!isLink && (verificationCode.length < 6 || verificationCode.length > 8)) {
      return setError('Enter the complete verification code or paste the confirmation link from your email');
    }

    setVerifying(true);
    setError('');
    try {
      const data = await authApi.verifySignupCode({ email: pendingEmail, token: verificationCode });
      sessionStorage.removeItem(PENDING_SIGNUP_KEY);
      let profile = null;
      try { profile = await profilesApi.getById(data.user.id); } catch { /* Profile trigger may still be finishing. */ }
      onSignup({
        ...data.user,
        ...(profile || {}),
        name: profile?.name || formData.name.trim(),
        username: profile?.username || formData.username.trim().toLowerCase(),
        email: pendingEmail,
      });
    } catch (err) {
      setError(err.message || 'The verification code is invalid or expired');
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendSeconds > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await authApi.resendSignupCode(pendingEmail);
      setResendSeconds(60);
    } catch (err) {
      if (/rate limit|too many/i.test(err.message || '')) {
        setError('Too many emails were requested. Wait a minute, then try again.');
        setResendSeconds(60);
      } else {
        setError(err.message || 'Unable to resend the code');
      }
    } finally {
      setResending(false);
    }
  };

  if (verificationStep) {
    return (
      <>
        <DotMatrixBackground />
        <div className="modern-auth-container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="modern-auth-card verification-card">
            <div className="verification-icon"><MailCheck size={26} /></div>
            <div className="modern-header">
              <h1>Verify your email</h1>
              <p>Enter the verification code sent to <strong>{pendingEmail}</strong>.</p>
            </div>
            <form className="modern-form" onSubmit={handleVerifyCode}>
              {error && <motion.div className="modern-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.div>}
              <label className="verification-code-label" htmlFor="verification-code">Verification code or confirmation link</label>
              <input
                id="verification-code"
                className="modern-input verification-code-input"
                value={verificationCode}
                onChange={event => setVerificationCode(cleanVerificationInput(event.target.value))}
                inputMode="text"
                autoComplete="one-time-code"
                placeholder="000000 or paste link"
                autoFocus
              />
              <button type="submit" className="modern-submit-btn" disabled={verifying || (!/^https?:\/\//i.test(verificationCode.trim()) && verificationCode.length < 6)}>
                {verifying ? 'Verifying...' : 'Verify account'} <ArrowRight size={15} />
              </button>
            </form>
            <div className="verification-actions">
              <button type="button" onClick={handleResendCode} disabled={resendSeconds > 0 || resending}>
                <RefreshCw size={13} /> {resending ? 'Sending...' : resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend code'}
              </button>
              <button type="button" onClick={() => { sessionStorage.removeItem(PENDING_SIGNUP_KEY); setVerificationStep(false); setVerificationCode(''); setError(''); }}>
                <ArrowLeft size={13} /> Change email
              </button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <DotMatrixBackground />
      <div className="modern-auth-container">
        <motion.div
          initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.52, ease: 'easeOut' }}
          className="modern-auth-card"
        >
          <div className="modern-logo">
            <img src="/taskray_logo.png" alt="TaskRay" />
            <span className="logo-text">TaskRay</span>
          </div>
          <div className="modern-header">
            <h1>Create account</h1>
            <p>Already have one? <button onClick={onSwitchToLogin} className="modern-link-btn">Sign in</button></p>
          </div>

          <div className="modern-social-grid">
            <button className="modern-social-btn" onClick={handleGoogleSignup} disabled={googleLoading}>
              <svg width="17" height="17" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{googleLoading ? 'Redirecting…' : 'Sign up with Google'}</span>
            </button>
          </div>

          <div className="modern-divider">
            <div className="divider-line" /><span className="divider-text">or</span><div className="divider-line" />
          </div>

          <form onSubmit={handleEmailSignup} className="modern-form">
            {error && (
              <motion.div className="modern-error" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                {error}
              </motion.div>
            )}

            <div className="modern-form-group">
              <label><User size={13} /> Full Name</label>
              <input type="text" placeholder="John Doe" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`modern-input${focusedField === 'name' ? ' input-focused' : ''}`}
                onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)} required />
            </div>

            <div className="modern-form-group">
              <label><AtSign size={13} /> Username</label>
              <input type="text" placeholder="your_username" value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={`modern-input${focusedField === 'username' ? ' input-focused' : ''}`}
                onFocus={() => setFocusedField('username')} onBlur={() => setFocusedField(null)}
                autoComplete="username" required />
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', margin: '3px 0 0', lineHeight: '1.4' }}>
                Letters, numbers, and underscores only
              </p>
            </div>

            <div className="modern-form-group">
              <label><Mail size={13} /> Email</label>
              <input type="email" placeholder="you@example.com" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`modern-input${focusedField === 'email' ? ' input-focused' : ''}`}
                onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} required />
            </div>

            <div className="modern-form-group">
              <label><Lock size={13} /> Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} placeholder="At least 10 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`modern-input${focusedField === 'password' ? ' input-focused' : ''}`}
                  onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                  style={{ paddingRight: '40px' }} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', margin: '3px 0 0', lineHeight: '1.4' }}>
                10+ chars, 1 uppercase, 1 number, 1 special character
              </p>
            </div>

            <div className="modern-form-group">
              <label><Lock size={13} /> Confirm password</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`modern-input${focusedField === 'confirmPassword' ? ' input-focused' : ''}`}
                  onFocus={() => setFocusedField('confirmPassword')} onBlur={() => setFocusedField(null)}
                  style={{ paddingRight: '40px' }} required />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}>
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="modern-submit-btn" disabled={loading}>
              <span>{loading ? 'Creating account…' : 'Create Account'}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          <p className="auth-privacy">
            By creating an account you agree to our{' '}
            <button type="button" className="auth-privacy-link">Terms of Service</button>,{' '}
            <button type="button" className="auth-privacy-link">Privacy Policy</button> and{' '}
            <button type="button" className="auth-privacy-link">Cookie Policy</button>.
          </p>
        </motion.div>
      </div>
    </>
  );
}

export default Signup;
