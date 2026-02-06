# StudyGenius (Supabase Server Mode)

هذا المشروع يعمل بنمط **Server-backed only** عبر Supabase.

## المتطلبات

أنشئ ملف `.env` في جذر المشروع:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## التشغيل

```bash
npm install
npm run dev
```

## ملاحظات الإنتاج

- المصادقة تتم عبر `supabase.auth` فقط.
- لا يوجد تخزين Demo عبر `localStorage` لتدفقات الحسابات/المجموعات/الاختبارات.
- يجب تفعيل RLS على الجداول: `profiles`, `groups`, `exams`, `messages`.
- يفضّل التحقق من كلمات مرور الانضمام للمجموعات عبر Edge Function باستخدام **Argon2id**.
