# StudyGenius (Local Demo Mode)

This project now runs without any environment variables.

## Run locally

1. Install dependencies:
   `npm install`
2. Start development server:
   `npm run dev`

## Notes

- Authentication, groups, exams, and chat are stored in browser localStorage for demo purposes.
- No backend setup is required to preview the app UI flow.

- Password hashing supports Argon2 if runtime hooks are provided (`globalThis.__argon2Hash` and `globalThis.__argon2Verify`); otherwise it falls back to PBKDF2 in-browser.
