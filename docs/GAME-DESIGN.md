# Game Design Document

Ascension: The Lost Archives - A tower-climbing ARPG

## Overview

Players create a character, fight monsters in the wilderness, and climb the tower floor by floor. Each floor increases in difficulty with stronger monsters and better rewards.

## Core Loop

```
Town (hub) → Wilderness (grind) → Tower (challenge) → Town
     ↑                                  │
     └────────── Death/Complete ←───────┘
```

1. **Town** - Safe zone, heal at well, prepare for adventure
2. **Wilderness** - Hunt monsters, gain kills, level up
3. **Tower** - Procedural floors with increasing difficulty
4. **Return** - Respawn in town on death, return with loot on completion

## Controls

- **Click ground** - Move to location
- **Click monster** - Approach and attack
- **Click well** - Heal to full
- **Click tower entrance** - Enter tower (requires 5 kills)
- **ESC** - Return to start screen

## Classes

| Class   | Description            | Planned Special    |
| ------- | ---------------------- | ------------------ |
| Warrior | Balanced melee fighter | Shield bash (stun) |
| Archer  | Fast ranged attacker   | Multi-shot         |
| Mage    | Slow but powerful      | Fireball (AoE)     |

Current: All classes use same stats. Future: Class-specific abilities.

## Combat

### Player Stats

| Stat            | Value |
| --------------- | ----- |
| Health          | 150   |
| Damage          | 10    |
| Attack Range    | 3     |
| Attack Cooldown | 500ms |

### Monster Stats

| Monster  | Health | Damage | Speed | Aggro Range | Kills Needed |
| -------- | ------ | ------ | ----- | ----------- | ------------ |
| Slime    | 38     | 10     | 1     | 8           | 1            |
| Rat      | 23     | 8      | 2     | 10          | 1            |
| Skeleton | 75     | 15     | 1.5   | 12          | 2            |

### Mechanics

- **Aggro**: Monsters chase when player enters aggro range (outside town)
- **Speed boost**: Monsters move 1.3x faster when chasing
- **Town safe zone**: Monsters cannot enter town radius (12 units)
- **Cooldowns**: Attacks have cooldowns, tracked per-entity

## World Layout

```
         [Tower Entrance] (0, 38)
                │
                │ path
                │
    ┌───────────────────────────────┐
    │           TOWN                │
    │   Cottage  Tower    Shop      │  ← Safe zone (radius 12)
    │      │      │       │         │
    │      └──────┼───────┘         │
    │            Well              │
    └───────────────────────────────┘
         │                    │
    [Western Field]      [Eastern Field] ← Monsters spawn here
    (monsters)           (monsters)
```

### Zones

| Zone           | Description                | Monsters                      |
| -------------- | -------------------------- | ----------------------------- |
| Town           | Safe zone, buildings, well | None                          |
| Northern Field | Path to tower              | 3 slimes, 2 rats, 3 skeletons |
| Western Field  | Wilderness                 | 2 slimes, 1 rat, 1 skeleton   |
| Eastern Field  | Secondary hunting ground   | 2 slimes, 2 rats, 1 skeleton  |

## Progression

### Current

- Kills tracked per character
- 5 kills required to enter tower
- Tower floor 1+ not yet implemented

### Planned

```
Level 1-5:   Town + Wilderness (current content)
Level 6-10:  Tower floors 1-5
Level 11-15: Tower floors 6-10 (harder monsters)
Level 16+:   Boss floors
```

### Experience Formula (Planned)

```typescript
xpRequired = Math.floor(100 * Math.pow(1.5, level - 1))
xpFromKill = monsterHealth / 2
```

## Persistence

Characters saved to localStorage:

```typescript
interface CharacterSave {
  id: string
  name: string
  class: 'warrior' | 'archer' | 'mage'
  stats: {
    level: number
    kills: number
    highestFloor: number
    playTimeMs: number
  }
  position: { x: number; z: number }
}
```

## Multiplayer

- Up to 5 players per session
- WebRTC peer-to-peer via Go signaling server
- Host authority for combat/AI
- Client prediction for movement

See [ARCHITECTURE.md](ARCHITECTURE.md) for networking details.

## Future Features

### Short Term

- [ ] Tower floor generation (procedural rooms)
- [ ] Floor-based monster scaling
- [ ] Experience and leveling
- [ ] Class-specific abilities
- [ ] Equipment/items
- [ ] Boss fights

### Medium Term

- [ ] Skill trees
- [ ] Loot drops
- [ ] Town NPCs (merchant, blacksmith)
- [ ] Quest system
- [ ] Dungeon themes (cave, ruins, fortress)

### Long Term

- [ ] Persistent world
- [ ] Guild system
- [ ] PvP arena
- [ ] Seasonal events
- [ ] Mobile support

## Balance Notes

### Current Balance (v1)

- Player kills slime in ~4 hits
- Slime kills player in ~15 hits
- Combat feels tactical, not spammy
- Monsters wander slowly (5s interval)

### Design Philosophy

1. **Deliberate combat** - Attacks have weight, cooldowns matter
2. **Risk/reward** - Venture further for more kills, but danger increases
3. **Town as sanctuary** - Always have a safe place to retreat
4. **Progression feel** - Each kill matters, tower entry is earned

## Content Pipeline

### Adding New Monsters

1. Define in `types/entities.ts`:

```typescript
export const MONSTER_DEFAULTS = {
  goblin: {
    health: { current: 50, max: 50, dead: false },
    combat: { attackRange: 1.5, attackDamage: 12, attackCooldown: 800 },
    ai: { behavior: 'wander', aggroRange: 10 },
    monster: { type: 'goblin', speed: 2.5 },
  },
}
```

2. Create mesh in `entities/Monster.tsx`
3. Add spawn points in `scenes/TownScene.tsx`

### Adding New Zones

1. Extend `world/Floor.tsx` with new floor mesh
2. Add decorations in `world/Wilderness.tsx`
3. Add monster spawns in `scenes/TownScene.tsx`
4. Connect with paths

### Adding New Floors

1. Create `scenes/FloorScene.tsx`
2. Implement procedural generation
3. Add floor transition trigger
4. Scale monster stats by floor number
