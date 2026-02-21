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
│   ├── CombatSystem.ts      # Range checks, damage application, cooldowns
│   ├── MovementSystem.ts    # Pathfinding, approach targets, position updates
│   ├── AISystem.ts          # Monster behavior, aggro, wandering
│   ├── InteractionSystem.ts # Click handling, hover states, selection
│   └── index.ts             # System orchestration, tick order
├── engine/
│   ├── GameLoop.ts          # Fixed tick loop, decoupled from render
│   ├── EntityManager.ts     # Entity registry, queries, lifecycle
│   ├── EventQueue.ts        # Intent queue, priority ordering
│   └── TimeManager.ts       # Delta time, fixed timestep, interpolation
├── entities/
│   ├── Player.tsx           # Rendering only, reads from stores
│   ├── Monster.tsx          # Rendering only, reads from stores
│   └── index.ts
├── store/
│   ├── worldStore.ts        # All world state: entities, positions, health
│   ├── combatStore.ts       # Combat state: cooldowns, pending attacks
│   └── uiStore.ts           # UI state: hover, selection, modals
├── bridge/
│   └── PhysicsBridge.ts     # Sync RigidBody <-> EntityManager
├── types/
│   ├── entities.ts          # Entity interfaces, component data
│   ├── events.ts            # Event/intent types
│   └── systems.ts           # System interfaces
├── utils/
│   └── math.ts              # Distance, direction, collision helpers
├── App.tsx                  # React root, scene setup
└── main.tsx                 # Entry point
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

## Migration Path

### Phase 1: Foundation

- [ ] Scaffold `src-v2/` directory structure
- [ ] Implement `EntityManager`
- [ ] Implement `EventQueue`
- [ ] Implement `GameLoop` with fixed timestep
- [ ] Implement `PhysicsBridge`
- [ ] Create entity type definitions

### Phase 2: Movement

- [ ] Implement `MovementSystem`
- [ ] Create `Player` entity (render-only)
- [ ] Create `Floor` with click handling
- [ ] Wire up click-to-move through event queue
- [ ] Verify player moves correctly

### Phase 3: AI

- [ ] Implement `AISystem`
- [ ] Create `Monster` entity (render-only)
- [ ] Wire up wander behavior
- [ ] Wire up aggro behavior
- [ ] Verify monsters move and chase

### Phase 4: Combat

- [ ] Implement `CombatSystem`
- [ ] Implement `InteractionSystem` for attack intents
- [ ] Wire up click-to-attack
- [ ] Wire up monster attacks on player
- [ ] Implement death/respawn
- [ ] Verify combat feels responsive

### Phase 5: World

- [ ] Port Town, Wilderness, TowerEntrance
- [ ] Implement healing well interaction
- [ ] Implement tower entry

### Phase 6: Polish & Cutover

- [ ] Feature parity check vs v1
- [ ] Performance profiling
- [ ] Move `src-v2/` → `src/`
- [ ] Archive v1 as `src-v1-archive/`

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

## Open Questions

- **Persistence**: Should we plan for save/load now or later?
- **Multiplayer**: Any networking considerations in the event queue design?
- **Scene management**: How do we handle tower floors (scene transitions vs same scene)?

## References

- [Entity Component System](https://github.com/SanderMertens/ecs-faq)
- [Game Programming Patterns - Game Loop](https://gameprogrammingpatterns.com/game-loop.html)
- [Overwatch ECS Architecture (GDC Talk)](https://www.youtube.com/watch?v=W3aieHjyNvw)
