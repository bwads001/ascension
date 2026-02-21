# Ascension: The Lost Archives

A tower-climbing ARPG built with React Three Fiber, Drei, and Rapier.

## Architecture

- **v1** (`src/`) - POC with logic embedded in React components
- **v2** (`src-v2/`) - Proper ECS-inspired architecture with decoupled systems

See [docs/v2-architecture.md](docs/v2-architecture.md) for the v2 design document.

## Development

```bash
npm install
npm run dev        # v1 dev server
npm run dev:v2     # v2 dev server (when available)
```

## Scripts

- `npm run dev` - Start v1 dev server
- `npm run dev:v2` - Start v2 dev server
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
