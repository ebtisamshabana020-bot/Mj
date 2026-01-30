
import React, { useState, useEffect, useRef } from 'react';
import { Exam, EncryptedMessage, User } from '../types';
import { encryptMessage, decryptMessage } from '../utils';
import { supabase } from './services/supabaseClient';

interface QuizTakerProps {
  exam: Exam;
  user: User;
  onBack: () => void;
}

const QuizTaker: React.FC<QuizTakerProps> = ({ exam, user, onBack }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [warnings, setWarnings] = useState(0);
  
  const [messages, setMessages] = useState<EncryptedMessage[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isFallbackExam = exam.id.startsWith('fallback_');

  useEffect(() => {
    const handleInvis = () => {
      if (document.hidden && !isDone) {
        setWarnings(w => w + 1);
        alert("⚠️ تنبيه أمني: تم رصد مغادرة الصفحة.");
      }
    };
    document.addEventListener("visibilitychange", handleInvis);
    return () => document.removeEventListener("visibilitychange", handleInvis);
  }, [isDone]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isFallbackExam) {
      setMessages([{
        id: 'welcome',
        senderId: 'system',
        senderName: 'النظام',
        examId: exam.id,
        encryptedContent: btoa(unescape(encodeURIComponent("مرحباً بك! الدردشة هنا تعمل بشكل محلي فقط."))),
        timestamp: Date.now()
      }]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('exam_id', String(exam.id))
          .order('created_at', { ascending: true });
        
        if (data && !error) {
          const mapped: EncryptedMessage[] = data.map((m: any) => ({
            id: m.id,
            senderId: m.sender_id,
            senderName: m.sender_name,
            examId: m.exam_id,
            encryptedContent: m.encrypted_content,
            timestamp: new Date(m.created_at).getTime()
          }));
          setMessages(mapped);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
    
    const channel = supabase
      .channel(`chat_${exam.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `exam_id=eq.${String(exam.id)}` 
        }, 
        (payload) => {
          const m = payload.new;
          const newMsg: EncryptedMessage = {
            id: m.id,
            senderId: m.sender_id,
            senderName: m.sender_name,
            examId: m.exam_id,
            encryptedContent: m.encrypted_content,
            timestamp: new Date(m.created_at).getTime()
          };
          
          setMessages(prev => {
            // Avoid adding the same message if optimistic update already added it
            if (prev.find(msg => msg.id === newMsg.id || (msg.senderId === newMsg.senderId && msg.timestamp > Date.now() - 5000 && msg.encryptedContent === newMsg.encryptedContent))) {
              return prev;
            }
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [exam.id, isFallbackExam]);

  const handleSendChat = async () => {
    if (!msgInput.trim()) return;
    const contentToSend = msgInput.trim();
    setMsgInput('');

    // Optimistic Update: Add message locally first
    const tempId = 'temp_' + Date.now();
    const encrypted = await encryptMessage(contentToSend);
    const optimisticMsg: EncryptedMessage = {
      id: tempId,
      senderId: user.id,
      senderName: user.username,
      examId: exam.id,
      encryptedContent: encrypted,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, optimisticMsg]);

    if (isFallbackExam) return;

    try {
      const { error } = await supabase.from('messages').insert([{
        exam_id: String(exam.id),
        sender_id: user.id,
        sender_name: user.username,
        encrypted_content: encrypted
      }]);

      if (error) throw error;
    } catch (err) {
      console.error("فشل إرسال الرسالة:", err);
      // Optional: Remove optimistic message if insert fails
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert("⚠️ تعذر إرسال الرسالة للسيرفر.");
    }
  };

  if (isDone) {
    return (
      <div className="max-w-2xl mx-auto p-12 bg-white rounded-[3rem] shadow-2xl text-center border border-slate-100 animate-in zoom-in duration-300">
        <h2 className="text-4xl font-extrabold text-indigo-900 mb-6">نتائج الاختبار</h2>
        <div className="text-7xl mb-6">🏆</div>
        <p className="text-2xl text-slate-600 mb-8">
          درجتك النهائية: <span className="text-indigo-600 font-black">{score}/{exam.questions.length}</span>
        </p>
        <button onClick={onBack} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl transition-all">إغلاق البوابة</button>
      </div>
    );
  }

  const q = exam.questions[currentIdx];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-[2.5rem] shadow-lg border border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 p-8 text-white flex justify-between items-center relative overflow-hidden flex-row-reverse">
            <div className="relative z-10 text-right">
              <h1 className="text-2xl font-bold">{exam.title}</h1>
              <p className="text-indigo-200 text-sm">جلسة اختبار آمنة 🔒</p>
            </div>
            <div className="bg-white/20 px-6 py-2 rounded-full text-sm font-bold relative z-10 backdrop-blur-md">
              السؤال {currentIdx + 1} من {exam.questions.length}
            </div>
          </div>
          
          <div className="p-12 text-right">
            <h2 className="text-2xl font-bold text-slate-800 mb-10 leading-relaxed">{q.text}</h2>
            <div className="grid gap-4">
              {q.options.map((opt, i) => (
                <button 
                  key={i} 
                  onClick={() => {
                    if (i === q.correctAnswer) setScore(s => s + 1);
                    if (currentIdx < exam.questions.length - 1) setCurrentIdx(c => c + 1);
                    else setIsDone(true);
                  }}
                  className="w-full text-right p-6 rounded-3xl border-2 border-slate-50 hover:border-indigo-400 hover:bg-indigo-50 transition-all font-bold group flex items-center gap-4 flex-row-reverse"
                >
                  <span className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-sm transition-colors">
                    {String.fromCharCode(65+i)}
                  </span>
                  <span className="flex-1">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] shadow-xl flex flex-col h-[650px] border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md flex-row-reverse">
          <h3 className="text-white font-bold flex items-center gap-3">
             دردشة مباشرة
             <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
          </h3>
          <span className="text-[10px] text-emerald-400 font-black border border-emerald-900/50 bg-emerald-900/20 px-3 py-1 rounded-lg uppercase">مشفر</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
           {messages.length === 0 ? (
             <div className="text-center py-24">
               <p className="text-slate-600 text-xs">لا توجد رسائل بعد</p>
             </div>
           ) : (
             messages.map(m => (
               <div key={m.id} className={`flex flex-col ${m.senderId === user.id ? 'items-end' : 'items-start'}`}>
                 <span className="text-[10px] text-slate-500 font-bold mb-1">{m.senderName}</span>
                 <div className={`${m.senderId === user.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'} p-4 rounded-3xl text-sm max-w-[90%] text-right`}>
                    {decryptMessage(m.encryptedContent)}
                 </div>
               </div>
             ))
           )}
           <div ref={chatEndRef} />
        </div>

        <div className="p-5 bg-slate-950/50 border-t border-slate-800">
          <div className="flex gap-3">
            <input 
              type="text" 
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="اكتب رسالة..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-right"
            />
            <button onClick={handleSendChat} className="bg-indigo-600 text-white p-3.5 rounded-2xl hover:bg-indigo-700 transition-all">
              🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizTaker;
