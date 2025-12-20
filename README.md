<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Tool Box - Next.js Edition

This is a Next.js application for discovering and managing AI tools, migrated from Vite/React.

## Features

- 🚀 Next.js 15 with App Router
- 🗄️ PostgreSQL database with loosely coupled schema layer
- 🔍 AI-powered chat interface (Gemini integration)
- 📊 Tool discovery, filtering, and search
- ⭐ User interactions (likes, stars, votes)
- 📚 Prompt template library
- 🛠️ Stack builder for tool management

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (AWS RDS configured)
- Gemini API key (optional, for chat features)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL=your_db_url_here
   GEMINI_API_KEY=your_api_key_here
   ```
   Get your Gemini API key from: https://aistudio.google.com/apikey

3. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

4. **Seed the database (optional):**
   ```bash
   npm run db:seed
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Architecture

The database layer is **loosely coupled** from the main application:

- **`database/schema.ts`** - Database schema definitions
- **`database/connection.ts`** - Database connection utilities
- **`database/repositories/`** - Repository pattern for data access
  - `tools.repository.ts` - Tool operations
  - `users.repository.ts` - User operations
  - `prompts.repository.ts` - Prompt template operations
  - `stacks.repository.ts` - Stack operations
- **`database/migrations/`** - SQL migration files
- **`database/scripts/`** - Utility scripts (migrate, seed)

## API Routes

- `GET /api/tools` - Get all tools (with filters)
- `GET /api/tools/[id]` - Get tool by ID
- `GET /api/tools/trending` - Get trending tools
- `POST /api/tools/vote` - Vote on a tool
- `GET /api/users` - Get user by email or ID
- `POST /api/users` - Create new user
- `POST /api/users/interactions` - Update user interactions (like/star/bookmark)
- `GET /api/prompts` - Get prompt templates

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
├── database/              # Database layer (loosely coupled)
│   ├── schema.ts          # Schema definitions
│   ├── connection.ts     # Connection utilities
│   ├── repositories/      # Data access layer
│   ├── migrations/        # SQL migrations
│   └── scripts/           # Utility scripts
├── data/                  # Static data (for seeding)
├── services/              # External services
└── types.ts              # TypeScript types
```

## Chat Feature

The chat feature allows 5 free queries before requiring signup. Make sure to set your `GEMINI_API_KEY` for the chat functionality to work properly.

## Build for Production

```bash
npm run build
npm start
```

## Database Management

- **Migrate:** `npm run db:migrate`
- **Seed:** `npm run db:seed`

## License

MIT
