import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import socket, { connectSocket, disconnectSocket } from '../utils/socket';

const glassCard = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
};

export default function Invites() {
  const [invites, setInvites] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Invite Form State
  const [showForm, setShowForm] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [questionBankId, setQuestionBankId] = useState('');
  const [sending, setSending] = useState(false);

  // Batch CSV State
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [batchQBId, setBatchQBId] = useState('');
  const [batchSending, setBatchSending] = useState(false);
  const [batchResult, setBatchResult] = useState(null);

  // Live Proctoring State
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [showLivePanel, setShowLivePanel] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invitesRes, banksRes] = await Promise.all([
        axios.get('/invites'),
        axios.get('/question-banks')
      ]);
      setInvites(invitesRes.data);
      setBanks(banksRes.data);

      // Connect to pending invite rooms for live monitoring
      invitesRes.data.forEach(invite => {
        if (invite.status === 'Pending') {
          connectSocket(invite.token);
        }
      });
    } catch (err) {
      console.error('Failed to fetch invites data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleUpdate = (data) => {
      console.log('📡 [Socket] Received real-time proctoring update:', data);
      setLiveAlerts(prev => [{
        ...data,
        id: Date.now() + Math.random(),
        isNew: true
      }, ...prev].slice(0, 50)); // Keep last 50 alerts
      setShowLivePanel(true);
    };

    socket.on('realtime_proctoring_update', handleUpdate);
    return () => {
      socket.off('realtime_proctoring_update', handleUpdate);
      disconnectSocket();
    };
  }, []);

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await axios.post('/invites', { 
        candidateName, 
        candidateEmail, 
        questionBankId: questionBankId || null 
      });
      alert('Invitation sent successfully!');
      setShowForm(false);
      setCandidateName('');
      setCandidateEmail('');
      setQuestionBankId('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send invite.');
    } finally {
      setSending(false);
    }
  };

  const handleBatchUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return alert('Please select a CSV file first.');
    setBatchSending(true);
    setBatchResult(null);
    try {
      const formData = new FormData();
      formData.append('csv', csvFile);
      if (batchQBId) formData.append('questionBankId', batchQBId);
      const res = await axios.post('/invites/batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      setBatchResult(res.data);
      setCsvFile(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Batch upload failed.');
    } finally {
      setBatchSending(false);
    }
  };

  const downloadCsvTemplate = () => {
    const csv = 'name,email\nJohn Doe,john@example.com\nJane Smith,jane@example.com\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'invite_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this invitation?')) return;
    try {
      await axios.delete(`/invites/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete invite.');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div style={{ width: '56px', height: '56px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%' }} className="animate-spin"></div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2rem)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }} className="animate-fade-in">
          <div>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
              background: 'linear-gradient(135deg, #10b981, #3b82f6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              <i className="fas fa-envelope-open-text" style={{ WebkitTextFillColor: 'initial', color: '#10b981', marginRight: '0.5rem' }}></i>
              Candidate Invites
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)' }}>Send magic link interviews directly to candidates.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setShowLivePanel(!showLivePanel)} style={{
              background: liveAlerts.some(a => a.isNew) ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
              color: liveAlerts.some(a => a.isNew) ? '#ef4444' : 'rgba(255,255,255,0.6)',
              padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 700,
              border: liveAlerts.some(a => a.isNew) ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative'
            }}>
              <i className="fas fa-satellite-dish animate-pulse"></i>
              Live Monitor
              {liveAlerts.filter(a => a.isNew).length > 0 && (
                <span style={{
                  position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444',
                  color: 'white', borderRadius: '50%', width: '18px', height: '18px',
                  fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {liveAlerts.filter(a => a.isNew).length}
                </span>
              )}
            </button>
            <button onClick={() => { setShowBatchForm(!showBatchForm); setShowForm(false); }} style={{
              background: showBatchForm ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
              color: showBatchForm ? '#fca5a5' : '#818cf8', padding: '0.75rem 1.25rem', borderRadius: '12px',
              fontWeight: 700, border: showBatchForm ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(99,102,241,0.3)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <i className={showBatchForm ? 'fas fa-times' : 'fas fa-file-csv'}></i>
              {showBatchForm ? 'Cancel' : 'Batch CSV'}
            </button>
            <button onClick={() => { setShowForm(!showForm); setShowBatchForm(false); }} style={{
              background: showForm ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg, #10b981, #3b82f6)',
              color: showForm ? '#fca5a5' : 'white', padding: '0.75rem 1.75rem', borderRadius: '12px',
              fontWeight: 700, border: showForm ? '1px solid rgba(239,68,68,0.3)' : 'none',
              boxShadow: showForm ? 'none' : '0 4px 15px rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <i className={showForm ? 'fas fa-times' : 'fas fa-paper-plane'}></i>
              {showForm ? 'Cancel' : 'Send Invite'}
            </button>
          </div>
        </div>

        {/* Live Proctoring Panel */}
        {showLivePanel && (
          <div style={{
            ...glassCard, padding: '1.5rem', marginBottom: '2rem',
            borderLeft: '4px solid #ef4444', background: 'rgba(239,68,68,0.02)'
          }} className="animate-slide-in-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-shield-alt"></i> Real-time Proctoring Alerts
              </h2>
              <button onClick={() => {
                setLiveAlerts(prev => prev.map(a => ({ ...a, isNew: false })));
                setShowLivePanel(false);
              }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {liveAlerts.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
                  No live activity detected yet.
                </p>
              ) : (
                liveAlerts.map(alert => (
                  <div key={alert.id} style={{
                    padding: '1rem', borderRadius: '10px',
                    background: alert.isNew ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${alert.isNew ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.9rem' }}>{alert.details.candidateName}</span>
                        <span style={{
                          fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
                          background: 'rgba(239,68,68,0.2)', color: '#fca5a5', fontWeight: 800, textTransform: 'uppercase'
                        }}>{alert.type.replace('_', ' ')}</span>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: 0 }}>{alert.details.message}</p>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Single Invite Form */}
        {showForm && (
          <div style={{ ...glassCard, padding: '2rem', marginBottom: '2rem' }} className="animate-slide-in-up">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem' }}>
              Create New Interview Loop
            </h2>
            <form onSubmit={handleCreateInvite} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input type="text" value={candidateName} onChange={e => setCandidateName(e.target.value)} placeholder="Candidate's Full Name" required
                style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f5f9' }} />
              
              <input type="email" value={candidateEmail} onChange={e => setCandidateEmail(e.target.value)} placeholder="Candidate's Email Address" required
                style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f5f9' }} />
              
              <div style={{ gridColumn: '1 / -1' }}>
                <select value={questionBankId} onChange={e => setQuestionBankId(e.target.value)} 
                  style={{ width: '100%', padding: '0.75rem 1rem', background: '#1a1a3e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f5f9' }}>
                  <option value="">Default General Interview Questions</option>
                  {banks.map(b => <option key={b._id} value={b._id}>{b.title} ({b.questions.length} Qs)</option>)}
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                <button type="submit" disabled={sending} style={{ width: '100%', padding: '1rem', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: 'white', fontWeight: 'bold', border: 'none', opacity: sending ? 0.7 : 1 }}>
                  {sending ? 'Sending Invite Email...' : 'Generate & Send Interview Link'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Batch CSV Form */}
        {showBatchForm && (
          <div style={{ ...glassCard, padding: '2rem', marginBottom: '2rem' }} className="animate-slide-in-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-file-csv" style={{ color: '#10b981' }}></i> Batch CSV Import
              </h2>
              <button type="button" onClick={downloadCsvTemplate} style={{
                background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '0.5rem 1rem',
                borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', border: '1px solid rgba(99,102,241,0.2)',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}>
                <i className="fas fa-download"></i> Download Template
              </button>
            </div>
            <form onSubmit={handleBatchUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '12px',
                padding: '2rem', textAlign: 'center', cursor: 'pointer',
                background: csvFile ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.3s',
              }}
                onClick={() => document.getElementById('csv-upload').click()}
              >
                <input id="csv-upload" type="file" accept=".csv" style={{ display: 'none' }}
                  onChange={e => setCsvFile(e.target.files[0])} />
                {csvFile ? (
                  <div>
                    <i className="fas fa-file-csv" style={{ fontSize: '2rem', color: '#10b981', marginBottom: '0.5rem' }}></i>
                    <p style={{ color: '#6ee7b7', fontWeight: 600 }}>{csvFile.name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{(csvFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <i className="fas fa-cloud-upload-alt" style={{ fontSize: '2.5rem', color: 'rgba(255,255,255,0.2)', marginBottom: '0.75rem' }}></i>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Click to upload CSV file</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      CSV must have <strong>name</strong> and <strong>email</strong> columns
                    </p>
                  </div>
                )}
              </div>

              <select value={batchQBId} onChange={e => setBatchQBId(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', background: '#1a1a3e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f5f9' }}>
                <option value="">Default General Interview Questions</option>
                {banks.map(b => <option key={b._id} value={b._id}>{b.title} ({b.questions.length} Qs)</option>)}
              </select>

              <button type="submit" disabled={batchSending || !csvFile} style={{
                width: '100%', padding: '1rem', borderRadius: '10px',
                background: batchSending || !csvFile ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #10b981, #3b82f6)',
                color: batchSending || !csvFile ? 'rgba(255,255,255,0.4)' : 'white',
                fontWeight: 'bold', border: 'none', transition: 'all 0.3s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}>
                {batchSending ? (
                  <><span style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} className="animate-spin"></span> Sending invites...</>
                ) : (
                  <><i className="fas fa-paper-plane"></i> Send Batch Invites</>
                )}
              </button>

              {batchResult && (
                <div style={{
                  background: batchResult.failed > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                  border: `1px solid ${batchResult.failed > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`,
                  borderRadius: '12px', padding: '1.25rem',
                }}>
                  <p style={{ fontWeight: 700, color: '#6ee7b7', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fas fa-check-circle"></i> {batchResult.message}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                    <span style={{ color: '#6ee7b7' }}><i className="fas fa-check" style={{ marginRight: '0.3rem' }}></i> {batchResult.sent} sent</span>
                    {batchResult.failed > 0 && <span style={{ color: '#fca5a5' }}><i className="fas fa-times" style={{ marginRight: '0.3rem' }}></i> {batchResult.failed} failed</span>}
                  </div>
                  {batchResult.errors?.length > 0 && (
                    <div style={{ marginTop: '0.75rem', maxHeight: '120px', overflow: 'auto' }}>
                      {batchResult.errors.map((e, i) => (
                        <p key={i} style={{ fontSize: '0.8rem', color: '#fca5a5', marginBottom: '0.25rem' }}>
                          <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.3rem', fontSize: '0.7rem' }}></i> {e}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Invites List */}
        {invites.length === 0 && !showForm ? (
             <div style={{ ...glassCard, padding: '4rem', textAlign: 'center', marginTop: '2rem' }}>
               <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <i className="fas fa-inbox" style={{ fontSize: '2.5rem', color: '#10b981' }}></i>
               </div>
               <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 700 }}>No active invites</h3>
               <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '400px', margin: '0 auto' }}>
                 Start an asynchronous interview process by sending a magic link to your first candidate.
               </p>
             </div>
        ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {invites.map((invite, idx) => (
                <div key={invite._id} style={{
                ...glassCard, padding: '1.5rem', display: 'flex', flexDirection: 'column',
                animation: `slideInUp 0.4s ease-out ${idx * 0.05}s`, animationFillMode: 'both',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>{invite.candidateName}</h3>
                        <p style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 500 }}>{invite.candidateEmail}</p>
                    </div>
                    {/* Status Badge */}
                    <span style={{
                        padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                        background: invite.status === 'Completed' ? 'rgba(16,185,129,0.15)' : invite.status === 'Expired' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', 
                        color: invite.status === 'Completed' ? '#6ee7b7' : invite.status === 'Expired' ? '#fca5a5' : '#fcd34d',
                        border: `1px solid ${invite.status === 'Completed' ? 'rgba(16,185,129,0.3)' : invite.status === 'Expired' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                    }}>
                        {invite.status === 'Completed' && <i className="fas fa-check-circle" style={{ marginRight: '0.3rem' }}></i>}
                        {invite.status === 'Pending' && <i className="fas fa-clock" style={{ marginRight: '0.3rem' }}></i>}
                        {invite.status}
                    </span>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 0.4rem 0' }}>
                        <i className="fas fa-folder-open" style={{ width: '16px', color: '#6366f1' }}></i>
                        {invite.questionBankId?.title || 'Default General Bank'}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                        <i className="fas fa-calendar-alt" style={{ width: '16px', color: '#6366f1' }}></i>
                        Sent: {new Date(invite.createdAt).toLocaleDateString()}
                    </p>
                </div>
                
                <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                    {invite.status === 'Completed' && invite.reportId ? (
                        <button onClick={() => navigate(`/reports`)} style={{
                            flex: 1, background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)',
                            padding: '0.6rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                        }} onMouseEnter={e => e.currentTarget.style.background='rgba(16,185,129,0.25)'} onMouseLeave={e => e.currentTarget.style.background='rgba(16,185,129,0.15)'}>
                            <i className="fas fa-file-pdf"></i> View Report
                        </button>
                    ) : (
                        <button onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/invite/${invite.token}`);
                            alert('Magic link copied to clipboard!');
                        }} style={{
                            flex: 1, background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)',
                            padding: '0.6rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                        }} onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,0.25)'} onMouseLeave={e => e.currentTarget.style.background='rgba(99,102,241,0.15)'}>
                            <i className="fas fa-link"></i> Copy Link
                        </button>
                    )}
                    
                    <button onClick={() => handleDelete(invite._id)} style={{
                        background: 'rgba(239,68,68,0.12)', color: '#fca5a5', padding: '0.6rem 0.8rem',
                        borderRadius: '8px', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', transition: 'all 0.2s'
                    }} onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.25)'} onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,0.12)'}>
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
