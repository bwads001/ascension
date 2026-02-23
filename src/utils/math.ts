export interface Vec3 {
  x: number
  y: number
  z: number
}

export function distance(a: Vec3, b: Vec3): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const dz = b.z - a.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function distanceXZ(a: Vec3, b: Vec3): number {
  const dx = b.x - a.x
  const dz = b.z - a.z
  return Math.sqrt(dx * dx + dz * dz)
}

export function direction(from: Vec3, to: Vec3): Vec3 {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dz = to.z - from.z
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz)

  if (len === 0) return { x: 0, y: 0, z: 0 }

  return {
    x: dx / len,
    y: dy / len,
    z: dz / len,
  }
}

export function directionXZ(from: Vec3, to: Vec3): Vec3 {
  const dx = to.x - from.x
  const dz = to.z - from.z
  const len = Math.sqrt(dx * dx + dz * dz)

  if (len === 0) return { x: 0, y: 0, z: 0 }

  return {
    x: dx / len,
    y: 0,
    z: dz / len,
  }
}

export function normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
  if (len === 0) return { x: 0, y: 0, z: 0 }

  return {
    x: v.x / len,
    y: v.y / len,
    z: v.z / len,
  }
}

export function scale(v: Vec3, s: number): Vec3 {
  return {
    x: v.x * s,
    y: v.y * s,
    z: v.z * s,
  }
}

export function add(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  }
}

export function subtract(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  }
}

export function length(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}

export function lengthXZ(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.z * v.z)
}

export function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function inRange(a: Vec3, b: Vec3, range: number): boolean {
  return distanceXZ(a, b) <= range
}

export function moveToward(current: Vec3, target: Vec3, maxDistance: number): Vec3 {
  const dir = directionXZ(current, target)
  const dist = distanceXZ(current, target)

  if (dist <= maxDistance) {
    return { ...target, y: current.y }
  }

  return {
    x: current.x + dir.x * maxDistance,
    y: current.y,
    z: current.z + dir.z * maxDistance,
  }
}

export function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function randomPointInRadius(center: Vec3, radius: number): Vec3 {
  const angle = Math.random() * Math.PI * 2
  const r = Math.sqrt(Math.random()) * radius
  return {
    x: center.x + Math.cos(angle) * r,
    y: center.y,
    z: center.z + Math.sin(angle) * r,
  }
}

export function getAngle(from: Vec3, to: Vec3): number {
  return Math.atan2(to.z - from.z, to.x - from.x)
}

export function angleDifference(angle1: number, angle2: number): number {
  let diff = angle2 - angle1
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return Math.abs(diff)
}

export function isInFrontCone(
  observerPos: Vec3,
  observerRotation: number,
  targetPos: Vec3,
  coneAngle: number
): boolean {
  const angleToTarget = getAngle(observerPos, targetPos)
  return angleDifference(observerRotation, angleToTarget) <= coneAngle / 2
}
