# VerifyMe (Frontend Only)

React + Vite + Tailwind mock implementation for the VerifyMe web app. Everything runs locally with mocked data/services (no backend or blockchain required).

## Getting started

```bash
npm install
npm run dev
```

Then open the printed localhost URL.

## App structure

- `src/pages` — Landing, public profile, and role apps for Candidate, Recruiter, Issuer.
- `src/layouts` — Role-based shells with navigation and topbars.
- `src/components` — Design system primitives (buttons, inputs, tables, modals, drawer, toasts, dropzone, skeletons).
- `src/services` — Async mock services with `setTimeout` to simulate network calls.
- `src/mocks` — Mock data for candidates, credentials, issuers, requests, audit logs.
- `src/store/AuthContext.jsx` — Frontend-only auth with role switching and route guards.
- `src/utils` — Formatters and validators (includes Candidate ID regex).

## Notes

- Candidate ID validation follows `/^0x[a-fA-F0-9]{1,64}$/` with inline success hint.
- Dangerous actions (revoke/reject) use confirmation modals and toasts.
- All proof/verification links are placeholders labeled “View proof / verification record”.
- UI is web2-friendly; no blockchain terms surface in copy.
