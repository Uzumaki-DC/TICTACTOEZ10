# Replit.md

## Overview

This is a real-time multiplayer Tic-Tac-Toe game built with a modern full-stack architecture. The application features a cyberpunk-themed UI with support for both single-player (against AI) and multiplayer modes using WebSocket connections for real-time gameplay.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a monorepo structure with three main components:

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and production builds
- **Styling**: Tailwind CSS with custom cyberpunk theme and shadcn/ui components
- **UI Components**: Radix UI primitives with custom styling
- **State Management**: React Query for server state and local React state
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket client for multiplayer functionality

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Real-time**: WebSocket server for multiplayer game sessions
- **Development**: Hot reload with Vite middleware integration
- **Storage**: In-memory storage (designed to be easily replaced with database)

### Database Architecture
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema**: Defined in shared directory for type safety
- **Migrations**: Drizzle Kit for database schema management
- **Current Storage**: In-memory implementation for development

## Key Components

### Game Logic
- **AI Player**: Minimax algorithm with alpha-beta pruning for intelligent gameplay
- **Game Rules**: Standard Tic-Tac-Toe validation and win condition checking
- **Session Management**: Unique session codes for multiplayer games

### UI Components
- **GameBoard**: Interactive 3x3 grid with click handling
- **GameModeSelector**: Choose between single-player and multiplayer
- **SessionManager**: Create or join multiplayer sessions
- **ScoreBoard**: Track wins, losses, and draws
- **ConnectionStatus**: Real-time connection indicator

### WebSocket Communication
- **Session Management**: Join/leave game sessions
- **Game State Sync**: Real-time board updates and turn management
- **Player Actions**: Move validation and broadcasting

## Data Flow

1. **Single Player Mode**: 
   - User makes move → AI calculates response using minimax → Update game state
   
2. **Multiplayer Mode**:
   - Host creates session → Guest joins with code → WebSocket sync → Real-time moves

3. **Game State Management**:
   - Local state for immediate UI updates
   - WebSocket messages for multiplayer synchronization
   - Session persistence in storage layer

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React 18, React Query for data fetching
- **UI Libraries**: Radix UI components, Tailwind CSS, shadcn/ui
- **Utilities**: date-fns, clsx, class-variance-authority
- **Development**: Vite, TypeScript, ESLint

### Backend Dependencies
- **Server**: Express.js, WebSocket (ws)
- **Database**: Drizzle ORM, @neondatabase/serverless
- **Session**: connect-pg-simple for session storage
- **Utilities**: zod for validation, nanoid for ID generation

### Development Tools
- **Build**: esbuild for server bundling
- **Database**: Drizzle Kit for migrations
- **Development**: tsx for TypeScript execution

## Deployment Strategy

### Development
- Vite dev server with HMR for frontend
- tsx for TypeScript execution with hot reload
- WebSocket server integrated with Express

### Production
- Frontend: Vite build to static assets
- Backend: esbuild bundle for Node.js deployment
- Database: PostgreSQL with Drizzle ORM (currently using in-memory storage)
- WebSocket: Production-ready WebSocket server

### Environment Configuration
- `DATABASE_URL` for PostgreSQL connection (optional - uses in-memory storage by default)
- `NODE_ENV` for environment-specific behavior
- `PORT` for server port (automatically set by hosting platforms)
- Session management with configurable storage

### Deployment Readiness
The application is fully ready for deployment with:
- ✅ Build process configured and tested
- ✅ Production server configuration
- ✅ Vercel deployment configuration (vercel.json) - Fixed serverless function issues
- ✅ Environment variables documented
- ✅ README with deployment instructions
- ✅ CORS headers configured for production
- ✅ WebSocket server production-ready (development only)
- ✅ HTTP polling fallback for production environments
- ✅ Vercel serverless functions for API endpoints
- ✅ Responsive design for mobile devices
- ✅ Error handling and logging implemented
- ✅ Hybrid multiplayer system (WebSocket + HTTP polling)

### Recent Changes (January 2025)
- Fixed Vercel deployment configuration conflicts
- Created dedicated serverless API endpoints for production
- Implemented hybrid multiplayer system with automatic fallback
- Added comprehensive error handling and logging
- Built HTTP polling system for multiplayer in production

The application supports deployment on multiple platforms including Vercel, Netlify, Railway, and other Node.js hosting services.