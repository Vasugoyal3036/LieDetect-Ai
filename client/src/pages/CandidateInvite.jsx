import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../api/axios';
import VideoRecorder from '../components/VideoRecorder';

const glassCard = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  transition: 'all 0.3s',
};

export default function CandidateInvite() {
  const { token } = useParams();
  
  // ── Invite State ──
  const [inviteDetails, setInviteDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);

  // ── Interview State ──
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Anti-Cheat State ──
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [pasteAttempts, setPasteAttempts] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(null);
  const warningTimeout = useRef(null);

  // ── Video State ──
  const [videoEnabled, setVideoEnabled] = useState(true); // Default to true for candidates
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const videoBlobRef = useRef(null);

  // Load invitation details on mount
  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await axios.get(`/invites/public/${token}`);
        setInviteDetails(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired invitation link.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [token]);

  // Anti-cheat tab detection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && interviewStarted && !interviewComplete) {
        setTabSwitchCount(prev => prev + 1);
        triggerWarning('⚠️ Disconnecting from test window is prohibited. This will be flagged.', '#ef4444');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [interviewStarted, interviewComplete]);

  // Reset metrics per question
  useEffect(() => {
    setTabSwitchCount(0);
    setPasteAttempts(0);
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
    triggerWarning('🚫 Copy/Paste is disabled for this interview.', '#ef4444');
  };

  const startInterview = () => {
    setInterviewStarted(true);
    setCurrentQuestionIndex(0);
    setQuestionStartTime(Date.now());
  };

  const handleRecordingComplete = useCallback((blob) => {
    setVideoBlob(blob);
    videoBlobRef.current = blob;
  }, []);

  const questions = inviteDetails?.questionBank?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex) / questions.length) * 100 : 0;

  const submitAnswer = async () => {
    if (!answer.trim() && !videoEnabled) {
      triggerWarning('Please provide an answer or record a video.', '#ef4444');
      return;
    }
    setSubmitting(true);
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    const typingSpeed = timeSpent > 0 && answer ? Math.round((answer.length / timeSpent) * 60) : 0;

    try {
      let finalVideoBlob = null;
      if (videoEnabled && isRecording) {
        setIsRecording(false);
        finalVideoBlob = await new Promise((resolve) => {
          const checkBlob = () => videoBlobRef.current ? resolve(videoBlobRef.current) : setTimeout(checkBlob, 100);
          setTimeout(checkBlob, 300);
        });
      } else if (videoBlobRef.current) {
        finalVideoBlob = videoBlobRef.current;
      }

      const formData = new FormData();
      formData.append('question', currentQuestion.text || currentQuestion); // Handle simple strings or objects
      formData.append('answer', answer);
      formData.append('antiCheat', JSON.stringify({ tabSwitchCount, pasteAttempts, typingSpeed, timeSpentSeconds: timeSpent }));

      if (finalVideoBlob) {
        formData.append('video', finalVideoBlob, 'recording.webm');
      }

      // Submit the individual answer
      await axios.post(`/invites/public/${token}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });

      // Move to next question or complete
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setAnswer('');
        setVideoBlob(null);
        videoBlobRef.current = null;
        if (videoEnabled) setIsRecording(true); // Auto-start next recording
      } else {
        // Complete the interview
        await axios.post(`/invites/public/${token}/complete`);
        setInterviewComplete(true);
      }
    } catch (err) {
      triggerWarning('Failed to submit answer: ' + (err.response?.data?.message || err.message), '#ef4444');
    } finally {
      setSubmitting(false);
    }
  };

  const WarningToast = () => showWarning ? (
    <div style={{
      position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100,
      background: `${showWarning.color}20`, border: `1px solid ${showWarning.color}50`,
      color: showWarning.color === '#ef4444' ? '#fca5a5' : '#fde68a',
      padding: '1rem 1.5rem', borderRadius: '14px', backdropFilter: 'blur(20px)',
      fontWeight: 600, fontSize: '0.9rem', boxShadow: `0 8px 30px ${showWarning.color}30`,
    }} className="animate-slide-in-right">
      {showWarning.msg}
    </div>
  ) : null;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%' }} className="animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ ...glassCard, padding: '3rem', textAlign: 'center', maxWidth: '500px' }}>
          <i className="fas fa-exclamation-circle" style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '1.5rem' }}></i>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>Invitation Unavailable</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (interviewComplete) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ ...glassCard, padding: '4rem 3rem', textAlign: 'center', maxWidth: '600px', borderTop: '4px solid #10b981' }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
            <i className="fas fa-check" style={{ fontSize: '2.5rem', color: '#10b981' }}></i>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>Interview Submitted</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
            Thank you, <strong>{inviteDetails.candidateName}</strong>! Your responses have been successfully recorded and sent to <strong>{inviteDetails.recruiterName}</strong> for review.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>You may now close this window safely.</p>
        </div>
      </div>
    );
  }

  if (!interviewStarted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ ...glassCard, padding: '3rem', maxWidth: '600px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <i className="fas fa-video" style={{ fontSize: '1.8rem', color: 'white' }}></i>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Welcome, {inviteDetails.candidateName}</h1>
            <p style={{ color: '#818cf8', fontSize: '1.1rem', fontWeight: 600 }}>{inviteDetails.recruiterName} invited you to interview.</p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2.5rem' }}>
            <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}><i className="fas fa-info-circle" style={{ color: '#6366f1', marginRight: '0.5rem' }}></i> Instructions</h3>
            <ul style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.8, paddingLeft: '1.5rem', margin: 0 }}>
              <li>This interview contains <strong>{questions.length} questions</strong>.</li>
              <li>You must allow camera and microphone access.</li>
              <li>Do not switch tabs or use external resources (this is tracked).</li>
              <li>Speak clearly and naturally into the camera.</li>
            </ul>
          </div>

          <button onClick={startInterview}
            style={{
              width: '100%', background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: 'white',
              fontWeight: 700, padding: '1.2rem', borderRadius: '12px', border: 'none', fontSize: '1.1rem',
              boxShadow: '0 8px 25px rgba(16,185,129,0.3)', cursor: 'pointer', transition: 'all 0.3s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(16,185,129,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(16,185,129,0.3)'; }}
          >
            Start Camera & Begin Interview <i className="fas fa-arrow-right" style={{ marginLeft: '0.5rem' }}></i>
          </button>
        </div>
      </div>
    );
  }

  // ── 5. ACTUAL INTERVIEW UI ──
  return (
    <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2rem)' }}>
      <WarningToast />
      <div style={{ maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
        
        {/* Header & Progress */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
              <i className="fas fa-record-vinyl animate-pulse" style={{ color: '#10b981', marginRight: '0.5rem' }}></i>
              Interview in Progress
            </h1>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.12)', padding: '0.4rem 1rem', borderRadius: '9999px', border: '1px solid rgba(99,102,241,0.2)' }}>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #10b981, #3b82f6)', height: '100%', transition: 'width 0.5s ease' }}></div>
          </div>
        </div>

        {/* Video Recorder */}
        <div style={{ marginBottom: '1.5rem' }}>
          <VideoRecorder isRecording={isRecording} onRecordingComplete={handleRecordingComplete} />
          {!isRecording && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button 
                onClick={() => setIsRecording(true)}
                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '50px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(239,68,68,0.4)' }}
              >
                <i className="fas fa-circle" style={{ marginRight: '0.5rem' }}></i> Start Recording Answer
              </button>
            </div>
          )}
          {isRecording && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button 
                onClick={() => setIsRecording(false)}
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.75rem 2rem', borderRadius: '50px', fontWeight: 700, cursor: 'pointer' }}
              >
                <i className="fas fa-stop" style={{ marginRight: '0.5rem' }}></i> Stop Recording
              </button>
            </div>
          )}
        </div>

        {/* Question Area */}
        <div style={{ ...glassCard, padding: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {currentQuestion.text || currentQuestion}
          </h2>
          
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onPaste={handlePaste}
            placeholder="Optionally, you can type supplementary notes here..."
            style={{
              width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
              color: '#f1f5f9', fontSize: '1rem', fontFamily: 'inherit',
              resize: 'vertical', minHeight: '100px', transition: 'all 0.3s', outline: 'none',
              marginBottom: '1.5rem'
            }}
          />

          <button onClick={submitAnswer} disabled={submitting || isRecording}
            style={{
              width: '100%', background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: 'white',
              fontWeight: 700, padding: '1rem', borderRadius: '12px', border: 'none', fontSize: '1.05rem',
              boxShadow: '0 4px 15px rgba(16,185,129,0.3)', transition: 'all 0.3s',
              opacity: (submitting || isRecording) ? 0.5 : 1, cursor: (submitting || isRecording) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            {submitting ? (
              <><span style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin"></span> Processing (This may take a minute)...</>
            ) : (
              <>{currentQuestionIndex === questions.length - 1 ? "Submit Final Answer" : 'Submit & Next Question'} <i className="fas fa-arrow-right"></i></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
