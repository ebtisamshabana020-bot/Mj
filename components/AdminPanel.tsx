import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase } from './services/supabaseClient';

interface AdminPanelProps {
  onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Removed .order('created_at') to fix the "column does not exist" error
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;

      const mappedUsers: User[] = data.map((u: any) => ({
        id: u.id,
        username: u.username,
        role: u.role as UserRole,
        avatar: u.avatar_url,
        isVerified: u.is_verified,
        joinedGroups: []
      }));
      setUsers(mappedUsers);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId: string, currentRole: UserRole) => {
    if (currentRole === UserRole.ADMIN) {
        alert("Cannot change Admin role here.");
        return;
    }

    const newRole = currentRole === UserRole.TEACHER ? UserRole.USER : UserRole.TEACHER;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert("Failed to update user role.");
      console.error(err);
    }
  };

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, isVerified: !currentStatus } : u));
    } catch (err) {
      alert("Failed to update verification status.");
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-3xl font-black text-slate-900">Super Admin Panel</h2>
           <p className="text-slate-500 font-medium">Full access to identity and permissions</p>
        </div>
        <button onClick={onBack} className="text-slate-400 font-bold hover:text-red-500 px-4 py-2 hover:bg-red-50 rounded-xl transition-all">
          Exit Panel
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-wider">Identity</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-wider text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-10 h-10 rounded-full border border-slate-200 bg-white" />
                      <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">{user.username}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{user.id.substring(0,8)}...</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide
                      ${user.role === UserRole.ADMIN ? 'bg-rose-100 text-rose-600' : 
                        user.role === UserRole.TEACHER ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.isVerified ? (
                       <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Verified
                       </span>
                    ) : (
                       <span className="flex items-center gap-1 text-slate-400 font-bold text-xs">
                          <span className="w-2 h-2 bg-slate-300 rounded-full"></span> Unverified
                       </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.role !== UserRole.ADMIN && (
                      <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => toggleVerification(user.id, user.isVerified)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                              ${user.isVerified 
                                  ? 'border-red-200 text-red-500 hover:bg-red-50' 
                                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 bg-emerald-50/50'}`}
                          >
                            {user.isVerified ? 'Revoke Verify' : 'Verify Account'}
                          </button>

                          <button 
                              onClick={() => toggleRole(user.id, user.role)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                          >
                              {user.role === UserRole.TEACHER ? 'Demote to Student' : 'Promote to Teacher'}
                          </button>
                      </div>
                    )}
                    {user.role === UserRole.ADMIN && (
                        <span className="text-[10px] font-bold text-slate-300 uppercase">System Admin</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;