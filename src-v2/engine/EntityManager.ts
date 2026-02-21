import type { Entity, EntityType, ComponentMap, EntityFactoryConfig } from '../types'

export class EntityManager {
  private entities: Map<string, Entity> = new Map()
  private nextId = 0

  create(config: EntityFactoryConfig): Entity {
    const id = config.id ?? this.generateId(config.type)
    const now = performance.now()

    const entity: Entity = {
      id,
      type: config.type,
      components: { ...config.components },
      createdAt: now,
      updatedAt: now,
    }

    this.entities.set(id, entity)
    return entity
  }

  get(id: string): Entity | undefined {
    return this.entities.get(id)
  }

  getAll(): Entity[] {
    return Array.from(this.entities.values())
  }

  query(predicate: (entity: Entity) => boolean): Entity[] {
    return this.getAll().filter(predicate)
  }

  queryByType(type: EntityType): Entity[] {
    return this.query((e) => e.type === type)
  }

  queryByComponent<K extends keyof ComponentMap>(component: K): Entity[] {
    return this.query((e) => e.components[component] !== undefined)
  }

  update(id: string, components: Partial<ComponentMap>): Entity | undefined {
    const entity = this.entities.get(id)
    if (!entity) return undefined

    entity.components = { ...entity.components, ...components }
    entity.updatedAt = performance.now()

    return entity
  }

  updateComponent<K extends keyof ComponentMap>(
    id: string,
    component: K,
    data: Partial<NonNullable<ComponentMap[K]>>
  ): Entity | undefined {
    const entity = this.entities.get(id)
    if (!entity) return undefined

    const currentComponent = entity.components[component] ?? {}
    entity.components[component] = {
      ...currentComponent,
      ...data,
    } as ComponentMap[K]
    entity.updatedAt = performance.now()

    return entity
  }

  destroy(id: string): boolean {
    return this.entities.delete(id)
  }

  destroyAll(): void {
    this.entities.clear()
  }

  exists(id: string): boolean {
    return this.entities.has(id)
  }

  count(): number {
    return this.entities.size
  }

  private generateId(type: EntityType): string {
    return `${type}_${++this.nextId}_${Date.now().toString(36)}`
  }
}

export const entityManager = new EntityManager()
