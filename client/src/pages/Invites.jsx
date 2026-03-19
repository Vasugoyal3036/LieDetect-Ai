import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';

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
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invitesRes, banksRes] = await Promise.all([
        axios.get('/invites'),
        axios.get('/questions')
      ]);
      setInvites(invitesRes.data);
      setBanks(banksRes.data.filter(b => b.isUserCreated));
    } catch (err) {
      console.error('Failed to fetch invites data:', err);
    } finally {
      setLoading(false);
    }
  };

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
          <button onClick={() => setShowForm(!showForm)} style={{
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

        {/* Invite Form */}
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
                <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                    Selecting a specific question bank limits the interview to those questions only.
                </p>
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                <button type="submit" disabled={sending} style={{ width: '100%', padding: '1rem', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: 'white', fontWeight: 'bold', border: 'none', opacity: sending ? 0.7 : 1 }}>
                  {sending ? 'Sending Invite Email...' : 'Generate & Send Interview Link'}
                </button>
              </div>
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
