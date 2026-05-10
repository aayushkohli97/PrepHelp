import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import {
  HiOutlineSparkles, HiOutlineMail, HiOutlineLockClosed,
  HiOutlineEye, HiOutlineEyeOff, HiOutlineShieldCheck,
  HiOutlineArrowLeft, HiOutlineCheck
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import './Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Countdown for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 2) {
      setCanResend(true);
    }
  }, [resendTimer, step]);

  // Auto-focus first OTP input when moving to step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // Step 1: Send reset email
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await authAPI.forgotPassword({ email: email.trim() });
      toast.success('Reset code sent! Check your email.');
      setStep(2);
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) newOtp[i] = pasted[i] || '';
      setOtp(newOtp);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  // Step 2: Verify OTP and proceed to step 3
  const handleVerifyOtp = () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    setError('');
    setStep(3);
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authAPI.resetPassword({
        email: email.trim(),
        otp: otp.join(''),
        newPassword,
      });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
      // If OTP is invalid/expired, go back to step 2
      if (err.response?.data?.message?.includes('OTP') || err.response?.data?.message?.includes('expired')) {
        setStep(2);
        setOtp(['', '', '', '', '', '']);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setResendTimer(60);
    setError('');
    try {
      await authAPI.forgotPassword({ email: email.trim() });
      toast.success('A new code has been sent');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend');
      setCanResend(true);
    }
  };

  return (
    <div className="auth-page" id="forgot-password-page">
      <div className="auth-bg">
        <div className="auth-orb orb-1"></div>
        <div className="auth-orb orb-2"></div>
      </div>

      <div className="auth-container animate-scale-in">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <div className="logo-icon"><HiOutlineSparkles /></div>
            <span>PrepHelp</span>
          </Link>

          {/* Step indicators */}
          <div className="step-indicator">
            <div className={`step-dot ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              {step > 1 ? <HiOutlineCheck /> : '1'}
            </div>
            <div className="step-line"></div>
            <div className={`step-dot ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              {step > 2 ? <HiOutlineCheck /> : '2'}
            </div>
            <div className="step-line"></div>
            <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
          </div>

          <h1>{step === 1 ? 'Forgot password?' : step === 2 ? 'Enter the code' : 'Set new password'}</h1>
          <p>
            {step === 1 && "No worries, we'll send you a reset code."}
            {step === 2 && <>We sent a 6-digit code to <strong>{email}</strong></>}
            {step === 3 && 'Choose a strong new password for your account.'}
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="auth-form">
            <div className="input-group">
              <label htmlFor="forgot-email">Email Address</label>
              <div className="input-with-icon">
                <HiOutlineMail />
                <input
                  id="forgot-email"
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
              {loading ? <span className="loader" style={{ width: 20, height: 20, borderWidth: 2 }}></span> : 'Send Reset Code'}
            </button>
            <p className="auth-switch">
              <Link to="/login"><HiOutlineArrowLeft style={{ marginBottom: -2 }} /> Back to Sign In</Link>
            </p>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <>
            <div className="otp-input-group" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`otp-input ${digit ? 'filled' : ''}`}
                  value={digit}
                  onChange={e => handleOtpChange(index, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(index, e)}
                />
              ))}
            </div>
            <button
              className="btn btn-primary btn-lg auth-btn"
              onClick={handleVerifyOtp}
              disabled={otp.join('').length !== 6}
            >
              <HiOutlineShieldCheck /> Verify Code
            </button>
            <div className="resend-section">
              <p>Didn't receive the code?</p>
              {canResend ? (
                <button className="resend-btn" onClick={handleResend}>Resend Code</button>
              ) : (
                <span className="resend-timer">Resend in {resendTimer}s</span>
              )}
            </div>
            <p className="auth-switch">
              <button className="resend-btn" onClick={() => { setStep(1); setError(''); }}>
                <HiOutlineArrowLeft style={{ marginBottom: -2 }} /> Change email
              </button>
            </p>
          </>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="input-group">
              <label htmlFor="new-password">New Password</label>
              <div className="input-with-icon">
                <HiOutlineLockClosed />
                <input
                  id="new-password"
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  autoFocus
                />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <div className="input-with-icon">
                <HiOutlineLockClosed />
                <input
                  id="confirm-password"
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
              {loading ? <span className="loader" style={{ width: 20, height: 20, borderWidth: 2 }}></span> : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
