# Ascension v2 Architecture

## Overview

v1 served as a POC proving the concept works. v2 restructures the codebase into a proper game architecture with decoupled systems, testable logic, and clear separation of concerns.

## Goals

- **Decouple rendering from game logic** - React components only render, systems handle logic
- **Single source of truth** - Entity state lives in stores, not scattered in component refs
- **Testable systems** - Pure functions with clear inputs/outputs, no React dependencies
- **Fixed tick rate** - Game logic runs at consistent intervals, independent of frame rate
- **Event-driven** - Decoupled communication via intent queue, not direct function calls

## Directory Structure

```
src-v2/
├── systems/
│   ├── CombatSystem.ts
│   ├── MovementSystem.ts
│   ├── AISystem.ts
│   ├── InteractionSystem.ts
│   ├── NetworkSystem.ts        # Sync events, handle latency
│   └── SceneSystem.ts          # Floor loading/unloading
├── engine/
│   ├── GameLoop.ts
│   ├── EntityManager.ts
│   ├── EventQueue.ts
│   ├── TimeManager.ts
│   └── SceneManager.ts         # Floor/scene lifecycle
├── services/
│   ├── PersistenceService.ts   # Save/load characters
│   └── NetworkService.ts       # Room management, events
├── scenes/
│   ├── StartScene.tsx          # Character select/create
│   ├── TownScene.tsx           # Safe zone, hub
│   └── FloorScene.tsx          # Dungeon floor template
├── entities/
│   ├── Player.tsx
│   ├── Monster.tsx
│   └── index.ts
├── store/
│   ├── worldStore.ts
│   ├── combatStore.ts
│   ├── uiStore.ts
│   ├── sessionStore.ts         # Current session, room info
│   └── characterStore.ts       # Saved characters
├── bridge/
│   └── PhysicsBridge.ts
├── types/
│   ├── entities.ts
│   ├── events.ts
│   ├── systems.ts
│   ├── networking.ts           # Network types
│   └── persistence.ts          # Save data types
├── utils/
│   └── math.ts
├── App.tsx
└── main.tsx
```

## Core Concepts

### Entities

Entities are data containers. They have:

- `id: string` - Unique identifier
- `type: EntityType` - 'player' | 'monster' | 'npc' | 'prop'
- `components: ComponentMap` - Attached components (position, health, ai, etc.)

```typescript
interface Entity {
  id: string
  type: EntityType
  components: {
    position?: PositionComponent
    health?: HealthComponent
    combat?: CombatComponent
    ai?: AIComponent
    render?: RenderComponent
  }
}

interface PositionComponent {
  x: number
  y: number
  z: number
  rotation: number
}

interface HealthComponent {
  current: number
  max: number
  dead: boolean
}

interface CombatComponent {
  attackRange: number
  attackDamage: number
  attackCooldown: number
  lastAttackTime: number
  targetId: string | null
}

interface AIComponent {
  behavior: 'idle' | 'wander' | 'aggro' | 'flee'
  aggroRange: number
  homePosition: [number, number, number]
}
```

### Events/Intents

User actions and game events are queued as intents:

```typescript
type GameEvent =
  | { type: 'MOVE_TO'; entityId: string; target: [number, number, number] }
  | { type: 'ATTACK_ENTITY'; attackerId: string; targetId: string }
  | { type: 'APPROACH_ENTITY'; entityId: string; targetId: string }
  | { type: 'ENTITY_DIED'; entityId: string }
  | { type: 'ENTITY_SPAWNED'; entity: Entity }
  | { type: 'INTERACT'; entityId: string; targetId: string }
```

### Systems

Systems are pure functions that process entities and events:

```typescript
interface System {
  name: string
  priority: number // Lower = runs first
  update(entities: Entity[], events: GameEvent[], delta: number): GameEvent[]
}
```

**Tick order:**

1. `InteractionSystem` - Process clicks, emit MOVE_TO/ATTACK_ENTITY intents
2. `MovementSystem` - Move entities, emit ARRIVED events
3. `AISystem` - Update monster behavior, emit ATTACK_ENTITY intents
4. `CombatSystem` - Process attacks, emit ENTITY_DIED events

### EntityManager

```typescript
interface EntityManager {
  create(type: EntityType, components: Partial<ComponentMap>): Entity
  get(id: string): Entity | undefined
  query(predicate: (e: Entity) => boolean): Entity[]
  update(id: string, components: Partial<ComponentMap>): void
  destroy(id: string): void
}
```

