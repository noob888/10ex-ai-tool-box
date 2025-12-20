# Migration Guide: Vite/React to Next.js

This document outlines the migration from Vite/React to Next.js with PostgreSQL database integration.

## What Changed

### 1. Project Structure
- **Before**: Single-page React app with Vite
- **After**: Next.js 15 with App Router
- **New**: Database layer separated from main app

### 2. Database Integration
- **Database Layer**: Loosely coupled in `database/` directory
  - `schema.ts` - Type definitions
  - `connection.ts` - Connection pool management
  - `repositories/` - Data access layer (Repository pattern)
  - `migrations/` - SQL migration files
  - `scripts/` - Utility scripts

### 3. API Routes
All data operations now go through Next.js API routes:
- `/api/tools` - Tool operations
- `/api/users` - User operations
- `/api/prompts` - Prompt operations

### 4. Component Updates
- `App.tsx` moved to `components/App.tsx`
- Components now fetch data from API routes instead of local state
- Client-side data fetching with React hooks

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create `.env.local`:
```env
DATABASE_URL=your_db_url_here
GEMINI_API_KEY=your_api_key_here
```

### 3. Database Setup
```bash
# Run migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 4. Development
```bash
npm run dev
```

## Database Schema

The database uses PostgreSQL with the following main tables:

- **users** - User accounts and profiles
- **tools** - AI tools directory
- **prompt_templates** - Prompt library
- **user_tool_interactions** - Likes, stars, bookmarks, votes
- **user_stacks** - User-created tool stacks

## Key Features

### Loosely Coupled Architecture
- Database layer is completely separate from the app
- Repository pattern for data access
- Easy to swap database implementations
- Clear separation of concerns

### API-First Design
- All data operations go through API routes
- Client components fetch data via fetch/API calls
- Server-side validation and error handling

### Type Safety
- TypeScript throughout
- Shared types in `types.ts`
- Database types in `database/schema.ts`

## Migration Checklist

- [x] Next.js project setup
- [x] Database schema definitions
- [x] Database connection utilities
- [x] Repository pattern implementation
- [x] API routes for all operations
- [x] Component migration to Next.js
- [x] Data fetching hooks
- [x] Environment configuration
- [x] Migration scripts
- [x] Seed scripts

## Next Steps

1. **Run migrations**: `npm run db:migrate`
2. **Seed database**: `npm run db:seed` (optional)
3. **Start dev server**: `npm run dev`
4. **Test all features**: Verify tool discovery, chat, voting, etc.

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check RDS security groups allow connections
- Ensure SSL is properly configured

### API Route Errors
- Check server logs in terminal
- Verify database tables exist (run migrations)
- Check environment variables are set

### Component Errors
- Ensure all imports use correct paths
- Check that API routes are returning expected data
- Verify TypeScript types match

## Architecture Benefits

1. **Scalability**: Easy to add new features and endpoints
2. **Maintainability**: Clear separation of concerns
3. **Testability**: Repository pattern allows easy mocking
4. **Flexibility**: Can swap database or add caching layers
5. **Performance**: Server-side rendering and API optimization

