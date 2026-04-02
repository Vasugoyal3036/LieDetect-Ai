import { useNavigate } from 'react-router-dom';

export default function Footer() {
    const navigate = useNavigate();
    const year = new Date().getFullYear();

    return (
        <footer style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '3rem clamp(1rem, 3vw, 2rem) 2rem',
            background: 'rgba(5,5,15,0.6)',
            backdropFilter: 'blur(20px)',
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '2.5rem',
                    marginBottom: '2.5rem',
                }}>
                    {/* Brand */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{
                                width: '38px', height: '38px',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                borderRadius: '10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: '0.9rem',
                                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                            }}>
                                <i className="fas fa-shield-alt"></i>
                            </div>
                            <span style={{
                                fontSize: '1.1rem', fontWeight: 800,
                                background: 'linear-gradient(135deg, #818cf8, #8b5cf6)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                            }}>HiringSentry</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>
                            AI-powered interview analysis platform for modern recruitment teams.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Product</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {[
                                { label: 'Dashboard', path: '/dashboard' },
                                { label: 'Interview', path: '/interview' },
                                { label: 'Reports', path: '/reports' },
                                { label: 'Pricing', path: '/pricing' },
                            ].map(item => (
                                <button key={item.label} onClick={() => navigate(item.path)}
                                    style={{
                                        background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)',
                                        fontSize: '0.85rem', textAlign: 'left', padding: 0, cursor: 'pointer',
                                        transition: 'color 0.3s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#818cf8'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Features */}
                    <div>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Features</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {['AI Analysis', 'Anti-Cheat', 'Video Recording', 'PDF Reports', 'Question Banks', 'Team Sharing'].map(item => (
                                <span key={item} style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)' }}>{item}</span>
                            ))}
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Contact</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-envelope" style={{ color: '#6366f1', fontSize: '0.75rem' }}></i>
                                support@hiringsentry.com
                            </span>
                            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-map-marker-alt" style={{ color: '#6366f1', fontSize: '0.75rem' }}></i>
                                New Delhi, India
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                            {[
                                { icon: 'fab fa-twitter', href: '#' },
                                { icon: 'fab fa-linkedin', href: '#' },
                                { icon: 'fab fa-github', href: '#' },
                            ].map(social => (
                                <a key={social.icon} href={social.href}
                                    style={{
                                        width: '36px', height: '36px',
                                        background: 'rgba(255,255,255,0.06)',
                                        borderRadius: '10px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem',
                                        transition: 'all 0.3s',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; e.currentTarget.style.color = '#818cf8'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                                >
                                    <i className={social.icon}></i>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    paddingTop: '1.5rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: '1rem',
                }}>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)' }}>
                        © {year} HiringSentry. All rights reserved.
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        {['Privacy Policy', 'Terms of Service', 'Security'].map(item => (
                            <span key={item} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', transition: 'color 0.3s' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                            >
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
