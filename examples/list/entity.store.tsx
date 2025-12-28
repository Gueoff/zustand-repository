import { createRepositoryStore } from 'zustand-repository'

import { Entity } from './entity.type'

const STORE_NAME = 'entity-store'

export const useEntityStore = createRepositoryStore<Entity>(
  STORE_NAME,
  (entity: Entity) => entity.id,
)
