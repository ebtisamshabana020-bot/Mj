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

## Troubleshooting: `infinite recursion detected in policy for relation "profiles"`

هذا الخطأ يظهر عند وجود policy على جدول `profiles` تقوم بقراءة `profiles` نفسها داخل `USING` أو `WITH CHECK`.

نفّذ السكربت التالي في Supabase SQL Editor لإصلاحها:

```sql
-- from repo root
-- sql/fix_profiles_policy_recursion.sql
```


```bash
npm install
npm run dev
```

## ملاحظات الإنتاج

- المصادقة تتم عبر `supabase.auth` فقط.
- لا يوجد تخزين Demo عبر `localStorage` لتدفقات الحسابات/المجموعات/الاختبارات.
- يجب تفعيل RLS على الجداول: `profiles`, `groups`, `exams`, `messages`.
- يفضّل التحقق من كلمات مرور الانضمام للمجموعات عبر Edge Function باستخدام **Argon2id**.
