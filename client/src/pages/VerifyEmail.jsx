import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from '../api/axios';

const glassCard = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '20px',
  padding: '2.5rem',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { login } = useAuth();

  const [status, setStatus] = useState('verifying'); // verifying, success, error, check-email
  const [errorMsg, setErrorMsg] = useState('');

  // If there's a token in the URL, verify it automatically
  useEffect(() => {
    if (token) {
      verifyToken(token);
    } else {
      // No token means they just signed up and we should tell them to check email
      setStatus('check-email');
    }
  }, [token]);

  const verifyToken = async (verifyTokenStr) => {
    setStatus('verifying');
    try {
      const response = await axios.post('/auth/verify-email', { token: verifyTokenStr });
      const { _id, name, email: userEmail, token: jwtToken } = response.data;
      
      setStatus('success');
      
      // Auto-login then redirect
      setTimeout(() => {
        login({ _id, name, email: userEmail }, jwtToken);
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.response?.data?.message || 'Verification link is invalid or has expired.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '480px', width: '100%' }}>
        <div style={glassCard} className="animate-fade-in">
          <div style={{ textAlign: 'center' }}>

            {/* STATUS: VERIFYING */}
            {status === 'verifying' && (
              <>
                <div style={{
                  width: '70px', height: '70px',
                  background: 'rgba(99,102,241,0.1)',
                  borderRadius: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  fontSize: '1.8rem', color: '#818cf8',
                }}>
                  <i className="fas fa-spinner animate-spin"></i>
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                  Verifying Your Email
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>
                  Please wait while we securely verify your link...
                </p>
              </>
            )}

            {/* STATUS: SUCCESS */}
            {status === 'success' && (
              <>
                <div style={{
                  width: '70px', height: '70px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderRadius: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 8px 30px rgba(16,185,129,0.3)',
                  fontSize: '1.8rem', color: 'white',
                  animation: 'bounce-in 0.5s ease-out',
                }}>
                  <i className="fas fa-check"></i>
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                  Email Verified!
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                  Your account is now active. Redirecting you to the dashboard...
                </p>
                <div style={{
                  width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)',
                  borderRadius: '2px', overflow: 'hidden'
                }}>
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(90deg, #10b981, #34d399)',
                    animation: 'progress 2s linear forwards',
                  }}></div>
                </div>
              </>
            )}

            {/* STATUS: ERROR */}
            {status === 'error' && (
              <>
                <div style={{
                  width: '70px', height: '70px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  borderRadius: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 8px 30px rgba(239,68,68,0.3)',
                  fontSize: '1.8rem', color: 'white',
                }}>
                  <i className="fas fa-times"></i>
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                  Verification Failed
                </h2>
                <div style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#fca5a5', padding: '1rem', borderRadius: '12px',
                  margin: '1rem 0 1.5rem', fontSize: '0.95rem'
                }}>
                  {errorMsg}
                </div>
                <Link to="/login" style={{
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.1)', color: 'white',
                  padding: '0.8rem 1.5rem', borderRadius: '8px',
                  textDecoration: 'none', fontWeight: 600,
                  transition: 'all 0.3s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                  Go to Login
                </Link>
              </>
            )}

            {/* STATUS: CHECK EMAIL (Waiting for user to open inbox) */}
            {status === 'check-email' && (
              <>
                <div style={{
                  width: '80px', height: '80px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  borderRadius: '24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 8px 30px rgba(99,102,241,0.3)',
                  fontSize: '2rem', color: 'white',
                  position: 'relative'
                }}>
                  <i className="fas fa-envelope-open-text"></i>
                  <div style={{
                    position: 'absolute', inset: '-6px',
                    borderRadius: '30px', border: '2px solid rgba(99,102,241,0.4)',
                    animation: 'pulse-ring 2s infinite'
                  }}></div>
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>
                  Check Your Inbox
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                  We've sent a magic link to your email address. Click the link inside to instantly verify your account.
                </p>
                
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    <i className="fas fa-info-circle" style={{ marginRight: '0.5rem', color: '#818cf8' }}></i>
                    You can safely close this window.
                  </p>
                  <Link to="/login" style={{
                    display: 'block', width: '100%',
                    background: 'rgba(255,255,255,0.08)', color: 'white',
                    padding: '0.8rem', borderRadius: '8px',
                    textDecoration: 'none', fontWeight: 600,
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
                    Return to Login
                  </Link>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 1; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes bounce-in {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
