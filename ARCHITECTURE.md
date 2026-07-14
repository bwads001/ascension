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
│   ├── InteractionSystem.ts # Auto-attack, player input
│   ├── MovementSystem.ts # Entity movement, rotation
│   ├── LevelingSystem.ts # XP, level ups, skill unlocks
│   ├── RegenSystem.ts    # HP regeneration from stamina
│   ├── SkillSystem.ts    # Skill execution, AoE, buffs
│   └── NetworkSystem.ts  # Multiplayer sync
├── store/            # State (Zustand)
│   ├── worldStore.ts     # All entities, floor, room bounds
│   ├── characterStore.ts # Saved characters
│   ├── combatStore.ts    # Attack cooldowns
│   ├── skillStore.ts     # Skill cooldowns, active skill
│   ├── damageNumberStore.ts # Floating damage numbers
│   ├── uiStore.ts        # UI state
│   └── sessionStore.ts   # Multiplayer session
├── entities/         # Render-only React components
│   ├── Player.tsx        # Character model, rotation
│   └── Monster.tsx       # Monster models by type
├── effects/          # Visual effects
│   └── DamageNumbers.tsx # Floating damage text
├── world/            # Static world elements
│   ├── Floor.tsx         # Click-to-move ground (town)
│   ├── FloorDungeon.tsx  # Procedural rooms, corridors, torches
│   ├── Wilderness.tsx    # Trees, rocks, grass
│   ├── Town.tsx          # Buildings, fence
│   ├── Well.tsx          # Healing well
│   ├── Camera.tsx        # Follow camera
│   └── TowerEntrance.tsx # Floor transition
├── scenes/           # Scene composition
│   ├── StartScene.tsx    # Character select/create
│   ├── TownScene.tsx     # Town gameplay
│   └── FloorScene.tsx    # Dungeon gameplay
├── ui/               # UI overlays
│   ├── PlayerHUD.tsx     # HP/XP bars, level
│   ├── SkillBar.tsx      # Skills 1-0 with cooldowns
│   ├── CharacterScreen.tsx # Attributes, stats, skills
│   ├── SkillUnlockNotification.tsx # Toast on unlock
│   └── DeathScreen.tsx   # Respawn UI
├── services/         # External services
│   ├── PersistenceService.ts # LocalStorage save/load
│   └── NetworkService.ts     # WebRTC multiplayer
├── types/            # TypeScript definitions
│   ├── entities.ts       # Entity types, components, defaults
│   ├── events.ts         # GameEvent union type
│   ├── skills.ts         # Skill definitions, unlock levels
│   └── networking.ts     # Multiplayer types
└── utils/            # Helper functions
    ├── math.ts           # Distance, movement, cone checks
    └── targeting.ts      # Find targets in range/cone
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
    ├── InteractionSystem → auto-attack in front cone
    ├── MovementSystem    → updates position, rotation
    ├── AISystem          → monster aggro/wander
    ├── CombatSystem      → damage, death
    ├── LevelingSystem    → XP grants, level ups
    ├── SkillSystem       → skill execution
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
  floor: number,
  roomBounds: RoomBounds[],

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
    combat?: {
      attackRange: number
      attackDamage: number
      attackCooldown: number
      lastAttackTime: number
      targetId: string | null
      autoAttackEnabled: boolean
    }
    ai?: {
      behavior: 'wander' | 'aggro'
      aggroRange: number
      homePosition: [number, number, number]
    }
    player?: {
      class: 'warrior' | 'archer' | 'mage'
      name: string
      kills: number
      level: number
      xp: number
      xpToNextLevel: number
      attributes: { strength: number; agility: number; intellect: number; stamina: number }
      unspentPoints: number
    }
    monster?: { type: 'slime' | 'rat' | 'skeleton'; speed: number }
  }
}
```

## Events

Decoupled communication between systems:

```typescript
type GameEvent =
  | { type: 'MOVE_TO'; entityId: string; target: [number, number, number] }
  | {
      type: 'APPROACH_INTERACT'
      entityId: string
      interactType: 'heal' | 'tower' | 'portal'
      targetPosition: [number, number, number]
    }
  | { type: 'ATTACK_ENTITY'; attackerId: string; targetId: string }
  | { type: 'USE_SKILL'; entityId: string; skillId: string; targetId: string }
  | { type: 'SKILL_UNLOCKED'; entityId: string; skillId: string }
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

