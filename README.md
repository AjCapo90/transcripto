# Transcripto

**Extract clean, searchable transcripts from any YouTube video.**

A modern web app with dark-themed UI, Google OAuth integration, and batch processing support.

[Live Demo](https://transcripto-theta.vercel.app)

---

## Features

- **Instant transcript extraction** — Paste a YouTube URL, get a formatted transcript with timestamps
- **Batch processing** — Queue up to 5 videos and extract them all at once
- **In-transcript search** — Real-time search with highlighted matches and keyboard navigation
- **YouTube integration** — Sign in with Google to browse your subscriptions and pick videos directly
- **Copy & download** — One-click copy to clipboard or export as `.txt`
- **Responsive design** — Works on desktop and mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript |
| Build | Vite 8 |
| Styling | SCSS (7-1 architecture, BEM) |
| Animations | Motion (Framer Motion) |
| Auth | Google OAuth 2.0 |
| API | YouTube Data API v3 |
| Hosting | Vercel (frontend + serverless API) |

## Architecture

```
Vercel
├── Frontend (React + TypeScript + SCSS)
│   ├── Google OAuth (client-side)
│   └── YouTube Data API v3 (subscriptions, videos)
│
└── Serverless Function (api/transcript.ts)
    ├── POST /api/transcript
    ├── YouTube InnerTube API (player data + captions)
    └── { title, lines[], ... }
```

## Design

- Dark theme with electric indigo accent (`#6366f1`)
- Aurora-style animated gradient orbs
- Glassmorphism effects with backdrop blur
- Fluid typography with `clamp()`
- Plus Jakarta Sans + Inter font pairing
- 4px spacing grid system
- Scroll-triggered reveal animations

## Getting Started

### Prerequisites

- Node.js 18+

### Setup

```bash
git clone https://github.com/AjCapo90/transcripto.git
cd transcripto
npm install
```

Create a `.env` file:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Project Structure

```
├── api/
│   └── transcript.ts     # Vercel serverless function
├── src/
│   ├── app/              # App root component
│   ├── components/
│   │   ├── layouts/      # Nav, Footer
│   │   └── ui/           # Button, Icons, SectionHeader
│   ├── features/
│   │   └── transcript/   # Hero, Features, Steps, Demo, Subscriptions
│   ├── hooks/            # useScrollReveal, useScrolled
│   ├── lib/              # Google Auth, YouTube API helpers
│   ├── scss/
│   │   ├── abstracts/    # Variables, mixins, functions
│   │   └── base/         # Reset, typography
│   └── types/            # Type declarations
```

## Author

**Alessandro Capozzi** — [GitHub](https://github.com/AjCapo90) · [LinkedIn](https://www.linkedin.com/in/ajcapo90)
