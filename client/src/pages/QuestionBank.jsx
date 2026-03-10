import { useState, useEffect } from 'react';
import axios from '../api/axios';

const glassCard = {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
};

const inputStyle = {
    width: '100%',
    padding: '0.85rem 1rem',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#f1f5f9',
    fontSize: '1rem',
    fontFamily: 'inherit',
    transition: 'all 0.3s',
    outline: 'none',
};

export default function QuestionBank() {
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingBank, setEditingBank] = useState(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [jobRole, setJobRole] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [questions, setQuestions] = useState([{ text: '', category: 'general' }]);

    useEffect(() => { fetchBanks(); }, []);

    const fetchBanks = async () => {
        try {
            const res = await axios.get('/question-banks');
            setBanks(res.data);
        } catch (err) {
            console.error('Failed to fetch question banks:', err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle(''); setDescription(''); setJobRole(''); setIsPublic(false);
        setQuestions([{ text: '', category: 'general' }]);
        setEditingBank(null); setShowForm(false);
    };

    const handleEditBank = (bank) => {
        setTitle(bank.title);
        setDescription(bank.description);
        setJobRole(bank.jobRole);
        setIsPublic(bank.isPublic);
        setQuestions(bank.questions.map(q => ({ text: q.text, category: q.category })));
        setEditingBank(bank);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validQuestions = questions.filter(q => q.text.trim());
        if (!title.trim() || validQuestions.length === 0) {
            alert('Please provide a title and at least one question');
            return;
        }
        try {
            const data = { title, description, jobRole, isPublic, questions: validQuestions };
            if (editingBank) {
                await axios.put(`/question-banks/${editingBank._id}`, data);
            } else {
                await axios.post('/question-banks', data);
            }
            resetForm();
            fetchBanks();
        } catch (err) {
            alert('Failed to save question bank: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this question bank?')) return;
        try {
            await axios.delete(`/question-banks/${id}`);
            fetchBanks();
        } catch (err) {
            alert('Failed to delete: ' + (err.response?.data?.message || err.message));
        }
    };

    const addQuestion = () => setQuestions([...questions, { text: '', category: 'general' }]);
    const removeQuestion = (idx) => setQuestions(questions.filter((_, i) => i !== idx));
    const updateQuestion = (idx, field, value) => {
        const updated = [...questions];
        updated[idx][field] = value;
        setQuestions(updated);
    };

    const handleFocus = (e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; };
    const handleBlur = (e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 1rem' }} className="animate-spin"></div>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Loading question banks...</p>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2rem)' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }} className="animate-fade-in">
                    <div>
                        <h1 style={{
                            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
                            background: 'linear-gradient(135deg, #818cf8, #8b5cf6, #ec4899)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                            marginBottom: '0.25rem',
                        }}>
                            <i className="fas fa-folder-open" style={{ WebkitTextFillColor: 'initial', color: '#6366f1', marginRight: '0.5rem' }}></i>
                            Question Banks
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1rem' }}>Create custom question sets for specific job roles</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowForm(!showForm); }}
                        style={{
                            background: showForm ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: showForm ? '#fca5a5' : 'white', padding: '0.75rem 1.75rem', borderRadius: '12px',
                            fontWeight: 700, fontSize: '0.95rem', border: showForm ? '1px solid rgba(239,68,68,0.3)' : 'none',
                            boxShadow: showForm ? 'none' : '0 4px 15px rgba(99,102,241,0.3)',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s',
                        }}
                    >
                        <i className={showForm ? 'fas fa-times' : 'fas fa-plus'}></i>
                        {showForm ? 'Cancel' : 'New Bank'}
                    </button>
                </div>

                {/* Create/Edit Form */}
                {showForm && (
                    <div style={{ ...glassCard, padding: '2rem', marginBottom: '2rem' }} className="animate-slide-in-up">
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className="fas fa-edit" style={{ color: '#6366f1' }}></i>
                            {editingBank ? 'Edit Question Bank' : 'Create Question Bank'}
                        </h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
                                        <i className="fas fa-heading" style={{ marginRight: '0.4rem', color: '#6366f1' }}></i> Title *
                                    </label>
                                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Software Engineer Questions" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
                                        <i className="fas fa-briefcase" style={{ marginRight: '0.4rem', color: '#6366f1' }}></i> Job Role
                                    </label>
                                    <input type="text" value={jobRole} onChange={e => setJobRole(e.target.value)} placeholder="e.g. Senior React Developer" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
                                    <i className="fas fa-align-left" style={{ marginRight: '0.4rem', color: '#6366f1' }}></i> Description
                                </label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the job requirements so AI can evaluate relevance..." style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} onFocus={handleFocus} onBlur={handleBlur} />
                            </div>

                            {/* Questions */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                                        <i className="fas fa-list-ol" style={{ marginRight: '0.4rem', color: '#6366f1' }}></i> Questions *
                                    </label>
                                    <button type="button" onClick={addQuestion} style={{
                                        background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '0.4rem 0.8rem',
                                        borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', border: '1px solid rgba(99,102,241,0.2)',
                                    }}>
                                        <i className="fas fa-plus" style={{ marginRight: '0.3rem' }}></i> Add Question
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {questions.map((q, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '0.8rem', minWidth: '24px' }}>{idx + 1}.</span>
                                            <input type="text" value={q.text} onChange={e => updateQuestion(idx, 'text', e.target.value)}
                                                placeholder="Enter question..."
                                                style={{ ...inputStyle, flex: 1 }} onFocus={handleFocus} onBlur={handleBlur} />
                                            <select value={q.category} onChange={e => updateQuestion(idx, 'category', e.target.value)}
                                                style={{ ...inputStyle, width: '130px', cursor: 'pointer' }}>
                                                <option value="general">General</option>
                                                <option value="behavioral">Behavioral</option>
                                                <option value="technical">Technical</option>
                                                <option value="situational">Situational</option>
                                            </select>
                                            {questions.length > 1 && (
                                                <button type="button" onClick={() => removeQuestion(idx)}
                                                    style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.8rem' }}>
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Public toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <button type="button" onClick={() => setIsPublic(!isPublic)}
                                    style={{
                                        width: '44px', height: '24px', borderRadius: '12px', padding: '2px',
                                        background: isPublic ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                        border: 'none', cursor: 'pointer', transition: 'all 0.3s', position: 'relative',
                                    }}>
                                    <div style={{
                                        width: '20px', height: '20px', borderRadius: '50%', background: 'white',
                                        transition: 'transform 0.3s',
                                        transform: isPublic ? 'translateX(20px)' : 'translateX(0)',
                                    }}></div>
                                </button>
                                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', fontWeight: 500 }}>
                                    <i className={isPublic ? 'fas fa-globe' : 'fas fa-lock'} style={{ marginRight: '0.4rem', color: isPublic ? '#6366f1' : 'rgba(255,255,255,0.3)' }}></i>
                                    {isPublic ? 'Public — visible to all users' : 'Private — only you can see this'}
                                </span>
                            </div>

                            <button type="submit" style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
                                fontWeight: 700, padding: '0.85rem', borderRadius: '12px', border: 'none', fontSize: '1rem',
                                boxShadow: '0 4px 15px rgba(99,102,241,0.3)', transition: 'all 0.3s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(99,102,241,0.4)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.3)'; }}
                            >
                                <i className={editingBank ? 'fas fa-save' : 'fas fa-plus'} style={{ marginRight: '0.5rem' }}></i>
                                {editingBank ? 'Update Bank' : 'Create Bank'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Banks List */}
                {banks.length === 0 && !showForm ? (
                    <div style={{ ...glassCard, padding: '4rem 2rem', textAlign: 'center' }} className="animate-fade-in">
                        <div style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.3 }}><i className="fas fa-folder-open"></i></div>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', fontWeight: 600 }}>No question banks yet</p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', marginBottom: '1.5rem' }}>Create your first custom question bank to get started</p>
                        <button onClick={() => setShowForm(true)} style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
                            padding: '0.75rem 2rem', borderRadius: '10px', fontWeight: 600, border: 'none',
                            boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                        }}>
                            <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i> Create Question Bank
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                        {banks.map((bank, idx) => (
                            <div
                                key={bank._id}
                                style={{
                                    ...glassCard, padding: '1.5rem',
                                    animation: `slideInUp 0.4s ease-out ${idx * 0.08}s`, animationFillMode: 'both',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.15)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{bank.title}</h3>
                                    <span style={{
                                        fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px',
                                        background: bank.isPublic ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
                                        color: bank.isPublic ? '#818cf8' : 'rgba(255,255,255,0.4)',
                                    }}>
                                        <i className={bank.isPublic ? 'fas fa-globe' : 'fas fa-lock'} style={{ marginRight: '0.25rem' }}></i>
                                        {bank.isPublic ? 'Public' : 'Private'}
                                    </span>
                                </div>
                                {bank.jobRole && (
                                    <p style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600, marginBottom: '0.5rem' }}>
                                        <i className="fas fa-briefcase" style={{ marginRight: '0.3rem' }}></i> {bank.jobRole}
                                    </p>
                                )}
                                {bank.description && <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem', lineHeight: 1.5 }}>{bank.description.substring(0, 100)}{bank.description.length > 100 ? '...' : ''}</p>}
                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', marginBottom: '1rem' }}>
                                    <i className="fas fa-list" style={{ marginRight: '0.3rem' }}></i> {bank.questions.length} question{bank.questions.length !== 1 ? 's' : ''}
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleEditBank(bank)} style={{
                                        flex: 1, background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '0.5rem',
                                        borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', border: '1px solid rgba(99,102,241,0.2)', transition: 'all 0.3s',
                                    }}>
                                        <i className="fas fa-edit" style={{ marginRight: '0.3rem' }}></i> Edit
                                    </button>
                                    <button onClick={() => handleDelete(bank._id)} style={{
                                        background: 'rgba(239,68,68,0.12)', color: '#fca5a5', padding: '0.5rem 0.75rem',
                                        borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', border: '1px solid rgba(239,68,68,0.2)', transition: 'all 0.3s',
                                    }}>
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
