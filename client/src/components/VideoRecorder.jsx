import { useState, useRef, useCallback, useEffect } from 'react';

export default function VideoRecorder({ isRecording, onRecordingComplete }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);
      setError(null);
    } catch (err) {
      setError('Camera access denied. Please allow camera and microphone.');
      setHasPermission(false);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startCamera]);

  useEffect(() => {
    if (isRecording && hasPermission && streamRef.current) {
      chunksRef.current = [];
      setRecordingTime(0);
      try {
        const mediaRecorder = new MediaRecorder(streamRef.current, {
          mimeType: 'video/webm;codecs=vp8,opus',
        });
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          onRecordingComplete(blob);
          if (timerRef.current) clearInterval(timerRef.current);
        };
        mediaRecorder.start(1000);
        timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
      } catch (err) {
        setError('Recording failed: ' + err.message);
      }
    } else if (!isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording, hasPermission, onRecordingComplete]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{
      position: 'relative', borderRadius: '16px', overflow: 'hidden',
      border: isRecording ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
      background: '#000', transition: 'all 0.3s',
      boxShadow: isRecording ? '0 0 20px rgba(239,68,68,0.2)' : 'none',
    }}>
      {error ? (
        <div style={{
          padding: '2rem', textAlign: 'center',
          background: 'rgba(239,68,68,0.08)', minHeight: '200px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem',
        }}>
          <i className="fas fa-video-slash" style={{ fontSize: '2rem', color: '#fca5a5' }}></i>
          <p style={{ color: '#fca5a5', fontSize: '0.9rem', fontWeight: 600 }}>{error}</p>
          <button onClick={startCamera} style={{
            background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '0.5rem 1rem',
            borderRadius: '8px', fontWeight: 600, border: '1px solid rgba(99,102,241,0.3)',
          }}>
            <i className="fas fa-redo" style={{ marginRight: '0.3rem' }}></i> Retry
          </button>
        </div>
      ) : (
        <>
          <video ref={videoRef} autoPlay muted playsInline
            style={{ width: '100%', display: 'block', maxHeight: '280px', objectFit: 'cover' }} />
          <div style={{
            position: 'absolute', top: '0.75rem', left: '0.75rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            padding: '0.4rem 0.75rem', borderRadius: '8px',
          }}>
            {isRecording ? (
              <>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                <span style={{ color: '#fca5a5', fontWeight: 700, fontSize: '0.8rem' }}>REC {formatTime(recordingTime)}</span>
              </>
            ) : (
              <>
                <i className="fas fa-video" style={{ color: '#6ee7b7', fontSize: '0.75rem' }}></i>
                <span style={{ color: '#6ee7b7', fontWeight: 600, fontSize: '0.8rem' }}>Camera Ready</span>
              </>
            )}
          </div>
          {isRecording && (
            <div style={{
              position: 'absolute', bottom: '0.75rem', right: '0.75rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
              padding: '0.4rem 0.75rem', borderRadius: '8px',
            }}>
              <i className="fas fa-microphone" style={{ color: '#ef4444', fontSize: '0.75rem' }}></i>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '0.75rem' }}>Audio Active</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
