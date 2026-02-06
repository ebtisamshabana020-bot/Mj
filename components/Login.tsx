import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  onGoToRegister: () => void;
}

const LOCAL_USERS_KEY = 'studygenius_users';

const Login: React.FC<LoginProps> = ({ onLogin, onGoToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedDemo = localStorage.getItem('studygenius_demo_creds');
    if (!savedDemo) return;
    try {
      const { username: savedName, password: savedPass } = JSON.parse(savedDemo);
      if (savedName && savedPass) {
        setUsername(savedName);
        setPassword(savedPass);
      }
    } catch {
      localStorage.removeItem('studygenius_demo_creds');
    }
  }, []);

  const getUsers = () => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 3) {
      setError('Password must be at least 3 characters.');
      return;
    }

    setLoading(true);
    setError('');

    const users = getUsers();
    let found = users.find((u: any) => u.username === username && u.password === password);

    if (!found) {
      found = {
        id: `user_${Date.now()}`,
        username,
        password,
        role: UserRole.USER,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}` ,
        isVerified: true
      };
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify([found, ...users]));
    }

    const loggedInUser: User = {
      id: found.id,
      username: found.username,
      role: found.role as UserRole,
      avatar: found.avatar,
      isVerified: true,
      joinedGroups: []
    };

    localStorage.setItem('studygenius_demo_creds', JSON.stringify({ username, password }));
    onLogin(loggedInUser);
    setLoading(false);
  };

  const handleAdminAutoLogin = async () => {
    setLoading(true);
    setError('');

    const adminUser = 'Admin';
    const adminPass = 'password123';
    const users = getUsers();
    let found = users.find((u: any) => u.username === adminUser);

    if (!found) {
      found = {
        id: 'admin-local',
        username: adminUser,
        password: adminPass,
        role: UserRole.ADMIN,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=AdminBoss`
      };
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify([found, ...users]));
    }

    setUsername(adminUser);
    setPassword(adminPass);
    localStorage.setItem('studygenius_demo_creds', JSON.stringify({ username: adminUser, password: adminPass }));
    onLogin({
      id: found.id,
      username: found.username,
      role: found.role,
      avatar: found.avatar,
      isVerified: true,
      joinedGroups: []
    });

    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-10">
          <div className="inline-block bg-indigo-600 p-4 rounded-3xl shadow-lg shadow-indigo-200 mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Login</h2>
          <p className="text-slate-400 mt-2 font-medium">Local demo mode (login بأي بيانات للتجربة)</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" placeholder="e.g. Ahmed123" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="******" required />
          </div>

          {error && <div className="p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 text-sm font-bold leading-relaxed text-center">{error}</div>}

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50">{loading ? 'Authenticating...' : 'Login'}</button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px bg-slate-100 flex-1"></div>
          <span className="text-xs text-slate-300 font-bold uppercase">Quick Access</span>
          <div className="h-px bg-slate-100 flex-1"></div>
        </div>

        <button onClick={handleAdminAutoLogin} disabled={loading} className="w-full bg-slate-900 text-white hover:bg-black py-3 rounded-2xl font-bold shadow-lg transition-colors flex items-center justify-center gap-2">
          <span>🚀</span> {loading ? 'Preparing...' : 'Create & Login Admin'}
        </button>

        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
          New here? <button onClick={onGoToRegister} className="text-indigo-600 font-bold hover:underline">Create Account</button>
        </p>
      </div>
    </div>
  );
};

export default Login;
