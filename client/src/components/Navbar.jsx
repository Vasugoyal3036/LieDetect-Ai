import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import axios from '../api/axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [plan, setPlan] = useState('free');

  useEffect(() => {
    if (user) {
      axios.get('/subscription').then(res => setPlan(res.data?.plan || 'free')).catch(() => { });
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      background: 'rgba(10, 10, 26, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ padding: '1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Brand */}
          <div
            onClick={() => navigate(user ? '/dashboard' : '/')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'transform 0.3s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{
              width: '42px', height: '42px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '1rem',
              boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
            }}>
              <i className="fas fa-shield-alt"></i>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{
                fontSize: '1.1rem', fontWeight: 800,
                background: 'linear-gradient(135deg, #818cf8, #8b5cf6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>LieDetect</span>
              {plan !== 'free' && <span style={{ fontSize: '0.6rem', color: '#fbbf24', marginTop: '-2px', fontWeight: 700, letterSpacing: '3px' }}>{plan.toUpperCase()}</span>}
            </div>
          </div>

          {/* Desktop Nav Links - Authenticated */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="nav-desktop">
              {[
                { label: 'Dashboard', icon: 'fas fa-chart-line', path: '/dashboard' },
                { label: 'Interview', icon: 'fas fa-microphone', path: '/interview' },
                { label: 'History', icon: 'fas fa-clock-rotate-left', path: '/history' },
                { label: 'Feedback', icon: 'fas fa-comments', path: '/feedback' },
                { label: 'Questions', icon: 'fas fa-folder-open', path: '/questions' },
                { label: 'Reports', icon: 'fas fa-file-pdf', path: '/reports' },
                { label: 'Pricing', icon: 'fas fa-crown', path: '/pricing' },
              ].map(item => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    style={{
                      background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                      color: active ? '#818cf8' : 'rgba(255,255,255,0.6)',
                      padding: '0.5rem 0.85rem',
                      borderRadius: '8px',
                      fontWeight: active ? 600 : 500,
                      fontSize: '0.85rem',
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      transition: 'all 0.3s',
                      border: active ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.color = '#818cf8';
                        e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <i className={item.icon} style={{ fontSize: '0.75rem' }}></i>
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user ? (
              <>
                {/* User badge */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '10px', padding: '0.4rem 0.75rem',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{
                    width: '28px', height: '28px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '0.7rem', fontWeight: 800,
                  }}>
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.8rem' }} className="nav-desktop">{user.name}</span>
                </div>

                <button
                  onClick={handleLogout}
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    color: '#fca5a5',
                    padding: '0.45rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    border: '1px solid rgba(239,68,68,0.15)',
                    transition: 'all 0.3s',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(239,68,68,0.15)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <i className="fas fa-sign-out-alt" style={{ fontSize: '0.7rem' }}></i>
                  <span className="nav-desktop">Logout</span>
                </button>

                {/* Mobile toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="nav-mobile-toggle"
                  style={{
                    display: 'none',
                    padding: '0.5rem',
                    color: 'rgba(255,255,255,0.6)',
                    background: 'transparent',
                  }}
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                  </svg>
                </button>
              </>
            ) : (
              /* Unauthenticated - Show Login/Signup */
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.7)',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                    transition: 'all 0.3s',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.3)'; }}
                >
                  <i className="fas fa-rocket" style={{ fontSize: '0.75rem' }}></i>
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {user && mobileMenuOpen && (
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '1rem 0',
          }} className="animate-slide-in-up">
            {[
              { label: 'Dashboard', icon: 'fas fa-chart-line', path: '/dashboard' },
              { label: 'Interview', icon: 'fas fa-microphone', path: '/interview' },
              { label: 'History', icon: 'fas fa-clock-rotate-left', path: '/history' },
              { label: 'Feedback', icon: 'fas fa-comments', path: '/feedback' },
              { label: 'Questions', icon: 'fas fa-folder-open', path: '/questions' },
              { label: 'Reports', icon: 'fas fa-file-pdf', path: '/reports' },
              { label: 'Pricing', icon: 'fas fa-crown', path: '/pricing' },
            ].map(item => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.label}
                  onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    width: '100%', textAlign: 'left',
                    padding: '0.75rem 1rem',
                    color: active ? '#818cf8' : 'rgba(255,255,255,0.6)',
                    borderRadius: '8px',
                    background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
                    transition: 'all 0.3s',
                    marginBottom: '0.25rem',
                    fontWeight: active ? 600 : 400,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <i className={item.icon}></i>
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .nav-desktop { display: flex !important; }
          .nav-mobile-toggle { display: none !important; }
        }
        @media (max-width: 1023px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
