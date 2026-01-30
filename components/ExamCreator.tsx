
import React, { useState } from 'react';
import { Group, User, Question } from '../types';
import { supabase } from './services/supabaseClient';

interface ExamCreatorProps {
  group: Group;
  user: User;
  onBack: () => void;
}

const ExamCreator: React.FC<ExamCreatorProps> = ({ group, user, onBack }) => {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQText, setNewQText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correct, setCorrect] = useState(0);
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    if (!newQText.trim()) { alert("يرجى كتابة نص السؤال أولاً."); return; }
    const filledOptions = options.map(o => o.trim()).filter(o => o !== '');
    if (filledOptions.length < 2) { alert("يرجى كتابة خيارين على الأقل للسؤال."); return; }
    
    const q: Question = {
      id: Math.random().toString(36).substr(2, 9),
      text: newQText,
      options: filledOptions,
      correctAnswer: correct,
      type: 'MCQ'
    };
    
    setQuestions([...questions, q]);
    setNewQText('');
    setOptions(['', '', '', '']);
    setCorrect(0);
  };

  const handleSave = async () => {
    if (!title.trim()) { alert("يرجى إدخال عنوان للاختبار."); return; }
    if (questions.length === 0) { alert("أضف سؤالاً واحداً على الأقل."); return; }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('exams')
        .insert([{
          group_id: group.id,
          title: title,
          questions: questions,
          creator_id: user.id
        }]);

      if (error) throw error;
      alert("🎉 تم نشر الاختبار بنجاح!");
      onBack();
    } catch (err: any) {
      console.error(err);
      alert("فشل حفظ الاختبار. تأكد من وجود جدول exams في قاعدة البيانات.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-right" dir="rtl">
      <div className="flex items-center justify-between flex-row-reverse mb-4">
        <h2 className="text-3xl font-black text-slate-900">إنشاء اختبار: {group.name}</h2>
        <button onClick={onBack} className="text-slate-400 font-bold hover:text-indigo-600 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm transition-all">&larr; إلغاء</button>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <label className="block text-sm font-black text-slate-700 mb-3">عنوان الاختبار</label>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
          placeholder="مثلاً: اختبار الرياضيات - الوحدة الأولى"
        />
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <h3 className="font-black text-xl mb-6">📝 إضافة سؤال</h3>
        <textarea 
          value={newQText}
          onChange={(e) => setNewQText(e.target.value)}
          className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 h-28 font-bold mb-6" 
          placeholder="اكتب السؤال هنا..."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((opt, i) => (
            <div key={i} className={`flex gap-3 items-center p-3 rounded-2xl border-2 ${correct === i ? 'border-emerald-500 bg-emerald-50' : 'border-slate-50 bg-slate-50'}`}>
              <input type="radio" checked={correct === i} onChange={() => setCorrect(i)} className="w-5 h-5 accent-emerald-600" name="correct" />
              <input type="text" value={opt} onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} className="flex-1 bg-transparent outline-none font-bold text-sm" placeholder={`خيار ${i+1}`} />
            </div>
          ))}
        </div>
        <button onClick={addQuestion} className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all">إضافة السؤال للقائمة</button>
      </div>

      <div className="space-y-4">
        <h3 className="font-black text-lg">الأسئلة الحالية ({questions.length})</h3>
        {questions.map((q, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center flex-row-reverse">
            <span className="font-bold">{q.text}</span>
            <button onClick={() => setQuestions(questions.filter((_, i) => i !== idx))} className="text-red-500 font-bold hover:underline">حذف</button>
          </div>
        ))}
      </div>

      <button 
        onClick={handleSave} 
        disabled={saving || questions.length === 0} 
        className={`w-full py-5 rounded-[2rem] font-black text-xl shadow-2xl transition-all ${saving ? 'bg-slate-300' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
      >
        {saving ? 'جاري الحفظ...' : '🚀 حفظ ونشر الاختبار'}
      </button>
    </div>
  );
};

export default ExamCreator;
