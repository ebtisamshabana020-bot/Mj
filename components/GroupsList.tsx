
import React, { useState, useEffect } from 'react';
import { Group, User, UserRole } from '../types';
import { hashString } from '../utils';
import { supabase } from './services/supabaseClient';

interface GroupsListProps {
  user: User;
  onBack: () => void;
  onJoinGroup: (group: Group, manageMode?: boolean) => void;
}

const GroupsList: React.FC<GroupsListProps> = ({ user, onBack, onJoinGroup }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Create Group Form
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [pass, setPass] = useState('');

  const isAdmin = user.role === UserRole.ADMIN;
  const canCreateGroups = user.role === UserRole.TEACHER || isAdmin;

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const serverGroups: Group[] = data.map((g: any) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        creatorId: g.creator_id,
        passwordHash: g.password_hash,
        imageUrl: g.image_url,
        membersCount: 0 
      }));

      setGroups(serverGroups);
    } catch (err) {
      console.error("Error fetching groups:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pass) return;

    try {
      const passHash = await hashString(pass);
      const { data, error } = await supabase
        .from('groups')
        .insert([{
          name,
          description: desc,
          password_hash: passHash,
          creator_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      const newGroup: Group = {
        id: data.id,
        name: data.name,
        description: data.description,
        creatorId: data.creator_id,
        passwordHash: data.password_hash,
        imageUrl: data.image_url,
        membersCount: 1
      };

      setGroups([newGroup, ...groups]);
      setShowCreate(false);
      setName(''); setDesc(''); setPass('');
    } catch (err: any) {
      alert("فشل إنشاء المجموعة: " + err.message);
    }
  };

  const attemptJoin = async (group: Group, manageMode: boolean = false) => {
    // Admins or Creators bypass password check
    if (group.creatorId === user.id || isAdmin) {
      onJoinGroup(group, manageMode);
      return;
    }

    const inputPass = manageMode ? null : prompt("أدخل كلمة مرور المجموعة للدخول كطالب:");
    if (manageMode) {
        alert("عذراً، فقط منشئ المجموعة أو الأدمن يمكنهم الإدارة.");
        return;
    }
    
    if (!inputPass) return;
    const inputHash = await hashString(inputPass);
    
    if (inputHash === group.passwordHash) {
      onJoinGroup(group, false);
    } else {
      alert("كلمة المرor غير صحيحة.");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p className="text-slate-500 font-bold">جاري تحميل المجموعات...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center flex-row-reverse">
        <div className="text-right">
           <h2 className="text-3xl font-black text-slate-900">المجموعات الدراسية</h2>
           <p className="text-slate-500 text-sm mt-1">تصفح المجموعات أو ابدأ في إنشاء اختباراتك</p>
        </div>
        <div className="flex gap-4">
          <button onClick={onBack} className="text-slate-500 font-bold hover:text-indigo-600 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm transition-all">
            &rarr; العودة
          </button>
          {canCreateGroups && (
            <button 
              onClick={() => setShowCreate(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
            >+ مجموعة جديدة</button>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl text-right">
            <h3 className="text-2xl font-black mb-6">إنشاء مجموعة دراسية</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <input type="text" placeholder="اسم المجموعة" value={name} onChange={e=>setName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-right" required />
              <textarea placeholder="وصف المجموعة" value={desc} onChange={e=>setDesc(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-right h-24" required />
              <input type="password" placeholder="كلمة المرور (لحماية المجموعة)" value={pass} onChange={e=>setPass(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-right" required />
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-4 font-bold text-slate-400">إلغاء</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700">إنشاء الآن</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {groups.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold">لا توجد مجموعات حالياً.</p>
          </div>
        )}
        {groups.map(group => {
          const isManager = group.creatorId === user.id || isAdmin;
          return (
            <div key={group.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative flex flex-col justify-between overflow-hidden">
              <div>
                <div className="h-32 bg-indigo-50 rounded-3xl mb-6 flex items-center justify-center text-5xl">
                   {isManager ? '👨‍🏫' : '📚'}
                </div>
                <h4 className="text-2xl font-black text-slate-900 text-right">{group.name}</h4>
                <p className="text-slate-500 text-sm text-right mt-2 line-clamp-2">{group.description}</p>
              </div>
              
              <div className="mt-8 flex flex-col gap-2">
                {isManager && (
                  <button 
                    onClick={() => attemptJoin(group, true)}
                    className="w-full bg-emerald-600 text-white py-3 rounded-2xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                  >
                    <span>📝</span> إنشاء وإدارة الاختبارات
                  </button>
                )}
                <button 
                  onClick={() => attemptJoin(group, false)}
                  className="w-full bg-slate-900 text-white py-3 rounded-2xl text-sm font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  <span>🚀</span> {isManager ? 'تجربة كطالب' : 'دخول المجموعة'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupsList;
