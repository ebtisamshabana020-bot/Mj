import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { compressImage } from '../utils';
import { supabase } from './services/supabaseClient';

interface RegisterProps {
  onRegister: (user: User) => void;
  onBack: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onRegister, onBack }) => {
  // Form Data - No Email
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [avatar, setAvatar] = useState<string | null>(null);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const compressed = await compressImage(e.target.files[0]);
      setAvatar(compressed);
    }
  };

  const createProfile = async (userId: string) => {
    const { error } = await supabase.from('profiles').insert([{
      id: userId,
      username,
      role,
      avatar_url: avatar,
      is_verified: true
    }]);
    
    if (error && !error.message.includes('duplicate')) {
       console.error("Error creating profile:", error);
       throw error;
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    
    setLoading(true);
    setErrorMsg('');

    try {
      // Create synthetic email: username@example.com
      const cleanName = username.trim().replace(/\s+/g, '_').toLowerCase();
      const syntheticEmail = `${cleanName}@example.com`;

      // 1. Sign up with Supabase Auth (using fake email)
      let { data: authData, error: authError } = await supabase.auth.signUp({
        email: syntheticEmail,
        password: password,
        options: {
          data: {
            username: username,
            role: role,
            avatar_url: avatar
          }
        }
      });

      // Fallback: If email sending fails, the user might still be created. Try login.
      if (authError && authError.message && authError.message.includes('confirmation email')) {
          console.warn("Supabase email error, attempting fallback login...");
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: syntheticEmail,
            password: password
          });
          
          if (loginData.session) {
            authData = loginData;
            authError = null; // Recovered
          }
      }

      if (authError) throw authError;

      // 2. Check Session
      if (authData.session) {
         await createProfile(authData.user!.id);
         
         const newUser: User = {
            id: authData.user!.id,
            username,
            role,
            avatar: avatar || undefined,
            isVerified: true,
            joinedGroups: []
         };
         onRegister(newUser);
      } else {
         // If we are here, 'Confirm Email' is likely ON and blocking the login.
         setErrorMsg("Login blocked by email verification. Please disable 'Confirm Email' in Supabase Dashboard -> Auth -> Providers -> Email.");
      }

    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('already registered')) {
          setErrorMsg("Username already exists. Please choose another one.");
      } else if (err.message && err.message.includes('confirmation email')) {
          setErrorMsg("Server Error: Supabase is trying to send an email. Please disable 'Confirm Email' in your Supabase Dashboard.");
      } else if (err.message && err.message.includes('Email logins are disabled')) {
          setErrorMsg("Configuration Error: Please ENABLE 'Email Provider' in your Supabase Dashboard settings.");
      } else {
          setErrorMsg(err.message || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Identity</h2>
          <p className="text-slate-400 mt-2 font-medium">Join with just a username</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="flex justify-center mb-6">
            <label className="relative cursor-pointer group">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl overflow-hidden border-2 border-dashed border-slate-300 group-hover:border-indigo-400 transition-colors">
                {avatar ? (
                  <img src={avatar} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-xs text-center p-2">Upload Photo</div>
                )}
              </div>
              <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
            </label>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Account Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => setRole(UserRole.USER)}
                className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${role === UserRole.USER ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}
              >Student</button>
              <button 
                type="button"
                onClick={() => setRole(UserRole.TEACHER)}
                className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${role === UserRole.TEACHER ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}
              >Teacher</button>
            </div>
          </div>

          <div className="space-y-4">
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none font-medium" 
              placeholder="Username (e.g. MasterAli)" 
              required
            />
            
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="Password (Min 6 chars)" 
              required
            />
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 text-xs font-bold text-center leading-relaxed">
              {errorMsg}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-transform active:scale-95 disabled:opacity-50">
            {loading ? 'Processing...' : 'Register'}
          </button>
        </form>

        <button onClick={onBack} className="w-full mt-4 text-slate-400 font-bold text-sm hover:underline">Back to Login</button>
      </div>
    </div>
  );
};