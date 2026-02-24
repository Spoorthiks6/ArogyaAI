(Node + Express + MongoDB)

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





