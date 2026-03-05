# StudyGenius (Firebase Server Mode)

هذا المشروع يعمل بنمط **Server-backed only** عبر Firebase (Authentication + Firestore).

## Environment Variables

أنشئ ملف `.env` في جذر المشروع:

```bash
VITE_FIREBASE_API_KEY=AIzaSyAIorPDHQwVC2t0l7cSCjfo1CUj5huqas0
VITE_FIREBASE_PROJECT_ID=chatapp-b5bda
```

## التشغيل

```bash
npm install
npm run dev
```

## ملاحظات

- المصادقة عبر Firebase Auth (REST API).
- البيانات الأساسية (`profiles`, `groups`, `exams`) عبر Firestore.
- لا يوجد مسار demo محلي للبيانات.
