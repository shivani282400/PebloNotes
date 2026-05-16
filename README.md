# 🚀 Peblo Notes — AI-Powered Collaborative Workspace

> Built for the Peblo Full Stack Developer Challenge  
> **Stack:** Next.js 14 · Fastify · PostgreSQL (Supabase) · Prisma · Gemini + Groq (multi-AI fallback)

---

## ✨ Features

### Core Requirements
| Feature | Status | Details |
|---|---|---|
| Authentication | ✅ | JWT-based signup/login with bcrypt, persistent sessions |
| Notes Workspace | ✅ | Create, edit, auto-save, pin, archive, color-code |
| AI Integration | ✅ | Summary, action items, suggested title, key topics, sentiment |
| Multi-AI Fallback | ✅ | Gemini (primary) → Groq/Llama (fallback) |
| Search & Filter | ✅ | Keyword search, tag filter, sort by updated/created/title |
| Public Sharing | ✅ | UUID share links, revokable, clean public page |
| Productivity Insights | ✅ | Dashboard with charts, AI stats, tag analytics, weekly activity |

### Extra Features (Bonus)
| Feature | Why It Stands Out |
|---|---|
| Markdown editor | Full `@uiw/react-md-editor` with preview toggle |
| Optimistic UI | Notes list updates instantly before API response |
| Note pinning | Pinned notes float to the top of the list |
| Color coding | Assign a color accent to each note |
| Sentiment analysis | AI detects positive/neutral/negative tone |
| AI usage logs | Tracks which provider served each request + token estimate |
| Word count | Live word count tracked on every save |
| Tag auto-color | Tags get auto-generated distinct colors |
| Docker support | Full `docker-compose.yml` for one-command local setup |
| Share revocation | Users can revoke share links at any time |

---

## 🏗 Architecture

```
peblo-notes/
├── frontend/          # Next.js 14 App Router
│   └── src/
│       ├── app/       # Pages (dashboard, notes, auth, shared)
│       ├── components/# UI components (layout, notes, ai)
│       ├── lib/       # API client (axios), utilities
│       ├── store/     # Zustand auth store
│       └── types/     # TypeScript interfaces
│
├── backend/           # Fastify REST API
│   ├── prisma/        # Schema + migrations
│   └── src/
│       ├── routes/    # auth.ts, notes.ts, shared.ts
│       ├── services/  # aiService.ts (multi-provider)
│       ├── middleware/ # JWT auth
│       └── db/        # Prisma client singleton
│
├── sample-outputs/    # API responses, schema dump
└── docker-compose.yml
```

### System Design Diagram

```
Browser (Next.js)
      │
      │  REST (JSON + JWT)
      ▼
Fastify API (Node.js)
      │
      ├──► Prisma ORM ──► PostgreSQL (Supabase)
      │
      └──► AI Service
              │
              ├──► Google Gemini 1.5 Flash  (primary)
              └──► Groq Llama-3 8B          (fallback)
```

### AI Fallback Strategy

```
User clicks "Generate Summary"
        │
        ▼
  Call Gemini API
        │
    Success? ──Yes──► Return result (provider: "gemini")
        │
       No
        │
        ▼
  Call Groq API
        │
    Success? ──Yes──► Return result (provider: "groq")
        │
       No
        │
        ▼
  Return error to user
```

### Database Schema

```
users ──────< notes >──────< note_tags >────── tags
                │
                ├──── ai_summaries (1:1)
                └──── ai_usage_logs
```

---

## 🛠 Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Modern React, SSR, file-based routing |
| State | Zustand + TanStack Query | Auth store + server state management |
| Backend | Fastify | Fast, lightweight, TypeScript-native |
| ORM | Prisma | Type-safe queries, clean migrations |
| Database | PostgreSQL (Supabase) | Relational, free hosted tier |
| AI Primary | Google Gemini 1.5 Flash | Free tier, fast, high quality |
| AI Fallback | Groq (Llama 3 8B) | Free tier, ultra-fast inference |
| Auth | JWT (@fastify/jwt) + bcryptjs | Stateless, secure |
| Styling | Tailwind CSS + CSS variables | Dark-first custom design system |
| Charts | Recharts | Lightweight, composable |
| Markdown | @uiw/react-md-editor | Full editor + preview |
| Deploy | Vercel (frontend) + Render (backend) | Free tiers |

---

## 📦 Local Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- A Supabase project (free at [supabase.com](https://supabase.com)) **OR** Docker

