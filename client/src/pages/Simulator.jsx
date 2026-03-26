import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';

const glassCard = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  transition: 'all 0.3s',
};

const INTERVIEW_TYPES = [
  { value: 'behavioral', label: 'Behavioral', icon: 'fas fa-users', color: '#6366f1', desc: 'STAR-based questions about past experiences' },
  { value: 'technical', label: 'Technical', icon: 'fas fa-code', color: '#10b981', desc: 'System design, algorithms & domain expertise' },
  { value: 'case-study', label: 'Case Study', icon: 'fas fa-briefcase', color: '#f59e0b', desc: 'Business scenarios & analytical thinking' },
  { value: 'mixed', label: 'Mixed', icon: 'fas fa-random', color: '#ec4899', desc: 'Combination of all interview styles' },
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Entry Level', icon: 'fas fa-seedling', color: '#10b981' },
  { value: 'medium', label: 'Mid Level', icon: 'fas fa-fire', color: '#f59e0b' },
  { value: 'hard', label: 'Senior Level', icon: 'fas fa-bolt', color: '#ef4444' },
];

export default function Simulator() {
  const navigate = useNavigate();

  // Setup state
  const [view, setView] = useState('setup'); // 'setup' | 'chat' | 'history' | 'review'
  const [jobRole, setJobRole] = useState('');
  const [interviewType, setInterviewType] = useState('behavioral');
  const [difficulty, setDifficulty] = useState('medium');
  const [totalQuestions, setTotalQuestions] = useState(8);

  // Chat state
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [totalQ, setTotalQ] = useState(8);
  const [coaching, setCoaching] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionResult, setSessionResult] = useState(null);

  // History state
  const [sessions, setSessions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reviewSession, setReviewSession] = useState(null);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, coaching]);

  // Focus input after AI responds
  useEffect(() => {
    if (!loading && view === 'chat' && !isComplete) {
      inputRef.current?.focus();
    }
  }, [loading, view, isComplete]);

  const startInterview = async () => {
    if (!jobRole.trim()) return;
    setIsStarting(true);
    try {
      const res = await axios.post('/simulator/start', {
        jobRole: jobRole.trim(),
        difficulty,
        interviewType,
        totalQuestions,
      });
      const session = res.data.session;
      setSessionId(session._id);
      setMessages(session.messages);
      setQuestionsAsked(session.questionsAsked);
      setTotalQ(session.totalQuestions);
      setCoaching(null);
      setIsComplete(false);
      setSessionResult(null);
      setView('chat');
    } catch (err) {
      console.error('Start error:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const sendAnswer = async () => {
    if (!userInput.trim() || loading) return;
    const answer = userInput.trim();
    setUserInput('');
    setCoaching(null);

    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content: answer, timestamp: new Date() }]);
    setLoading(true);

    try {
      const res = await axios.post(`/simulator/${sessionId}/respond`, { answer }, { timeout: 120000 });
      const data = res.data;

      // Show coaching
      setCoaching(data.coaching);

      // Add AI response
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', content: data.aiMessage, timestamp: new Date() }]);
        setQuestionsAsked(data.questionsAsked);
        setLoading(false);

        if (data.isComplete) {
          setIsComplete(true);
          setSessionResult({
            overallScore: data.overallScore,
            summary: data.summary,
            strengths: data.strengths,
            areasToImprove: data.areasToImprove,
          });
        }
      }, 800); // Brief delay so coaching shows first
    } catch (err) {
      console.error('Respond error:', err);
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAnswer();
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await axios.get('/simulator/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error('History error:', err);
    } finally {
      setHistoryLoading(false);
    }
    setView('history');
  };

  const loadReview = async (id) => {
    try {
      const res = await axios.get(`/simulator/sessions/${id}`);
      setReviewSession(res.data);
      setView('review');
    } catch (err) {
      console.error('Review error:', err);
    }
  };

  const deleteSession = async (id) => {
    try {
      await axios.delete(`/simulator/sessions/${id}`);
      setSessions(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Needs Work';
  };

  const progress = totalQ > 0 ? Math.min((questionsAsked / totalQ) * 100, 100) : 0;

  /* ═══════════════════════════════════════════
     SETUP VIEW
     ═══════════════════════════════════════════ */
  if (view === 'setup') {
    return (
      <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2rem)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
          {/* Header */}
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
                background: 'linear-gradient(135deg, #10b981, #6366f1, #ec4899)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                marginBottom: '0.25rem',
              }}>
                <i className="fas fa-robot" style={{ WebkitTextFillColor: 'initial', color: '#10b981', marginRight: '0.5rem' }}></i>
                AI Interview Simulator
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1rem' }}>Practice with an AI interviewer and get real-time coaching</p>
            </div>
            <button
              onClick={loadHistory}
              style={{
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
                padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: 600,
                fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            >
              <i className="fas fa-history"></i> Past Sessions
            </button>
          </div>

          {/* Job Role Input */}
          <div style={{ ...glassCard, padding: '1.5rem', marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818cf8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="fas fa-briefcase"></i> Job Role / Position
            </label>
            <input
              type="text"
              value={jobRole}
              onChange={e => setJobRole(e.target.value)}
              placeholder="e.g. Frontend Developer, Product Manager, Data Scientist..."
              style={{
                width: '100%', padding: '0.85rem 1rem',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', color: '#f1f5f9', fontSize: '1rem',
                fontFamily: 'inherit', outline: 'none', transition: 'all 0.3s',
              }}
              onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Interview Type Selection */}
          <div style={{ ...glassCard, padding: '1.5rem', marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818cf8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="fas fa-clipboard-list"></i> Interview Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {INTERVIEW_TYPES.map(type => (
                <div
                  key={type.value}
                  onClick={() => setInterviewType(type.value)}
                  style={{
                    padding: '1rem',
                    background: interviewType === type.value ? `${type.color}12` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${interviewType === type.value ? `${type.color}40` : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => { if (interviewType !== type.value) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (interviewType !== type.value) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <i className={type.icon} style={{ color: type.color, fontSize: '0.9rem' }}></i>
                    <span style={{ fontWeight: 700, color: interviewType === type.value ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{type.label}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>{type.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty & Questions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ ...glassCard, padding: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818cf8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fas fa-signal"></i> Difficulty
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {DIFFICULTIES.map(d => (
                  <div
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    style={{
                      padding: '0.7rem 1rem',
                      background: difficulty === d.value ? `${d.color}15` : 'transparent',
                      border: `1px solid ${difficulty === d.value ? `${d.color}40` : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '10px', cursor: 'pointer', transition: 'all 0.3s',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}
                  >
                    <i className={d.icon} style={{ color: d.color, fontSize: '0.8rem' }}></i>
                    <span style={{ fontWeight: 600, color: difficulty === d.value ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...glassCard, padding: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818cf8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fas fa-list-ol"></i> Number of Questions
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[5, 8, 10, 15].map(n => (
                  <div
                    key={n}
                    onClick={() => setTotalQuestions(n)}
                    style={{
                      padding: '0.7rem 1rem',
                      background: totalQuestions === n ? 'rgba(99,102,241,0.12)' : 'transparent',
                      border: `1px solid ${totalQuestions === n ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '10px', cursor: 'pointer', transition: 'all 0.3s',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: totalQuestions === n ? '#818cf8' : 'rgba(255,255,255,0.4)', fontSize: '1.1rem', width: '28px' }}>{n}</span>
                    <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>questions</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startInterview}
            disabled={isStarting || !jobRole.trim()}
            style={{
              width: '100%', padding: '1rem',
              background: jobRole.trim() ? 'linear-gradient(135deg, #10b981, #6366f1)' : 'rgba(255,255,255,0.06)',
              color: jobRole.trim() ? 'white' : 'rgba(255,255,255,0.3)',
              fontWeight: 700, fontSize: '1.1rem', borderRadius: '14px', border: 'none',
              boxShadow: jobRole.trim() ? '0 8px 30px rgba(16,185,129,0.3)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              transition: 'all 0.3s', cursor: jobRole.trim() ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={e => { if (jobRole.trim()) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(16,185,129,0.4)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = jobRole.trim() ? '0 8px 30px rgba(16,185,129,0.3)' : 'none'; }}
          >
            {isStarting ? (
              <><span style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} className="animate-spin"></span> Starting Interview...</>
            ) : (
              <><i className="fas fa-play"></i> Start Interview Simulation</>
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     CHAT VIEW (Active Interview)
     ═══════════════════════════════════════════ */
  if (view === 'chat') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          padding: '0.75rem clamp(1rem, 3vw, 2rem)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(10,10,26,0.5)',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => { setView('setup'); setSessionId(null); setMessages([]); }}
                style={{
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
                  padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 600,
                  fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s',
                }}
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  <i className="fas fa-robot" style={{ color: '#10b981', marginRight: '0.4rem' }}></i>
                  {jobRole}
                </h2>
                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                  {INTERVIEW_TYPES.find(t => t.value === interviewType)?.label} • {DIFFICULTIES.find(d => d.value === difficulty)?.label}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                fontSize: '0.8rem', fontWeight: 700, color: '#818cf8',
                background: 'rgba(99,102,241,0.12)', padding: '0.35rem 0.85rem',
                borderRadius: '9999px', border: '1px solid rgba(99,102,241,0.2)',
              }}>
                Q{Math.min(questionsAsked, totalQ)} / {totalQ}
              </span>
              <div style={{ width: '80px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
                <div style={{
                  width: `${progress}%`, background: 'linear-gradient(90deg, #10b981, #6366f1)',
                  height: '6px', borderRadius: '9999px', transition: 'width 0.5s ease-out',
                }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: 'clamp(1rem, 2vw, 1.5rem)',
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                animation: 'slideInUp 0.3s ease-out',
              }}>
                <div style={{
                  maxWidth: '75%',
                  padding: '1rem 1.25rem',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <i className={msg.role === 'user' ? 'fas fa-user' : 'fas fa-robot'}
                      style={{ fontSize: '0.7rem', color: msg.role === 'user' ? '#818cf8' : '#10b981' }}></i>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: msg.role === 'user' ? '#818cf8' : '#10b981', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {msg.role === 'user' ? 'You' : 'Interviewer'}
                    </span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, margin: 0, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}

            {/* Coaching Feedback Card */}
            {coaching && (
              <div style={{
                ...glassCard, padding: '1.25rem', marginLeft: 'auto', marginRight: 'auto',
                maxWidth: '600px', width: '100%',
                background: 'rgba(16,185,129,0.04)',
                border: '1px solid rgba(16,185,129,0.15)',
                animation: 'slideInUp 0.4s ease-out',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fas fa-graduation-cap"></i> AI Coaching
                  </span>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: `${getScoreColor(coaching.score)}15`,
                    padding: '0.25rem 0.75rem', borderRadius: '9999px',
                    border: `1px solid ${getScoreColor(coaching.score)}30`,
                  }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: getScoreColor(coaching.score) }}>{coaching.score}</span>
                    <span style={{ fontSize: '0.65rem', color: getScoreColor(coaching.score), fontWeight: 600 }}>/100</span>
                  </div>
                </div>

                {coaching.strengths?.length > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    {coaching.strengths.map((s, i) => (
                      <p key={i} style={{ fontSize: '0.8rem', color: '#6ee7b7', margin: '0.2rem 0', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <i className="fas fa-check-circle" style={{ marginTop: '3px', flexShrink: 0 }}></i> {s}
                      </p>
                    ))}
                  </div>
                )}

                {coaching.improvements?.length > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    {coaching.improvements.map((s, i) => (
                      <p key={i} style={{ fontSize: '0.8rem', color: '#fbbf24', margin: '0.2rem 0', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <i className="fas fa-exclamation-circle" style={{ marginTop: '3px', flexShrink: 0 }}></i> {s}
                      </p>
                    ))}
                  </div>
                )}

                {coaching.tip && (
                  <p style={{ fontSize: '0.8rem', color: '#93c5fd', margin: '0.5rem 0 0', fontStyle: 'italic', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                    <i className="fas fa-lightbulb" style={{ color: '#60a5fa', marginTop: '3px', flexShrink: 0 }}></i> {coaching.tip}
                  </p>
                )}
              </div>
            )}

            {/* Loading indicator */}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '1rem 1.5rem', borderRadius: '16px 16px 16px 4px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', gap: '0.4rem', alignItems: 'center',
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.2s infinite' }}></div>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.2s infinite 0.2s' }}></div>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.2s infinite 0.4s' }}></div>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.5rem' }}>AI is thinking...</span>
                </div>
              </div>
            )}

            {/* Session Complete Card */}
            {isComplete && sessionResult && (
              <div style={{
                ...glassCard, padding: '2rem', marginTop: '1rem',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(99,102,241,0.06))',
                border: '1px solid rgba(16,185,129,0.2)',
                animation: 'slideInUp 0.5s ease-out',
              }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{
                    fontSize: '1.6rem', fontWeight: 800,
                    background: 'linear-gradient(135deg, #10b981, #6366f1)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>Interview Complete! 🎉</h2>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '100px', height: '100px', borderRadius: '50%',
                    background: `conic-gradient(${getScoreColor(sessionResult.overallScore)} ${sessionResult.overallScore * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}>
                    <div style={{
                      width: '80px', height: '80px', borderRadius: '50%',
                      background: 'rgba(10,10,30,0.9)', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: 800, color: getScoreColor(sessionResult.overallScore) }}>
                        {sessionResult.overallScore}
                      </span>
                      <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>/100</span>
                    </div>
                  </div>
                </div>

                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                  {sessionResult.summary}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '12px', padding: '1rem' }}>
                    <h4 style={{ color: '#6ee7b7', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      <i className="fas fa-star" style={{ marginRight: '0.3rem' }}></i> Strengths
                    </h4>
                    {sessionResult.strengths?.map((s, i) => (
                      <p key={i} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: '0.25rem 0' }}>• {s}</p>
                    ))}
                  </div>
                  <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '12px', padding: '1rem' }}>
                    <h4 style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      <i className="fas fa-arrow-up" style={{ marginRight: '0.3rem' }}></i> Areas to Improve
                    </h4>
                    {sessionResult.areasToImprove?.map((s, i) => (
                      <p key={i} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: '0.25rem 0' }}>• {s}</p>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => { setView('setup'); setSessionId(null); setMessages([]); setIsComplete(false); setSessionResult(null); setCoaching(null); }}
                    style={{
                      flex: 1, padding: '0.85rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem',
                      background: 'linear-gradient(135deg, #10b981, #6366f1)', color: 'white', border: 'none',
                      boxShadow: '0 4px 15px rgba(16,185,129,0.3)', transition: 'all 0.3s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <i className="fas fa-redo"></i> Practice Again
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                      flex: 1, padding: '0.85rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.95rem',
                      background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    }}
                  >
                    <i className="fas fa-home"></i> Dashboard
                  </button>
                </div>
              </div>
            )}

            <div ref={chatEndRef}></div>
          </div>
        </div>

        {/* Input Area */}
        {!isComplete && (
          <div style={{
            padding: '1rem clamp(1rem, 3vw, 2rem)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(10,10,26,0.8)',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
                disabled={loading}
                rows={2}
                style={{
                  flex: 1, padding: '0.85rem 1rem',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '14px', color: '#f1f5f9', fontSize: '0.95rem',
                  fontFamily: 'inherit', resize: 'none', outline: 'none', transition: 'all 0.3s',
                  opacity: loading ? 0.5 : 1,
                }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                onClick={sendAnswer}
                disabled={loading || !userInput.trim()}
                style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: userInput.trim() && !loading ? 'linear-gradient(135deg, #10b981, #6366f1)' : 'rgba(255,255,255,0.06)',
                  color: userInput.trim() && !loading ? 'white' : 'rgba(255,255,255,0.3)',
                  border: 'none', fontSize: '1.1rem', transition: 'all 0.3s', cursor: userInput.trim() && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     HISTORY VIEW
     ═══════════════════════════════════════════ */
  if (view === 'history') {
    return (
      <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2rem)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{
                fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800,
                background: 'linear-gradient(135deg, #10b981, #6366f1)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                <i className="fas fa-history" style={{ WebkitTextFillColor: 'initial', color: '#10b981', marginRight: '0.5rem' }}></i>
                Past Sessions
              </h1>
            </div>
            <button
              onClick={() => setView('setup')}
              style={{
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
                padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: 600,
                fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s',
              }}
            >
              <i className="fas fa-arrow-left" style={{ marginRight: '0.3rem' }}></i> Back
            </button>
          </div>

          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#10b981', borderRadius: '50%', margin: '0 auto' }} className="animate-spin"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ ...glassCard, padding: '3rem', textAlign: 'center' }}>
              <i className="fas fa-robot" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.15)', marginBottom: '1rem', display: 'block' }}></i>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>No simulator sessions yet. Start your first practice interview!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sessions.map((s, idx) => (
                <div key={s._id} style={{
                  ...glassCard, padding: '1.25rem', cursor: 'pointer',
                  animation: `slideInUp 0.3s ease-out ${idx * 0.05}s`, animationFillMode: 'both',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
                  onClick={() => loadReview(s._id)}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>{s.jobRole}</h3>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 700,
                        background: s.status === 'completed' ? 'rgba(16,185,129,0.12)' : s.status === 'active' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.06)',
                        color: s.status === 'completed' ? '#6ee7b7' : s.status === 'active' ? '#818cf8' : 'rgba(255,255,255,0.4)',
                        padding: '0.15rem 0.5rem', borderRadius: '9999px',
                        border: `1px solid ${s.status === 'completed' ? 'rgba(16,185,129,0.2)' : s.status === 'active' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.08)'}`,
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>{s.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                      <span><i className="fas fa-clipboard-list" style={{ marginRight: '0.3rem' }}></i>{s.interviewType}</span>
                      <span><i className="fas fa-signal" style={{ marginRight: '0.3rem' }}></i>{s.difficulty}</span>
                      <span><i className="fas fa-list" style={{ marginRight: '0.3rem' }}></i>{s.questionsAsked}/{s.totalQuestions} Qs</span>
                      <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {s.overallScore && (
                      <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        background: `${getScoreColor(s.overallScore)}10`, padding: '0.5rem 0.75rem',
                        borderRadius: '10px', border: `1px solid ${getScoreColor(s.overallScore)}25`,
                      }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: 800, color: getScoreColor(s.overallScore) }}>{s.overallScore}</span>
                        <span style={{ fontSize: '0.6rem', color: getScoreColor(s.overallScore), fontWeight: 600 }}>{getScoreLabel(s.overallScore)}</span>
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSession(s._id); }}
                      style={{
                        background: 'rgba(239,68,68,0.08)', color: '#fca5a5', padding: '0.4rem',
                        borderRadius: '8px', border: '1px solid rgba(239,68,68,0.15)', fontSize: '0.8rem',
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    >
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

  /* ═══════════════════════════════════════════
     REVIEW VIEW (Past Session Details)
     ═══════════════════════════════════════════ */
  if (view === 'review' && reviewSession) {
    return (
      <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2rem)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{
                fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 800, color: '#fff',
              }}>
                <i className="fas fa-robot" style={{ color: '#10b981', marginRight: '0.5rem' }}></i>
                {reviewSession.jobRole}
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>
                {reviewSession.interviewType} • {reviewSession.difficulty} • {new Date(reviewSession.createdAt).toLocaleString()}
              </p>
            </div>
            <button onClick={() => loadHistory()} style={{
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
              padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: 600,
              fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <i className="fas fa-arrow-left" style={{ marginRight: '0.3rem' }}></i> Back
            </button>
          </div>

          {/* Summary Card */}
          {reviewSession.overallScore && (
            <div style={{
              ...glassCard, padding: '1.5rem', marginBottom: '1.25rem',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(99,102,241,0.06))',
              border: '1px solid rgba(16,185,129,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '70px', height: '70px', borderRadius: '50%',
                  background: `conic-gradient(${getScoreColor(reviewSession.overallScore)} ${reviewSession.overallScore * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'rgba(10,10,30,0.9)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: getScoreColor(reviewSession.overallScore) }}>{reviewSession.overallScore}</span>
                  </div>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, fontSize: '0.9rem' }}>{reviewSession.summary}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <h4 style={{ color: '#6ee7b7', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}><i className="fas fa-star" style={{ marginRight: '0.3rem' }}></i>Strengths</h4>
                  {reviewSession.strengths?.map((s, i) => <p key={i} style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', margin: '0.15rem 0' }}>• {s}</p>)}
                </div>
                <div>
                  <h4 style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}><i className="fas fa-arrow-up" style={{ marginRight: '0.3rem' }}></i>Improve</h4>
                  {reviewSession.areasToImprove?.map((s, i) => <p key={i} style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', margin: '0.15rem 0' }}>• {s}</p>)}
                </div>
              </div>
            </div>
          )}

          {/* Conversation Replay */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reviewSession.messages?.map((msg, idx) => (
              <div key={idx}>
                <div style={{
                  display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '80%', padding: '1rem 1.25rem',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))'
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                      <i className={msg.role === 'user' ? 'fas fa-user' : 'fas fa-robot'}
                        style={{ fontSize: '0.65rem', color: msg.role === 'user' ? '#818cf8' : '#10b981' }}></i>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: msg.role === 'user' ? '#818cf8' : '#10b981', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {msg.role === 'user' ? 'You' : 'Interviewer'}
                      </span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: 0, fontSize: '0.88rem', whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </p>
                  </div>
                </div>
                {/* Inline coaching for user messages */}
                {msg.role === 'user' && msg.coaching?.score != null && (
                  <div style={{
                    maxWidth: '500px', margin: '0.5rem auto 0', padding: '0.75rem 1rem',
                    background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)',
                    borderRadius: '10px', fontSize: '0.75rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ color: '#6ee7b7', fontWeight: 700 }}><i className="fas fa-graduation-cap" style={{ marginRight: '0.3rem' }}></i>Score</span>
                      <span style={{ fontWeight: 800, color: getScoreColor(msg.coaching.score) }}>{msg.coaching.score}/100</span>
                    </div>
                    {msg.coaching.strengths?.map((s, i) => <p key={`s${i}`} style={{ color: '#6ee7b7', margin: '0.15rem 0' }}>✓ {s}</p>)}
                    {msg.coaching.improvements?.map((s, i) => <p key={`i${i}`} style={{ color: '#fbbf24', margin: '0.15rem 0' }}>↑ {s}</p>)}
                    {msg.coaching.tip && <p style={{ color: '#93c5fd', fontStyle: 'italic', margin: '0.25rem 0 0' }}>💡 {msg.coaching.tip}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
