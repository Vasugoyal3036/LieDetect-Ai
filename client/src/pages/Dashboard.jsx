import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from '../api/axios';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const glassCard = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [invites, setInvites] = useState([]);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [riskData, setRiskData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [historyRes, invitesRes] = await Promise.all([
        axios.get('/history'),
        axios.get('/invites').catch(() => ({ data: [] }))
      ]);
      setSessions(historyRes.data);
      setInvites(invitesRes.data);
      calculateStats(historyRes.data);
      prepareChartData(historyRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (sessionList) => {
    if (sessionList.length === 0) {
      setStats({ avgScore: 0, totalSessions: 0, avgRisk: 'N/A', riskDistribution: {} });
      return;
    }
    const avgScore = (sessionList.reduce((sum, s) => sum + s.genuinenessScore, 0) / sessionList.length).toFixed(2);
    const riskCounts = sessionList.reduce((acc, s) => {
      acc[s.bluffRisk] = (acc[s.bluffRisk] || 0) + 1;
      return acc;
    }, {});
    setRiskData([
      { name: 'Low', value: riskCounts.Low || 0, fill: '#10b981' },
      { name: 'Medium', value: riskCounts.Medium || 0, fill: '#f59e0b' },
      { name: 'High', value: riskCounts.High || 0, fill: '#ef4444' }
    ]);
    setStats({ avgScore, totalSessions: sessionList.length, riskDistribution: riskCounts });
  };

  const prepareChartData = (sessionList) => {
    const data = sessionList.slice(-10).map((session, idx) => ({
      name: `Q${idx + 1}`,
      score: session.genuinenessScore,
      risk: session.bluffRisk === 'Low' ? 1 : session.bluffRisk === 'Medium' ? 2 : 3
    }));
    setChartData(data);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '56px', height: '56px',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          margin: '0 auto 1rem',
        }} className="animate-spin"></div>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Loading your dashboard...</p>
      </div>
    </div>
  );

  const statCards = [
    {
      label: 'Candidate Invites',
      value: invites.length,
      sub: 'Links sent',
      icon: 'fas fa-paper-plane',
      gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
      glow: 'rgba(236,72,153,0.2)',
      border: '#ec4899',
    },
    {
      label: 'Total Interviews',
      value: stats?.totalSessions || 0,
      sub: null,
      icon: 'fas fa-chart-bar',
      gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
      glow: 'rgba(99,102,241,0.2)',
      border: '#6366f1',
    },
    {
      label: 'Average Score',
      value: stats?.avgScore || 0,
      sub: 'Out of 100',
      icon: 'fas fa-star',
      gradient: 'linear-gradient(135deg, #10b981, #34d399)',
      glow: 'rgba(16,185,129,0.2)',
      border: '#10b981',
    },
    {
      label: 'Low Risk',
      value: stats?.riskDistribution?.Low || 0,
      sub: 'Authentic responses',
      icon: 'fas fa-check-circle',
      gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
      glow: 'rgba(245,158,11,0.2)',
      border: '#f59e0b',
    },
    {
      label: 'High Risk',
      value: stats?.riskDistribution?.High || 0,
      sub: 'Needs verification',
      icon: 'fas fa-exclamation-triangle',
      gradient: 'linear-gradient(135deg, #ef4444, #f87171)',
      glow: 'rgba(239,68,68,0.2)',
      border: '#ef4444',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2rem)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }} className="animate-fade-in">
          <div>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
              background: 'linear-gradient(135deg, #818cf8, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              marginBottom: '0.25rem',
            }}>
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.05rem' }}>Here's your interview analysis overview</p>
          </div>
          <button
            onClick={() => navigate('/interview')}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', padding: '0.75rem 1.75rem', borderRadius: '12px',
              fontWeight: 700, fontSize: '0.95rem', border: 'none',
              boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(99,102,241,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.3)'; }}
          >
            <i className="fas fa-plus"></i>
            New Interview
          </button>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            {statCards.map((card, idx) => (
              <div
                key={card.label}
                className="animate-slide-in-up"
                style={{
                  ...glassCard,
                  padding: '1.5rem',
                  borderLeft: `3px solid ${card.border}`,
                  animationDelay: `${idx * 0.1}s`,
                  animationFillMode: 'both',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.borderColor = card.border;
                  e.currentTarget.style.boxShadow = `0 8px 30px ${card.glow}`;
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</p>
                    <p style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff' }}>{card.value}</p>
                    {card.sub && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.25rem' }}>{card.sub}</p>}
                  </div>
                  <div style={{
                    width: '48px', height: '48px',
                    background: card.gradient,
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', color: 'white',
                    boxShadow: `0 4px 15px ${card.glow}`,
                  }}>
                    <i className={card.icon}></i>
                  </div>
                </div>
                {/* Decorative glow */}
                <div style={{
                  position: 'absolute', top: '-50%', right: '-30%',
                  width: '150px', height: '150px',
                  background: `radial-gradient(circle, ${card.glow} 0%, transparent 70%)`,
                  borderRadius: '50%', pointerEvents: 'none',
                }}></div>
              </div>
            ))}
          </div>
        )}

        {/* Charts */}
        {chartData.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            {/* Score Trend */}
            <div style={{ ...glassCard, padding: '1.5rem' }} className="animate-slide-in-left">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-chart-line" style={{ color: '#6366f1' }}></i>
                Score Trends
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15,15,46,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: '#fff',
                      backdropFilter: 'blur(20px)',
                    }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 5, stroke: '#6366f1', strokeWidth: 2 }} activeDot={{ r: 7, fill: '#818cf8' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Distribution */}
            <div style={{ ...glassCard, padding: '1.5rem' }} className="animate-slide-in-right">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-chart-pie" style={{ color: '#8b5cf6' }}></i>
                Risk Distribution
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%" cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={90} innerRadius={55}
                    fill="#8884d8" dataKey="value"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={2}
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15,15,46,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Sessions Table */}
        <div style={{ ...glassCard, padding: 0, overflow: 'hidden' }} className="animate-slide-in-up">
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <i className="fas fa-list-ul" style={{ color: '#6366f1' }}></i>
              Recent Sessions
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{sessions.length} sessions</span>
          </div>

          {sessions.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.3 }}>
                <i className="fas fa-inbox"></i>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', fontWeight: 600 }}>No interviews yet</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', marginBottom: '1.5rem' }}>Start your first interview session to begin analysis</p>
              <button
                onClick={() => navigate('/interview')}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white', padding: '0.75rem 2rem', borderRadius: '10px',
                  fontWeight: 600, border: 'none', boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                }}
              >
                <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
                Start Interview
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '0.85rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Candidate</th>
                    <th style={{ padding: '0.85rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Question</th>
                    <th style={{ padding: '0.85rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Score</th>
                    <th style={{ padding: '0.85rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Risk Level</th>
                    <th style={{ padding: '0.85rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 5).map((session, idx) => {
                    const inviteMatch = invites.find(inv => inv.sessions.includes(session._id));
                    const candidateName = inviteMatch ? inviteMatch.candidateName : (user?.name?.split(' ')[0] + ' (You)');
                    
                    return (
                      <tr
                        key={session._id}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          transition: 'all 0.3s',
                          animation: `fadeIn 0.5s ease-out ${idx * 0.05}s`,
                          animationFillMode: 'both',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>{candidateName}</td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)' }}>{session.question.substring(0, 40)}...</td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{
                            fontWeight: 700, color: '#818cf8',
                            background: 'rgba(99,102,241,0.1)',
                            padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.85rem',
                          }}>{session.genuinenessScore}</span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                            background: session.bluffRisk === 'Low' ? 'rgba(16,185,129,0.15)' : session.bluffRisk === 'Medium' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                            color: session.bluffRisk === 'Low' ? '#6ee7b7' : session.bluffRisk === 'Medium' ? '#fbbf24' : '#fca5a5',
                            border: `1px solid ${session.bluffRisk === 'Low' ? 'rgba(16,185,129,0.3)' : session.bluffRisk === 'Medium' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
                          }}>
                            {session.bluffRisk}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <button
                            onClick={() => navigate('/history')}
                            style={{
                              color: '#818cf8', fontWeight: 600, fontSize: '0.85rem',
                              background: 'transparent', border: 'none', cursor: 'pointer',
                              transition: 'all 0.3s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
                            onMouseLeave={e => e.currentTarget.style.color = '#818cf8'}
                          >
                            View <i className="fas fa-arrow-right" style={{ marginLeft: '0.3rem', fontSize: '0.7rem' }}></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
