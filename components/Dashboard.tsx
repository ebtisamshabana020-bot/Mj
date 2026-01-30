
import React from 'react';
import { User, UserRole, AppView } from '../types';

interface DashboardProps {
  user: User;
  onNavigate: (view: AppView) => void;
  onOpenGroup: (g: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const canCreateContent = user.role === UserRole.TEACHER || user.role === UserRole.ADMIN;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="relative group cursor-pointer" onClick={() => onNavigate(AppView.PROFILE)}>
              <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-16 h-16 rounded-3xl border-4 border-white shadow-xl group-hover:scale-105 transition-transform" />
              {user.isVerified && (
                <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white shadow-sm">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path></svg>
                </span>
              )}
           </div>
           <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">أهلاً بك، {user.username}</h1>
              <p className="text-slate-500 font-medium mt-1">مركز التحكم التعليمي الخاص بك جاهز.</p>
           </div>
        </div>
        
        <div className="flex gap-3">
          {user.role === UserRole.ADMIN && (
            <button 
              onClick={() => onNavigate(AppView.ADMIN_PANEL)}
              className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
            >
              🛡️ لوحة الإدارة
            </button>
          )}

          {canCreateContent && (
            <button 
              onClick={() => onNavigate(AppView.GROUPS)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <span>+</span> مجموعة جديدة
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-xl transition-all group">
           <div>
             <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">👥</div>
             <h3 className="text-2xl font-bold text-slate-800 text-right">مجموعاتي</h3>
             <p className="text-slate-400 text-sm mt-3 leading-relaxed text-right">الوصول إلى الفصول الدراسية النشطة ومجموعات النقاش المتزامنة.</p>
           </div>
           <button onClick={() => onNavigate(AppView.GROUPS)} className="mt-8 text-indigo-600 font-black text-sm hover:translate-x-2 transition-transform text-right">عرض جميع المجموعات ←</button>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-xl transition-all group">
           <div>
             <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">⚙️</div>
             <h3 className="text-2xl font-bold text-slate-800 text-right">الحساب</h3>
             <p className="text-slate-400 text-sm mt-3 leading-relaxed text-right">تحديث هويتك العامة، إعدادات الأمان، وبياناتك الشخصية.</p>
           </div>
           <button onClick={() => onNavigate(AppView.PROFILE)} className="mt-8 text-emerald-600 font-black text-sm hover:translate-x-2 transition-transform text-right">تعديل الملف الشخصي ←</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
