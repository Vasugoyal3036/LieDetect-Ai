import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import VideoRecorder from '../components/VideoRecorder';

const DEFAULT_QUESTIONS = [
  'Tell me about a time when you failed at something important.',
  'Describe your biggest professional achievement.',
  'How do you handle conflicts with colleagues?',
  'What is your biggest weakness?',
  'Tell me about a project where you had to learn something new quickly.',
];

const glassCard = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  transition: 'all 0.3s',
};

export default function Interview() {
  const navigate = useNavigate();

  // ── Question Bank State ──
  const [questionBanks, setQuestionBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [jobRole, setJobRole] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [banksLoading, setBanksLoading] = useState(true);

  // ── Interview State ──
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // ── Anti-Cheat State ──
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [pasteAttempts, setPasteAttempts] = useState(0);
  const [keystrokeCount, setKeystrokeCount] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(null);
  const warningTimeout = useRef(null);

  // ── Video State ──
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  // ── Load question banks ──
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await axios.get('/question-banks');
        setQuestionBanks(res.data);
      } catch (err) {
        console.error('Failed to fetch question banks:', err);
      } finally {
        setBanksLoading(false);
      }
    };
    fetchBanks();
  }, []);

  // ── Tab-switch detection ──
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && interviewStarted && !result) {
        setTabSwitchCount(prev => prev + 1);
        triggerWarning('⚠️ Tab switch detected! This will be flagged in your analysis.', '#ef4444');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [interviewStarted, result]);

  // ── Reset anti-cheat on new question ──
  useEffect(() => {
    setTabSwitchCount(0);
    setPasteAttempts(0);
    setKeystrokeCount(0);
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const triggerWarning = useCallback((msg, color) => {
    setShowWarning({ msg, color });
    if (warningTimeout.current) clearTimeout(warningTimeout.current);
    warningTimeout.current = setTimeout(() => setShowWarning(null), 4000);
  }, []);

  const handlePaste = (e) => {
    e.preventDefault();
    setPasteAttempts(prev => prev + 1);
    triggerWarning('🚫 Paste is disabled! Type your own answer for accurate analysis.', '#f59e0b');
  };

  const handleKeyDown = () => setKeystrokeCount(prev => prev + 1);

  const startInterview = (bank) => {
    if (bank === 'default') {
      setQuestions(DEFAULT_QUESTIONS);
      setJobRole('');
      setSelectedBank(null);
    } else {
      setQuestions(bank.questions.map(q => q.text));
      setJobRole(bank.jobRole || '');
      setSelectedBank(bank);
    }
    setCurrentQuestionIndex(0);
    setAnswer('');
    setResult(null);
    setInterviewStarted(true);
  };

  // Use a ref to capture the latest video blob (avoids stale closure)
  const videoBlobRef = useRef(null);
  const handleRecordingComplete = useCallback((blob) => {
    setVideoBlob(blob);
    videoBlobRef.current = blob;
  }, []);

  const submitAnswer = async () => {
    if (!answer.trim() && !videoEnabled) { triggerWarning('Please provide an answer first.', '#ef4444'); return; }
    setLoading(true);
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    const typingSpeed = timeSpent > 0 ? Math.round((answer.length / timeSpent) * 60) : 0;

    try {
      // Stop recording and wait for blob if video is enabled
      let finalVideoBlob = null;
      if (videoEnabled && isRecording) {
        setIsRecording(false);
        finalVideoBlob = await new Promise((resolve) => {
          const checkBlob = () => {
            if (videoBlobRef.current) {
              resolve(videoBlobRef.current);
            } else {
              setTimeout(checkBlob, 100);
            }
          };
          setTimeout(checkBlob, 300);
        });
      } else if (videoBlobRef.current) {
        finalVideoBlob = videoBlobRef.current;
      }

      // Build FormData to send video + fields in a single request
      const formData = new FormData();
      formData.append('question', currentQuestion);
      formData.append('answer', answer);
      formData.append('category', selectedBank?.title || 'interview');
      formData.append('antiCheat', JSON.stringify({ tabSwitchCount, pasteAttempts, typingSpeed, timeSpentSeconds: timeSpent }));

      if (finalVideoBlob) {
        formData.append('video', finalVideoBlob, 'recording.webm');
      }

      const response = await axios.post('/analysis/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2 min timeout for video processing
      });
      setResult({ ...response.data.analysis });
    } catch (err) {
      triggerWarning('Analysis failed: ' + (err.response?.data?.message || err.message), '#ef4444');
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setAnswer('');
      setResult(null);
      setVideoBlob(null);
      videoBlobRef.current = null;
    } else {
      navigate('/history');
    }
  };

  const goToPrevious = () => {
    setCurrentQuestionIndex(currentQuestionIndex - 1);
    setAnswer('');
    setResult(null);
  };

  const WarningToast = () => showWarning ? (
    <div style={{
      position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100,
      background: `${showWarning.color}20`,
      border: `1px solid ${showWarning.color}50`,
      color: showWarning.color === '#ef4444' ? '#fca5a5' : '#fde68a',
      padding: '1rem 1.5rem', borderRadius: '14px',
      backdropFilter: 'blur(20px)',
      fontWeight: 600, fontSize: '0.9rem', maxWidth: '400px',
      boxShadow: `0 8px 30px ${showWarning.color}30`,
    }} className="animate-slide-in-right">
      {showWarning.msg}
    </div>
  ) : null;

  const AntiCheatBar = () => (
    <div style={{
      display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
      padding: '0.75rem 1rem',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)',
      fontSize: '0.75rem', fontWeight: 600,
    }}>
      <span style={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <i className="fas fa-shield-alt" style={{ color: '#6366f1' }}></i> Anti-Cheat Active
      </span>
      <span style={{ color: tabSwitchCount > 0 ? '#fca5a5' : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        <i className="fas fa-eye"></i> Tabs: {tabSwitchCount}
      </span>
      <span style={{ color: pasteAttempts > 0 ? '#fde68a' : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        <i className="fas fa-paste"></i> Pastes: {pasteAttempts}
      </span>
      <span style={{ color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        <i className="fas fa-keyboard"></i> Keys: {keystrokeCount}
      </span>
    </div>
  );

  /* ── BANK SELECTION SCREEN ── */
  if (!interviewStarted) {
    return (
      <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2rem)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }} className="animate-fade-in">
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
              background: 'linear-gradient(135deg, #818cf8, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              marginBottom: '0.25rem',
            }}>
              <i className="fas fa-microphone" style={{ WebkitTextFillColor: 'initial', color: '#6366f1', marginRight: '0.5rem' }}></i>
              Start Interview
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1rem' }}>Choose a question bank to begin your interview session</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {/* Default Bank */}
            <div
              onClick={() => startInterview('default')}
              style={{
                ...glassCard, padding: '1.5rem', cursor: 'pointer',
                borderLeft: '3px solid #6366f1',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{
                width: '48px', height: '48px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem', color: 'white', marginBottom: '1rem',
                boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
              }}>
                <i className="fas fa-star"></i>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Default Questions</h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.5rem' }}>Standard behavioral interview questions for general roles</p>
              <p style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600 }}>
                <i className="fas fa-list" style={{ marginRight: '0.3rem' }}></i> {DEFAULT_QUESTIONS.length} questions
              </p>
            </div>

            {/* Custom Banks */}
            {banksLoading ? (
              <div style={{ ...glassCard, padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%' }} className="animate-spin"></div>
              </div>
            ) : (
              questionBanks.map((bank, idx) => (
                <div
                  key={bank._id}
                  onClick={() => startInterview(bank)}
                  style={{
                    ...glassCard, padding: '1.5rem', cursor: 'pointer',
                    borderLeft: '3px solid #8b5cf6',
                    animation: `slideInUp 0.4s ease-out ${(idx + 1) * 0.08}s`, animationFillMode: 'both',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(139,92,246,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{
                    width: '48px', height: '48px',
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.3rem', color: 'white', marginBottom: '1rem',
                    boxShadow: '0 4px 15px rgba(139,92,246,0.25)',
                  }}>
                    <i className="fas fa-folder-open"></i>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>{bank.title}</h3>
                  {bank.jobRole && <p style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: 600, marginBottom: '0.5rem' }}><i className="fas fa-briefcase" style={{ marginRight: '0.3rem' }}></i> {bank.jobRole}</p>}
                  {bank.description && <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>{bank.description.substring(0, 80)}...</p>}
                  <p style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600 }}>
                    <i className="fas fa-list" style={{ marginRight: '0.3rem' }}></i> {bank.questions.length} questions
                  </p>
                </div>
              ))
            )}

            {/* Create New */}
            <div
              onClick={() => navigate('/questions')}
              style={{
                ...glassCard, padding: '1.5rem', cursor: 'pointer',
                borderLeft: '3px solid rgba(255,255,255,0.1)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: '180px',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = '#6366f1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              <i className="fas fa-plus-circle" style={{ fontSize: '2.5rem', color: 'rgba(255,255,255,0.2)', marginBottom: '0.75rem' }}></i>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Create Custom Bank</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── RESULT VIEW ── */
  if (result) {
    const flags = result.suspiciousFlags || [];
    return (
      <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2rem)' }}>
        <WarningToast />
        <div style={{ maxWidth: '700px', margin: '0 auto' }} className="animate-fade-in">
          <div style={{ ...glassCard, padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.8rem', fontWeight: 800,
                background: 'linear-gradient(135deg, #818cf8, #8b5cf6, #ec4899)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Analysis Complete</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>Question {currentQuestionIndex + 1} of {questions.length}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '14px', padding: '1.5rem' }}>
                  <p style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600, marginBottom: '0.5rem' }}><i className="fas fa-chart-line" style={{ marginRight: '0.4rem' }}></i> Genuineness Score</p>
                  <p style={{ fontSize: '2.8rem', fontWeight: 800, color: '#fff' }}>{result.genuinenessScore}</p>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.25rem' }}>out of 100</p>
                </div>
                <div style={{
                  background: result.bluffRisk === 'Low' ? 'rgba(16,185,129,0.08)' : result.bluffRisk === 'Medium' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${result.bluffRisk === 'Low' ? 'rgba(16,185,129,0.2)' : result.bluffRisk === 'Medium' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  borderRadius: '14px', padding: '1.5rem',
                }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: result.bluffRisk === 'Low' ? '#6ee7b7' : result.bluffRisk === 'Medium' ? '#fbbf24' : '#fca5a5' }}>
                    <i className="fas fa-shield-alt" style={{ marginRight: '0.4rem' }}></i> Bluff Risk
                  </p>
                  <p style={{ fontSize: '2.8rem', fontWeight: 800, color: result.bluffRisk === 'Low' ? '#10b981' : result.bluffRisk === 'Medium' ? '#f59e0b' : '#ef4444' }}>{result.bluffRisk}</p>
                </div>
                {/* Answer Quality Score */}
                {(() => {
                  const qs = result.answerQualityScore || 0;
                  const qColor = qs >= 81 ? '#10b981' : qs >= 61 ? '#3b82f6' : qs >= 41 ? '#f59e0b' : '#ef4444';
                  const qBg = qs >= 81 ? 'rgba(16,185,129,0.08)' : qs >= 61 ? 'rgba(59,130,246,0.08)' : qs >= 41 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';
                  const qBorder = qs >= 81 ? 'rgba(16,185,129,0.2)' : qs >= 61 ? 'rgba(59,130,246,0.2)' : qs >= 41 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)';
                  const qLabel = qs >= 81 ? 'Excellent' : qs >= 61 ? 'Good' : qs >= 41 ? 'Average' : qs >= 21 ? 'Below Average' : 'Poor';
                  return (
                    <div style={{ background: qBg, border: `1px solid ${qBorder}`, borderRadius: '14px', padding: '1.5rem' }}>
                      <p style={{ fontSize: '0.8rem', color: qColor, fontWeight: 600, marginBottom: '0.5rem' }}>
                        <i className="fas fa-star" style={{ marginRight: '0.4rem' }}></i> Answer Quality
                      </p>
                      <p style={{ fontSize: '2.8rem', fontWeight: 800, color: '#fff' }}>{qs}</p>
                      <p style={{ fontSize: '0.7rem', color: qColor, marginTop: '0.25rem', fontWeight: 600 }}>{qLabel}</p>
                    </div>
                  );
                })()}
              </div>

              {flags.length > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderLeft: '3px solid #ef4444', borderRadius: '14px', padding: '1.25rem' }}>
                  <h3 style={{ fontWeight: 700, color: '#fca5a5', marginBottom: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fas fa-exclamation-triangle"></i> Suspicious Activity
                  </h3>
                  <ul style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {flags.map((f, i) => <li key={i}><i className="fas fa-flag" style={{ color: '#ef4444', marginRight: '0.4rem', fontSize: '0.65rem' }}></i>{f}</li>)}
                  </ul>
                </div>
              )}

              {result.transcription && (
                <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderLeft: '3px solid #3b82f6', borderRadius: '14px', padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: 700, color: '#93c5fd', marginBottom: '0.75rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fas fa-microphone" style={{ color: '#3b82f6' }}></i> AI Transcription
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, fontStyle: 'italic' }}>"{result.transcription}"</p>
                </div>
              )}

              <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderLeft: '3px solid #8b5cf6', borderRadius: '14px', padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: '0.75rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fas fa-robot" style={{ color: '#8b5cf6' }}></i> AI Feedback
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>{result.feedback}</p>
              </div>

              {/* Suggested Answer */}
              {result.suggestedAnswer && result.answerQualityScore < 75 && (
                <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderLeft: '3px solid #10b981', borderRadius: '14px', padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: 700, color: '#6ee7b7', marginBottom: '0.75rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fas fa-lightbulb" style={{ color: '#10b981' }}></i> Suggested Answer
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, fontStyle: 'italic' }}>{result.suggestedAnswer}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                {currentQuestionIndex > 0 && (
                  <button onClick={goToPrevious} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', padding: '0.85rem', borderRadius: '12px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
                    <i className="fas fa-arrow-left" style={{ marginRight: '0.4rem' }}></i> Previous
                  </button>
                )}
                <button onClick={nextQuestion} style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', padding: '0.85rem', borderRadius: '12px', fontWeight: 700, border: 'none', boxShadow: '0 4px 15px rgba(99,102,241,0.3)', transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(99,102,241,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.3)'; }}>
                  {currentQuestionIndex === questions.length - 1 ? (<><i className="fas fa-check" style={{ marginRight: '0.4rem' }}></i> Finish</>) : (<>Next <i className="fas fa-arrow-right" style={{ marginLeft: '0.4rem' }}></i></>)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── QUESTION VIEW ── */
  return (
    <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2rem)' }}>
      <WarningToast />
      <div style={{ maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <h1 style={{
                fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800,
                background: 'linear-gradient(135deg, #818cf8, #8b5cf6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                <i className="fas fa-microphone" style={{ WebkitTextFillColor: 'initial', color: '#6366f1', marginRight: '0.5rem' }}></i>
                Interview
              </h1>
              {selectedBank && <p style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: 600, marginTop: '0.25rem' }}><i className="fas fa-folder-open" style={{ marginRight: '0.3rem' }}></i> {selectedBank.title}</p>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button onClick={() => setInterviewStarted(false)} style={{
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', padding: '0.4rem 0.8rem',
                borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
                <i className="fas fa-arrow-left" style={{ marginRight: '0.3rem' }}></i> Change Bank
              </button>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.12)', padding: '0.4rem 1rem', borderRadius: '9999px', border: '1px solid rgba(99,102,241,0.2)' }}>
                {currentQuestionIndex + 1} / {questions.length}
              </span>
            </div>
          </div>
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', height: '6px', borderRadius: '9999px', transition: 'width 0.5s ease-out', boxShadow: '0 0 12px rgba(99,102,241,0.4)' }}></div>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}><AntiCheatBar /></div>

        {/* Video Toggle + Recorder */}
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => { setVideoEnabled(!videoEnabled); if (!videoEnabled) setIsRecording(true); else setIsRecording(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: videoEnabled ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.08)',
              color: videoEnabled ? '#fca5a5' : '#818cf8',
              padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem',
              border: `1px solid ${videoEnabled ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.15)'}`,
              transition: 'all 0.3s', marginBottom: videoEnabled ? '0.75rem' : 0,
            }}>
            <i className={videoEnabled ? 'fas fa-video-slash' : 'fas fa-video'}></i>
            {videoEnabled ? 'Disable Video Recording' : 'Enable Video Recording'}
          </button>
          {videoEnabled && (
            <VideoRecorder isRecording={isRecording} onRecordingComplete={handleRecordingComplete} />
          )}
        </div>

        <div style={{ ...glassCard, padding: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '1.25rem' }} className="animate-slide-in-up">
          <h2 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 700, color: '#fff', marginBottom: '1.5rem', lineHeight: 1.5 }}>{currentQuestion}</h2>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer here... (Paste is disabled)"
            style={{
              width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
              color: '#f1f5f9', fontSize: '1rem', fontFamily: 'inherit',
              resize: 'vertical', minHeight: '160px', transition: 'all 0.3s', outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
          />
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
            <button onClick={submitAnswer} disabled={loading || (!answer.trim() && !videoEnabled)}
              style={{
                flex: 1, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
                fontWeight: 700, padding: '0.85rem', borderRadius: '12px', border: 'none', fontSize: '1rem',
                boxShadow: '0 4px 15px rgba(99,102,241,0.3)', transition: 'all 0.3s',
                opacity: (loading || (!answer.trim() && !videoEnabled)) ? 0.5 : 1, cursor: (loading || (!answer.trim() && !videoEnabled)) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
              onMouseEnter={e => { if (!loading && (answer.trim() || videoEnabled)) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(99,102,241,0.4)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.3)'; }}>
              {loading ? (<><span style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} className="animate-spin"></span> Analyzing...</>) : (<><i className="fas fa-search"></i> Analyze</>)}
            </button>
            {currentQuestionIndex > 0 && (
              <button onClick={goToPrevious} style={{ padding: '0.85rem 1.25rem', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', borderRadius: '12px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
                <i className="fas fa-arrow-left" style={{ marginRight: '0.3rem' }}></i> Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
