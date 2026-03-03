# A Thousand Lamps

> Project scaffolded on 2026-03-03. Full description to be added as the project takes shape.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React) |
| API | Node.js — hosted on Render.com |
| Database | MongoDB 7 |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Preview Deploys | Vercel |

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Git

### 1. Clone and configure environment

```bash
git clone <repo-url>
cd A_THOUSAND_LAMPS
cp .env.example .env
# Edit .env with your real values
```

### 2. Run with Docker Compose

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| App (Next.js) | http://localhost:3000 |
| API | http://localhost:4000 |
| MongoDB | mongodb://localhost:27017 |

### 3. Run locally (without Docker)

```bash
cd app
npm ci
npm run dev
```

## Project Structure

```
A_THOUSAND_LAMPS/
├── app/                  # Next.js frontend
├── api/                  # Node.js API (deployed to Render.com)
├── .github/
│   └── workflows/
│       └── ci.yml        # GitHub Actions CI/CD
├── AI/                   # AI agent management & documentation
├── docker-compose.yml
├── vercel.json
├── .env.example
├── .gitignore
└── .dockerignore
```

## AI Agent Management

All AI agent workflows, architectural decisions, and state tracking live in the `AI/` directory. See [`AI/Instruction.md`](AI/Instruction.md) to get started.

## Deployment

- **Frontend:** Vercel (auto-deploy on push to `main`).
- **API:** Render.com (triggered via deploy hook in GitHub Actions).
- **Secrets:** Store all secrets as GitHub repository secrets and Vercel/Render environment variables. Never commit `.env`.
