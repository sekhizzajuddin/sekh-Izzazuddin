
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { CHOCOLATE, GOLD } from '../constants';

interface AccountSettingsProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onBack: () => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ user, onUpdateUser, onBack }) => {
  const [activeCategory, setActiveCategory] = useState<'setting' | 'privacy'>('setting');
  
  // Profile state
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [profilePic, setProfilePic] = useState(user.profilePic || '');
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Privacy state
  const [isPrivate, setIsPrivate] = useState(user.isPrivate || false);
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ ...user, displayName, profilePic });
    setMessage({ type: 'success', text: 'Profile updated successfully' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 2MB' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setProfilePic(base64);
      setMessage({ type: 'success', text: 'Local image loaded successfully. Click Update Profile to save.' });
    };
    reader.readAsDataURL(file);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    const users: any[] = JSON.parse(localStorage.getItem('app_users') || '[]');
    const userIdx = users.findIndex(u => u.username === user.username && u.password === currentPassword);

    if (userIdx === -1) {
      setMessage({ type: 'error', text: 'Current password is incorrect' });
      return;
    }

    users[userIdx].password = newPassword;
    localStorage.setItem('app_users', JSON.stringify(users));
    
    // Update local user object too
    onUpdateUser({ ...user, password: newPassword });
    
    setMessage({ type: 'success', text: 'Password updated successfully' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleTogglePrivacy = (val: boolean) => {
    setIsPrivate(val);
    onUpdateUser({ ...user, isPrivate: val });
    setMessage({ type: 'success', text: `Privacy updated: Comments are now ${val ? 'Private' : 'Public'}` });
  };

  return (
    <div className="max-w-xl mx-auto py-6">
      <div className="bg-white rounded-xl shadow-lg border border-[#E5E1DA] overflow-hidden">
        <div className="p-4 border-b border-[#E5E1DA] flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-[#F9F6F1] text-[#2b1810]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-xl font-serif font-bold text-[#2b1810]">Account Settings</h2>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#E5E1DA]">
          <button 
            onClick={() => { setActiveCategory('setting'); setMessage({type: '', text: ''}); }}
            className={`flex-1 py-3 font-bold text-sm uppercase tracking-wider transition-colors ${activeCategory === 'setting' ? 'bg-[#F4E4BC] text-[#2b1810] border-b-2 border-[#D4AF37]' : 'text-[#5c4033] hover:bg-[#F9F6F1]'}`}
          >
            Setting
          </button>
          <button 
            onClick={() => { setActiveCategory('privacy'); setMessage({type: '', text: ''}); }}
            className={`flex-1 py-3 font-bold text-sm uppercase tracking-wider transition-colors ${activeCategory === 'privacy' ? 'bg-[#F4E4BC] text-[#2b1810] border-b-2 border-[#D4AF37]' : 'text-[#5c4033] hover:bg-[#F9F6F1]'}`}
          >
            Privacy
          </button>
        </div>

        <div className="p-6">
          {message.text && (
            <div className={`mb-6 p-3 rounded text-sm text-center font-bold animate-pulse ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {message.text}
            </div>
          )}

          {activeCategory === 'setting' ? (
            <div className="space-y-8 animate-fade-in">
              {/* Profile Configuration */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-lg text-[#2b1810]">Profile Configuration</h3>
                  <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-[#2b1810] shadow-md">
                    {profilePic ? (
                      <img src={profilePic} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D4AF37] font-bold">{user.username.charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                </div>
                <form onSubmit={handleUpdateProfile} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#5c4033] mb-1 uppercase">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter display name"
                      className="w-full px-4 py-2 bg-[#F9F6F1] border border-[#E5E1DA] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-[#5c4033] mb-1 uppercase">Profile Picture Source</label>
                    <div className="flex space-x-2">
                       <input
                        type="text"
                        value={profilePic.startsWith('data:') ? 'Local Image Attached' : profilePic}
                        onChange={(e) => setProfilePic(e.target.value)}
                        placeholder="Enter image URL"
                        className="flex-1 px-4 py-2 bg-[#F9F6F1] border border-[#E5E1DA] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-[#F4E4BC] text-[#2b1810] border border-[#D4AF37] rounded-lg font-bold text-xs uppercase hover:bg-[#D4AF37] hover:text-white transition-all"
                      >
                        Local File
                      </button>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-2.5 bg-[#2b1810] text-[#D4AF37] rounded-lg font-bold text-sm hover:brightness-125 transition-all shadow-md">Update Profile</button>
                </form>
              </section>

              <hr className="border-[#E5E1DA]" />

              {/* Password Change */}
              <section className="space-y-4">
                <h3 className="font-serif font-bold text-lg text-[#2b1810]">Security</h3>
                <form onSubmit={handleUpdatePassword} className="space-y-3">
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-[#F9F6F1] border border-[#E5E1DA] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    placeholder="Current Password"
                  />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-[#F9F6F1] border border-[#E5E1DA] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    placeholder="New Password"
                  />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-[#F9F6F1] border border-[#E5E1DA] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    placeholder="Confirm New Password"
                  />
                  <button type="submit" className="w-full py-2 bg-[#D4AF37] text-white rounded-lg font-bold hover:brightness-110 transition-all">Change Password</button>
                </form>
              </section>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <section className="space-y-4">
                <h3 className="font-serif font-bold text-lg text-[#2b1810]">Privacy Settings</h3>
                <p className="text-sm text-[#5c4033]">Configure how your identity is shared across the Academic community.</p>
                
                <div className="bg-[#F9F6F1] p-4 rounded-xl border border-[#E5E1DA] flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[#2b1810]">Public Commenting</h4>
                    <p className="text-xs text-[#5c4033]">Turn off to display as "Private User" on comments.</p>
                  </div>
                  <div 
                    onClick={() => handleTogglePrivacy(!isPrivate)}
                    className={`w-14 h-7 rounded-full p-1 cursor-pointer transition-colors ${!isPrivate ? 'bg-[#2b1810]' : 'bg-[#E5E1DA]'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform transform ${!isPrivate ? 'translate-x-7' : 'translate-x-0'}`} />
                  </div>
                </div>
                
                <div className="bg-[#F4E4BC]/20 p-4 border-l-4 border-[#D4AF37] rounded-r-xl">
                  <p className="text-xs text-[#2b1810] leading-relaxed italic">
                    Note: Your profile configuration and password are never shared publicly regardless of these settings.
                  </p>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
