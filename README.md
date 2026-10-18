# KOOPLE — AI Image Generation Platform

A full-stack AI image generation platform powered by Google Gemini. Generate stunning images from text descriptions, manage your creation history, and download your artwork.

## Features

- **Landing Page** — Professional SaaS landing with feature showcase, FAQ, and CTAs
- **Authentication** — Secure signup/login with JWT HTTP-only cookies, bcrypt password hashing
- **AI Image Generation** — Google Gemini Imagen 3 text-to-image generation
- **Aspect Ratios** — Square (1:1), Landscape (16:9), Portrait (9:16)
- **Generation History** — Browse, search, download, and delete past creations
- **Responsive Design** — Works on desktop, tablet, and mobile
- **Security** — Helmet, rate limiting, CORS, input validation, ownership checks

## Tech Stack

| Layer      | Technology                                          |
|-----------|-----------------------------------------------------|
| Frontend  | React 18, Vite, React Router v6, Lucide React       |
| Backend   | Node.js, Express, Mongoose, Zod                     |
| Database  | MongoDB                                              |
| AI        | Google Gemini (`@google/genai` — Imagen 3)           |
| Auth      | JWT (HTTP-only cookies), bcryptjs                    |
| Security  | Helmet, express-rate-limit, CORS, cookie-parser      |
| Testing   | Vitest, Supertest, MongoDB Memory Server             |

## Project Structure

```
KOOPLE/
├── client/                    # React/Vite frontend
│   ├── src/
│   │   ├── components/        # Navbar, Footer, ProtectedRoute, ImagePreview
│   │   ├── context/           # AuthContext (auth state management)
│   │   ├── hooks/             # useApi custom hook
│   │   ├── pages/             # Landing, Login, Signup, Dashboard, History, NotFound
│   │   ├── utils/             # API fetch wrapper
│   │   └── tests/             # Frontend tests
│   ├── .env.example
│   └── package.json
├── server/                    # Express backend
│   ├── src/
│   │   ├── config/            # env validation, DB connection, CORS
│   │   ├── middleware/        # auth, error handler, rate limiter, validation
│   │   ├── models/            # User, Generation (Mongoose)
│   │   ├── routes/            # auth, generate, generations, health
│   │   ├── services/          # Gemini image generation service
│   │   └── utils/             # API response helpers
│   ├── tests/                 # Backend integration tests
│   ├── .env.example
│   └── package.json
└── README.md
```

## Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** — Local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier)
- **Google Gemini API Key** — From [Google AI Studio](https://aistudio.google.com/apikey)

## Quick Start (Windows / PowerShell)

### 1. Clone and configure environment

```powershell
# Backend
cd server
copy .env.example .env
# Edit server\.env with your actual values
```

Required environment variables in `server\.env`:

| Variable        | Description                                    | Example                                  |
|----------------|------------------------------------------------|------------------------------------------|
| `PORT`         | Server port                                    | `5000`                                   |
| `MONGODB_URI`  | MongoDB connection string                      | `mongodb://localhost:27017/koople`        |
| `GEMINI_API_KEY`| Google AI Studio API key                      | `AIza...`                                |
| `JWT_SECRET`   | JWT signing secret (min 32 chars, random)      | `your-random-secret-here`                |
| `FRONTEND_URL` | Frontend origin for CORS                       | `http://localhost:5173`                  |
| `NODE_ENV`     | Environment                                    | `development`                            |

### 2. Install dependencies

```powershell
# Backend
cd server
npm.cmd install

# Frontend
cd ..\client
npm.cmd install
```

### 3. Start development servers

```powershell
# Terminal 1 — Backend (requires MongoDB running)
cd server
npm.cmd run dev

# Terminal 2 — Frontend
cd client
npm.cmd run dev
```

The frontend runs at `http://localhost:5173` and proxies `/api` requests to the backend at `http://localhost:5000`.

### 4. Run tests

```powershell
# Backend tests (uses MongoDB Memory Server — no real DB needed)
cd server
npm.cmd test

# Frontend tests
cd client
npm.cmd test
```

### 5. Production build

```powershell
# Frontend production build
cd client
npm.cmd run build
# Output in client/dist/

# Backend production start
cd server
set NODE_ENV=production
npm.cmd start
```

## API Endpoints

### Authentication

| Method | Endpoint              | Auth | Description              |
|--------|----------------------|------|--------------------------|
| POST   | `/api/auth/signup`   | No   | Register new user        |
| POST   | `/api/auth/login`    | No   | Log in                   |
| POST   | `/api/auth/logout`   | No   | Log out (clears cookie)  |
| GET    | `/api/auth/me`       | Yes  | Get current user profile |

### Image Generation

| Method | Endpoint                  | Auth | Description                    |
|--------|--------------------------|------|--------------------------------|
| POST   | `/api/generate-image`    | Yes  | Generate image from prompt     |
| GET    | `/api/generations`       | Yes  | List user's generations (paginated) |
| GET    | `/api/generations/:id`   | Yes  | Get single generation detail   |
| DELETE | `/api/generations/:id`   | Yes  | Delete a generation            |

### Health

| Method | Endpoint         | Auth | Description        |
|--------|-----------------|------|--------------------|
| GET    | `/api/health`   | No   | Server health check |

## Deployment Guide

### Recommended Free-Tier Stack

| Service        | Provider                     | Free Tier Limits                    |
|---------------|------------------------------|-------------------------------------|
| Frontend      | Vercel / Netlify             | Static hosting, generous bandwidth  |
| Backend       | Render / Railway             | 750 hrs/month (may sleep on idle)   |
| Database      | MongoDB Atlas                | 512 MB free cluster                 |
| Image AI      | Google AI Studio             | Rate-limited free tier              |

### Deployment Steps

1. **MongoDB Atlas**: Create a free M0 cluster. Add your server IP to network access. Get the connection URI.

2. **Backend (Render)**:
   - Create a Web Service connected to your repo
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node src/index.js`
   - Set environment variables: `MONGODB_URI`, `GEMINI_API_KEY`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`

3. **Frontend (Vercel)**:
   - Import repo, set root to `client`
   - Build Command: `npm run build`
   - Output: `dist`
   - Environment variable: `VITE_API_URL=https://your-backend.onrender.com`

4. **Post-deployment**: Update `FRONTEND_URL` on the backend to your Vercel domain for CORS.

### Important Notes

- **Gemini API costs**: Image generation uses the Imagen 3 model. Check [Google AI pricing](https://ai.google.dev/pricing) for current rates.
- **Cookie security**: In production, cookies require HTTPS (`Secure` flag is set automatically when `NODE_ENV=production`).
- **Image storage**: Currently stored as base64 in MongoDB. For production scale, migrate to cloud object storage (GCS/S3).

## Troubleshooting

| Issue | Solution |
|-------|---------|
| `MONGODB_URI` connection failure | Ensure MongoDB is running locally or Atlas IP whitelist includes your IP |
| Gemini API 429 errors | Quota exceeded — wait or upgrade your API plan |
| Gemini API 403 errors | Verify `GEMINI_API_KEY` is valid and Imagen API is enabled in your project |
| CORS errors | Ensure `FRONTEND_URL` matches your frontend origin exactly |
| Cookies not sent | Check `credentials: 'include'` in fetch and CORS `credentials: true` |
| `npm.ps1 cannot be loaded` | Use `npm.cmd` instead of `npm` in PowerShell |
| Build fails with missing module | Run `npm.cmd install` in the correct directory |

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT stored in HTTP-only, SameSite cookies (not localStorage)
- Rate limiting on auth (10/15min) and generation (5/min) endpoints
- Helmet security headers
- Server-side input validation with Zod
- MongoDB ownership checks on all private operations
- API keys never exposed to the browser

## Credential Rotation

If a credential is leaked:

1. **JWT_SECRET**: Change in `.env` and restart server. All existing sessions will be invalidated.
2. **GEMINI_API_KEY**: Revoke in Google AI Studio, generate new key, update `.env`.
3. **MONGODB_URI**: Change password in Atlas, update connection string in `.env`.

## License

Private project. All rights reserved.
