import { useState, useEffect } from 'react';
import axios from '../api/axios';

const glassCard = {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
};

export default function Report() {
    const [reports, setReports] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedSessions, setSelectedSessions] = useState([]);
    const [title, setTitle] = useState('');
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [reportsRes, sessionsRes] = await Promise.all([
                axios.get('/reports'),
                axios.get('/history'),
            ]);
            setReports(reportsRes.data);
            setSessions(sessionsRes.data);
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setLoading(false);
        }
    };

    const createReport = async () => {
        if (selectedSessions.length === 0) return;
        try {
            await axios.post('/reports', {
                sessionIds: selectedSessions,
                title: title || 'Interview Report',
            });
            setShowCreate(false);
            setSelectedSessions([]);
            setTitle('');
            fetchData();
        } catch (err) {
            alert('Failed to create report: ' + (err.response?.data?.message || err.message));
        }
    };

    const deleteReport = async (id) => {
        if (!confirm('Delete this report?')) return;
        try {
            await axios.delete(`/reports/${id}`);
            fetchData();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const downloadPDF = async (id, reportTitle) => {
        try {
            const res = await axios.get(`/reports/${id}/pdf`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to download PDF');
        }
    };

    const copyShareLink = (token) => {
        const url = `${window.location.origin}/shared-report/${token}`;
        navigator.clipboard.writeText(url);
        setCopiedId(token);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const toggleSession = (id) => {
        setSelectedSessions(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const riskColor = (risk) => risk === 'Low' ? '#10b981' : risk === 'Medium' ? '#f59e0b' : '#ef4444';

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
            <div style={{ width: '56px', height: '56px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%' }} className="animate-spin"></div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2rem)' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }} className="animate-fade-in">
                    <div>
                        <h1 style={{
                            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
                            background: 'linear-gradient(135deg, #818cf8, #8b5cf6, #ec4899)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>
                            <i className="fas fa-file-pdf" style={{ WebkitTextFillColor: 'initial', color: '#6366f1', marginRight: '0.5rem' }}></i>
                            Reports
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.45)' }}>Generate shareable PDF reports for candidates</p>
                    </div>
                    <button onClick={() => setShowCreate(!showCreate)} style={{
                        background: showCreate ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: showCreate ? '#fca5a5' : 'white', padding: '0.75rem 1.75rem', borderRadius: '12px',
                        fontWeight: 700, border: showCreate ? '1px solid rgba(239,68,68,0.3)' : 'none',
                        boxShadow: showCreate ? 'none' : '0 4px 15px rgba(99,102,241,0.3)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}>
                        <i className={showCreate ? 'fas fa-times' : 'fas fa-plus'}></i>
                        {showCreate ? 'Cancel' : 'New Report'}
                    </button>
                </div>

                {/* Create Form */}
                {showCreate && (
                    <div style={{ ...glassCard, padding: '2rem', marginBottom: '2rem' }} className="animate-slide-in-up">
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem' }}>
                            <i className="fas fa-plus-circle" style={{ color: '#6366f1', marginRight: '0.5rem' }}></i> Create Report
                        </h2>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Report title (optional)"
                            style={{
                                width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f5f9',
                                fontSize: '1rem', fontFamily: 'inherit', marginBottom: '1rem', outline: 'none',
                            }}
                            onFocus={e => e.target.style.borderColor = '#6366f1'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>Select sessions to include:</p>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            {sessions.map(s => (
                                <div key={s._id} onClick={() => toggleSession(s._id)}
                                    style={{
                                        padding: '0.75rem 1rem', borderRadius: '10px', cursor: 'pointer',
                                        background: selectedSessions.includes(s._id) ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${selectedSessions.includes(s._id) ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        transition: 'all 0.2s',
                                    }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>{s.question?.substring(0, 60)}...</p>
                                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
                                            Score: {s.genuinenessScore} | Risk: <span style={{ color: riskColor(s.bluffRisk) }}>{s.bluffRisk}</span>
                                        </p>
                                    </div>
                                    <div style={{
                                        width: '22px', height: '22px', borderRadius: '6px',
                                        border: `2px solid ${selectedSessions.includes(s._id) ? '#6366f1' : 'rgba(255,255,255,0.2)'}`,
                                        background: selectedSessions.includes(s._id) ? '#6366f1' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                                    }}>
                                        {selectedSessions.includes(s._id) && <i className="fas fa-check" style={{ color: 'white', fontSize: '0.6rem' }}></i>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={createReport} disabled={selectedSessions.length === 0} style={{
                            background: selectedSessions.length > 0 ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.06)',
                            color: selectedSessions.length > 0 ? 'white' : 'rgba(255,255,255,0.3)',
                            fontWeight: 700, padding: '0.85rem', borderRadius: '12px', border: 'none', width: '100%',
                            cursor: selectedSessions.length > 0 ? 'pointer' : 'not-allowed',
                        }}>
                            <i className="fas fa-file-pdf" style={{ marginRight: '0.5rem' }}></i>
                            Generate Report ({selectedSessions.length} sessions)
                        </button>
                    </div>
                )}

                {/* Reports List */}
                {reports.length === 0 && !showCreate ? (
                    <div style={{ ...glassCard, padding: '4rem 2rem', textAlign: 'center' }} className="animate-fade-in">
                        <div style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.3 }}><i className="fas fa-file-pdf"></i></div>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', fontWeight: 600 }}>No reports yet</p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', marginBottom: '1.5rem' }}>Generate your first candidate report</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {reports.map((report, idx) => (
                            <div key={report._id} style={{
                                ...glassCard, padding: '1.5rem',
                                animation: `slideInUp 0.4s ease-out ${idx * 0.06}s`, animationFillMode: 'both',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>{report.title}</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
                                            {new Date(report.createdAt).toLocaleDateString()} • {report.sessions?.length || 0} sessions • {report.viewCount} views
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                                            background: `${riskColor(report.overallRisk)}15`, color: riskColor(report.overallRisk),
                                            border: `1px solid ${riskColor(report.overallRisk)}30`,
                                        }}>
                                            Score: {report.averageScore} • {report.overallRisk}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button onClick={() => downloadPDF(report._id, report.title)} style={{
                                        background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '0.5rem 1rem',
                                        borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', border: '1px solid rgba(99,102,241,0.2)',
                                    }}>
                                        <i className="fas fa-download" style={{ marginRight: '0.3rem' }}></i> PDF
                                    </button>
                                    <button onClick={() => copyShareLink(report.shareToken)} style={{
                                        background: copiedId === report.shareToken ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.12)',
                                        color: copiedId === report.shareToken ? '#6ee7b7' : '#a78bfa', padding: '0.5rem 1rem',
                                        borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem',
                                        border: `1px solid ${copiedId === report.shareToken ? 'rgba(16,185,129,0.3)' : 'rgba(139,92,246,0.2)'}`,
                                    }}>
                                        <i className={copiedId === report.shareToken ? 'fas fa-check' : 'fas fa-share-alt'} style={{ marginRight: '0.3rem' }}></i>
                                        {copiedId === report.shareToken ? 'Copied!' : 'Share'}
                                    </button>
                                    <button onClick={() => deleteReport(report._id)} style={{
                                        background: 'rgba(239,68,68,0.12)', color: '#fca5a5', padding: '0.5rem 0.75rem',
                                        borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', border: '1px solid rgba(239,68,68,0.2)',
                                    }}>
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
