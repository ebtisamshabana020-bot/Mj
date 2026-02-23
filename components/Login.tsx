import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { supabase } from './supabaseClient';

interface LoginProps {
  onLogin: (user: User) => void;
  onGoToRegister: () => void;
}

const usernameToEmail = (username: string): string => {
  const normalized = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return `${normalized}@studygenius.app`;
};

const Login: React.FC<LoginProps> = ({ onLogin, onGoToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const email = usernameToEmail(username);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError || !authData.user) {
        throw new Error('بيانات الدخول غير صحيحة.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, role, avatar_url, is_verified')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      let effectiveProfile = profile;
      if (!effectiveProfile) {
        const { data: insertedProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username: username.trim(),
            role: UserRole.USER,
            is_verified: true,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username.trim())}`
          })
          .select('id, username, role, avatar_url, is_verified')
          .single();

        if (insertError) {
          throw insertError;
        }
        effectiveProfile = insertedProfile;
      }

      onLogin({
        id: effectiveProfile.id,
        username: effectiveProfile.username,
        role: effectiveProfile.role as UserRole,
        avatar: effectiveProfile.avatar_url ?? undefined,
        isVerified: Boolean(effectiveProfile.is_verified),
        joinedGroups: []
      });
    } catch (err: any) {
      setError(err?.message || 'تعذر تسجيل الدخول حالياً. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">تسجيل الدخول</h2>
          <p className="text-slate-400 mt-2 font-medium">حسابك متصل بسيرفر Supabase</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              placeholder="e.g. Ahmed123"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="******"
              required
            />
          </div>

          {error && <div className="p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 text-sm font-bold leading-relaxed text-center">{error}</div>}

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50">{loading ? 'Authenticating...' : 'Login'}</button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
          New here? <button onClick={onGoToRegister} className="text-indigo-600 font-bold hover:underline">Create Account</button>
        </p>
      </div>
    </div>
  );
};

export default Login;
