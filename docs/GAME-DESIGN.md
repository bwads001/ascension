# Game Design Document

Ascension: The Lost Archives - A tower-climbing ARPG

## Overview

Players create a character, fight monsters in town wilderness or tower dungeons, level up, unlock skills, and climb the tower floor by floor. Each floor increases in difficulty with stronger monsters.

## Core Loop

```
Town (hub) → Kill Monsters → Level Up → Tower (challenge) → Return to Town
     ↑                                         │
     └────────── Death/Complete ←─────────────┘
```

1. **Town** - Safe zone, heal at well, prepare for adventure
2. **Wilderness** - Hunt monsters around town, gain XP
3. **Tower** - Procedural dungeon floors with rooms, corridors, monsters
4. **Return** - Exit portal returns to town

## Controls

| Action | Input |
| ------ | ----- |
| Move | Click on ground/floor |
| Attack monster | Click monster (enables auto-attack, moves to range) |
| Toggle auto-attack | Press `1` |
| Use skills | Press `2-0` |
| Character screen | Press `C` |
| Heal | Click well |
| Enter tower | Click tower entrance (requires 5 kills) |
| Exit dungeon | Click exit portal |

See [CONTROLS.md](CONTROLS.md) for full reference.

## Classes

| Class | Primary Stat | Specialization |
| ----- | ------------ | -------------- |
| Warrior | Strength | Melee damage, AoE, buffs |
| Archer | Agility | Ranged damage, multi-target, evasion |
| Mage | Intellect | Spell damage, AoE, healing |

## Combat

### Auto-Attack System

- **Toggle**: Press '1' or click monster to enable
- **Range**: 3.5 units
- **Cone**: 180° front arc
- **Behavior**: Automatically attacks nearest enemy in cone when cooldown ready
- **Disable**: Click floor or interactable

### Attack Cooldowns

| Entity | Cooldown |
| ------ | -------- |
| Player | 500ms |
| Slime | 1000ms |
| Rat | 800ms |
| Skeleton | 1200ms |

### Damage Calculation

```typescript
baseDamage = 8 + (primaryStat * 2)
finalDamage = baseDamage * skillDamageMultiplier
```

### Floating Damage Numbers

- Yellow: Damage to monsters
- Red: Damage to player
- Size scales with damage amount

## Progression

### Experience

| Monster | XP |
| ------- | -- |
| Slime | 15 |
| Rat | 12 |
| Skeleton | 30 |

### Level Up

- XP threshold: `floor(150 * 1.5^(level-1))`
- Grants: +3 attribute points
- Skill unlocks at levels 2, 4, 6

### Skills

**Warrior:**
| Level | Skill | Type | Cooldown |
| ----- | ----- | ---- | -------- |
| 1 | Attack | Enemy | 0 |
| 2 | Power Strike | Enemy | 5s |
| 4 | Whirlwind | AoE 4u | 8s |
| 6 | Battle Cry | Self | 20s |

**Archer:**
| Level | Skill | Type | Cooldown |
| ----- | ----- | ---- | -------- |
| 1 | Attack | Enemy | 0 |
| 2 | Aimed Shot | Enemy | 4s |
| 4 | Multi Shot | AoE 8u | 7s |
| 6 | Evasion | Self | 15s |

**Mage:**
| Level | Skill | Type | Cooldown |
| ----- | ----- | ---- | -------- |
| 1 | Attack | Enemy | 0 |
| 2 | Fireball | Enemy | 4s |
| 4 | Frost Nova | AoE 5u | 8s |
| 6 | Heal | Self | 15s |

### Attributes

| Attribute | Effect per Point |
| --------- | ---------------- |
| Strength | +2 melee damage (Warrior) |
| Agility | +2 ranged damage (Archer) |
| Intellect | +2 spell damage (Mage) |
| Stamina | +10 max HP, +1 HP regen/30s |

## World Layout

### Town

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
    [Western Field]      [Eastern Field]
    (monsters)           (monsters)
```

### Tower Dungeons

- **Rooms**: 5 + floor * 2 per floor
- **Layout**: Sequential rooms connected by corridors
- **Monsters**: 1-2 per room, scaled by floor
- **Lighting**: Torches in corners and corridors
- **Exit**: Portal in final room

### Monster Scaling

Per floor multiplier: `1 + (floor - 1) * 0.3`

| Floor | HP Mult | Damage Mult |
| ----- | ------- | ----------- |
| 1 | 1.0x | 1.0x |
| 2 | 1.3x | 1.3x |
| 3 | 1.6x | 1.6x |
| 5 | 2.2x | 2.2x |
| 10 | 3.7x | 3.7x |

### Monster Leash

Monsters return to spawn point if they chase 20+ units away.

## Persistence

Characters saved to localStorage:

```typescript
interface CharacterSave {
  id: string
  name: string
  class: 'warrior' | 'archer' | 'mage'
  stats: {
    level: number
    xp: number
    xpToNextLevel: number
    kills: number
    highestFloor: number
    playTimeMs: number
    attributes: { strength: number; agility: number; intellect: number; stamina: number }
    unspentPoints: number
  }
  position: { floor: number; x: number; z: number }
}
```

Save migration handles older versions without attributes.

## Multiplayer

- Up to 5 players per session
- WebRTC peer-to-peer via Go signaling server
- Host authority for combat/AI
- Client prediction for movement

See [signaling/README.md](../signaling/README.md) for setup.

## Future Features

### Short Term

- [ ] Equipment system (weapons, armor)
- [ ] Consumables (health potions)
- [ ] More monster types
- [ ] Boss fights every 5 floors

### Medium Term

- [ ] Loot drops
- [ ] Town NPCs (merchant, blacksmith)
- [ ] Quest system
- [ ] Dungeon themes (cave, ruins, fortress)

### Long Term

- [ ] Skill trees
- [ ] Persistent world
- [ ] Guild system
- [ ] PvP arena
- [ ] Seasonal events

## Balance Notes

### Current Philosophy

1. **Deliberate combat** - Attacks have weight, cooldowns matter
2. **Positioning matters** - 180° cone requires facing enemies
3. **Risk/reward** - Higher floors = better XP but more danger
4. **Progression feel** - Each level unlocks tangible power

### Target Balance

- Player kills slime in ~4 hits (early floors)
- Slime kills player in ~15 hits
- Level 2 achievable after ~10 kills
- First skill unlock feels impactful

## Content Pipeline

### Adding New Monsters

1. Define stats in `types/entities.ts` MONSTER_DEFAULTS
2. Add 3D model in `entities/Monster.tsx`
3. Add XP value in `systems/LevelingSystem.ts`
4. Add spawn points in scene

### Adding New Skills

1. Define in `types/skills.ts`
2. Add to CLASS_SKILL_BARS
3. Handle special logic in `systems/SkillSystem.ts` if needed

### Adding New Floors

Floors are auto-generated. To add variety:
1. Add room size variations in `generateDungeon()`
2. Add new monster types to spawn pool
3. Adjust scaling in `FloorScene.tsx`
