import type { Entity } from '../types'
import { distanceXZ, isInFrontCone } from './math'

const TARGETING_RANGE = 6
const TARGETING_CONE_ANGLE = Math.PI * 0.75

export function findTargetInFront(
  attacker: Entity,
  entities: Entity[],
  range: number = TARGETING_RANGE,
  coneAngle: number = TARGETING_CONE_ANGLE
): Entity | null {
  const pos = attacker.components.position
  if (!pos) return null

  let nearestTarget: Entity | null = null
  let nearestDist = Infinity

  for (const entity of entities) {
    if (entity.type !== 'monster') continue
    if (!entity.components.position || !entity.components.health) continue
    if (entity.components.health.dead) continue

    const targetPos = entity.components.position
    const dist = distanceXZ(pos, targetPos)

    if (dist > range) continue
    if (dist >= nearestDist) continue

    if (isInFrontCone(pos, pos.rotation, targetPos, coneAngle)) {
      nearestTarget = entity
      nearestDist = dist
    }
  }

  return nearestTarget
}

export function findTargetInRange(
  attacker: Entity,
  entities: Entity[],
  range: number
): Entity | null {
  const pos = attacker.components.position
  if (!pos) return null

  let nearestTarget: Entity | null = null
  let nearestDist = Infinity

  for (const entity of entities) {
    if (entity.type !== 'monster') continue
    if (!entity.components.position || !entity.components.health) continue
    if (entity.components.health.dead) continue

    const targetPos = entity.components.position
    const dist = distanceXZ(pos, targetPos)

    if (dist > range) continue
    if (dist < nearestDist) {
      nearestTarget = entity
      nearestDist = dist
    }
  }

  return nearestTarget
}
