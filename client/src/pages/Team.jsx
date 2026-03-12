import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const glassCard = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
};

export default function Team() {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Invite form
  const [showInvite, setShowInvite] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Interviewer');
  const [inviteResult, setInviteResult] = useState(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const res = await axios.get('/team');
      setTeam(res.data);
    } catch (err) {
      console.error('Failed to fetch team', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteResult(null);
    try {
      const res = await axios.post('/team/invite', { name, email, role });
      setInviteResult({ success: true, message: res.data.message, tempPassword: res.data.member.temporaryPassword });
      setName('');
      setEmail('');
      setRole('Interviewer');
      fetchTeam();
    } catch (err) {
      setInviteResult({ success: false, message: err.response?.data?.message || 'Failed to invite user.' });
    }
  };

  const removeMember = async (id, memberName) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from your workspace workspace?`)) return;
    try {
      await axios.delete(`/team/${id}`);
      fetchTeam();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove team member.');
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
              background: 'linear-gradient(135deg, #10b981, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              <i className="fas fa-users" style={{ WebkitTextFillColor: 'initial', color: '#10b981', marginRight: '0.5rem' }}></i>
              Team Workspace
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)' }}>Manage roles and collaborate on interview recordings.</p>
          </div>
          {/* Admin only button */}
          {user?.role === 'Admin' && (
            <button onClick={() => setShowInvite(!showInvite)} style={{
              background: showInvite ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg, #10b981, #6366f1)',
              color: showInvite ? '#fca5a5' : 'white', padding: '0.75rem 1.75rem', borderRadius: '12px',
              fontWeight: 700, border: showInvite ? '1px solid rgba(239,68,68,0.3)' : 'none',
              boxShadow: showInvite ? 'none' : '0 4px 15px rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <i className={showInvite ? 'fas fa-times' : 'fas fa-user-plus'}></i>
              {showInvite ? 'Cancel' : 'Invite Member'}
            </button>
          )}
        </div>

        {/* Invite Form */}
        {showInvite && (
          <div style={{ ...glassCard, padding: '2rem', marginBottom: '2rem' }} className="animate-slide-in-up">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem' }}>
              <i className="fas fa-envelope-open-text" style={{ color: '#10b981', marginRight: '0.5rem' }}></i> Invite New Member
            </h2>
            <form onSubmit={handleInvite} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" required
                style={{ flex: 1, padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f5f9' }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" required
                style={{ flex: 1, padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f5f9' }} />
              <select value={role} onChange={e => setRole(e.target.value)} 
                style={{ padding: '0.75rem 1rem', background: '#1a1a3e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f5f9' }}>
                <option value="Interviewer">Interviewer (Can conduct and view)</option>
                <option value="Recruiter">Recruiter (Can view and rate)</option>
              </select>
              <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', background: '#10b981', color: 'white', fontWeight: 'bold', border: 'none' }}>
                Send Invite
              </button>
            </form>
            
            {inviteResult && (
              <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '10px', 
                background: inviteResult.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${inviteResult.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: inviteResult.success ? '#6ee7b7' : '#fca5a5'
              }}>
                <i className={inviteResult.success ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'} style={{ marginRight: '0.5rem' }}></i>
                {inviteResult.message}
                {inviteResult.tempPassword && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '5px', fontFamily: 'monospace' }}>
                        Temporary Password: <strong>{inviteResult.tempPassword}</strong>
                    </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Team List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {team.map((member, idx) => (
            <div key={member._id} style={{
              ...glassCard, padding: '1.5rem',
              animation: `slideInUp 0.4s ease-out ${idx * 0.06}s`, animationFillMode: 'both',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, #10b981, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
                        {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{member.name} {member._id === user._id && '(You)'}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{member.email}</p>
                    </div>
                </div>
              </div>
              
              <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{
                    padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                    background: member.role === 'Admin' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)', 
                    color: member.role === 'Admin' ? '#818cf8' : '#6ee7b7',
                    border: `1px solid ${member.role === 'Admin' ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.3)'}`,
                }}>
                    <i className={member.role === 'Admin' ? 'fas fa-crown' : 'fas fa-user-tag'} style={{ marginRight: '0.3rem' }}></i>
                    {member.role}
                 </span>
                 
                 {user?.role === 'Admin' && member._id !== user._id && (
                     <button onClick={() => removeMember(member._id, member.name)} style={{
                        background: 'rgba(239,68,68,0.12)', color: '#fca5a5', padding: '0.4rem 0.6rem',
                        borderRadius: '6px', fontSize: '0.8rem', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer'
                    }}>
                        Remove
                    </button>
                 )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
