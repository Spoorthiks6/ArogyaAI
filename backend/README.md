# Hackshethra Backend (Node + Express + MongoDB)

## What this contains
- Express server with JWT auth
- Mongoose models: User, Profile, EmergencyContact
- Routes: /auth (register/login), /profile (GET/PUT), /contacts (GET/POST/PUT/DELETE)
- Middleware: auth (JWT)

## Quick start (locally)
1. Install Node 18+ and MongoDB (or use MongoDB Atlas).
2. Extract this folder and open terminal here.
3. Copy `.env.example` to `.env` and set `MONGO_URI` and `JWT_SECRET`.
4. Install dependencies:
   ```
   npm install
   ```
5. Start server:
   ```
   npm run dev
   ```
   or
   ```
   npm start
   ```
6. The API will run at `http://localhost:4000` by default.

## Endpoints
- POST /auth/register  -> { email, password }
- POST /auth/login     -> { email, password }  => returns { token, userId }
- GET  /profile        -> Authorization: Bearer <token>
- PUT  /profile        -> Authorization: Bearer <token>, body: profile fields
- GET  /contacts       -> Authorization: Bearer <token>
- POST /contacts       -> Authorization: Bearer <token>, body: contact
- PUT  /contacts       -> Authorization: Bearer <token>, body: contact (include id)
- DELETE /contacts     -> Authorization: Bearer <token>, body: { id }



## Emergency route (SMS + voice upload)
POST /emergency (authenticated)
- Headers: Authorization: Bearer <token>
- Content-Type: multipart/form-data (if uploading voice) or application/json
- Fields:
  - message (string) — optional custom message
  - location (string) — optional location text or URL
  - voice (file) — optional audio file (field name 'voice')
- Response: { ok: true, sent: [ ...results ], voice: { filename, path } }

Environment variables required for SMS:
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_PHONE_NUMBER
