# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based interactive game application featuring multiple game modes including drone control, ventilation system mapping, security monitoring, and microfilm viewing. The application uses WebSocket communication for real-time updates and includes both client-side (React/Vite) and server-side (Node.js) components.

## Development Commands

### Start Development Environment
```bash
npm run dev          # Starts both client and server concurrently
npm run dev:client   # Start Vite dev server only (port 5173)
npm run dev:server   # Start Node.js WebSocket server only (port 3030)
```

### Build and Deploy
```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

### Testing
```bash
npm test            # Currently returns error - no tests configured
```

## Architecture Overview

### Client-Side Structure
- **React Router**: Uses HashRouter with route-based component loading
- **Main Routes**:
  - `/dronemap` - DroneMap component for drone control interface
  - `/ventmap` - VentMap component for ventilation system
  - `/security` - VideoScreen component with security dashboard
  - `/microfilm` - Microfilm component for document viewing

### WebSocket Communication
- **Server**: Node.js HTTP server with WebSocket (port 3030) that broadcasts messages to all connected clients
- **Client Service**: `websocketService.js` manages connection, auto-reconnection, and message handling
- **Default URL**: `ws://towerloop:1880/ws/dronemaze` (configurable per component)

### Key Components

#### DroneMap (`src/DroneMap.jsx`)
- Main game interface with ASCII drone animation
- Grid-based movement system with walls, vents, doors, and goals
- Real-time position updates via WebSocket
- Animated propeller frames and hover effects

#### VideoScreen (`src/VideoScreen.jsx`)
- 3x3 grid video display system
- Security dashboard with status monitoring
- Supports MP4 video playback with automatic looping
- Custom highlighting and transition effects

#### VentMap (`src/VentMap.jsx`)
- Ventilation system control interface
- Pressure monitoring and control

#### Microfilm (`src/Microfilm.tsx`)
- PDF document viewer using react-pdf
- File browsing and document display

### Configuration Files

#### Vite Config (`vite.config.js`)
- Environment-specific base paths and API URLs
- Proxy configuration for WebSocket connections to Node-RED (`towerloop:1880`)
- MP4 asset support for video components
- Development server on port 5173

#### Map Configuration (`src/map.js`)
- Grid layout definitions with room codes (R01-R08, H01-H05, G01)
- Feature toggles: `SHOW_VENTS`, `SHOW_GOAL`, `SHOW_DOORS`
- WebSocket URL configuration

### Asset Organization
- `/public/images/` - General images and key graphics
- `/public/music/` - Background music files (.mp3)
- `/public/sounds/` - Sound effects for game events
- `/public/security/` - Security system videos and images
- `/public/pdfs/` - Document files for microfilm viewer

### Development Notes

#### WebSocket Integration
- Components subscribe to WebSocket messages via `websocketService.subscribe()`
- Message format: `{ type: 'message_type', payload: data }`
- Automatic reconnection with 5-second retry interval
- Heartbeat ping every 30 seconds

#### Styling
- CSS-in-JS approach in VideoScreen component
- Global styles in `src/index.css`
- Component-specific styles in `src/microfilm.css`

#### Production Deployment
- Base path configured for `/game-loop/dist/` in production
- Asset paths automatically adjusted based on environment
- WebSocket URLs switch from `towerloop:1880` to relative paths in production

## External Dependencies

The application integrates with external systems:
- **Node-RED**: WebSocket endpoint at `towerloop:1880` for game state management
- **PDF.js**: For document rendering in microfilm component
- **React PDF**: PDF viewing capabilities