import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';
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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Show session expired message if redirected
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired')) {
      setError('Your session has expired. Please log in again.');
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (showTwoFactor) {
      // Handle 2FA Verification
      try {
        const response = await axios.post('/auth/verify-2fa', { email, otp });
        const { _id, name, email: userEmail, token } = response.data;
        login({ _id, name, email: userEmail }, token);
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid 2FA Code. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const response = await axios.post('/auth/login', { email, password });
      
      // If 2FA is triggered
      if (response.data.requiresTwoFactor) {
        setShowTwoFactor(true);
        setLoading(false);
        return;
      }

      const { _id, name, email: userEmail, token } = response.data;
      login({ _id, name, email: userEmail }, token);
      navigate('/dashboard');
    } catch (err) {
      // Check if email verification is required
      if (err.response?.status === 403 && err.response?.data?.requiresVerification) {
        navigate('/verify-email', { state: { email: err.response.data.email } });
        return;
      }
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      if (!showTwoFactor) setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post('/auth/google', { token: credentialResponse.credential });
      
      // If 2FA is triggered
      if (response.data.requiresTwoFactor) {
        setEmail(response.data.email); // Need to save it in state manually
        setShowTwoFactor(true);
        setLoading(false);
        return;
      }

      const { _id, name, email: userEmail, token } = response.data;
      login({ _id, name, email: userEmail }, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Google Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleFailure = () => {
    setError('Google Sign-In failed or was cancelled.');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem', width: '100%', maxWidth: '1000px', alignItems: 'center' }} className="login-grid">

        {/* Hero Section */}
        <div className="login-hero animate-slide-in-left" style={{ display: 'none' }}>
          <h1 style={{
            fontSize: '3rem', fontWeight: 800, marginBottom: '1rem',
            background: 'linear-gradient(135deg, #818cf8, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            LieDetect AI
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500, marginBottom: '0.5rem' }}>Professional Interview Analysis</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, marginBottom: '2rem' }}>
            Leveraging AI to analyze interview responses with precision and accuracy. Detect patterns, assess authenticity, and make data-driven decisions.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: 'fas fa-brain', title: 'AI-Powered Analysis', desc: 'Advanced patterns to evaluate authenticity', color: '#6366f1' },
              { icon: 'fas fa-chart-bar', title: 'Detailed Insights', desc: 'Comprehensive feedback and risk assessment', color: '#8b5cf6' },
              { icon: 'fas fa-shield-alt', title: 'Interview Management', desc: 'Track and analyze multiple sessions', color: '#ec4899' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '44px', height: '44px', minWidth: '44px',
                  background: `${item.color}20`, borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: item.color, fontSize: '1.1rem',
                }}>
                  <i className={item.icon}></i>
                </div>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '0.15rem' }}>{item.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Login Card */}
        <div className="animate-fade-in">
          <div style={glassCard}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '60px', height: '60px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                borderRadius: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: '0 8px 25px rgba(99,102,241,0.3)',
                fontSize: '1.5rem', color: 'white',
              }}>
                <i className="fas fa-shield-alt"></i>
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Welcome Back</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Sign in to access your interview analysis</p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {!showTwoFactor ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
                      <i className="fas fa-envelope" style={{ marginRight: '0.4rem', color: '#6366f1' }}></i>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
                      <i className="fas fa-lock" style={{ marginRight: '0.4rem', color: '#6366f1' }}></i>
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                      required
                    />
                    <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                      <Link to="/forgot-password" style={{ color: '#8b5cf6', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500, transition: 'color 0.3s' }} onMouseEnter={e => e.currentTarget.style.color = '#c084fc'} onMouseLeave={e => e.currentTarget.style.color = '#8b5cf6'}>
                        Forgot your password?
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div className="animate-fade-in">
                  <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '1rem', borderRadius: '10px', marginBottom: '1rem', color: '#d1fae5', fontSize: '0.9rem', textAlign: 'center' }}>
                     A 6-digit code has been sent to your email.
                  </div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
                    <i className="fas fa-shield-alt" style={{ marginRight: '0.4rem', color: '#10b981' }}></i>
                    Authentication Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    style={{...inputStyle, textAlign: 'center', letterSpacing: '4px', fontSize: '1.25rem', fontWeight: 'bold'}}
                    onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.15)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                    required
                  />
                  <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                    <button type="button" onClick={() => setShowTwoFactor(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}>
                      Cancel and go back
                    </button>
                  </div>
                </div>
              )}

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
                    Processing...
                  </span>
                ) : (
                  <>
                    <i className={showTwoFactor ? "fas fa-shield-check" : "fas fa-sign-in-alt"} style={{ marginRight: '0.5rem' }}></i>
                    {showTwoFactor ? "Verify Code" : "Sign In"}
                  </>
                )}
              </button>
            </form>

            <div style={{ position: 'relative', margin: '1.5rem 0' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.08)' }}></div>
              </div>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <span style={{ padding: '0 1rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', background: 'var(--bg-color, #1a1a3e)' }}>or single sign-on</span>
              </div>
            </div>

            {!showTwoFactor && (
               <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                 <GoogleLogin
                   onSuccess={handleGoogleSuccess}
                   onError={handleGoogleFailure}
                   theme="filled_black"
                   shape="pill"
                   size="large"
                 />
               </div>
            )}

            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ fontWeight: 600, color: '#818cf8', transition: 'color 0.3s' }}>
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .login-grid { grid-template-columns: 1fr 1fr !important; }
          .login-hero { display: block !important; }
        }
      `}</style>
    </div>
  );
}