### PhysicsBridge

Syncs Rapier RigidBody positions with EntityManager:

```typescript
interface PhysicsBridge {
  register(id: string, body: RapierRigidBody): void
  unregister(id: string): void
  syncToEngine(): void // RigidBody -> EntityManager
  syncToPhysics(): void // EntityManager -> RigidBody
}
```

## Data Flow

```
User Click
    │
    ▼
React Component (emits intent)
    │
    ▼
EventQueue.enqueue({ type: 'ATTACK_ENTITY', ... })
    │
    ▼
GameLoop.tick()
    │
    ├── InteractionSystem.update() → emits MOVE_TO/ATTACK_ENTITY
    ├── MovementSystem.update()    → updates positions, emits ARRIVED
    ├── AISystem.update()          → emits ATTACK_ENTITY for aggro'd monsters
    ├── CombatSystem.update()      → applies damage, emits ENTITY_DIED
    │
    ▼
Stores updated (worldStore, combatStore)
    │
    ▼
React components re-render (via Zustand subscriptions)
```

## Entity Contract (React Components)

Entities are rendering-only. They:

1. **Subscribe to stores** - Position, health, state
2. **Emit intents** - onClick → queue event
3. **Forward refs** - Register RigidBody with PhysicsBridge

```typescript
function Player({ id }: { id: string }) {
  const ref = useRef<RapierRigidBody>(null)
  const position = useWorldStore(s => s.entities[id]?.components.position)
  const enqueue = useEventQueue(s => s.enqueue)

  // Register physics body
  useEffect(() => {
    if (ref.current) {
      physicsBridge.register(id, ref.current)
      return () => physicsBridge.unregister(id)
    }
  }, [id])

  // Render
  return (
    <RigidBody ref={ref} position={[position.x, position.y, position.z]}>
      {/* mesh */}
    </RigidBody>
  )
}
```

## Persistence

**Yes - Character save/load is required.**

### Character System

- **Start Screen** - Presented on game launch
  - Character selection from saved characters
  - Character creation (pick class: warrior/archer/mage)
  - Character deletion (with confirmation)
  - "New Game" option to create additional characters

### Character Data

```typescript
interface CharacterSave {
  id: string
  name: string
  class: 'warrior' | 'archer' | 'mage'
  createdAt: number
  lastPlayedAt: number
  stats: {
    level: number
    kills: number
    highestFloor: number
    playTimeMs: number
  }
  position: {
    floor: number
    x: number
    z: number
  }
}

interface SaveData {
  version: number
  characters: CharacterSave[]
  settings: GameSettings
}
```

### Persistence Layer

```typescript
interface PersistenceService {
  load(): Promise<SaveData>
  save(data: SaveData): Promise<void>
  deleteCharacter(id: string): Promise<void>
}
```

**Initial implementation**: `localStorage` with JSON serialization
**Future**: Backend API with cloud sync

### Scene Flow

```
Start Screen
    │
    ├── New Character → Class Selection → Spawn in Town
    │
    └── Select Character → Load Position → Resume
```

## Multiplayer

**Yes - Up to 5 players per game session.**

### Networking Architecture

```typescript
// Room/session based networking
interface GameRoom {
  id: string
  hostId: string
  players: PlayerConnection[]
  state: RoomState
  floor: number
}

interface PlayerConnection {
  id: string
  characterId: string
  isHost: boolean
  latency: number
}
```

### Networked Event System

Events must be serializable and authoritative:

```typescript
type NetworkedEvent =
  | { type: 'PLAYER_JOINED'; playerId: string; character: CharacterSave }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'MOVE_TO'; entityId: string; target: [number, number, number]; timestamp: number }
  | { type: 'ATTACK_ENTITY'; attackerId: string; targetId: string; timestamp: number }
  | { type: 'ENTITY_DAMAGED'; entityId: string; amount: number; sourceId: string }
  | { type: 'FLOOR_TRANSITION'; floor: number; players: string[] }
```

### Authority Model

- **Host authority**: Host's game loop is authoritative for combat/AI
- **Client prediction**: Movement is predicted locally, reconciled with host
- **State sync**: Full state sync on join, delta sync during play

### Scene Management (Tower Floors)

Each floor is a separate scene. Transition triggers:

- All living players enter tower door
- Last player on floor leaves (cleanup)

