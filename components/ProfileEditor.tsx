import React, { useState } from 'react';
import { User } from '../types';
import { compressImage } from '../utils';
import { supabase } from './supabaseClient';

interface ProfileEditorProps {
  user: User;
  onUpdate: (u: User) => void;
  onBack: () => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ user, onUpdate, onBack }) => {
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState<string | undefined>(user.avatar);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const compressed = await compressImage(e.target.files[0]);
      setAvatar(compressed);
    }
  };

  const saveProfile = async () => {
    if (!username.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim(), avatar_url: avatar ?? null })
        .eq('id', user.id);

      if (error) throw error;

      onUpdate({
        ...user,
        username: username.trim(),
        avatar
      });
      onBack();
    } catch (err: any) {
      alert(err?.message || 'تعذر تحديث الملف الشخصي.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-right" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black">الملف الشخصي</h2>
        <button onClick={onBack} className="px-4 py-2 bg-white rounded-xl border">عودة</button>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex justify-center">
          <label className="cursor-pointer">
            <div className="w-24 h-24 rounded-3xl bg-slate-100 overflow-hidden border-2 border-dashed border-slate-300">
              {avatar ? (
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="h-full flex items-center justify-center text-2xl text-slate-400">+</div>
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">اسم المستخدم</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button onClick={saveProfile} disabled={saving} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold disabled:opacity-50">
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
};

export default ProfileEditor;
