import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { compressImage } from '../utils';
import { signUpWithPassword, upsertProfile } from './services/firebaseClient';

interface RegisterProps {
  onRegister: (user: User) => void;
  onBack: () => void;
}

const usernameToEmail = (username: string): string => {
  const normalized = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return `${normalized}@studygenius.app`;
};

export const Register: React.FC<RegisterProps> = ({ onRegister, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const compressed = await compressImage(e.target.files[0]);
      setAvatar(compressed);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const email = usernameToEmail(username);
      const auth = await signUpWithPassword(email, password, username.trim());
      const requestedRole = role === UserRole.ADMIN ? UserRole.USER : role;

      const profile = await upsertProfile(
        auth.localId,
        {
          username: username.trim(),
          role: requestedRole,
          is_verified: true,
          avatar_url: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username.trim())}`
        },
        auth.idToken
      );

      onRegister({
        id: auth.localId,
        username: profile.username,
        role: requestedRole,
        avatar: profile.avatar_url ?? undefined,
        isVerified: Boolean(profile.is_verified),
        joinedGroups: []
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Identity</h2>
          <p className="text-slate-400 mt-2 font-medium">Server-backed registration via Firebase</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="flex justify-center mb-6">
            <label className="relative cursor-pointer group">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl overflow-hidden border-2 border-dashed border-slate-300 group-hover:border-indigo-400 transition-colors">
                {avatar ? <img src={avatar} className="w-full h-full object-cover" alt="Avatar" /> : <div className="flex items-center justify-center h-full text-2xl text-slate-400">+</div>}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>

          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full bg-slate-50 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-slate-50 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500" required />

          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full bg-slate-50 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
            <option value={UserRole.USER}>Student</option>
            <option value={UserRole.TEACHER}>Teacher</option>
          </select>

          {errorMsg && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-bold">{errorMsg}</div>}

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Have an account? <button onClick={onBack} className="text-indigo-600 font-bold hover:underline">Login</button>
        </p>
      </div>
    </div>
  );
};
