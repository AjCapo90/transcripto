# Transcripto — YouTube Transcript Extractor

## Stack
- React 19 + TypeScript + Vite
- SCSS (7-1 architecture, BEM naming, NO Tailwind)
- Motion (framer-motion) per animazioni
- Google OAuth 2.0 per YouTube subscriptions

## URLs

### Production
- **Frontend:** https://transcripto-theta.vercel.app (Vercel, public)
- **Backend API:** https://transcripto-api.onrender.com (Render, free tier)
- **Frontend repo:** https://github.com/AjCapo90/transcripto (pubblico)
- **Backend repo:** https://github.com/AjCapo90/youtube-transcript (privato)

### Local development
- Frontend: http://localhost:3000 (`npx vite --port 3000`)
- Backend: http://localhost:8000 (`cd ../youtube-transcript && .venv/bin/uvicorn api:app --port 8000 --reload`)

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=885996383441-p11cctpoiocpqutbvf77igjbchiiojri.apps.googleusercontent.com
```

### Vercel (production)
```
VITE_API_URL=https://transcripto-api.onrender.com
VITE_GOOGLE_CLIENT_ID=885996383441-p11cctpoiocpqutbvf77igjbchiiojri.apps.googleusercontent.com
```

## Google Cloud Console
- Progetto: "Transcripto"
- API abilitata: YouTube Data API v3
- OAuth Client ID: `885996383441-p11cctpoiocpqutbvf77igjbchiiojri.apps.googleusercontent.com`
- Authorized origins: `http://localhost:3000`, `https://transcripto-theta.vercel.app`
- Authorized redirect URIs: `http://localhost:3000`, `https://transcripto-theta.vercel.app`
- Stato: test mode (solo utenti test possono fare login)
- Per renderlo pubblico: serve verifica Google (OAuth consent screen → Publish)

## Deploy

### Frontend (Vercel)
- Auto-deploy su push a `main`
- Nessuna azione manuale richiesta
- Build: `tsc -b && vite build`

### Backend (Render)
- Auto-deploy su push a `main` del repo youtube-transcript
- Free tier: si spegne dopo inattivita (cold start ~30-50s)
- Start command: `uvicorn api:app --host 0.0.0.0 --port $PORT`
- Build command: `pip install -r requirements.txt`
- **NOTA:** yt-dlp fallback NON funziona su Render (no Chrome cookies)
- **NOTA:** YouTube blocca IP cloud di Render quasi subito
- Per risolvere: implementare caching dei transcript o proxy residenziali

## Architettura

```
Frontend (Vercel)                Backend (Render)
React + TS + SCSS               FastAPI + Python
     |                               |
     |  POST /api/transcript          |
     |------------------------------>|
     |                               |--- youtube-transcript-api (veloce)
     |                               |--- yt-dlp fallback (se bloccato)
     |  JSON response                |
     |<------------------------------|
     |
     |  Google OAuth (client-side)
     |--- YouTube Data API v3
     |    (subscriptions, video list)
```

## Limiti noti
- YouTube blocca IP cloud (Render) dopo poche richieste
- Free tier Render: cold start 30-50s dopo inattivita
- Google OAuth in test mode: solo utenti aggiunti manualmente
- Batch max 5 video per evitare rate limiting
- yt-dlp fallback non disponibile su Render (no browser cookies)

## Skill applicate
Questo progetto usa tutte le skill master:
- `/ts-master` — TypeScript rigoroso
- `/react-master` — React 19 patterns, feature-based architecture
- `/scss-master` — 7-1 architecture, BEM, @use/@forward
- `/design-master` — Dark theme, aurora orbs, 4px grid, fluid type
- `/html-master` — Semantic HTML, ARIA, accessibility

## Commit rules
- MAI includere Co-Authored-By o riferimenti a Claude/AI nei commit
