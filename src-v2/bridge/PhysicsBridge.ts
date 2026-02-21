import type { RapierRigidBody } from '@react-three/rapier'

import { entityManager } from '../engine/EntityManager'

export class PhysicsBridge {
  private bodies: Map<string, RapierRigidBody> = new Map()

  register(id: string, body: RapierRigidBody): void {
    this.bodies.set(id, body)
  }

  unregister(id: string): void {
    this.bodies.delete(id)
  }

  get(id: string): RapierRigidBody | undefined {
    return this.bodies.get(id)
  }

  syncToEngine(): void {
    for (const [id, body] of this.bodies) {
      const entity = entityManager.get(id)
      if (!entity?.components.position) continue

      const translation = body.translation()

      entityManager.updateComponent(id, 'position', {
        x: translation.x,
        y: translation.y,
        z: translation.z,
        rotation: 0,
      })
    }
  }

  syncToPhysics(): void {
    for (const [id, body] of this.bodies) {
      const entity = entityManager.get(id)
      if (!entity?.components.position) continue

      const pos = entity.components.position
      body.setTranslation({ x: pos.x, y: pos.y, z: pos.z }, true)
    }
  }

  getPosition(id: string): { x: number; y: number; z: number } | null {
    const body = this.bodies.get(id)
    if (!body) return null

    const translation = body.translation()
    return {
      x: translation.x,
      y: translation.y,
      z: translation.z,
    }
  }

  setPosition(id: string, x: number, y: number, z: number): void {
    const body = this.bodies.get(id)
    if (!body) return

    body.setTranslation({ x, y, z }, true)
  }

  exists(id: string): boolean {
    return this.bodies.has(id)
  }

  count(): number {
    return this.bodies.size
  }

  clear(): void {
    this.bodies.clear()
  }
}

export const physicsBridge = new PhysicsBridge()
