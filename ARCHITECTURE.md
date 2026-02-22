# Architecture

Ascension uses an ECS-inspired architecture with a single source of truth and event-driven systems.

## Core Principles

1. **Single Source of Truth** - All entity state lives in `worldStore` (Zustand)
2. **Systems Handle Logic** - React components only render, systems process game logic
3. **Event-Driven** - Decoupled communication via `EventQueue`, not direct function calls
4. **Fixed Tick Rate** - Game logic runs at 60fps independent of rendering

## Directory Structure

```
src/
├── engine/           # Core game loop and event handling
│   ├── GameLoop.ts   # Fixed timestep loop, runs systems
│   ├── EventQueue.ts # Decoupled event communication
│   └── TimeManager.ts # Tick timing
├── systems/          # Game logic (pure functions)
│   ├── AISystem.ts       # Monster behavior, aggro, wander
│   ├── CombatSystem.ts   # Damage, death, healing
│   ├── InteractionSystem.ts # Player input handling
│   ├── MovementSystem.ts # Entity movement, pathfinding
│   └── NetworkSystem.ts  # Multiplayer sync
├── store/            # State (Zustand)
│   ├── worldStore.ts     # All entities, single source of truth
│   ├── characterStore.ts # Saved characters
│   ├── combatStore.ts    # Attack cooldowns
│   ├── uiStore.ts        # UI state
│   └── sessionStore.ts   # Multiplayer session
├── entities/         # Render-only React components
│   ├── Player.tsx
│   └── Monster.tsx
├── world/            # Static world elements
│   ├── Floor.tsx         # Click-to-move ground
│   ├── Wilderness.tsx    # Trees, rocks, grass
│   ├── Town.tsx          # Buildings, fence
│   ├── Well.tsx          # Healing well
│   ├── Camera.tsx        # Follow camera
│   └── TowerEntrance.tsx # Floor transition
├── scenes/           # Scene composition
│   ├── StartScene.tsx    # Character select/create
│   └── TownScene.tsx     # Main game scene
├── services/         # External services
│   ├── PersistenceService.ts # LocalStorage save/load
│   └── NetworkService.ts     # WebRTC multiplayer
├── types/            # TypeScript definitions
│   ├── entities.ts       # Entity types, components, defaults
│   ├── events.ts         # GameEvent union type
│   └── networking.ts     # Multiplayer types
└── utils/            # Helper functions
    └── math.ts           # Distance, movement utils
```

## Data Flow

```
User Click
    │
    ▼
React Component (emits event)
    │
    ▼
EventQueue.enqueue({ type: 'MOVE_TO', ... })
    │
    ▼
GameLoop.tick() at 60fps
    │
    ├── InteractionSystem → handles APPROACH_ENTITY, sets combat.targetId
    ├── MovementSystem    → updates position in worldStore
    ├── AISystem          → monster aggro/wander, emits MOVE_TO
    ├── CombatSystem      → damage, death, healing
    │
    ▼
worldStore updated (Zustand)
    │
    ▼
React components re-render (automatic via Zustand subscriptions)
```

## worldStore - Single Source of Truth

All entity state lives here. Systems read and write directly:

```typescript
const useWorldStore = create<WorldState>((set) => ({
  entities: Record<string, Entity>,

  setEntity: (entity) =>
    set((state) => ({
      entities: { ...state.entities, [entity.id]: entity },
    })),

  updateEntity: (id, components) =>
    set((state) => ({
      entities: {
        ...state.entities,
        [id]: {
          ...state.entities[id],
          components: { ...state.entities[id].components, ...components },
        },
      },
    })),
}))
```

### Systems Usage

```typescript
// Systems read/write directly
const store = useWorldStore.getState()
const entity = store.entities[entityId]
store.updateEntity(entityId, { position: newPos })
```

### Components Usage

```typescript
// Components subscribe reactively
const entity = useWorldStore((s) => s.entities[id])
const position = entity?.components.position
```

## Entities

Entities are data containers with components:

```typescript
interface Entity {
  id: string
  type: 'player' | 'monster' | 'npc' | 'prop'
  components: {
    position?: { x: number; y: number; z: number; rotation: number }
    velocity?: { x: number; y: number; z: number }
    health?: { current: number; max: number; dead: boolean }
    combat?: { attackRange: number; attackDamage: number; attackCooldown: number }
    ai?: { behavior: 'wander' | 'aggro'; aggroRange: number }
    player?: { class: string; name: string; kills: number }
    monster?: { type: 'slime' | 'rat' | 'skeleton'; speed: number }
  }
}
```

## Events

Decoupled communication between systems:

