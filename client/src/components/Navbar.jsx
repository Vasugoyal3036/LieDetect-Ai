import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [plan, setPlan] = useState('free');

  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
  const avatarSrc = user?.profilePicture ? `${API_BASE}/uploads/avatars/${user.profilePicture}` : null;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      axios.get('/subscription').then(res => setPlan(res.data?.plan || 'free')).catch(() => { });

      // Fetch profile picture if not already set in context
      if (!user.profilePicture) {
        axios.get('/auth/me').then(res => {
          if (res.data.profilePicture && typeof user === 'object') {
            // Silently update local storage with avatar info
            const stored = JSON.parse(localStorage.getItem('user') || '{}');
            stored.profilePicture = res.data.profilePicture;
            localStorage.setItem('user', JSON.stringify(stored));
          }
        }).catch(() => {});
      }
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }} className="nav-desktop">
              {[
                { label: 'Dashboard', icon: 'fas fa-chart-line', path: '/dashboard' },
                { label: 'Interview', icon: 'fas fa-microphone', path: '/interview' },
                { label: 'History', icon: 'fas fa-clock-rotate-left', path: '/history' },
                { label: 'Feedback', icon: 'fas fa-comments', path: '/feedback' },
                { label: 'Questions', icon: 'fas fa-folder-open', path: '/questions' },
                { label: 'Reports', icon: 'fas fa-file-pdf', path: '/reports' },
                { label: 'Team', icon: 'fas fa-users', path: '/team' },
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
                      padding: '0.4rem 0.6rem',
                      borderRadius: '8px',
                      fontWeight: active ? 600 : 500,
                      fontSize: '0.8rem',
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
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
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  {/* User badge with profile picture */}
                  <div 
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: profileDropdownOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                      borderRadius: '10px', padding: '0.4rem 0.75rem',
                      border: profileDropdownOpen ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer', transition: 'all 0.3s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'; }}
                    onMouseLeave={e => { 
                      if (!profileDropdownOpen) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; 
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; 
                      }
                    }}
                  >
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="avatar" style={{
                        width: '38px', height: '38px', minWidth: '38px', flexShrink: 0, borderRadius: '10px', objectFit: 'cover', imageRendering: '-webkit-optimize-contrast'
                      }} />
                    ) : (
                      <div style={{
                        width: '38px', height: '38px', minWidth: '38px', flexShrink: 0,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '1rem', fontWeight: 800,
                      }}>
                        {user.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.8rem' }} className="nav-desktop">{user.name}</span>
                    <i className={`fas fa-chevron-down nav-desktop`} style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', transition: 'transform 0.3s', transform: profileDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}></i>
                  </div>
                  
                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="animate-fade-in" style={{
                      position: 'absolute',
                      top: 'calc(100% + 10px)',
                      right: 0,
                      width: '220px',
                      background: 'rgba(15, 15, 30, 0.95)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      overflow: 'hidden',
                      zIndex: 100,
                    }}>
                      <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem', margin: '0 0 0.2rem 0' }}>{user.name}</p>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
                      </div>
                      <div style={{ padding: '0.5rem' }}>
                        <button
                          onClick={() => { navigate('/settings'); setProfileDropdownOpen(false); }}
                          style={{
                            width: '100%', textAlign: 'left', padding: '0.6rem 1rem',
                            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)',
                            fontSize: '0.85rem', fontWeight: 500, borderRadius: '8px',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                        >
                          <i className="fas fa-cog" style={{ width: '16px' }}></i> Settings
                        </button>
                        <button
                          onClick={() => { handleLogout(); setProfileDropdownOpen(false); }}
                          style={{
                            width: '100%', textAlign: 'left', padding: '0.6rem 1rem',
                            background: 'transparent', border: 'none', color: '#fca5a5',
                            fontSize: '0.85rem', fontWeight: 500, borderRadius: '8px',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s', marginTop: '0.25rem'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#fca5a5'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fca5a5'; }}
                        >
                          <i className="fas fa-sign-out-alt" style={{ width: '16px' }}></i> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>

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
              { label: 'Team', icon: 'fas fa-users', path: '/team' },
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
        @media (min-width: 1100px) {
          .nav-desktop { display: flex !important; }
          .nav-mobile-toggle { display: none !important; }
        }
        @media (max-width: 1099px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
