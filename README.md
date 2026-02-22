# Ascension: The Lost Archives

A tower-climbing ARPG built with React Three Fiber, Drei, and Rapier.

## Architecture

- **Current** (`src/`) - ECS-inspired architecture with decoupled systems
- **Archive** (`src-v1-archive/`) - Original POC (preserved for reference)

See [docs/v2-architecture.md](docs/v2-architecture.md) for the architecture design document.

## Features

- Character creation with 3 classes (warrior, archer, mage)
- Click-to-move controls
- Town safe zone with buildings and healing well
- Wilderness with monsters (slime, rat, skeleton)
- Combat with cooldowns and damage
- Death and respawn system
- Tower entrance (requires 5 kills)
- Persistence via localStorage
- Multiplayer support (up to 5 players)

## Development

```bash
npm install
npm run dev
```

### Multiplayer

Multiplayer requires the signaling server. See [signaling/README.md](signaling/README.md) for setup.

Set the signaling URL:

```bash
# .env.local
VITE_SIGNALING_URL=ws://your-vps:8080/ws
```

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run lint` - Run oxlint
- `npm run lint:fix` - Run oxlint with auto-fix
- `npm run fmt` - Format with oxfmt
- `npm run fmt:check` - Check formatting
- `npm run typecheck` - Run TypeScript check

## Tech Stack

- React Three Fiber + Drei (3D)
- Rapier (Physics)
- Zustand (State)
- Oxlint + Oxfmt (Linting/Formatting)
- Vite (Build)
