import { useState, useRef, useCallback } from 'react';
import axios from '../api/axios';

const glassCard = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  transition: 'all 0.3s',
};

const PRACTICE_QUESTIONS = [
  { text: 'Tell me about yourself.', category: 'Behavioral' },
  { text: 'What is your greatest strength?', category: 'Behavioral' },
  { text: 'Describe a challenge you overcame at work.', category: 'Situational' },
  { text: 'Why should we hire you?', category: 'General' },
  { text: 'Where do you see yourself in 5 years?', category: 'General' },
  { text: 'Tell me about a time you failed.', category: 'Behavioral' },
  { text: 'How do you handle tight deadlines?', category: 'Situational' },
  { text: 'Describe your ideal work environment.', category: 'General' },
];

export default function Practice() {
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [practiceCount, setPracticeCount] = useState(0);

  const question = selectedQuestion || customQuestion;

  const submitPractice = async () => {
    if (!question.trim() || !answer.trim()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('question', question);
      formData.append('answer', answer);

      const response = await axios.post('/practice/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      setResult(response.data.analysis);
      setPracticeCount(prev => prev + 1);
    } catch (err) {
      alert('Practice analysis failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedQuestion(null);
    setCustomQuestion('');
    setAnswer('');
    setResult(null);
  };

  // Calculate readiness score from practice history
  const readinessLabel = practiceCount === 0 ? 'Not Started' : practiceCount < 3 ? 'Warming Up' : practiceCount < 6 ? 'Getting Ready' : 'Interview Ready';
  const readinessColor = practiceCount === 0 ? 'rgba(255,255,255,0.3)' : practiceCount < 3 ? '#f59e0b' : practiceCount < 6 ? '#3b82f6' : '#10b981';

  /* ── RESULT VIEW ── */
  if (result) {
    const qs = result.answerQualityScore || 0;
    const qColor = qs >= 81 ? '#10b981' : qs >= 61 ? '#3b82f6' : qs >= 41 ? '#f59e0b' : '#ef4444';
    const qLabel = qs >= 81 ? 'Excellent' : qs >= 61 ? 'Good' : qs >= 41 ? 'Average' : qs >= 21 ? 'Below Average' : 'Poor';

    return (
      <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2rem)' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }} className="animate-fade-in">
          {/* Practice Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: '9999px', padding: '0.4rem 1rem', marginBottom: '1.5rem',
            fontSize: '0.8rem', fontWeight: 700, color: '#6ee7b7',
          }}>
            <i className="fas fa-flask"></i> Practice Mode — Results are private & not saved
          </div>

          <div style={{ ...glassCard, padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
            <h2 style={{
              fontSize: '1.6rem', fontWeight: 800, textAlign: 'center', marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, #10b981, #3b82f6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Practice Analysis</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '14px', padding: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600, marginBottom: '0.4rem' }}>Genuineness</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>{result.genuinenessScore}</p>
                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>out of 100</p>
              </div>
              <div style={{
                background: `rgba(${result.bluffRisk === 'Low' ? '16,185,129' : result.bluffRisk === 'Medium' ? '245,158,11' : '239,68,68'},0.08)`,
                border: `1px solid rgba(${result.bluffRisk === 'Low' ? '16,185,129' : result.bluffRisk === 'Medium' ? '245,158,11' : '239,68,68'},0.2)`,
                borderRadius: '14px', padding: '1.25rem', textAlign: 'center',
              }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: result.bluffRisk === 'Low' ? '#6ee7b7' : result.bluffRisk === 'Medium' ? '#fbbf24' : '#fca5a5' }}>Bluff Risk</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 800, color: result.bluffRisk === 'Low' ? '#10b981' : result.bluffRisk === 'Medium' ? '#f59e0b' : '#ef4444' }}>{result.bluffRisk}</p>
              </div>
              <div style={{ background: `${qColor}12`, border: `1px solid ${qColor}33`, borderRadius: '14px', padding: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: qColor, fontWeight: 600, marginBottom: '0.4rem' }}>Answer Quality</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>{qs}</p>
                <p style={{ fontSize: '0.7rem', color: qColor, fontWeight: 600 }}>{qLabel}</p>
              </div>
            </div>

            <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderLeft: '3px solid #8b5cf6', borderRadius: '14px', padding: '1.25rem', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <i className="fas fa-robot" style={{ color: '#8b5cf6', marginRight: '0.4rem' }}></i> AI Coaching Feedback
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, fontSize: '0.9rem' }}>{result.feedback}</p>
            </div>

            {result.suggestedAnswer && (
              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderLeft: '3px solid #10b981', borderRadius: '14px', padding: '1.25rem', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 700, color: '#6ee7b7', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <i className="fas fa-lightbulb" style={{ color: '#10b981', marginRight: '0.4rem' }}></i> Suggested Better Answer
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, fontStyle: 'italic', fontSize: '0.9rem' }}>{result.suggestedAnswer}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={reset} style={{
                flex: 1, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', padding: '0.85rem',
                borderRadius: '12px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
                <i className="fas fa-redo" style={{ marginRight: '0.4rem' }}></i> Try Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── QUESTION SELECTION VIEW ── */
  return (
    <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2rem)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
                background: 'linear-gradient(135deg, #10b981, #3b82f6, #8b5cf6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                marginBottom: '0.25rem',
              }}>
                <i className="fas fa-flask" style={{ WebkitTextFillColor: 'initial', color: '#10b981', marginRight: '0.5rem' }}></i>
                Practice Mode
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1rem' }}>
                Test your answers privately — results are never saved to your profile
              </p>
            </div>
            <div style={{
              background: `${readinessColor}18`, border: `1px solid ${readinessColor}40`,
              borderRadius: '12px', padding: '0.75rem 1.25rem', textAlign: 'center',
            }}>
              <p style={{ fontSize: '0.7rem', color: readinessColor, fontWeight: 700, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Readiness</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: readinessColor }}>{readinessLabel}</p>
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>{practiceCount} sessions</p>
            </div>
          </div>
        </div>

        {/* Question Selection */}
        <div style={{ ...glassCard, padding: '2rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-question-circle" style={{ color: '#6366f1' }}></i>
            {selectedQuestion ? 'Selected Question' : 'Choose a Question'}
          </h2>

          {!selectedQuestion ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {PRACTICE_QUESTIONS.map((q, idx) => (
                  <button key={idx} onClick={() => setSelectedQuestion(q.text)} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                    padding: '1rem', textAlign: 'left', color: '#f1f5f9', transition: 'all 0.3s', cursor: 'pointer',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  >
                    <span style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{q.category}</span>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: '0.3rem', lineHeight: 1.4 }}>{q.text}</p>
                  </button>
                ))}
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
                  <i className="fas fa-pencil-alt" style={{ marginRight: '0.4rem', color: '#8b5cf6' }}></i> Or type your own question:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" value={customQuestion} onChange={e => setCustomQuestion(e.target.value)}
                    placeholder="Enter a custom interview question..."
                    style={{
                      flex: 1, padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                      color: '#f1f5f9', fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', lineHeight: 1.5 }}>{selectedQuestion}</p>
              <button onClick={() => setSelectedQuestion(null)} style={{
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', padding: '0.5rem 0.75rem',
                borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap',
              }}>
                <i className="fas fa-exchange-alt"></i> Change
              </button>
            </div>
          )}
        </div>

        {/* Answer Area — only show when question is selected */}
        {question && (
          <div style={{ ...glassCard, padding: '2rem' }} className="animate-slide-in-up">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
              <i className="fas fa-keyboard" style={{ color: '#6366f1', marginRight: '0.4rem' }}></i> Your Answer
            </h2>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Type your answer here... Be as natural as possible — this is practice!"
              style={{
                width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                color: '#f1f5f9', fontSize: '1rem', fontFamily: 'inherit',
                resize: 'vertical', minHeight: '150px', transition: 'all 0.3s', outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
            <button
              onClick={submitPractice}
              disabled={loading || !answer.trim()}
              style={{
                width: '100%', marginTop: '1rem', background: (loading || !answer.trim()) ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #10b981, #3b82f6)',
                color: (loading || !answer.trim()) ? 'rgba(255,255,255,0.4)' : 'white',
                fontWeight: 700, padding: '0.85rem', borderRadius: '12px', border: 'none', fontSize: '1rem',
                boxShadow: (loading || !answer.trim()) ? 'none' : '0 4px 15px rgba(16,185,129,0.3)',
                transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                cursor: (loading || !answer.trim()) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <><span style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} className="animate-spin"></span> Analyzing...</>
              ) : (
                <><i className="fas fa-flask"></i> Get Practice Feedback</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
