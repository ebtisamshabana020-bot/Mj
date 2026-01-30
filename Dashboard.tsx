import React from 'react';
import { User, UserRole, AppView } from '../types';

interface DashboardProps {
  user: User;
  onNavigate: (view: AppView) => void;
  onOpenGroup: (g: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your education environment.</p>
        </div>
        
        <div className="flex gap-3">
          {user.role === UserRole.TEACHER && (
            <button 
              onClick={() => alert("Create Group feature coming soon in groups list")}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <span>+</span> New Group
            </button>
          )}
          {user.role === UserRole.ADMIN && (
            <button 
              onClick={() => onNavigate(AppView.ADMIN_PANEL)}
              className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-all"
            >
              Admin Portal
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between">
           <div>
             <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-xl mb-4">👥</div>
             <h3 className="text-xl font-bold text-slate-800">My Groups</h3>
             <p className="text-slate-400 text-sm mt-2">Access your classes and discussion groups.</p>
           </div>
           <button onClick={() => onNavigate(AppView.GROUPS)} className="mt-6 text-indigo-600 font-bold text-sm hover:underline">View All →</button>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between">
           <div>
             <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-xl mb-4">🎨</div>
             <h3 className="text-xl font-bold text-slate-800">AI Editor</h3>
             <p className="text-slate-400 text-sm mt-2">Generate and edit study diagrams with Gemini.</p>
           </div>
           <button onClick={() => onNavigate(AppView.IMAGE_EDITOR)} className="mt-6 text-purple-600 font-bold text-sm hover:underline">Open Editor →</button>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between">
           <div>
             <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-xl mb-4">📈</div>
             <h3 className="text-xl font-bold text-slate-800">Performance</h3>
             <p className="text-slate-400 text-sm mt-2">Track your academic progress over time.</p>
           </div>
           <span className="mt-6 text-slate-300 font-bold text-sm">Statistics locked</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;