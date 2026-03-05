import React, { useEffect, useState } from 'react';
import { AppView, Exam, Group, User, UserRole } from './types';
import Login from './components/Login';
import { Register } from './components/Register';
import Dashboard from './components/Dashboard';
import GroupsList from './components/GroupsList';
import AdminPanel from './components/AdminPanel';
import ExamCreator from './components/ExamCreator';
import QuizTaker from './components/QuizTaker';
import ProfileEditor from './components/ProfileEditor';
import { getCurrentAuthUser, getProfile, listExamsByGroup, signOut } from './components/services/firebaseClient';

const mapProfileToUser = (profile: any): User => ({
  id: profile.id,
  username: profile.username,
  role: (profile.role as UserRole) ?? UserRole.USER,
  avatar: profile.avatar_url ?? undefined,
  isVerified: Boolean(profile.is_verified),
  joinedGroups: []
});

const mapExam = (exam: any): Exam => ({
  id: exam.id,
  groupId: exam.group_id,
  title: exam.title,
  description: exam.description ?? undefined,
  questions: exam.questions ?? [],
  creatorId: exam.creator_id
});

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupExams, setGroupExams] = useState<Exam[]>([]);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const authUser = await getCurrentAuthUser();
        if (authUser?.uid) {
          const profile = await getProfile(authUser.uid, authUser.idToken);
          if (!profile) throw new Error('تعذر تحميل الملف الشخصي.');
          setCurrentUser(mapProfileToUser(profile));
          setView(AppView.DASHBOARD);
        }
      } catch (error) {
        console.error('Session bootstrap failed', error);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (view === AppView.GROUP_DETAIL && selectedGroup) {
      const loadExams = async () => {
        try {
          const exams = await listExamsByGroup(selectedGroup.id);
          setGroupExams(exams.map(mapExam));
        } catch {
          alert('تعذر تحميل الاختبارات.');
          setGroupExams([]);
        }
      };
      loadExams();
    }
  }, [view, selectedGroup]);

  const handleLogout = async () => {
    await signOut();
    setCurrentUser(null);
    setView(AppView.LOGIN);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setView(AppView.DASHBOARD);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-slate-500 font-bold">جاري تحميل المنصة...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    if (!currentUser) {
      if (view === AppView.REGISTER) {
        return <Register onRegister={handleAuthSuccess} onBack={() => setView(AppView.LOGIN)} />;
      }
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
            onJoinGroup={(group, manageMode) => {
              setSelectedGroup(group);
              setView(manageMode ? AppView.EXAM_CREATOR : AppView.GROUP_DETAIL);
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
                {currentUser.role !== UserRole.USER && (
                  <button onClick={() => setView(AppView.EXAM_CREATOR)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold">+ إضافة اختبار</button>
                )}
              </div>
              {groupExams.length > 0 ? (
                <div className="grid gap-4">
                  {groupExams.map((exam) => (
                    <div key={exam.id} className="p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold">{exam.title}</h4>
                        {exam.description && <p className="text-sm text-slate-500">{exam.description}</p>}
                      </div>
                      <button onClick={() => { setActiveExam(exam); setView(AppView.EXAM_TAKER); }} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold">بدء</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">لا توجد اختبارات منشورة بعد.</p>
              )}
            </div>
          </div>
        );
      case AppView.EXAM_TAKER:
        return activeExam ? <QuizTaker exam={activeExam} user={currentUser} onBack={() => setView(AppView.GROUP_DETAIL)} /> : null;
      case AppView.EXAM_CREATOR:
        return selectedGroup ? <ExamCreator group={selectedGroup} user={currentUser} onBack={() => setView(AppView.GROUP_DETAIL)} /> : null;
      case AppView.ADMIN_PANEL:
        return <AdminPanel onBack={() => setView(AppView.DASHBOARD)} />;
      case AppView.PROFILE:
        return <ProfileEditor user={currentUser} onUpdate={setCurrentUser} onBack={() => setView(AppView.DASHBOARD)} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4 md:p-8">
      {currentUser && (
        <div className="max-w-7xl mx-auto mb-4 flex justify-end">
          <button onClick={handleLogout} className="px-4 py-2 bg-white rounded-xl border font-bold">تسجيل الخروج</button>
        </div>
      )}
      <main className="max-w-7xl mx-auto">{renderView()}</main>
    </div>
  );
};

export default App;
