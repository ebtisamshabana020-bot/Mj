import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase } from './services/supabaseClient';

interface LoginProps {
  onLogin: (user: User) => void;
  onGoToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onGoToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-fill saved credentials if available
  useEffect(() => {
    const savedDemo = localStorage.getItem('studygenius_demo_creds');
    if (savedDemo) {
      try {
        const { username: savedName, password: savedPass } = JSON.parse(savedDemo);
        if (savedName && savedPass) {
          setUsername(savedName);
          setPassword(savedPass);
        }
      } catch (e) {
        localStorage.removeItem('studygenius_demo_creds');
      }
    }
  }, []);

  const getSyntheticEmail = (user: string) => {
    const cleanName = user.trim().replace(/\s+/g, '_').toLowerCase();
    return `${cleanName}@example.com`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError('');

    try {
      const syntheticEmail = getSyntheticEmail(username);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password: password
      });

      if (authError) throw authError;

      if (authData.user) {
        await handleProfileFetch(authData.user, onLogin);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Email logins are disabled")) {
          setError("Configuration Error: Enable 'Email Provider' in Supabase Auth Settings.");
      } else {
          setError("Invalid username or password.");
      }
      setLoading(false);
    }
  };

  const handleProfileFetch = async (authUser: any, callback: (u: User) => void) => {
    let { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (!profileData) {
        const metadata = authUser.user_metadata || {};
        const newProfile = {
          id: authUser.id,
          username: metadata.username || username || "User",
          role: metadata.role || UserRole.USER,
          avatar_url: metadata.avatar_url || null,
          is_verified: true
        };
        const { error: insertError } = await supabase.from('profiles').insert([newProfile]);
        if (!insertError) profileData = newProfile;
    }

    if (profileData) {
      const loggedInUser: User = {
        id: authUser.id,
        username: profileData.username,
        role: profileData.role as UserRole,
        avatar: profileData.avatar_url,
        isVerified: profileData.is_verified,
        joinedGroups: []
      };
      callback(loggedInUser);
    }
    setLoading(false);
  };

  const handleAdminAutoLogin = async () => {
    setLoading(true);
    setError('');
    
    // Hardcoded Admin Credentials
    const adminUser = "Admin";
    const adminPass = "password123";
    const adminEmail = getSyntheticEmail(adminUser);

    try {
      // 1. Try to Login first
      let { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPass
      });

      // Catch specific Supabase config error
      if (error && error.message.includes("Email logins are disabled")) {
          setError("⚠️ Supabase Config Error: Go to Authentication -> Providers -> Email and ENABLE it.");
          setLoading(false);
          return;
      }

      // 2. If login fails (user doesn't exist), Create it
      if (error || !data.user) {
         console.log("Admin account not found, creating it...");
         
         const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: adminEmail,
            password: adminPass,
            options: {
                data: {
                    username: adminUser,
                    role: UserRole.ADMIN, // Set as Admin immediately
                    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=AdminBoss`
                }
            }
         });

         if (signUpError) {
             if (signUpError.message.includes("Email logins are disabled")) {
                 setError("⚠️ Enable 'Email Provider' in Supabase Dashboard.");
                 setLoading(false);
                 return;
             }
             // Use fallback if email confirmation causes issues but user is created
             if (signUpError.message.includes('confirmation')) {
                 const { data: retryData } = await supabase.auth.signInWithPassword({
                    email: adminEmail,
                    password: adminPass
                 });
                 if (retryData.user) data = retryData;
             }
         } else if (signUpData.user) {
             data = signUpData;
             // FORCE Insert Admin Profile
             await supabase.from('profiles').upsert({
                id: signUpData.user.id,
                username: adminUser,
                role: UserRole.ADMIN,
                is_verified: true,
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=AdminBoss`
             });
         }
      }

      if (data.user) {
          setUsername(adminUser);
          setPassword(adminPass);
          await handleProfileFetch(data.user, onLogin);
      } else {
          // Final fallback check
          if (error?.message) setError(error.message);
          else setError("Could not create Admin account.");
          setLoading(false);
      }

    } catch (err: any) {
        console.error("Auto login error:", err);
        setError("Error: " + err.message);
        setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-10">
          <div className="inline-block bg-indigo-600 p-4 rounded-3xl shadow-lg shadow-indigo-200 mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Login</h2>
          <p className="text-slate-400 mt-2 font-medium">Enter your username to access portal</p>
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
          
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 text-sm font-bold leading-relaxed text-center">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50">
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
        
        <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-slate-100 flex-1"></div>
            <span className="text-xs text-slate-300 font-bold uppercase">Quick Access</span>
            <div className="h-px bg-slate-100 flex-1"></div>
        </div>

        <button 
          onClick={handleAdminAutoLogin}
          disabled={loading}
          className="w-full bg-slate-900 text-white hover:bg-black py-3 rounded-2xl font-bold shadow-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>🚀</span> {loading ? 'Creating Admin...' : 'Create & Login Admin'}
        </button>

        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
          New here? <button onClick={onGoToRegister} className="text-indigo-600 font-bold hover:underline">Create Account</button>
        </p>
      </div>
    </div>
  );
};

export default Login;