1. **InteractionSystem** (5) - Auto-attack targeting, player input
2. **MovementSystem** (10) - Entity movement, rotation updates
3. **AISystem** (15) - Monster behavior, stuck detection
4. **SkillSystem** (18) - Skill execution
5. **CombatSystem** (20) - Damage and healing
6. **LevelingSystem** (25) - XP grants, level ups, skill unlock events
7. **RegenSystem** (30) - HP regeneration

## Targeting System

Dynamic targeting based on character facing:

```typescript
// Find nearest enemy in front cone (180°)
const target = findTargetInFront(player, entities, range, Math.PI)

// Cone check uses entity rotation
function isInFrontCone(observerPos, observerRotation, targetPos, coneAngle)
```

**Auto-attack behavior:**

- Enabled via toggle (press '1' or click monster)
- Targets nearest enemy in 180° front cone within 3.5 units
- Disabled when clicking floor/interactables

## Skills

Skills defined in `types/skills.ts`:

```typescript
interface SkillDefinition {
  id: string
  name: string
  description: string
  icon: string // emoji
  cooldown: number
  range: number
  targetType: 'self' | 'enemy' | 'area'
  classes: PlayerClass[]
  unlockLevel: number
  damageMultiplier?: number
  areaRadius?: number
}
```

**Unlock schedule:**

- Level 1: Basic Attack
- Level 2: Primary skill
- Level 4: Secondary skill
- Level 6: Utility skill

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
    // Enable auto-attack and move toward monster
    store.updateEntity(playerId, {
      combat: { ...combat, autoAttackEnabled: true }
    })
    eventQueue.enqueue({
      type: 'MOVE_TO',
      entityId: playerId,
      target: [position.x, 0, position.z],
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
      // Emit to UI listeners AND keep for next tick
      for (const event of newEvents) {
        eventQueue.emit(event)
      }
      eventQueue.enqueueMultiple(newEvents)
    }
  }
}
```

## Dungeon Generation

Procedural rooms in `FloorDungeon.tsx`:

- Rooms: 5 + floor \* 2 rooms per floor
- Corridors: Connect sequential rooms
- Walls: With doorways at connections
- Lighting: Torches in corners and corridors
- Collision: Software-based room bounds check

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

    for (const event of events) {
      if (event.type === 'MY_EVENT') {
        // Handle event
      }
    }

    for (const entity of entities) {
      // ... game logic
      store.updateEntity(entity.id, { ... })
    }

    return emittedEvents
  }
}

export const mySystem = new MySystem()
```

2. Register in scene:

```typescript
useEffect(() => {
  gameLoop.registerSystem(mySystem)
  return () => gameLoop.unregisterSystem('MySystem')
}, [])
```

## Adding a New Skill

1. Define in `types/skills.ts`:

```typescript
my_skill: {
  id: 'my_skill',
  name: 'My Skill',
  description: 'Does something cool',
  icon: '✨',
  cooldown: 5000,
  range: 5,
  targetType: 'enemy',
  classes: ['warrior'],
  unlockLevel: 3,
  damageMultiplier: 1.5,
},
```

2. Handle in `systems/SkillSystem.ts` if special logic needed

## Adding a New Monster

1. Define in `types/entities.ts`:

```typescript
goblin: {
  health: { current: 50, max: 50, dead: false },
  combat: {
    attackRange: 1.5,
    attackDamage: 12,
    attackCooldown: 800,
    lastAttackTime: 0,
    targetId: null,
    autoAttackEnabled: false,
  },
  ai: { behavior: 'wander', aggroRange: 10, homePosition: [0,0,0], wanderTarget: [0,0,0], lastWanderTime: 0, targetId: null },
  monster: { type: 'goblin', speed: 2.5 },
},
```

2. Create mesh in `entities/Monster.tsx`
3. Add spawn points in scene
