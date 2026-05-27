# studypath

An adaptive study dashboard that passively detects each student's dominant learning style — then delivers study content tailored to how they actually learn best.

## What it does

Students study through Physics, Math, and English question sets. Behind the scenes, LearnLens tracks behavioural signals — answer accuracy, time on task, revisit rate, and self-rated confidence — across four VARK learning modes:

| Mode | Description |
|------|-------------|
| **Visual** | Diagrams, charts, spatial relationships |
| **Auditory** | Conceptual explanations, verbal logic, discussion-style |
| **Read/Write** | Text-heavy, definitions, written analysis |
| **Kinesthetic** | Step-by-step worked examples, applied problems |

After enough sessions, the adaptive engine locks in each student's best mode per subject and personalises all future content delivery accordingly — no long diagnostic test required.

## Tech Stack

- **Framework:** Next.js 15 (App Router), TypeScript strict
- **Database:** PostgreSQL + Prisma ORM
- **Styling:** Tailwind CSS v4
- **Auth:** JWT (httpOnly cookie), jose, bcryptjs
- **AI:** Anthropic API (claude-sonnet) for question explanation and style summaries
- **Validation:** Zod

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL running locally (or a hosted instance)

### Setup

```bash
git clone https://github.com/KevinSutario/learnlens
cd learnlens
npm install
cp .env.example .env.local
# fill in DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Adaptive Engine

For a new student, the app rotates through all four VARK modes randomly during the first 20 sessions.

After 20 sessions, the engine scores each mode per subject using:
