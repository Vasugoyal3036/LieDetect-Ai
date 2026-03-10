import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('/auth/signup', { name, email, password });
      const { _id, email: userEmail, token } = response.data;
      signup({ _id, name, email: userEmail }, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = (e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; };
  const handleBlur = (e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '480px', width: '100%' }}>
        <div style={glassCard} className="animate-fade-in">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '60px', height: '60px',
              background: 'linear-gradient(135deg, #10b981, #6366f1)',
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 8px 25px rgba(16,185,129,0.2)',
              fontSize: '1.5rem', color: 'white',
            }}>
              <i className="fas fa-user-plus"></i>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Create Account</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Join LieDetect AI for powerful interview analysis</p>
          </div>

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
                <i className="fas fa-user" style={{ marginRight: '0.4rem', color: '#6366f1' }}></i>
                Full Name
              </label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
                <i className="fas fa-envelope" style={{ marginRight: '0.4rem', color: '#6366f1' }}></i>
                Email Address
              </label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
                <i className="fas fa-lock" style={{ marginRight: '0.4rem', color: '#6366f1' }}></i>
                Password
              </label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
                <i className="fas fa-lock" style={{ marginRight: '0.4rem', color: '#6366f1' }}></i>
                Confirm Password
              </label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} required />
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
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', fontWeight: 700, padding: '0.85rem', borderRadius: '10px',
                border: 'none', fontSize: '1rem', marginTop: '0.5rem',
                boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                transition: 'all 0.3s', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(99,102,241,0.4)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.3)'; }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin"></span>
                  Creating account...
                </span>
              ) : (
                <>
                  <i className="fas fa-user-plus" style={{ marginRight: '0.5rem' }}></i>
                  Create Account
                </>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: '1.5rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 600, color: '#818cf8' }}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
