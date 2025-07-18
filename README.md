# Futuristic Tic-Tac-Toe Game

A real-time multiplayer Tic-Tac-Toe game built with React, featuring a cyberpunk-themed UI and support for both single-player (against AI) and multiplayer modes using WebSocket connections.

## Features

- 🎮 **Single Player Mode**: Play against an intelligent AI opponent using minimax algorithm
- 🌐 **Multiplayer Mode**: Real-time multiplayer with session codes
- 🎨 **Cyberpunk Theme**: Dark futuristic design with neon colors and animations
- 🔊 **Sound Effects**: Custom audio feedback for game actions
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Real-time Sync**: WebSocket-based multiplayer synchronization

## Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Wouter** for routing
- **React Query** for state management
- **WebSocket** for real-time communication

### Backend
- **Node.js** with Express
- **WebSocket Server** for real-time features
- **Drizzle ORM** for database operations
- **In-memory storage** (easily replaceable with PostgreSQL)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5000`

### Building for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
   - Install Command: `npm install`

3. Deploy!

### Environment Variables

The application uses in-memory storage by default. To use PostgreSQL, set:
- `DATABASE_URL`: PostgreSQL connection string

## Game Modes

### Single Player
- Challenge an AI opponent
- Adaptive difficulty using minimax algorithm
- Instant gameplay with no setup required

### Multiplayer
1. **Host a Session**: Create a new game and share the session code
2. **Join a Session**: Enter a session code to join an existing game
3. **Play**: Real-time synchronized gameplay

## Architecture

The application follows a monorepo structure with:
- `client/` - React frontend
- `server/` - Express backend with WebSocket
- `shared/` - Shared types and schemas

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details