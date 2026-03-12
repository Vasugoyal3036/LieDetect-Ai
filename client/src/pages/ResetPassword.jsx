import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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

const inputStyle = {
  width: '100%',
  padding: '0.85rem 1rem',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: '#f1f5f9',
  fontSize: '1rem',
  fontFamily: 'inherit',
  transition: 'all 0.3s',
  outline: 'none',
};

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      setError('Invalid or missing password reset token.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/auth/reset-password', {
        token,
        newPassword: password
      });
      setSuccess(response.data.message);
      
      // Navigate to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link might have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '500px' }} className="animate-fade-in">
        <div style={glassCard}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '60px', height: '60px',
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 8px 25px rgba(236,72,153,0.3)',
              fontSize: '1.5rem', color: 'white',
            }}>
              <i className="fas fa-lock-open"></i>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Create New Password</h2>
            {!success && (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Your new password must be securely strong.
              </p>
            )}
          </div>

          {!isValidToken ? (
            <div style={{ textAlign: 'center', color: '#fca5a5' }}>
              <i className="fas fa-times-circle" style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ef4444' }}></i>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Link Invalid</h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '2rem' }}>{error}</p>
            </div>
          ) : !success ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
                  <i className="fas fa-lock" style={{ marginRight: '0.4rem', color: '#ec4899' }}></i>
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#ec4899'; e.target.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
                  <i className="fas fa-check" style={{ marginRight: '0.4rem', color: '#ec4899' }}></i>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#ec4899'; e.target.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                  required
                />
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#fca5a5',
                  padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }} className="animate-slide-in-up">
                  <i className="fas fa-exclamation-circle"></i>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                  color: 'white', fontWeight: 700, padding: '0.85rem', borderRadius: '10px',
                  border: 'none', fontSize: '1rem', marginTop: '0.5rem',
                  boxShadow: '0 4px 15px rgba(236,72,153,0.3)',
                  transition: 'all 0.3s', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <div style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              color: '#d1fae5',
              padding: '1.25rem', borderRadius: '12px', textAlign: 'center',
            }} className="animate-fade-in">
              <i className="fas fa-check-circle" style={{ fontSize: '2.5rem', color: '#34d399', marginBottom: '1rem' }}></i>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Success!</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.5, opacity: 0.8, marginBottom: '1.5rem' }}>
                {success}
              </p>
              
              <Link to="/login" style={{
                display: 'inline-block',
                background: '#34d399',
                color: '#064e3b',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 600,
                textDecoration: 'none',
              }}>
                Go to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
