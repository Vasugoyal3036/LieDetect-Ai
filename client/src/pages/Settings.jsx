import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from '../api/axios';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

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

export default function Settings() {
  const { user, login } = useAuth();
  
  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState(null);
  const fileInputRef = useRef(null);

  // Crop state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState(null);

  // 2FA state
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [twoFaLoading, setTwoFaLoading] = useState(true);
  const [twoFaMsg, setTwoFaMsg] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/auth/me');
      setName(res.data.name);
      setIs2FAEnabled(res.data.isTwoFactorEnabled);
      if (res.data.profilePicture) {
        setAvatarUrl(`${API_BASE}/uploads/avatars/${res.data.profilePicture}`);
      }
    } catch (err) {
      console.error('Failed to load profile');
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 5 * 1024 * 1024) {
      setAvatarMsg({ type: 'error', text: 'Image must be under 5MB.' });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setRawImageSrc(objectUrl);
    setCropModalOpen(true);
    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    setCropModalOpen(false);
    setAvatarUploading(true);
    setAvatarMsg(null);

    try {
      const croppedBlob = await getCroppedImg(rawImageSrc, croppedAreaPixels);
      
      const objectUrl = URL.createObjectURL(croppedBlob);
      setAvatarUrl(objectUrl);

      const formData = new FormData();
      formData.append('avatar', croppedBlob, 'avatar.jpg');

      const res = await axios.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatarUrl(`${API_BASE}/uploads/avatars/${res.data.profilePicture}`);
      setAvatarMsg({ type: 'success', text: 'Profile picture updated!' });

      // Update local auth context
      const meRes = await axios.get('/auth/me');
      if (user) {
        login(
          { ...user, profilePicture: meRes.data.profilePicture },
          localStorage.getItem('token')
        );
      }
    } catch (err) {
      setAvatarMsg({ type: 'error', text: err.response?.data?.message || 'Failed to upload avatar.' });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const res = await axios.put('/auth/profile', { name });
      
      if (res.data.token) {
         login({ _id: res.data._id, name: res.data.name, email: res.data.email, role: res.data.role, profilePicture: user?.profilePicture }, res.data.token);
      }
      
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setPwdLoading(true);
    setPwdMsg(null);
    try {
      const res = await axios.put('/auth/change-password', { currentPassword, newPassword });
      setPwdMsg({ type: 'success', text: res.data.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    setTwoFaLoading(true);
    setTwoFaMsg(null);
    try {
      const res = await axios.post('/auth/toggle-2fa');
      setIs2FAEnabled(res.data.isTwoFactorEnabled);
      setTwoFaMsg({ type: 'success', text: res.data.message });
    } catch (err) {
      setTwoFaMsg({ type: 'error', text: 'Failed to toggle 2FA' });
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleFocus = (e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; };
  const handleBlur = (e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; };

  return (
    <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2rem)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '2rem' }} className="animate-fade-in">
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            <i className="fas fa-cog" style={{ WebkitTextFillColor: 'initial', color: '#6366f1', marginRight: '0.75rem' }}></i>
            Settings
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)' }}>Manage your personal account profile, security, and preferences.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Profile Details */}
          <div style={{ ...glassCard, padding: '2rem' }} className="animate-slide-in-up">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-user-edit" style={{ color: '#8b5cf6' }}></i> Profile Details
            </h2>

            {/* Avatar Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100px', height: '100px', minWidth: '100px', flexShrink: 0, borderRadius: '50%',
                  background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  border: '3px solid rgba(99,102,241,0.4)',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.2)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#818cf8'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', minWidth: '100%', objectFit: 'cover', borderRadius: '50%', imageRendering: '-webkit-optimize-contrast' }} />
                ) : (
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
                
                {/* Hover overlay */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: avatarUploading ? 1 : 0, transition: 'opacity 0.3s',
                }}
                  className="avatar-overlay"
                >
                  {avatarUploading ? (
                    <i className="fas fa-circle-notch fa-spin" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                  ) : (
                    <i className="fas fa-camera" style={{ color: 'white', fontSize: '1.25rem' }}></i>
                  )}
                </div>
              </div>

              <div>
                <p style={{ color: '#fff', fontWeight: 600, fontSize: '1rem', marginBottom: '0.35rem' }}>Profile Picture</p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  Click the avatar or the button below. JPG, PNG, WebP, GIF — max 5MB.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  style={{
                    background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                    border: '1px solid rgba(99,102,241,0.25)', padding: '0.5rem 1rem',
                    borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem',
                    cursor: avatarUploading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
                >
                  <i className="fas fa-upload" style={{ fontSize: '0.75rem' }}></i>
                  {avatarUploading ? 'Uploading…' : 'Upload New Photo'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {avatarMsg && (
              <div style={{
                padding: '0.65rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem',
                background: avatarMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: avatarMsg.type === 'success' ? '#6ee7b7' : '#fca5a5',
                border: `1px solid ${avatarMsg.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
              }}>
                {avatarMsg.text}
              </div>
            )}
            
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Email Address</label>
                <input type="email" value={user?.email || ''} style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} disabled />
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem', display: 'block' }}>Email cannot be changed directly. Contact support if needed.</span>
              </div>
              
              {profileMsg && (
                <div style={{
                  padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem',
                  background: profileMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: profileMsg.type === 'success' ? '#6ee7b7' : '#fca5a5',
                  border: `1px solid ${profileMsg.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                }}>
                  {profileMsg.text}
                </div>
              )}

              <button type="submit" disabled={profileLoading} style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 600, border: 'none', cursor: profileLoading ? 'not-allowed' : 'pointer', alignSelf: 'flex-start', marginTop: '0.5rem'
              }}>
                {profileLoading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Security & 2FA */}
          <div style={{ ...glassCard, padding: '2rem', animationDelay: '0.1s' }} className="animate-slide-in-up">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-shield-alt" style={{ color: '#10b981' }}></i> Security Settings
            </h2>
            
            <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>Two-Factor Authentication (2FA)</h3>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', maxWidth: '400px' }}>Add an extra layer of security to your account. When logging in, you'll need to provide a 6-digit code sent to your email.</p>
                </div>
                
                <button 
                  onClick={handleToggle2FA} 
                  disabled={twoFaLoading}
                  style={{
                    background: is2FAEnabled ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                    color: is2FAEnabled ? '#fca5a5' : '#6ee7b7',
                    border: `1px solid ${is2FAEnabled ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                    padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: twoFaLoading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s'
                  }}
                >
                  {twoFaLoading ? (
                     <i className="fas fa-circle-notch fa-spin"></i>
                  ) : (
                     <i className={is2FAEnabled ? "fas fa-lock-open" : "fas fa-lock"}></i>
                  )}
                  {is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                </button>
              </div>
              
              {twoFaMsg && (
                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: twoFaMsg.type === 'success' ? '#6ee7b7' : '#fca5a5' }}>
                  {twoFaMsg.text}
                </div>
              )}
            </div>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>Change Password</h3>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Current Password</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                 <div>
                   <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>New Password</label>
                   <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} required />
                 </div>
                 <div>
                   <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Confirm New Password</label>
                   <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} required />
                 </div>
              </div>

              {pwdMsg && (
                <div style={{
                  padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem',
                  background: pwdMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: pwdMsg.type === 'success' ? '#6ee7b7' : '#fca5a5',
                  border: `1px solid ${pwdMsg.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                }}>
                  {pwdMsg.text}
                </div>
              )}

              <button type="submit" disabled={pwdLoading} style={{
                background: 'rgba(255,255,255,0.05)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)', cursor: pwdLoading ? 'not-allowed' : 'pointer', alignSelf: 'flex-start', marginTop: '0.5rem',
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                {pwdLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* Crop Modal */}
      {cropModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }} className="animate-fade-in">
          <div style={{
            background: 'rgba(20, 20, 35, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px', width: '100%', maxWidth: '500px', overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }} className="animate-slide-in-up">
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>Adjust your avatar</h3>
              <button 
                onClick={() => setCropModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1.25rem' }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              >&times;</button>
            </div>
            
            <div style={{ position: 'relative', width: '100%', height: '300px', background: '#111' }}>
              <Cropper
                image={rawImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Zoom Slider</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  style={{ width: '100%', accentColor: '#8b5cf6' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  onClick={() => setCropModalOpen(false)}
                  style={{
                    padding: '0.6rem 1.2rem', borderRadius: '8px', background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropConfirm}
                  style={{
                    padding: '0.6rem 1.2rem', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Save Profile Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .avatar-overlay { pointer-events: none; }
        div:hover > .avatar-overlay { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
