# PulseChat Agent Instructions

## Project Shape
- This repo has two independent apps: [server](./server) for the Node/Express API and Socket.io server, and [pulsechat-client](./pulsechat-client) for the React/Vite frontend.
- Keep changes localized to the owning layer. For auth, messaging, and presence flows, check [server/server.js](./server/server.js), [server/routes](./server/routes), [server/controllers](./server/controllers), [pulsechat-client/src/context/AuthContext.jsx](./pulsechat-client/src/context/AuthContext.jsx), and [pulsechat-client/src/hooks/useSocket.js](./pulsechat-client/src/hooks/useSocket.js).
- Treat [README.md](./README.md), [SECURITY.md](./SECURITY.md), [DEPLOYMENT.md](./DEPLOYMENT.md), and [LAUNCH_GUIDE.md](./LAUNCH_GUIDE.md) as the source of truth for setup and deployment details; do not duplicate them here.

## Run and Verify
- Backend: `cd server && npm install`, `npm run dev` for local work, `npm start` for production-style runs.
- Frontend: `cd pulsechat-client && npm install`, `npm run dev` for local work, `npm run build` before release checks, `npm run lint` when touching client code.
- There are no committed test scripts in either package today, so prefer targeted runtime checks or lint/build verification over inventing test commands.

## Code Conventions
- The backend is ESM-based and uses Express middleware, Zod validation helpers, Winston logging, Helmet, and rate limiting; keep those concerns in their existing modules under [server/utils](./server/utils) and [server/middleware](./server/middleware).
- The frontend uses React Router, a single auth context, and a singleton Socket.io client; preserve those boundaries rather than introducing parallel state or socket instances.
- Environment-sensitive values come from `server/.env` and client Vite env vars such as `VITE_API_URL`; avoid hard-coding URLs, secrets, or credentials.
- Follow the repository's existing formatting in the touched file. Keep edits minimal and avoid broad refactors unless they are necessary for the requested change.

## Practical Pitfalls
- When changing auth, remember the client stores `user` and `token` in localStorage and redirects based on auth state.
- When changing socket behavior, keep the shared socket instance in [pulsechat-client/src/hooks/useSocket.js](./pulsechat-client/src/hooks/useSocket.js) in mind so you do not create duplicate connections.
- When changing server startup or middleware order, preserve the current sequence in [server/server.js](./server/server.js): env validation, DB connection, security middleware, CORS, JSON parsing, rate limiting, routes, then error handling.