```typescript
interface SceneManager {
  currentFloor: number
  loadFloor(floor: number, players: PlayerEntity[]): Promise<void>
  unloadFloor(): void
  getFloorConfig(floor: number): FloorConfig
}

interface FloorConfig {
  theme: 'dungeon' | 'cave' | 'ruins' | 'boss'
  monsterTypes: MonsterType[]
  monsterCount: number
  hasBoss: boolean
  size: { width: number; depth: number }
}
```

### Networking Service

```typescript
interface NetworkService {
  createRoom(): Promise<GameRoom>
  joinRoom(roomId: string): Promise<GameRoom>
  leaveRoom(): void
  broadcast(event: NetworkedEvent): void
  onEvent(callback: (event: NetworkedEvent) => void): () => void
}
```

**Initial implementation**: WebRTC peer-to-peer with host as authority
**Future**: Dedicated server with WebSocket

### Multiplayer Implications

1. **Entity IDs** - Must be globally unique, include player prefix
2. **Event timestamps** - Required for lag compensation
3. **Deterministic AI** - Monster behavior must be deterministic or host-controlled
4. **State interpolation** - Smooth other players' movement
5. **Late join** - Full state snapshot for joining players

## Migration Path

### Phase 1: Foundation

- [x] Scaffold `src-v2/` directory structure
- [x] Implement `EntityManager`
- [x] Implement `EventQueue`
- [x] Implement `GameLoop` with fixed timestep
- [x] Implement `PhysicsBridge`
- [x] Create entity type definitions

### Phase 2: Persistence & Characters

- [x] Implement `PersistenceService` (localStorage)
- [x] Create `characterStore`
- [x] Create `StartScene` with character select/create/delete UI
- [ ] Wire character selection → game entry
- [ ] Verify save/load works

### Phase 3: Movement

- [x] Implement `MovementSystem`
- [x] Create `Player` entity (render-only)
- [x] Create `Floor` with click handling
- [x] Wire up click-to-move through event queue
- [ ] Verify player moves correctly

### Phase 4: AI

- [x] Implement `AISystem`
- [x] Create `Monster` entity (render-only)
- [x] Wire up wander behavior
- [x] Wire up aggro behavior
- [ ] Verify monsters move and chase

### Phase 5: Combat

- [x] Implement `CombatSystem`
- [x] Implement `InteractionSystem` for attack intents
- [x] Wire up click-to-attack
- [x] Wire up monster attacks on player
- [x] Implement death/respawn
- [ ] Verify combat feels responsive

### Phase 6: World & Scenes

- [ ] Implement `SceneManager` and `SceneSystem`
- [x] Port Town scene (buildings, fence)
- [x] Port Wilderness scene (grass, rocks, trees)
- [ ] Create Floor scene template
- [x] Implement tower entry (floor transition)
- [x] Implement healing well interaction

### Phase 7: Networking (Multiplayer)

- [x] Implement `NetworkService` (WebSocket + WebRTC)
- [x] Implement `NetworkSystem`
- [x] Add room create/join to StartScene
- [x] Go signaling server (`signaling/`)
- [ ] Implement host authority for combat/AI
- [ ] Implement client prediction for movement
- [ ] Implement state interpolation
- [ ] Test 2+ player connectivity

### Phase 8: Polish & Cutover

- [x] Feature parity check vs v1
- [ ] Performance profiling
- [ ] Multiplayer stress test (5 players)
- [x] Move `src-v2/` → `src/`
- [x] Archive v1 as `src-v1-archive/`

## Testing Strategy

Systems are pure functions - easy to unit test:

```typescript
describe('CombatSystem', () => {
  it('applies damage when in range and off cooldown', () => {
    const attacker = createEntity({ position: { x: 0, y: 0, z: 0 }, combat: { attackRange: 3 } })
    const target = createEntity({
      position: { x: 2, y: 0, z: 0 },
      health: { current: 100, max: 100 },
    })
    const events = [{ type: 'ATTACK_ENTITY', attackerId: attacker.id, targetId: target.id }]

    const emitted = combatSystem.update([attacker, target], events, 16)

    expect(emitted).toContainEqual({ type: 'DAMAGE_APPLIED', targetId: target.id, amount: 25 })
    expect(target.components.health.current).toBe(75)
  })
})
```

## References

- [Entity Component System](https://github.com/SanderMertens/ecs-faq)
- [Game Programming Patterns - Game Loop](https://gameprogrammingpatterns.com/game-loop.html)
- [Overwatch ECS Architecture (GDC Talk)](https://www.youtube.com/watch?v=W3aieHjyNvw)
