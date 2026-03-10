import { useEffect, useState } from 'react';
import axios from '../api/axios';

const glassCard = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  transition: 'all 0.3s',
};

export default function Feedback() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get('/history');
      setSessions(response.data);
      if (response.data.length > 0) setSelectedSession(response.data[0]);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 1rem' }} className="animate-spin"></div>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Loading feedback data...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2rem)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }} className="animate-fade-in">
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
            background: 'linear-gradient(135deg, #818cf8, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: '0.25rem',
          }}>
            <i className="fas fa-comments" style={{ WebkitTextFillColor: 'initial', color: '#8b5cf6', marginRight: '0.5rem' }}></i>
            Detailed Feedback
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1rem' }}>Review comprehensive analysis of your interview responses</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }} className="feedback-grid">

          {/* Sidebar */}
          <div className={`feedback-sidebar ${sidebarOpen ? '' : 'sidebar-hidden'}`} style={{ ...(sidebarOpen ? {} : { display: 'none' }) }}>
            <div style={{ ...glassCard, padding: 0, overflow: 'hidden', position: 'sticky', top: '5rem' }} className="animate-slide-in-left">
              <div style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                padding: '1rem 1.5rem',
              }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <i className="fas fa-list-ul"></i> Sessions
                </h2>
              </div>
              <div style={{ padding: '0.75rem', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {sessions.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', padding: '2rem 0' }}>No sessions yet</p>
                ) : (
                  sessions.map((session, idx) => {
                    const isSelected = selectedSession?._id === session._id;
                    return (
                      <button
                        key={session._id}
                        onClick={() => { setSelectedSession(session); setSidebarOpen(false); }}
                        style={{
                          width: '100%', textAlign: 'left',
                          padding: '0.85rem 1rem', borderRadius: '10px',
                          transition: 'all 0.3s',
                          background: isSelected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                          border: isSelected ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                          cursor: 'pointer',
                          animation: `slideInUp 0.4s ease-out ${idx * 0.04}s`,
                          animationFillMode: 'both',
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      >
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)', marginBottom: '0.35rem', lineHeight: 1.3 }}>
                          {session.question.substring(0, 30)}...
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                            Score: <span style={{ fontWeight: 700, color: '#818cf8' }}>{session.genuinenessScore}</span>
                          </span>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px',
                            background: session.bluffRisk === 'Low' ? 'rgba(16,185,129,0.15)' : session.bluffRisk === 'Medium' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                            color: session.bluffRisk === 'Low' ? '#6ee7b7' : session.bluffRisk === 'Medium' ? '#fbbf24' : '#fca5a5',
                          }}>{session.bluffRisk}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          {selectedSession ? (
            <div className="feedback-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Mobile Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="feedback-mobile-toggle"
                style={{
                  display: 'none', width: '100%',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)', padding: '0.75rem', borderRadius: '10px',
                  fontWeight: 600, transition: 'all 0.3s',
                }}
              >
                {sidebarOpen ? (<><i className="fas fa-chevron-left" style={{ marginRight: '0.4rem' }}></i> Hide Sessions</>) : (<><i className="fas fa-list-ul" style={{ marginRight: '0.4rem' }}></i> Show Sessions</>)}
              </button>

              {/* Question */}
              <div style={{ ...glassCard, padding: '1.5rem' }} className="animate-slide-in-right">
                <h3 style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
                  <i className="fas fa-question-circle" style={{ marginRight: '0.4rem', color: '#6366f1' }}></i> Question
                </h3>
                <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', lineHeight: 1.5 }}>{selectedSession.question}</p>
              </div>

              {/* Answer */}
              <div style={{ ...glassCard, padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
                  <i className="fas fa-pen" style={{ marginRight: '0.4rem', color: '#8b5cf6' }}></i> Your Answer
                </h3>
                <div style={{
                  background: 'rgba(99,102,241,0.05)',
                  borderLeft: '3px solid #6366f1',
                  borderRadius: '10px', padding: '1.25rem',
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>{selectedSession.answer}</p>
                </div>
              </div>

              {/* Score Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{
                  background: 'rgba(99,102,241,0.06)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: '14px', padding: '1.5rem',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.7rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '1px' }}>Genuineness Score</h3>
                    <i className="fas fa-chart-bar" style={{ color: '#6366f1', fontSize: '1.25rem' }}></i>
                  </div>
                  <p style={{ fontSize: '2.8rem', fontWeight: 800, color: '#fff' }}>{selectedSession.genuinenessScore}</p>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.25rem' }}>Out of 100 points</p>
                  <div style={{ position: 'absolute', top: '-40%', right: '-20%', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
                </div>

                <div style={{
                  background: selectedSession.bluffRisk === 'Low' ? 'rgba(16,185,129,0.06)' : selectedSession.bluffRisk === 'Medium' ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)',
                  border: `1px solid ${selectedSession.bluffRisk === 'Low' ? 'rgba(16,185,129,0.15)' : selectedSession.bluffRisk === 'Medium' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'}`,
                  borderRadius: '14px', padding: '1.5rem',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <h3 style={{
                      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
                      color: selectedSession.bluffRisk === 'Low' ? '#6ee7b7' : selectedSession.bluffRisk === 'Medium' ? '#fbbf24' : '#fca5a5',
                    }}>Risk Assessment</h3>
                    <span style={{ fontSize: '1.25rem' }}>
                      {selectedSession.bluffRisk === 'Low' ? (<i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>) : selectedSession.bluffRisk === 'Medium' ? (<i className="fas fa-exclamation-triangle" style={{ color: '#f59e0b' }}></i>) : (<i className="fas fa-times-circle" style={{ color: '#ef4444' }}></i>)}
                    </span>
                  </div>
                  <p style={{
                    fontSize: '2.2rem', fontWeight: 800,
                    color: selectedSession.bluffRisk === 'Low' ? '#10b981' : selectedSession.bluffRisk === 'Medium' ? '#f59e0b' : '#ef4444',
                  }}>{selectedSession.bluffRisk}</p>
                  <p style={{
                    fontSize: '0.75rem', marginTop: '0.25rem',
                    color: selectedSession.bluffRisk === 'Low' ? 'rgba(16,185,129,0.7)' : selectedSession.bluffRisk === 'Medium' ? 'rgba(245,158,11,0.7)' : 'rgba(239,68,68,0.7)',
                  }}>
                    {selectedSession.bluffRisk === 'Low' ? 'Authentic response' : selectedSession.bluffRisk === 'Medium' ? 'Requires verification' : 'High likelihood of deception'}
                  </p>
                </div>
              </div>

              {/* AI Feedback */}
              <div style={{
                background: 'rgba(139,92,246,0.05)',
                border: '1px solid rgba(139,92,246,0.12)',
                borderLeft: '3px solid #8b5cf6',
                borderRadius: '14px', padding: '1.75rem',
              }}>
                <h3 style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fas fa-robot"></i> AI Feedback & Insights
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.9, fontSize: '1.05rem' }}>{selectedSession.feedback}</p>
              </div>

              {/* Category */}
              <div style={{ ...glassCard, padding: '1.25rem 1.5rem' }}>
                <h3 style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
                  <i className="fas fa-tag" style={{ marginRight: '0.4rem', color: '#6366f1' }}></i> Category
                </h3>
                <span style={{
                  display: 'inline-block', padding: '0.4rem 1rem', borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white', fontWeight: 600, fontSize: '0.85rem',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.2)',
                }}>
                  {selectedSession.category || 'Interview'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ ...glassCard, padding: '4rem 2rem', textAlign: 'center' }} className="animate-fade-in">
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}><i className="fas fa-inbox"></i></div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', fontWeight: 600 }}>No sessions available</p>
              <p style={{ color: 'rgba(255,255,255,0.35)' }}>Start an interview to see detailed feedback here</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .feedback-grid { grid-template-columns: 280px 1fr !important; }
          .feedback-sidebar { display: block !important; }
          .feedback-mobile-toggle { display: none !important; }
          .sidebar-hidden { display: block !important; }
        }
        @media (max-width: 1023px) {
          .feedback-mobile-toggle { display: block !important; }
        }
      `}</style>
    </div>
  );
}
