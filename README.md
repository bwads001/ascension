# Ascension: The Lost Archives

A tower-climbing ARPG built with React Three Fiber, Drei, and Rapier.

## Features

- **3 Classes** - Warrior, Archer, Mage with unique skills
- **Click-to-move** controls with auto-attack toggle
- **Procedural dungeons** - Tower floors with rooms, corridors, and monsters
- **Leveling system** - XP from kills, attribute points on level up
- **Skill system** - Unlock skills at levels 2, 4, 6
- **Dynamic combat** - 180° targeting cone, auto-attack toggle
- **Floating damage numbers** - Visual combat feedback
- **Persistence** - Characters saved to localStorage
- **Multiplayer** - Up to 5 players via WebRTC

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Documentation

- [CONTROLS.md](docs/CONTROLS.md) - Player controls reference
- [GAME-DESIGN.md](docs/GAME-DESIGN.md) - Game systems and balance
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical architecture

## Gameplay

1. Create a character (Warrior, Archer, or Mage)
2. Click monsters to attack, or press '1' to toggle auto-attack
3. Kill monsters to gain XP and level up
4. Press 'C' to allocate attribute points
5. After 5 kills, click the tower entrance to enter the dungeon
6. Fight through procedurally generated floors
7. Use the exit portal to return to town

## Multiplayer

Multiplayer requires the signaling server. See [signaling/README.md](signaling/README.md) for setup.

```bash
# .env.local
VITE_SIGNALING_URL=ws://your-vps:8080/ws
```

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run lint` | Run oxlint |
| `npm run lint:fix` | Run oxlint with auto-fix |
| `npm run fmt` | Format with oxfmt |
| `npm run fmt:check` | Check formatting |
| `npm run typecheck` | Run TypeScript check |

## Tech Stack

- **3D**: React Three Fiber + Drei
- **Physics**: Rapier
- **State**: Zustand
- **Build**: Vite
- **Lint/Format**: Oxlint + Oxfmt
