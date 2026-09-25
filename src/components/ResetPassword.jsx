import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import DotMatrixBackground from './DotMatrixBackground';
import { authApi } from '../api/authApi';
import '../Auth.css';

export default function ResetPassword({ onReturnToLogin }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');
  const [linkReady, setLinkReady] = useState(false);

  useEffect(() => {
    let alive = true;
    authApi.completePasswordRecoveryFromUrl()
      .then(() => {
        if (!alive) return;
        setLinkReady(true);
        setError('');
      })
      .catch((err) => {
        if (!alive) return;
        setLinkReady(false);
        setError(err.message || 'The recovery link is invalid or expired. Please request a new reset email.');
      })
      .finally(() => {
        if (alive) setCheckingLink(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const validatePassword = () => {
    if (password.length < 10) return 'Password must be at least 10 characters';
    if (!/[A-Z]/.test(password)) return 'Include at least one uppercase letter';
    if (!/[0-9]/.test(password)) return 'Include at least one number';
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) return 'Include at least one special character';
    if (password !== confirmPassword) return 'Passwords do not match';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validatePassword();
    if (validationError) return setError(validationError);

    setSaving(true);
    setError('');
    try {
      await authApi.completePasswordRecoveryFromUrl();
      await authApi.updatePassword(password);
      setComplete(true);
    } catch (err) {
      setError(err.message || 'The recovery link is invalid or expired');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DotMatrixBackground />
      <div className="modern-auth-container">
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="modern-auth-card reset-password-card">
          {complete ? (
            <div className="reset-complete">
              <div className="reset-success-icon"><CheckCircle2 size={27} /></div>
              <h1>Password changed</h1>
              <p>Your TaskRay password has been updated. Sign in again using your new password.</p>
              <button className="modern-submit-btn" onClick={onReturnToLogin}><ArrowLeft size={15} /> Return to sign in</button>
            </div>
          ) : (
            <>
              <div className="reset-lock-icon"><LockKeyhole size={25} /></div>
              <div className="modern-header">
                <h1>Create new password</h1>
                <p>{checkingLink ? 'Checking your reset link...' : 'Choose a strong password for your TaskRay account.'}</p>
              </div>
              <div className="reset-status-note">
                <ShieldCheck size={16} />
                <span>This page only works after opening the secure reset link from your email.</span>
              </div>
              <form className="modern-form" onSubmit={handleSubmit}>
                {error && <motion.div className="modern-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.div>}
                <div className="modern-form-group">
                  <label><LockKeyhole size={13} /> New password</label>
                  <div className="password-input-wrap">
                    <input className="modern-input" type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" disabled={checkingLink || !linkReady} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} title={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>
                <div className="modern-form-group">
                  <label><LockKeyhole size={13} /> Confirm password</label>
                  <div className="password-input-wrap">
                    <input className="modern-input" type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password" disabled={checkingLink || !linkReady} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} title={showConfirm ? 'Hide password' : 'Show password'}>{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>
                <ul className="password-requirements reset-password-rules">
                  <li>At least 10 characters</li>
                  <li>One uppercase letter, one number, and one special character</li>
                  <li>Both password fields must match</li>
                </ul>
                <button className="modern-submit-btn" type="submit" disabled={saving || checkingLink || !linkReady}>{checkingLink ? 'Checking link...' : saving ? 'Updating...' : 'Update password'}</button>
                {!checkingLink && !linkReady && (
                  <button className="forgot-cancel-btn" type="button" onClick={onReturnToLogin}>Request another reset link</button>
                )}
              </form>
            </>
          )}
        </motion.div>
      </div>
    </>
  );
}
