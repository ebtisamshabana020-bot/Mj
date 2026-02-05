
import React, { useState, useEffect } from 'react';
import { AppView, User, UserRole, Group, Exam } from './types';
import Login from './components/Login';
import { Register } from './components/Register';
import Dashboard from './components/Dashboard';
import GroupsList from './components/GroupsList';
import AdminPanel from './components/AdminPanel';
import ExamCreator from './components/ExamCreator';
import QuizTaker from './components/QuizTaker';
import ProfileEditor from './components/ProfileEditor';
import ImageEditor from './components/ImageEditor';

const LOCAL_USER_KEY = 'studygenius_local_user';
const LOCAL_EXAMS_KEY = 'studygenius_exams';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupExams, setGroupExams] = useState<Exam[]>([]);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const storedUser = localStorage.getItem(LOCAL_USER_KEY);
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
          setView(AppView.DASHBOARD);
        } catch {
          localStorage.removeItem(LOCAL_USER_KEY);
        }
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (view === AppView.GROUP_DETAIL && selectedGroup) {
      fetchExams(selectedGroup.id);
    }
  }, [view, selectedGroup]);

  const fetchExams = async (groupId: string) => {
    try {
      const localExams: Exam[] = JSON.parse(localStorage.getItem(LOCAL_EXAMS_KEY) || '[]');
      setGroupExams(localExams.filter(exam => exam.groupId === groupId));
    } catch {
      setGroupExams([]);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem(LOCAL_USER_KEY);
    setCurrentUser(null);
    setView(AppView.LOGIN);
  };

  const handleAuthSuccess = (u: User) => {
    setCurrentUser(u);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
    setView(AppView.DASHBOARD);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-500 font-bold">جاري تحميل المنصة...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    if (!currentUser) {
      if (view === AppView.REGISTER) return <Register onRegister={handleAuthSuccess} onBack={() => setView(AppView.LOGIN)} />;
      return <Login onLogin={handleAuthSuccess} onGoToRegister={() => setView(AppView.REGISTER)} />;
    }

    switch (view) {
      case AppView.DASHBOARD:
        return <Dashboard user={currentUser} onNavigate={setView} onOpenGroup={() => {}} />;
      case AppView.GROUPS:
        return (
          <GroupsList 
            user={currentUser} 
            onBack={() => setView(AppView.DASHBOARD)} 
            onJoinGroup={(g, manageMode) => {
              setSelectedGroup(g);
              if (manageMode) setView(AppView.EXAM_CREATOR);
              else setView(AppView.GROUP_DETAIL);
            }} 
          />
        );
      case AppView.GROUP_DETAIL:
        return (
          <div className="max-w-4xl mx-auto space-y-6 text-right">
             <div className="flex justify-between items-center flex-row-reverse">
                <h2 className="text-3xl font-black">{selectedGroup?.name}</h2>
                <button onClick={() => setView(AppView.GROUPS)} className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 font-bold">عودة للمجموعات</button>
             </div>
             <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6 flex-row-reverse">
                  <h3 className="text-xl font-bold">الاختبارات المنشورة</h3>
                  {(currentUser.role !== UserRole.USER) && (
                    <button onClick={() => setView(AppView.EXAM_CREATOR)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold">+ إضافة اختبار</button>
                  )}
                </div>
                {groupExams.length > 0 ? (
                  <div className="grid gap-4">
                    {groupExams.map(exam => (
                      <div key={exam.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center flex-row-reverse border border-slate-100">
                        <span className="font-bold">{exam.title}</span>
                        <button 
                          onClick={() => { setActiveExam(exam); setView(AppView.EXAM_TAKER); }}
                          className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold"
                        >دخول الاختبار</button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-slate-400 py-10">لا توجد اختبارات متاحة حالياً.</p>}
             </div>
          </div>
        );
      case AppView.EXAM_CREATOR:
        return selectedGroup ? <ExamCreator group={selectedGroup} user={currentUser} onBack={() => setView(AppView.GROUP_DETAIL)} /> : null;
      case AppView.EXAM_TAKER:
        return activeExam ? <QuizTaker exam={activeExam} user={currentUser} onBack={() => setView(AppView.GROUP_DETAIL)} /> : null;
      case AppView.ADMIN_PANEL:
        return <AdminPanel onBack={() => setView(AppView.DASHBOARD)} />;
      case AppView.PROFILE:
        return <ProfileEditor user={currentUser} onUpdate={setCurrentUser} onBack={() => setView(AppView.DASHBOARD)} />;
      case AppView.IMAGE_EDITOR:
        return <ImageEditor onBack={() => setView(AppView.DASHBOARD)} />;
      default:
        return <Dashboard user={currentUser} onNavigate={setView} onOpenGroup={() => {}} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-40 flex-row-reverse">
        <div className="flex items-center gap-4 flex-row-reverse">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl">S</div>
          <span className="text-xl font-black text-slate-900 hidden sm:inline">StudyGenius</span>
        </div>
        {currentUser && (
          <div className="flex items-center gap-6 flex-row-reverse">
             <button onClick={() => setView(AppView.DASHBOARD)} className="text-slate-500 font-bold">الرئيسية</button>
             <button onClick={() => setView(AppView.GROUPS)} className="text-slate-500 font-bold">المجموعات</button>
             <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView(AppView.PROFILE)}>
                <img src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`} className="w-8 h-8 rounded-lg shadow-sm" alt="Avatar" />
                <span className="text-sm font-bold hidden sm:inline">{currentUser.username}</span>
             </div>
             <button onClick={handleLogout} className="text-slate-500 hover:text-red-500">خروج</button>
          </div>
        )}
      </nav>
      <main className="flex-1 p-6 md:p-10">{renderView()}</main>
    </div>
  );
};

export default App;
