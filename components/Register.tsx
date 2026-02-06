import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { compressImage } from '../utils';

interface RegisterProps {
  onRegister: (user: User) => void;
  onBack: () => void;
}

const LOCAL_USERS_KEY = 'studygenius_users';

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
    if (!username || !password) return;

    if (password.length < 3) {
      setErrorMsg('Password must be at least 3 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const users = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
    const exists = users.find((u: any) => u.username === username);
    if (exists) {
      setErrorMsg('Username already exists. Please choose another one.');
      setLoading(false);
      return;
    }

    const id = `user_${Date.now()}`;
    const stored = { id, username, password, role, avatar };
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify([stored, ...users]));
    localStorage.setItem('studygenius_demo_creds', JSON.stringify({ username, password }));

    const newUser: User = {
      id,
      username,
      role,
      avatar: avatar || undefined,
      isVerified: true,
      joinedGroups: []
    };

    onRegister(newUser);
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Identity</h2>
          <p className="text-slate-400 mt-2 font-medium">Local registration without backend</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="flex justify-center mb-6">
            <label className="relative cursor-pointer group">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl overflow-hidden border-2 border-dashed border-slate-300 group-hover:border-indigo-400 transition-colors">
                {avatar ? (
                  <img src={avatar} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  <div className="flex items-center justify-center h-full text-2xl text-slate-400">+</div>
                )}
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
