import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const glassCard = {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
};

export default function SharedReport() {
    const { token } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await fetch(`${API_URL}/reports/shared/${token}`);
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || 'Report not found');
                }
                setReport(await res.json());
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [token]);

    const riskColor = (risk) => risk === 'Low' ? '#10b981' : risk === 'Medium' ? '#f59e0b' : '#ef4444';
    const riskBg = (risk) => risk === 'Low' ? 'rgba(16,185,129,0.08)' : risk === 'Medium' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a1a' }}>
            <div style={{ width: '56px', height: '56px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%' }} className="animate-spin"></div>
        </div>
    );

    if (error) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a1a' }}>
            <div style={{ ...glassCard, padding: '3rem', textAlign: 'center', maxWidth: '400px' }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '1rem', display: 'block' }}></i>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Report Unavailable</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>{error}</p>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2rem)', background: '#0a0a1a', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }} className="animate-fade-in">
                    <h1 style={{
                        fontSize: '2rem', fontWeight: 800,
                        background: 'linear-gradient(135deg, #818cf8, #8b5cf6, #ec4899)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        marginBottom: '0.5rem',
                    }}>
                        <i className="fas fa-shield-alt" style={{ WebkitTextFillColor: 'initial', color: '#6366f1', marginRight: '0.5rem' }}></i>
                        {report.title}
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                        by {report.user?.name || 'Unknown'} • {new Date(report.createdAt).toLocaleDateString()} • {report.viewCount} views
                    </p>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }} className="animate-slide-in-up">
                    <div style={{ ...glassCard, padding: '1.5rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#818cf8', marginBottom: '0.5rem' }}>AVG SCORE</p>
                        <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>{report.averageScore}</p>
                    </div>
                    <div style={{ ...glassCard, padding: '1.5rem', textAlign: 'center', background: riskBg(report.overallRisk) }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: riskColor(report.overallRisk), marginBottom: '0.5rem' }}>RISK LEVEL</p>
                        <p style={{ fontSize: '2.5rem', fontWeight: 800, color: riskColor(report.overallRisk) }}>{report.overallRisk}</p>
                    </div>
                    <div style={{ ...glassCard, padding: '1.5rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#818cf8', marginBottom: '0.5rem' }}>QUESTIONS</p>
                        <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>{report.sessions?.length || 0}</p>
                    </div>
                </div>

                {/* Sessions Detail */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {report.sessions?.map((s, idx) => (
                        <div key={s._id || idx} style={{ ...glassCard, padding: '1.5rem', borderLeft: `3px solid ${riskColor(s.bluffRisk)}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#818cf8' }}>Question {idx + 1}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span style={{
                                        padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700,
                                        background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                                    }}>Score: {s.genuinenessScore}</span>
                                    <span style={{
                                        padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700,
                                        background: `${riskColor(s.bluffRisk)}15`, color: riskColor(s.bluffRisk),
                                    }}>{s.bluffRisk}</span>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>{s.question}</p>
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem', lineHeight: 1.6 }}>{s.answer}</p>
                            {s.suspiciousFlags?.length > 0 && (
                                <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '0.5rem' }}>
                                    <p style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
                                        <i className="fas fa-flag" style={{ marginRight: '0.3rem' }}></i>
                                        {s.suspiciousFlags.join(' • ')}
                                    </p>
                                </div>
                            )}
                            {s.feedback && (
                                <div style={{ background: 'rgba(139,92,246,0.06)', borderRadius: '8px', padding: '0.75rem' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                                        <i className="fas fa-robot" style={{ color: '#8b5cf6', marginRight: '0.3rem' }}></i> {s.feedback}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: '3rem', padding: '1.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>
                    <p>Generated by LieDetector AI • Results are AI-powered estimates</p>
                </div>
            </div>
        </div>
    );
}
