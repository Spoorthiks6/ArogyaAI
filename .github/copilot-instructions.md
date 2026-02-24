<!-- .github/copilot-instructions.md - guidance for AI coding agents working on this repo -->
# Repository-specific instructions for code edits

This project is a two-part web app: a Node/Express backend (audio + SMS emergency API) and a Vite + React TypeScript frontend (mobile-capable, Capacitor-ready). Keep guidance concise and actionable — use the files and examples referenced below.

- **Big picture**: Backend (`/backend`) exposes JSON and multipart endpoints (notably `/emergency`) and persists alerts/contacts to MongoDB. Frontend (`/frontend`) calls the backend via `VITE_API_URL` using the helper in `src/api/index.ts`.

- **Primary entry points**:
  - Backend server: `backend/server.js` (default port `4000`).
  - Frontend dev: `frontend` uses Vite (`npm run dev`).

- **Run / dev workflow** (what humans will run):
  - Backend: `cd backend && npm install && npm run dev` (uses `nodemon`).
  - Frontend: `cd frontend && npm install && npm run dev` (Vite dev server).
  - Frontend expects `VITE_API_URL` in `.env` (see `frontend/README_API.md`). Backend expects `.env` with `MONGO_URI`, `JWT_SECRET`, and optional keys described below.

- **Key environment variables**:
  - `MONGO_URI` — MongoDB connection string (backend/.env).
  - `JWT_SECRET` — JWT signing secret for `middleware/auth.js`.
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` — Twilio SMS sending (see `services/twilioService.js`).
  - `DEEPGRAM_API_KEY` — preferred STT provider.
  - `OPENAI_API_KEY` — Whisper fallback STT.
  - Frontend: `VITE_API_URL` — e.g. `http://localhost:4000`.

- **Emergency flow & integration points (concrete examples)**:
  - Frontend helper `sendEmergencyWithVoice` (in `frontend/src/api/index.ts`) builds a `FormData` with keys: `message`, `location`, `userName`, `language`, and `voice` (file field name `voice`). Backend route `backend/routes/emergency.js` expects these same fields and uses `multer` to read `req.file`.
  - Transcription sequence (backend `services/offlineTranscriptionService.js`): try Deepgram -> OpenAI Whisper -> offline mock. Failures are logged; tests should mock the remote API or set keys.
  - SMS sending: `services/twilioService.js` initializes Twilio and normalizes numbers to E.164; trial account caveats and error codes (e.g. 21608, 30044) are logged. Use `formatPhoneNumber` to reproduce normalization logic in tests.

- **Project patterns & conventions** (concrete, discoverable):
  - Routes are small, synchronous-looking async handlers in `backend/routes/*.js` returning JSON. Use the same style (`res.json(...)`) and reuse `auth` middleware (`backend/middleware/auth.js`).
  - Services live in `backend/services/` and encapsulate external integrations (Twilio, Deepgram, Whisper). Prefer updating or adding helpers here rather than embedding API calls directly in routes.
  - Simple file uploads land in `backend/uploads/` via `multer` configured in `routes/emergency.js` (filename includes timestamp + random suffix).
  - Logging: code uses verbose console logging with emojis; keep logs informative and consistent with existing style.

- **Testing / debugging tips specific to this repo**:
  - If audio transcription fails locally, check `DEEPGRAM_API_KEY`/`OPENAI_API_KEY` in backend `.env`. The offline mock returns deterministic mock texts in `offlineTranscription`.
  - To reproduce Twilio errors: try using a trial account (SID begins with `AC`) — `twilioService` logs trial-specific warnings.
  - Check `uploads/` for saved files when debugging `multipart/form-data` flows.
  - Backend port: `4000` by default; frontend `VITE_API_URL` should point to it for local dev.

- **Files to inspect for implementation examples**:
  - `backend/server.js` — Express setup, body size limits for audio: `express.json({ limit: '50mb' })`.
  - `backend/routes/emergency.js` — emergency endpoint, `multer` usage, transcription + persistence to `EmergencyAlert`.
  - `backend/services/offlineTranscriptionService.js` and `services/transcriptionService.js` — STT flow and OpenAI/Deepgram usage.
  - `backend/services/twilioService.js` — phone normalization and bulk sending patterns.
  - `frontend/src/api/index.ts` — canonical API usage patterns, auth token usage, and `sendEmergencyWithVoice` example.

- **What not to change lightly**:
  - The shape of multipart fields for `/emergency` (`voice`, `language`, `userName`, `message`, `location`) — frontend and backend must remain compatible.
  - Database model fields used for `EmergencyAlert`/contacts — changing fields requires migration or coordinated frontend updates.

- **Small code-edit style rules for AI agents**:
  - Preserve the existing logging style and error-message patterns.
  - Add new env variables only after verifying no collision with existing names; document them in `backend/README.md`.
  - For new external calls, add retries/timeouts consistent with existing services (30s timeouts are used in STT calls).

If anything above is unclear or you want additional coverage (unit tests, CI scripts, or example `.env` files), tell me which part to expand and I will iterate.
