import React, { useState, useEffect } from 'react';
import { Group, User, UserRole } from '../types';
import { hashString } from '../utils';
import { supabase } from '../services/supabaseClient';

interface GroupsListProps {
  user: User;
  onBack: () => void;
  onJoinGroup: (group: Group) => void;
}

const GroupsList: React.FC<GroupsListProps> = ({ user, onBack, onJoinGroup }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Create Group Form
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [pass, setPass] = useState('');

  // Fetch groups from Supabase
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

      // Map Supabase columns to our Type
      const mappedGroups: Group[] = data.map((g: any) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        creatorId: g.creator_id,
        passwordHash: g.password_hash,
        imageUrl: g.image_url,
        membersCount: 0 // In a real app, we would do a count query on a members table
      }));
      setGroups(mappedGroups);
    } catch (err) {
      console.error("Error fetching groups:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
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

      // Optimistic update or refetch
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
    } catch (err) {
      alert("Failed to create group. Ensure you are a Teacher.");
      console.error(err);
    }
  };

  const attemptJoin = async (group: Group) => {
    const inputPass = prompt("Enter Group Access Key:");
    if (!inputPass) return;
    const inputHash = await hashString(inputPass);
    
    if (inputHash === group.passwordHash) {
      onJoinGroup(group);
    } else {
      alert("Invalid Access Key. Connection Denied.");
    }
  };

  if (loading) return <div className="text-center p-10">Loading encrypted groups...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-slate-500 font-bold hover:text-indigo-600">← Return</button>
        {user.role === UserRole.TEACHER && (
          <button 
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-md"
          >+ Create New Group</button>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-2xl font-black mb-6">Initialize Group</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input type="text" placeholder="Group Name" value={name} onChange={e=>setName(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl" required />
              <textarea placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl" required />
              <input type="password" placeholder="Access Key (Password)" value={pass} onChange={e=>setPass(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl" required />
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 font-bold text-slate-400">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Launch Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.length === 0 && <div className="col-span-3 text-center text-slate-400">No active groups found. Teachers can create one.</div>}
        {groups.map(group => (
          <div key={group.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="h-32 bg-slate-50 rounded-2xl mb-4 overflow-hidden">
               {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-4xl">📚</div>}
            </div>
            <h4 className="text-xl font-black text-slate-900">{group.name}</h4>
            <p className="text-slate-500 text-sm mt-1 line-clamp-2">{group.description}</p>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Locked</span>
              <button 
                onClick={() => attemptJoin(group)}
                className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold group-hover:bg-indigo-600 transition-colors"
              >Join Group</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupsList;