import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const features = [
    {
        icon: 'fas fa-brain',
        title: 'AI-Powered Analysis',
        desc: 'Leverage Google Gemini AI to analyze interview responses for authenticity and detect potential deception patterns.',
        gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
    },
    {
        icon: 'fas fa-shield-alt',
        title: 'Anti-Cheat Monitoring',
        desc: 'Real-time detection of tab switches, paste attempts, and abnormal typing speeds during interviews.',
        gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    },
    {
        icon: 'fas fa-chart-line',
        title: 'Detailed Analytics',
        desc: 'Track genuineness scores, risk distributions, and performance trends across all interview sessions.',
        gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
    },
    {
        icon: 'fas fa-video',
        title: 'Video Recording',
        desc: 'Record interview sessions with integrated webcam support for comprehensive behavioral analysis.',
        gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    },
    {
        icon: 'fas fa-file-pdf',
        title: 'PDF Reports',
        desc: 'Generate professional PDF reports with shareable links for team collaboration and candidate reviews.',
        gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    },
    {
        icon: 'fas fa-folder-open',
        title: 'Custom Question Banks',
        desc: 'Create tailored question banks for specific roles and industries with AI-assisted generation.',
        gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
    },
    {
        icon: 'fas fa-robot',
        title: 'AI Interview Simulator',
        desc: 'Practice with an AI interviewer that gives real-time coaching, follow-up questions, and performance scoring.',
        gradient: 'linear-gradient(135deg, #14b8a6, #10b981)',
    },
];

const stats = [
    { value: '99.2%', label: 'Accuracy Rate', icon: 'fas fa-bullseye' },
    { value: '50K+', label: 'Interviews Analyzed', icon: 'fas fa-users' },
    { value: '<2s', label: 'Analysis Time', icon: 'fas fa-bolt' },
    { value: '4.9★', label: 'User Rating', icon: 'fas fa-star' },
];

const glassCard = {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
};