### Option A — Manual Setup (Recommended)

#### 1. Clone the repo
```bash
git clone https://github.com/yourusername/peblo-notes.git
cd peblo-notes
```

#### 2. Backend setup
```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
JWT_SECRET=any-32-char-secret-string-here
GEMINI_API_KEY=your-gemini-key        # console.cloud.google.com (free)
GROQ_API_KEY=your-groq-key            # console.groq.com (free)
FRONTEND_URL=http://localhost:3000
PORT=3001
```

```bash
npm install
npm run db:push       # Push schema to Supabase
npm run db:generate   # Generate Prisma client
npm run dev           # Start on :3001
```

#### 3. Frontend setup
```bash
cd ../frontend
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

```bash
npm install
npm run dev           # Start on :3000
```

#### 4. Open the app
Visit [http://localhost:3000](http://localhost:3000) → Sign up → Start writing!

---

### Option B — Docker (One Command)

```bash
# In project root, create .env
cat > .env << EOF
JWT_SECRET=super-secret-32-char-key-here
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key
EOF

docker-compose up --build
```

App will be at [http://localhost:3000](http://localhost:3000)

---

## 🔑 Getting Free API Keys

### Gemini (Primary AI)
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click **Get API key** → Create API key
3. Free tier: 15 requests/min, 1M tokens/day

### Groq (Fallback AI)
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up → API Keys → Create key
3. Free tier: generous daily limits

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login, returns JWT |
| GET | `/auth/me` | ✅ | Get current user |

### Notes
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/notes` | ✅ | List notes (search, filter, sort, paginate) |
| POST | `/notes` | ✅ | Create note |
| GET | `/notes/:id` | ✅ | Get single note |
| PATCH | `/notes/:id` | ✅ | Update note (auto-save) |
| DELETE | `/notes/:id` | ✅ | Delete note |
| POST | `/notes/:id/generate-summary` | ✅ | Trigger AI analysis |
| POST | `/notes/:id/share` | ✅ | Generate public share link |
| DELETE | `/notes/:id/share` | ✅ | Revoke share link |

### Public
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/shared/:shareId` | ❌ | View shared note (public) |

### Dashboard
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/dashboard/insights` | ✅ | Full productivity analytics |
| GET | `/dashboard/tags` | ✅ | All tags with note counts |

### Query Parameters — GET /notes
| Param | Type | Example | Description |
|---|---|---|---|
| `search` | string | `search=sprint` | Full-text search in title + content |
| `tag` | string | `tag=work` | Filter by tag name |
| `archived` | boolean | `archived=true` | Show archived notes |
| `sort` | string | `sort=created` | `updated` \| `created` \| `title` |
| `page` | number | `page=2` | Pagination |
| `limit` | number | `limit=20` | Items per page |

---

## 🧪 Testing the Application

### Manual Test Flow
1. **Auth** — Sign up with a new email → should redirect to dashboard
2. **Create Note** — Click "New Note" → add title, content, tags
3. **Auto-save** — Type in the editor → watch "Saving…" → "Saved just now"
4. **AI Summary** — Click ✨ AI button → "Generate Summary" → see summary + action items
5. **Search** — Type in the search box → results filter in real time
6. **Tag filter** — Click a tag pill → notes filter by that tag
7. **Share** — In note editor, click the 🔗 icon → share URL is copied to clipboard
8. **Public page** — Open the share URL in incognito → view note without login
9. **Archive** — Click 📦 icon → note moves to archived view
10. **Dashboard** — Visit /dashboard → see stats + charts
11. **Insights** — Visit /dashboard/insights → full analytics page

---

## 🚀 Deployment

### Frontend → Vercel
```bash
# In /frontend
vercel deploy --prod
# Set env: NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

### Backend → Render
1. New Web Service → connect GitHub repo
2. Root directory: `backend`
3. Build command: `npm install && npm run build && npx prisma generate`
4. Start command: `npm start`
5. Add all env variables from `.env.example`

---

## 📁 Sample Outputs

See [`/sample-outputs/`](./sample-outputs/) for:
- `api-responses.md` — Example JSON responses for all endpoints
- `schema.sql` — Full PostgreSQL schema with indexes and triggers

---

## 👩‍💻 About

Built by **Shivani Sharma** for the Peblo Full Stack Developer Challenge.

- GitHub: [github.com/yourusername](https://github.com/yourusername)
- Email: neoshivani05@gmail.com
