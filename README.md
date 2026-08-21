# AstroJournal

Gamified Daily Diary & Celestial Streak Tracker.

## Prerequisites
- Node.js
- MongoDB (Local or Atlas)

## Setup

### Server
1. Navigate to `server/`
2. Create a `.env` file based on `.env.example` (or use the one provided: `MONGODB_URI`, `JWT_SECRET`)
3. `npm install`
4. `npm run dev` (for development) or `npm run build && npm start` (for production)

### Client
1. Navigate to `client/`
2. `npm install`
3. `npm run dev`

## Features
- **Daily Journaling**: Strictly limited to 1 entry per day.
- **Star Generation**: Each entry earns you a star in your digital sky.
- **Streak Tracker**: Tracks consecutive days of journaling.
- **3D Sky Interface**: Interactive 3D visualization of your progress.
- **Archive**: View and manage previous entries.
