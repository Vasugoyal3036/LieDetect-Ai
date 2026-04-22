import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

const glassCard = {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
};

const plans = [
    {
        id: 'free',
        name: 'Free',
        price: '₹0',
        priceUSD: '$0',
        period: 'forever',
        icon: 'fas fa-paper-plane',
        gradient: 'linear-gradient(135deg, #64748b, #94a3b8)',
        features: [
            '10 questions / month',
            '2 custom question banks',
            '1 report',
            'Basic AI analysis',
            'Anti-cheat monitoring',
        ],
        disabled: ['Video analysis', 'PDF export', 'Team workspace', 'Priority support'],
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '₹2,499',
        priceUSD: '$29',
        period: '/month',
        icon: 'fas fa-rocket',
        gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        popular: true,
        features: [
            '100 questions / month',
            '20 custom question banks',
            '50 reports',
            'Advanced AI analysis',
            'Anti-cheat monitoring',
            'Video & audio analysis',
            'PDF report export',
            'Priority support',
        ],
        disabled: ['Team workspace'],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: '₹7,999',
        priceUSD: '$99',
        period: '/month',
        icon: 'fas fa-building',
        gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
        features: [
            'Unlimited questions',
            'Unlimited question banks',
            'Unlimited reports',
            'Advanced AI analysis',
            'Anti-cheat monitoring',
            'Video & audio analysis',
            'PDF report export',
            'Team workspace',
            'Priority support',
            'Custom branding',
        ],
        disabled: [],
    },
];

