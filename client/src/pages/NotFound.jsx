import { useNavigate } from 'react-router-dom';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
        }}>
            <div style={{ textAlign: 'center', maxWidth: '500px' }} className="animate-fade-in">
                {/* Glowing 404 */}
                <div style={{
                    fontSize: 'clamp(5rem, 15vw, 10rem)',
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    lineHeight: 1,
                    marginBottom: '1rem',
                    textShadow: '0 0 80px rgba(99,102,241,0.3)',
                }}>
                    404
                </div>

                <h2 style={{
                    fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem',
                }}>
                    Page Not Found
                </h2>

                <p style={{
                    color: 'rgba(255,255,255,0.45)', fontSize: '1rem', marginBottom: '2rem', lineHeight: 1.7,
                }}>
                    The page you're looking for doesn't exist or has been moved.
                    Let's get you back on track.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: 'white', padding: '0.85rem 2rem', borderRadius: '12px',
                            fontWeight: 700, border: 'none',
                            boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            transition: 'all 0.3s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(99,102,241,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.3)'; }}
                    >
                        <i className="fas fa-home"></i>
                        Go to Dashboard
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.7)', padding: '0.85rem 2rem', borderRadius: '12px',
                            fontWeight: 700,
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            transition: 'all 0.3s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    >
                        <i className="fas fa-arrow-left"></i>
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}
