import React, { useState } from 'react';
import { User } from '../types';
import { compressImage } from '../utils';

interface ProfileEditorProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
  onBack: () => void;
}

const LOCAL_USERS_KEY = 'studygenius_users';
const LOCAL_USER_KEY = 'studygenius_local_user';

const ProfileEditor: React.FC<ProfileEditorProps> = ({ user, onUpdate, onBack }) => {
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar || null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const compressed = await compressImage(e.target.files[0]);
      setAvatar(compressed);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const updatedUser = {
        ...user,
        username,
        avatar: avatar || undefined
      };

      const users = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
      const updatedUsers = users.map((u: any) => (u.id === user.id ? { ...u, username, avatar } : u));
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updatedUsers));
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser));

      onUpdate(updatedUser);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onBack} className="text-slate-400 font-bold hover:text-indigo-600">← Return to Dashboard</button>
        <h2 className="text-2xl font-black text-slate-900">Edit Profile</h2>
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
        <form onSubmit={handleSave} className="space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-32 h-32 bg-slate-100 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-lg relative">
                {avatar ? (
                  <img src={avatar} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <div className="flex items-center justify-center h-full text-4xl">👤</div>
                )}
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="text-white text-xs font-bold">Change</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
              {user.isVerified && (
                <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full border-4 border-white shadow-md" title="Verified Account">
                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path></svg>
                </div>
              )}
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{user.role}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400 ml-1">Display Name</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                required
              />
            </div>

            <div className="space-y-1 opacity-50">
              <label className="text-xs font-black uppercase text-slate-400 ml-1">Account ID (Read Only)</label>
              <input 
                type="text" 
                value={user.id}
                readOnly
                className="w-full bg-slate-100 border-none rounded-2xl p-4 cursor-not-allowed text-xs font-mono"
              />
            </div>
          </div>

          {success && (
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-center font-bold text-sm">
              ✓ Profile updated successfully!
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditor;
