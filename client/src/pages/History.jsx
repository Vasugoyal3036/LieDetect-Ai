import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

const glassCard = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  transition: 'all 0.3s',
};

export default function History() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewType, setViewType] = useState('self'); // 'self' vs 'candidate'
  const [expandedSession, setExpandedSession] = useState(null);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const [historyRes, invitesRes] = await Promise.all([
        axios.get("/history"),
        axios.get("/invites").catch(() => ({ data: [] }))
      ]);
      setSessions(historyRes.data);
      setInvites(invitesRes.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const typeFilteredSessions = sessions.filter(s => 
    viewType === 'candidate' ? s.category === 'Candidate Invite' : s.category !== 'Candidate Invite'
  );

  const filteredSessions = filter === 'all'
    ? typeFilteredSessions
    : typeFilteredSessions.filter(s => s.bluffRisk.toLowerCase() === filter.toLowerCase());

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 1rem' }} className="animate-spin"></div>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Loading interview history...</p>
      </div>
    </div>
  );

  const filterButtons = [
    { label: 'All', value: 'all', icon: 'fas fa-th-list', activeColor: '#6366f1', activeBg: 'rgba(99,102,241,0.15)', activeBorder: 'rgba(99,102,241,0.3)' },
    { label: 'Low', value: 'low', icon: 'fas fa-check-circle', activeColor: '#10b981', activeBg: 'rgba(16,185,129,0.15)', activeBorder: 'rgba(16,185,129,0.3)' },
    { label: 'Medium', value: 'medium', icon: 'fas fa-exclamation-circle', activeColor: '#f59e0b', activeBg: 'rgba(245,158,11,0.15)', activeBorder: 'rgba(245,158,11,0.3)' },
    { label: 'High', value: 'high', icon: 'fas fa-times-circle', activeColor: '#ef4444', activeBg: 'rgba(239,68,68,0.15)', activeBorder: 'rgba(239,68,68,0.3)' },
  ];

  return (
    <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2rem)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }} className="animate-fade-in">
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
            background: 'linear-gradient(135deg, #818cf8, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: '0.25rem',
          }}>
            <i className="fas fa-clock-rotate-left" style={{ WebkitTextFillColor: 'initial', color: '#6366f1', marginRight: '0.5rem' }}></i>
            Interview History
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1rem' }}>Review and analyze all your past interview sessions</p>
        </div>

        {/* Tabs for Candidate vs Self */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => setViewType('self')} style={{
                background: 'transparent', color: viewType === 'self' ? '#fff' : 'rgba(255,255,255,0.4)',
                border: 'none', borderBottom: viewType === 'self' ? '2px solid #6366f1' : '2px solid transparent',
                padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s'
            }}>
                <i className="fas fa-user" style={{ marginRight: '0.5rem' }}></i> My Interviews
            </button>
            <button onClick={() => setViewType('candidate')} style={{
                background: 'transparent', color: viewType === 'candidate' ? '#fff' : 'rgba(255,255,255,0.4)',
                border: 'none', borderBottom: viewType === 'candidate' ? '2px solid #ec4899' : '2px solid transparent',
                padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s'
            }}>
                <i className="fas fa-users" style={{ marginRight: '0.5rem' }}></i> Candidate Invites
            </button>
        </div>

        {/* Filter Buttons */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }} className="animate-slide-in-up">
          {filterButtons.map((btn) => {
            const isActive = filter === btn.value;
            return (
              <button
                key={btn.value}
                onClick={() => setFilter(btn.value)}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem',
                  background: isActive ? btn.activeBg : 'rgba(255,255,255,0.04)',
                  color: isActive ? btn.activeColor : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${isActive ? btn.activeBorder : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              >
                <i className={btn.icon} style={{ fontSize: '0.75rem' }}></i>
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Count */}
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginBottom: '1rem' }}>
          Showing {filteredSessions.length} {viewType === 'candidate' ? 'candidate sessions' : 'personal sessions'}
        </p>

        {/* Content */}
        {filteredSessions.length === 0 ? (
          <div style={{ ...glassCard, padding: '4rem 2rem', textAlign: 'center' }} className="animate-fade-in">
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}><i className="fas fa-inbox"></i></div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', fontWeight: 600 }}>No interviews found in this category</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', marginBottom: '1.5rem' }}>{viewType === 'self' ? 'Start a new personal interview session' : 'Send a magic link to a candidate from the Invites tab'}</p>
            {viewType === 'self' && (
                <button onClick={() => navigate('/interview')} style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
                padding: '0.75rem 2rem', borderRadius: '10px', fontWeight: 600, border: 'none',
                boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                }}>
                <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i> Start Interview
                </button>
            )}
          </div>
        ) : (
          <div style={{ ...glassCard, padding: 0, overflow: 'hidden' }} className="animate-slide-in-up">
            {/* Desktop Table */}
            <div className="history-desktop-table" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {viewType === 'candidate' && <th style={{ padding: '0.85rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Candidate</th>}
                    {['Question', 'Answer', 'Score', 'Risk Level'].map(h => (
                      <th key={h} style={{ padding: '0.85rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((s, idx) => {
                    const inviteMatch = invites.find(inv => inv.sessions.includes(s._id));
                    const candidateName = inviteMatch ? inviteMatch.candidateName : 'Unknown';
                    const isExpanded = expandedSession === s._id;
                    
                    return (
                        <React.Fragment key={s._id}>
                        <tr 
                        onClick={() => setExpandedSession(isExpanded ? null : s._id)}
                        style={{ borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.04)', transition: 'all 0.3s', animation: `fadeIn 0.5s ease-out ${idx * 0.04}s`, animationFillMode: 'both', cursor: 'pointer', background: isExpanded ? 'rgba(99,102,241,0.08)' : 'transparent' }}
                        onMouseEnter={e => { if(!isExpanded) e.currentTarget.style.background = 'rgba(99,102,241,0.06)' }}
                        onMouseLeave={e => { if(!isExpanded) e.currentTarget.style.background = 'transparent' }}
                        >
                        {viewType === 'candidate' && <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>{candidateName}</td>}
                        
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ marginRight: '0.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}></i>
                            {s.question.substring(0, 35)}...
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{s.answer.substring(0, 40)}...</td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                            <span style={{ fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.85rem' }}>{s.genuinenessScore}</span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                            <span style={{
                            padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                            background: s.bluffRisk === 'Low' ? 'rgba(16,185,129,0.15)' : s.bluffRisk === 'Medium' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                            color: s.bluffRisk === 'Low' ? '#6ee7b7' : s.bluffRisk === 'Medium' ? '#fbbf24' : '#fca5a5',
                            border: `1px solid ${s.bluffRisk === 'Low' ? 'rgba(16,185,129,0.3)' : s.bluffRisk === 'Medium' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            }}>{s.bluffRisk}</span>
                        </td>
                        </tr>
                        {isExpanded && (
                            <tr style={{ background: 'rgba(15,15,30,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <td colSpan={viewType === 'candidate' ? 5 : 4} style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                        {/* Video/Answer Block */}
                                        <div>
                                            <h4 style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Candidate Response</h4>
                                            {s.videoUrl && s.videoUrl !== "" ? (
                                                <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <video src={s.videoUrl} controls style={{ width: '100%', maxHeight: '250px', display: 'block' }}></video>
                                                </div>
                                            ) : (
                                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', fontSize: '0.85rem', margin: 0 }}>
                                                        <i className="fas fa-video-slash" style={{ marginRight: '0.5rem' }}></i> No video response was recorded for this session.
                                                    </p>
                                                </div>
                                            )}
                                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <h5 style={{ fontSize: '0.75rem', color: '#6366f1', marginBottom: '0.25rem', margin: 0 }}>Transcription / Text Answer</h5>
                                                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0, marginTop: '0.5rem' }}>{s.answer}</p>
                                            </div>
                                        </div>

                                        {/* Feedback Block */}
                                        <div>
                                            <h4 style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>AI Feedback & Analysis</h4>
                                            <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.15)', marginBottom: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Content Quality</p>
                                                        <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', margin: 0 }}>{s.answerQualityScore}/100</p>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Genuineness</p>
                                                        <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#818cf8', margin: 0 }}>{s.genuinenessScore}/100</p>
                                                    </div>
                                                </div>
                                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>{s.feedback}</p>
                                            </div>

                                            {s.suspiciousFlags && s.suspiciousFlags.length > 0 && (
                                                <div style={{ background: 'rgba(239,68,68,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
                                                    <h5 style={{ fontSize: '0.8rem', color: '#fca5a5', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <i className="fas fa-exclamation-triangle"></i> Security Flags
                                                    </h5>
                                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                                                        {s.suspiciousFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                        </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="history-mobile-cards" style={{ display: 'none', padding: '1rem', gap: '0.75rem', flexDirection: 'column' }}>
              {filteredSessions.map((s, idx) => {
                const inviteMatch = invites.find(inv => inv.sessions.includes(s._id));
                const candidateName = inviteMatch ? inviteMatch.candidateName : 'Unknown';
                const isExpanded = expandedSession === s._id;

                return (
                  <div key={s._id} onClick={() => setExpandedSession(isExpanded ? null : s._id)} style={{
                    background: isExpanded ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px', padding: '1rem',
                    animation: `fadeIn 0.5s ease-out ${idx * 0.08}s`, animationFillMode: 'both',
                    cursor: 'pointer', transition: 'all 0.3s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase' }}>{viewType === 'candidate' ? candidateName : 'Question'}</p>
                      <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}></i>
                    </div>
                    
                    <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem' }}>{s.question}</p>
                    {!isExpanded && (
                      <>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Answer Preview</p>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>{s.answer.substring(0, 60)}...</p>
                      </>
                    )}
                    
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: 600 }}>Score</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8' }}>{s.genuinenessScore}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Risk</p>
                        <span style={{
                          padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                          background: s.bluffRisk === 'Low' ? 'rgba(16,185,129,0.15)' : s.bluffRisk === 'Medium' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                          color: s.bluffRisk === 'Low' ? '#6ee7b7' : s.bluffRisk === 'Medium' ? '#fbbf24' : '#fca5a5',
                        }}>{s.bluffRisk}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Candidate Response</h4>
                        {s.videoUrl && s.videoUrl !== "" ? (
                            <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <video src={s.videoUrl} controls style={{ width: '100%', maxHeight: '250px', display: 'block' }}></video>
                            </div>
                        ) : (
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', fontSize: '0.85rem', margin: 0 }}>
                                    <i className="fas fa-video-slash" style={{ marginRight: '0.5rem' }}></i> No video response was recorded.
                                </p>
                            </div>
                        )}
                        <h5 style={{ fontSize: '0.75rem', color: '#6366f1', marginBottom: '0.25rem', margin: 0 }}>Transcription / Default Answer</h5>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0, marginTop: '0.5rem', marginBottom: '1rem' }}>{s.answer}</p>

                        <h4 style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '0.5rem', marginTop: '1rem' }}>AI Feedback</h4>
                        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.15)' }}>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>{s.feedback}</p>
                        </div>
                        
                        {s.suspiciousFlags && s.suspiciousFlags.length > 0 && (
                            <div style={{ background: 'rgba(239,68,68,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', marginTop: '1rem' }}>
                                <h5 style={{ fontSize: '0.8rem', color: '#fca5a5', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <i className="fas fa-exclamation-triangle"></i> Security Flags
                                </h5>
                                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                                    {s.suspiciousFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                                </ul>
                            </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .history-desktop-table { display: none !important; }
          .history-mobile-cards { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