```typescript
type GameEvent =
  | { type: 'MOVE_TO'; entityId: string; target: [number, number, number] }
  | { type: 'APPROACH_ENTITY'; entityId: string; targetId: string; stopAtRange: number }
  | { type: 'ATTACK_ENTITY'; attackerId: string; targetId: string }
  | { type: 'DAMAGE_DEALT'; sourceId: string; targetId: string; amount: number }
  | { type: 'HEAL'; entityId: string; amount: number }
  | { type: 'ENTITY_DIED'; entityId: string; killedBy?: string }
  | { type: 'INTERACT'; entityId: string; targetId: string }
```

## Systems

Systems are pure functions that process entities and events each tick:

```typescript
interface System {
  name: string
  priority: number // Lower = runs first
  update(entities: Entity[], events: GameEvent[], deltaTime: number): GameEvent[]
}
```

### Priority Order

1. **InteractionSystem** (5) - Player input, sets combat targets
2. **MovementSystem** (10) - Entity movement
3. **AISystem** (15) - Monster behavior
4. **CombatSystem** (20) - Damage and healing

### Example: MovementSystem

```typescript
class MovementSystem implements System {
  name = 'MovementSystem'
  priority = 10

  update(entities, events, deltaTime) {
    const store = useWorldStore.getState()

    // Handle MOVE_TO events
    for (const event of events) {
      if (event.type === 'MOVE_TO') {
        store.updateEntity(event.entityId, {
          velocity: { x: event.target[0], y: 0, z: event.target[2] },
        })
      }
    }

    // Move entities toward velocity target
    for (const entity of entities) {
      // ... calculate new position
      store.updateEntity(entity.id, { position: newPos })
    }

    return []
  }
}
```

## React Components

Components are render-only. They:

1. Subscribe to `worldStore` for data
2. Emit events for user actions
3. Do NOT contain game logic

```typescript
function Monster({ id }: { id: string }) {
  const entity = useWorldStore((s) => s.entities[id])
  const position = entity?.components.position

  const handleClick = () => {
    eventQueue.enqueue({
      type: 'APPROACH_ENTITY',
      entityId: playerId,
      targetId: id,
      stopAtRange: 3
    })
  }

  if (!position) return null

  return (
    <RigidBody position={[position.x, position.y, position.z]}>
      <mesh onClick={handleClick}>...</mesh>
    </RigidBody>
  )
}
```

## Game Loop

Fixed timestep at 60fps:

```typescript
class GameLoop {
  private loop() {
    timeManager.update(currentTime)

    while (timeManager.shouldTick()) {
      const deltaTime = timeManager.consumeTick()
      this.tick(deltaTime)
    }

    requestAnimationFrame(this.loop)
  }

  private tick(deltaTime: number) {
    const entities = Object.values(useWorldStore.getState().entities)
    const events = eventQueue.dequeueAll()

    for (const system of this.systems) {
      const newEvents = system.update(entities, events, deltaTime)
      eventQueue.enqueueMultiple(newEvents)
    }
  }
}
```

## Multiplayer

WebRTC peer-to-peer with Go signaling server:

```
Player A          Signaling Server (Go)          Player B
   │                    │                            │
   ├──── join room ────►│                            │
   │                    │◄──── join room ────────────┤
   │                    │                            │
   │◄──── offer ────────┼──── offer ────────────────►│
   ├──── answer ───────►│◄──── answer ───────────────┤
   │                    │                            │
   │◄══════════════ WebRTC Data Channel ════════════►│
```

Events are synced via `NetworkSystem`. See [signaling/README.md](../signaling/README.md).

## Adding a New System

1. Create `src/systems/MySystem.ts`:

```typescript
import type { System, GameEvent, Entity } from '../types'
import { useWorldStore } from '../store'

export class MySystem implements System {
  readonly name = 'MySystem'
  readonly priority = 25  // After CombatSystem

  update(entities: Entity[], events: GameEvent[], deltaTime: number): GameEvent[] {
    const emittedEvents: GameEvent[] = []
    const store = useWorldStore.getState()

    // Process events
    for (const event of events) {
      if (event.type === 'MY_EVENT') {
        // Handle event
      }
    }

    // Update entities
    for (const entity of entities) {
      // ... game logic
      store.updateEntity(entity.id, { ... })
    }

    return emittedEvents
  }
}

export const mySystem = new MySystem()
```

2. Register in `TownScene.tsx`:

```typescript
useEffect(() => {
  gameLoop.registerSystem(mySystem)
  return () => gameLoop.unregisterSystem('MySystem')
}, [])
```

## Adding a New Entity Type

1. Define components in `types/entities.ts`
2. Add defaults to `PLAYER_DEFAULTS` or `MONSTER_DEFAULTS`
3. Create render component in `entities/`
4. Spawn in scene
