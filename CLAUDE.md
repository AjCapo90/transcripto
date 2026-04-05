# Transcripto — YouTube Transcript Extractor

## Stack
- React 19 + TypeScript + Vite
- SCSS (7-1 architecture, BEM naming, NO Tailwind)
- Motion (framer-motion) per animazioni
- Google OAuth 2.0 per YouTube subscriptions
- Vercel Serverless Functions (backend API)

## URLs

### Production
- **App:** https://transcripto-theta.vercel.app (Vercel)
- **API:** https://transcripto-theta.vercel.app/api/transcript (Vercel serverless)
- **Repo:** https://github.com/AjCapo90/transcripto (pubblico)

### Local development
- http://localhost:3000 (`npx vite --port 3000`)
- API servita da Vercel dev oppure direttamente dal path relativo `/api/transcript`

## Environment Variables

### Frontend (.env)
```
VITE_GOOGLE_CLIENT_ID=885996383441-p11cctpoiocpqutbvf77igjbchiiojri.apps.googleusercontent.com
```

> `VITE_API_URL` non è più necessario: il frontend chiama `/api/transcript` come path relativo.

## Google Cloud Console
- Progetto: "Transcripto"
- API abilitata: YouTube Data API v3
- OAuth Client ID: `885996383441-p11cctpoiocpqutbvf77igjbchiiojri.apps.googleusercontent.com`
- Authorized origins: `http://localhost:3000`, `https://transcripto-theta.vercel.app`
- Authorized redirect URIs: `http://localhost:3000`, `https://transcripto-theta.vercel.app`
- Stato: test mode (solo utenti test possono fare login)
- Per renderlo pubblico: serve verifica Google (OAuth consent screen → Publish)

## Deploy
- Tutto su **Vercel** (frontend + API serverless), monorepo
- Auto-deploy su push a `main`
- Build: `tsc -b && vite build`
- Serverless function: `api/transcript.ts`

## Architettura

```
Vercel
├── Frontend (React + TS + SCSS)
│   ├── Google OAuth (client-side)
│   └── YouTube Data API v3 (subscriptions, video list)
│
└── Serverless Function (api/transcript.ts)
    ├── POST /api/transcript
    ├── YouTube InnerTube API (player data + captions)
    └── Risposta: { video_id, title, channel, lines[], ... }
```

## Limiti noti
- Google OAuth in test mode: solo utenti aggiunti manualmente
- Batch max 5 video per evitare rate limiting

## Skill applicate
Questo progetto usa tutte le skill master:
- `/ts-master` — TypeScript rigoroso
- `/react-master` — React 19 patterns, feature-based architecture
- `/scss-master` — 7-1 architecture, BEM, @use/@forward
- `/design-master` — Dark theme, aurora orbs, 4px grid, fluid type
- `/html-master` — Semantic HTML, ARIA, accessibility

## Commit rules
- MAI includere Co-Authored-By o riferimenti a Claude/AI nei commit
