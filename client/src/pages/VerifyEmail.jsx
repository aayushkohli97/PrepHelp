import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { HiOutlineSparkles, HiOutlineMail, HiOutlineShieldCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';
import './Auth.css';

const VerifyEmail = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  const email = user?.email || sessionStorage.getItem('prephelp_verify_email') || '';

  // Countdown for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // If already verified, redirect
  useEffect(() => {
    if (user?.isEmailVerified) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only last char
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || '';
      }
      setOtp(newOtp);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await authAPI.verifyEmail({ email, otp: otpString });
      const userData = res.data;
      sessionStorage.setItem('prephelp_token', userData.token);
      sessionStorage.setItem('prephelp_user', JSON.stringify(userData));
      updateUser(userData);
      toast.success('Email verified successfully!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
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
      await authAPI.resendOtp({ email });
      toast.success('A new code has been sent to your email');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
      setCanResend(true);
    }
  };

  return (
    <div className="auth-page" id="verify-email-page">
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
          <div className="verify-icon-wrapper">
            <HiOutlineMail style={{ fontSize: '2.5rem', color: 'var(--accent-primary-light)' }} />
          </div>
          <h1>Verify your email</h1>
          <p>We've sent a 6-digit code to</p>
          <p className="verify-email-display">{email}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="otp-input-group" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className={`otp-input ${digit ? 'filled' : ''}`}
              value={digit}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              id={`otp-input-${index}`}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        <button
          className="btn btn-primary btn-lg auth-btn"
          onClick={handleVerify}
          disabled={loading || otp.join('').length !== 6}
          id="verify-submit"
        >
          {loading ? (
            <span className="loader" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
          ) : (
            <><HiOutlineShieldCheck /> Verify Email</>
          )}
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
          Wrong email? <Link to="/register">Go back</Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