export default function Landing() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
            return;
        }
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [user, navigate]);

    return (
        <div style={{ minHeight: '100vh', overflow: 'hidden' }}>

            {/* Hero Section */}
            <section style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'clamp(2rem, 5vw, 4rem)',
                position: 'relative',
            }}>
                {/* Animated background orbs */}
                <div style={{
                    position: 'absolute', top: '10%', left: '10%',
                    width: 'clamp(200px, 40vw, 500px)', height: 'clamp(200px, 40vw, 500px)',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                    borderRadius: '50%', filter: 'blur(60px)',
                    animation: 'float 6s ease-in-out infinite',
                    pointerEvents: 'none',
                }}></div>
                <div style={{
                    position: 'absolute', bottom: '15%', right: '5%',
                    width: 'clamp(150px, 30vw, 400px)', height: 'clamp(150px, 30vw, 400px)',
                    background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)',
                    borderRadius: '50%', filter: 'blur(60px)',
                    animation: 'float 8s ease-in-out infinite reverse',
                    pointerEvents: 'none',
                }}></div>

                <div style={{ maxWidth: '900px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    {/* Badge */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: '9999px', padding: '0.5rem 1.25rem', marginBottom: '2rem',
                        fontSize: '0.85rem', fontWeight: 600, color: '#818cf8',
                    }} className="animate-fade-in">
                        <i className="fas fa-sparkles" style={{ fontSize: '0.75rem' }}></i>
                        Powered by Google Gemini AI
                    </div>

                    {/* Main Heading */}
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                        fontWeight: 900,
                        lineHeight: 1.1,
                        marginBottom: '1.5rem',
                        background: 'linear-gradient(135deg, #fff 0%, #818cf8 40%, #8b5cf6 60%, #ec4899 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        letterSpacing: '-1px',
                    }} className="animate-fade-in">
                        Detect Authenticity.<br />Hire with Confidence.
                    </h1>

                    {/* Subtitle */}
                    <p style={{
                        fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                        color: 'rgba(255,255,255,0.5)',
                        maxWidth: '650px',
                        margin: '0 auto 2.5rem',
                        lineHeight: 1.7,
                    }} className="animate-fade-in">
                        AI-powered interview analysis platform that detects deception patterns, monitors anti-cheat behavior, and delivers actionable hiring intelligence — in real time.
                    </p>

                    {/* CTA Buttons */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }} className="animate-slide-in-up">
                        <button
                            onClick={() => navigate('/signup')}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: 'white', padding: '1rem 2.5rem', borderRadius: '14px',
                                fontWeight: 700, fontSize: '1.1rem', border: 'none',
                                boxShadow: '0 8px 30px rgba(99,102,241,0.4)',
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                transition: 'all 0.3s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.5)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.4)'; }}
                        >
                            <i className="fas fa-rocket"></i>
                            Start Free Trial
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                color: 'rgba(255,255,255,0.8)', padding: '1rem 2.5rem', borderRadius: '14px',
                                fontWeight: 700, fontSize: '1.1rem',
                                border: '1px solid rgba(255,255,255,0.12)',
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                transition: 'all 0.3s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                        >
                            <i className="fas fa-sign-in-alt"></i>
                            Sign In
                        </button>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section style={{ padding: '0 clamp(1rem, 3vw, 2rem) 4rem' }}>
                <div style={{
                    maxWidth: '1000px', margin: '0 auto',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '1rem',
                }}>
                    {stats.map((stat, idx) => (
                        <div key={stat.label} style={{
                            ...glassCard,
                            padding: '1.75rem', textAlign: 'center',
                            animation: `slideInUp 0.5s ease-out ${idx * 0.1}s`, animationFillMode: 'both',
                            transition: 'all 0.3s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            <i className={stat.icon} style={{ fontSize: '1.5rem', color: '#818cf8', marginBottom: '0.75rem', display: 'block' }}></i>
                            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>{stat.value}</p>
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{stat.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section style={{ padding: 'clamp(2rem, 5vw, 5rem) clamp(1rem, 3vw, 2rem)' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                        <h2 style={{
                            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #818cf8, #8b5cf6, #ec4899)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                            marginBottom: '0.75rem',
                        }}>
                            Everything You Need
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
                            Comprehensive tools for modern interview intelligence
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '1.5rem',
                    }}>
                        {features.map((feature, idx) => (
                            <div key={feature.title} style={{
                                ...glassCard,
                                padding: '2rem',
                                animation: `slideInUp 0.5s ease-out ${idx * 0.08}s`, animationFillMode: 'both',
                                transition: 'all 0.3s', cursor: 'default',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <div style={{
                                    width: '52px', height: '52px',
                                    background: feature.gradient,
                                    borderRadius: '14px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.3rem', color: 'white', marginBottom: '1.25rem',
                                    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                                }}>
                                    <i className={feature.icon}></i>
                                </div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{feature.title}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section style={{ padding: 'clamp(2rem, 5vw, 5rem) clamp(1rem, 3vw, 2rem)' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                        <h2 style={{
                            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #818cf8, #8b5cf6, #ec4899)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                            marginBottom: '0.75rem',
                        }}>
                            How It Works
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1.1rem' }}>
                            Three simple steps to smarter hiring
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                        {[
                            { step: '01', title: 'Create Interview', desc: 'Select from default or custom question banks tailored to specific roles.', icon: 'fas fa-clipboard-list', color: '#6366f1' },
                            { step: '02', title: 'Analyze Responses', desc: 'AI evaluates authenticity, typing patterns, and behavioral signals in real-time.', icon: 'fas fa-search', color: '#8b5cf6' },
                            { step: '03', title: 'Review Reports', desc: 'Generate comprehensive PDF reports with risk assessments and share with your team.', icon: 'fas fa-chart-bar', color: '#ec4899' },
                        ].map((item, idx) => (
                            <div key={item.step} style={{
                                textAlign: 'center',
                                animation: `slideInUp 0.5s ease-out ${idx * 0.15}s`, animationFillMode: 'both',
                            }}>
                                <div style={{
                                    width: '72px', height: '72px',
                                    background: `${item.color}15`,
                                    border: `2px solid ${item.color}30`,
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 1.25rem',
                                    fontSize: '1.5rem', color: item.color,
                                    transition: 'all 0.3s',
                                }}>
                                    <i className={item.icon}></i>
                                </div>
                                <span style={{
                                    fontSize: '0.7rem', fontWeight: 800, color: item.color,
                                    textTransform: 'uppercase', letterSpacing: '3px',
                                }}>Step {item.step}</span>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: '0.5rem 0' }}>{item.title}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section style={{
                padding: 'clamp(3rem, 6vw, 6rem) clamp(1rem, 3vw, 2rem)',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 50%, rgba(236,72,153,0.05) 100%)',
            }}>
                <div style={{
                    maxWidth: '700px', margin: '0 auto', textAlign: 'center',
                    ...glassCard, padding: 'clamp(2rem, 4vw, 3.5rem)',
                }}>
                    <h2 style={{
                        fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                        fontWeight: 800, color: '#fff', marginBottom: '1rem',
                    }}>
                        Ready to Transform Your Hiring?
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.05rem', marginBottom: '2rem', lineHeight: 1.7 }}>
                        Join thousands of recruiters using AI-powered interview intelligence to make better hiring decisions.
                    </p>
                    <button
                        onClick={() => navigate('/signup')}
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: 'white', padding: '1rem 3rem', borderRadius: '14px',
                            fontWeight: 700, fontSize: '1.1rem', border: 'none',
                            boxShadow: '0 8px 30px rgba(99,102,241,0.4)',
                            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                            transition: 'all 0.3s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.5)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.4)'; }}
                    >
                        <i className="fas fa-rocket"></i>
                        Get Started Free
                    </button>
                    <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
                        No credit card required • 10 free analyses/month
                    </p>
                </div>
            </section>
        </div>
    );
}
