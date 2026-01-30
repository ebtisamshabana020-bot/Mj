import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { compressImage } from '../utils';
import { supabase } from './services/supabaseClient';

interface RegisterProps {
  onRegister: (user: User) => void;
  onBack: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onBack }) => {
  // State for flow control
  const [step, setStep] = useState<'REGISTER' | 'VERIFY'>('REGISTER');
  
  // Form Data
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [avatar, setAvatar] = useState<string | null>(null);
  
  // Verification Data
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Timer for resend button
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

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
    if (error) {
       // Ignore duplicate key error in case profile was already created
       if (!error.message.includes('duplicate')) {
           console.error("Error creating profile:", error);
           throw error;
       }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password) return;
    
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            username: username,
            role: role,
            avatar_url: avatar
          }
        }
      });

      if (authError) throw authError;

      if (authData.session) {
         // User is already active (auto-confirm enabled or existing session)
         await createProfile(authData.user!.id);
         completeLogin(authData.user!, authData.session);
      } else {
         // Move to OTP step
         setStep('VERIFY');
         setResendTimer(60); // Start 60s cooldown
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) throw error;
      setInfoMsg("Code has been resent to your email.");
      setResendTimer(60);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });

      if (error) throw error;

      if (data.user && data.session) {
        // Create profile now that we are verified and have a session
        await createProfile(data.user.id);
        completeLogin(data.user, data.session);
      } else {
        throw new Error("Verification successful but login failed.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Invalid code. Please check your email and try again.");
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = (authUser: any, session: any) => {
    const newUser: User = {
      id: authUser.id,
      username,
      role,
      avatar: avatar || undefined,
      isVerified: true,
      joinedGroups: []
    };
    onRegister(newUser);
  };

  if (step === 'VERIFY') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100">
          <div className="text-center mb-8">
            <div className="inline-block bg-indigo-100 p-3 rounded-full mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verify Email</h2>
            <p className="text-slate-400 mt-2 font-medium text-sm">
              Enter the 6-digit code sent to <br/><span className="text-indigo-600 font-bold">{email}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400 ml-1">Confirmation Code</label>
              <input 
                type="text" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-center tracking-[0.5em] text-lg" 
                placeholder="123456" 
                maxLength={6}
                required
              />
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold text-center">
                {errorMsg}
              </div>
            )}
            
            {infoMsg && (
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-xs font-bold text-center">
                {infoMsg}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-transform active:scale-95 disabled:opacity-50">
              {loading && !infoMsg ? 'Verifying...' : 'Confirm Account'}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3">
             <button 
               onClick={handleResendOtp} 
               disabled={resendTimer > 0 || loading}
               className={`text-sm font-bold ${resendTimer > 0 ? 'text-slate-300' : 'text-indigo-600 hover:underline'}`}
             >
               {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
             </button>

             <button onClick={() => setStep('REGISTER')} className="text-slate-400 font-bold text-sm hover:underline">
               Wrong email? Go Back
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Identity</h2>
          <p className="text-slate-400 mt-2 font-medium">Join the secure learning network</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="flex justify-center mb-6">
            <label className="relative cursor-pointer group">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl overflow-hidden border-2 border-dashed border-slate-300 group-hover:border-indigo-400 transition-colors">
                {avatar ? (
                  <img src={avatar} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-xs">Photo</div>
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
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none font-medium" 
              placeholder="Email (e.g. hossam@gmail.com)" 
              required
            />
            
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none font-medium" 
              placeholder="Username (Public)" 
              required
            />
            
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="Secure Password (min 6 chars)" 
              required
            />
          </div>

          {errorMsg && (
            <div className={`p-3 rounded-xl text-xs font-bold text-center bg-red-50 text-red-600`}>
              {errorMsg}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-transform active:scale-95 disabled:opacity-50">
            {loading ? 'Sending Code...' : 'Initialize Portal'}
          </button>
        </form>

        <button onClick={onBack} className="w-full mt-4 text-slate-400 font-bold text-sm hover:underline">Back to Login</button>
      </div>
    </div>
  );
};

export default Register;