function loadRazorpayScript() {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export default function Pricing() {
    const [currentSub, setCurrentSub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(null);

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const res = await axios.get('/subscription');
            setCurrentSub(res.data);
        } catch (err) {
            console.error('Subscription error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (planId) => {
        if (planId === 'free') return;
        if (currentSub?.plan === planId) return;
        setUpgrading(planId);

        try {
            const res = await axios.post('/subscription/checkout', { plan: planId });

            // If demo mode (no Razorpay configured), upgrade directly
            if (res.data.demo) {
                toast.success(res.data.message, { duration: 4000 });
                fetchSubscription();
                setUpgrading(null);
                return;
            }

            // Load Razorpay checkout
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                toast.error('Payment gateway failed to load. Please try again.');
                setUpgrading(null);
                return;
            }

            const options = {
                key: res.data.keyId,
                amount: res.data.amount,
                currency: res.data.currency,
                name: 'HiringSentry',
                description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan Subscription`,
                order_id: res.data.orderId,
                handler: async function (response) {
                    console.log('Payment success:', response);
                    try {
                        const verifyRes = await axios.post('/subscription/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            plan: planId,
                        });
                        toast.success(verifyRes.data.message, {
                            duration: 5000,
                            icon: '🎉',
                        });
                        await fetchSubscription();
                    } catch (err) {
                        console.error('Verification error:', err);
                        toast.error('Payment verification failed. Please contact support.');
                    } finally {
                        setUpgrading(null);
                    }
                },
                prefill: {},
                theme: {
                    color: '#6366f1',
                    backdrop_color: 'rgba(10,10,26,0.85)',
                },
                modal: {
                    ondismiss: () => {
                        setUpgrading(null);
                        toast('Payment cancelled', { icon: '❌' });
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error('Payment failed: ' + response.error.description);
                setUpgrading(null);
            });
            rzp.open();
        } catch (err) {
            toast.error('Upgrade failed: ' + (err.response?.data?.message || err.message));
            setUpgrading(null);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel? You will be downgraded to the free plan.')) return;
        try {
            await axios.post('/subscription/cancel');
            toast.success('Subscription cancelled. Downgraded to free plan.');
            fetchSubscription();
        } catch (err) {
            toast.error('Failed to cancel subscription');
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
            <div style={{ width: '56px', height: '56px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%' }} className="animate-spin"></div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2rem)' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }} className="animate-fade-in">
                    <h1 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800,
                        background: 'linear-gradient(135deg, #818cf8, #8b5cf6, #ec4899)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        marginBottom: '0.75rem',
                    }}>
                        Choose Your Plan
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
                        Scale your interview intelligence with the right plan for your team
                    </p>
                    {currentSub && (
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            background: 'rgba(99,102,241,0.12)', padding: '0.5rem 1.25rem',
                            borderRadius: '9999px', marginTop: '1.25rem',
                            border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.85rem',
                        }}>
                            <i className="fas fa-crown" style={{ color: '#fbbf24' }}></i>
                            <span style={{ color: '#818cf8', fontWeight: 700 }}>Current: {currentSub.plan.charAt(0).toUpperCase() + currentSub.plan.slice(1)}</span>
                            <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>{currentSub.questionsUsedThisMonth}/{currentSub.features.maxQuestionsPerMonth} questions used</span>
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
                    {plans.map((plan, idx) => {
                        const isCurrent = currentSub?.plan === plan.id;
                        return (
                            <div key={plan.id} style={{
                                ...glassCard,
                                padding: '2rem',
                                position: 'relative',
                                border: plan.popular ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.08)',
                                transform: plan.popular ? 'scale(1.02)' : 'scale(1)',
                                animation: `slideInUp 0.5s ease-out ${idx * 0.1}s`, animationFillMode: 'both',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = plan.popular ? 'scale(1.04)' : 'scale(1.02)'; e.currentTarget.style.boxShadow = `0 12px 40px rgba(99,102,241,0.15)`; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = plan.popular ? 'scale(1.02)' : 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>

                                {plan.popular && (
                                    <div style={{
                                        position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
                                        padding: '0.3rem 1.25rem', borderRadius: '9999px', fontSize: '0.7rem',
                                        fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
                                        boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
                                    }}>
                                        Most Popular
                                    </div>
                                )}

                                <div style={{
                                    width: '56px', height: '56px',
                                    background: plan.gradient, borderRadius: '16px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.4rem', color: 'white', marginBottom: '1.25rem',
                                    boxShadow: `0 8px 20px ${plan.popular ? 'rgba(99,102,241,0.3)' : 'rgba(0,0,0,0.2)'}`,
                                }}>
                                    <i className={plan.icon}></i>
                                </div>

                                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>{plan.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>{plan.price}</span>
                                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)' }}>{plan.period}</span>
                                </div>
                                {plan.priceUSD !== '$0' && (
                                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }}>
                                        ≈ {plan.priceUSD}/month
                                    </p>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '2rem', marginTop: plan.priceUSD === '$0' ? '1.5rem' : '0' }}>
                                    {plan.features.map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
                                            <i className="fas fa-check-circle" style={{ color: '#6366f1', fontSize: '0.8rem' }}></i>
                                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{f}</span>
                                        </div>
                                    ))}
                                    {plan.disabled.map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
                                            <i className="fas fa-times-circle" style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.8rem' }}></i>
                                            <span style={{ color: 'rgba(255,255,255,0.25)' }}>{f}</span>
                                        </div>
                                    ))}
                                </div>

                                {isCurrent ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{
                                            padding: '0.85rem', borderRadius: '12px', textAlign: 'center',
                                            background: 'rgba(16,185,129,0.12)', color: '#6ee7b7', fontWeight: 700,
                                            border: '1px solid rgba(16,185,129,0.2)',
                                        }}>
                                            <i className="fas fa-check" style={{ marginRight: '0.4rem' }}></i> Current Plan
                                        </div>
                                        {plan.id !== 'free' && (
                                            <button onClick={handleCancel} style={{
                                                padding: '0.6rem', borderRadius: '10px', background: 'rgba(239,68,68,0.08)',
                                                color: '#fca5a5', fontWeight: 600, fontSize: '0.8rem', border: '1px solid rgba(239,68,68,0.15)',
                                                transition: 'all 0.3s',
                                            }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                                            >
                                                Cancel Subscription
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <button onClick={() => handleUpgrade(plan.id)} disabled={upgrading === plan.id || plan.id === 'free'}
                                        style={{
                                            width: '100%', padding: '0.85rem', borderRadius: '12px', fontWeight: 700, border: 'none',
                                            background: plan.id === 'free' ? 'rgba(255,255,255,0.06)' : plan.gradient,
                                            color: plan.id === 'free' ? 'rgba(255,255,255,0.3)' : 'white',
                                            cursor: plan.id === 'free' ? 'default' : 'pointer',
                                            boxShadow: plan.id === 'free' ? 'none' : '0 4px 15px rgba(99,102,241,0.3)',
                                            transition: 'all 0.3s',
                                        }}
                                        onMouseEnter={e => { if (plan.id !== 'free') { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(99,102,241,0.4)'; } }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = plan.id === 'free' ? 'none' : '0 4px 15px rgba(99,102,241,0.3)'; }}>
                                        {upgrading === plan.id ? (
                                            <><span style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} className="animate-spin"></span> Processing...</>
                                        ) : plan.id === 'free' ? 'Free Forever' : (
                                            <><i className="fas fa-bolt" style={{ marginRight: '0.4rem' }}></i> Upgrade Now</>
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Trust badges */}
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap',
                    marginTop: '3rem', paddingTop: '2rem',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                }}>
                    {[
                        { icon: 'fas fa-shield-alt', text: 'SSL Encrypted' },
                        { icon: 'fas fa-lock', text: 'Secure Payments' },
                        { icon: 'fas fa-undo', text: '30-Day Refund' },
                        { icon: 'fas fa-headset', text: '24/7 Support' },
                    ].map(badge => (
                        <div key={badge.text} style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)',
                        }}>
                            <i className={badge.icon} style={{ color: '#6366f1', fontSize: '0.75rem' }}></i>
                            {badge.text}
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>
                    <p><i className="fas fa-credit-card" style={{ marginRight: '0.3rem' }}></i> Payments powered by Razorpay • PCI DSS Compliant</p>
                </div>
            </div>
        </div>
    );
}
