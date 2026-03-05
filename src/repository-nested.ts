import { shallow } from 'zustand/vanilla/shallow'

import { BaseRepositoryStore } from './repository'
import { KeyType, ParamsRepository } from './store.types'
import { getNestedValue } from './utils/object'

export type NestedRepositoryStore<TEntity> = Omit<BaseRepositoryStore<TEntity>, 'itemsMap'>

export interface NestedRepositoryConfig<TParent, TEntity> {
  readonly getKey: (entity: TEntity) => KeyType
  readonly getParent: () => TParent | undefined
  readonly getParentKey: (parent: TParent) => KeyType
  readonly getItems: (parent: TParent) => Record<KeyType, TEntity>
  readonly setItems: (parent: TParent, items: Record<KeyType, TEntity>) => TParent
}

/**
 * Create a nested repository that manages a Record<KeyType, TEntity> field
 * inside a parent entity stored in a parent repository store.
 *
 * The parent store must have an `itemsMap` field (standard repository store).
 */
export type NestedRepositoryExtensions<TEntity, U = NonNullable<unknown>> = (
  defaults: NestedRepositoryStore<TEntity>,
) => Partial<NestedRepositoryStore<TEntity>> & U

type NestedSetType<TParent> = (
  partial:
    | { itemsMap: Record<KeyType, TParent> }
    | ((state: { itemsMap: Record<KeyType, TParent> }) => {
        itemsMap: Record<KeyType, TParent>
      }),
  replace?: false,
  actionName?: string,
) => void

export function createNestedRepository<TParent, TEntity, U = NonNullable<unknown>>(
  config: NestedRepositoryConfig<TParent, TEntity>,
  set: NestedSetType<TParent>,
  extensions?: NestedRepositoryExtensions<TEntity, U>,
): NestedRepositoryStore<TEntity> & U {
  const { getKey, getParent, getParentKey, getItems, setItems } = config

  const getItemsMap = (): Record<KeyType, TEntity> => {
    const parent = getParent()
    if (!parent) {
      return {}
    }
    return getItems(parent)
  }

  const updateItems = (
    updater: (items: Record<KeyType, TEntity>) => Record<KeyType, TEntity>,
    actionName?: string,
  ) => {
    const parent = getParent()
    if (!parent) {
      return
    }

    const currentItems = getItems(parent)
    const newItems = updater(currentItems)
    const updatedParent = setItems(parent, newItems)
    const parentKey = getParentKey(parent)

    set(
      (state) => ({
        itemsMap: {
          ...state.itemsMap,
          [parentKey]: updatedParent,
        },
      }),
      undefined,
      actionName,
    )
  }

  const defaults: NestedRepositoryStore<TEntity> = {
    items: () => Object.values(getItemsMap()),

    itemCount: () => Object.keys(getItemsMap()).length,

    itemById: (key?: KeyType) => (key ? getItemsMap()[key] : undefined),

    itemsByIds: (keys: KeyType[]) => {
      const result: TEntity[] = []
      const itemsMap = getItemsMap()
      for (const key of keys) {
        const item = itemsMap[key]
        if (item !== undefined) {
          result.push(item)
        }
      }
      return result
    },

    itemsWhere: (predicate: (item: TEntity, key: KeyType) => boolean) => {
      const result: TEntity[] = []
      const itemsMap = getItemsMap()
      for (const key in itemsMap) {
        const item = itemsMap[key]
        if (predicate(item, key)) {
          result.push(item)
        }
      }
      return result
    },

    findItem: (predicate: (item: TEntity, key: KeyType) => boolean) => {
      const itemsMap = getItemsMap()
      for (const key in itemsMap) {
        const item = itemsMap[key]
        if (predicate(item, key)) {
          return item
        }
      }
      return undefined
    },

    addOne: (item: TEntity, params?: Pick<ParamsRepository, 'isShallow' | 'shallowFields'>) => {
      const key = getKey(item)

      if (params?.isShallow) {
        const existing = getItemsMap()[key]
        if (existing && shallow(item, existing)) {
          return
        }
      }

      if (params?.shallowFields?.length) {
        const existing = getItemsMap()[key]
        if (existing) {
          const isIdentical = params.shallowFields.every(
            (field) => getNestedValue(item, field) === getNestedValue(existing, field),
          )
          if (isIdentical) {
            return
          }
        }
      }

      updateItems((items) => ({ ...items, [key]: item }), 'nestedAddOne')
    },

    addMany: (
      items: TEntity[],
      params?: Pick<ParamsRepository, 'isFlush' | 'isShallow' | 'shallowFields'>,
    ) => {
      if (!items || items.length === 0) {
        if (params?.isFlush) {
          updateItems(() => ({}), 'clearNested')
        }
        return
      }

      updateItems((currentItems) => {
        const newItems: Record<KeyType, TEntity> = params?.isFlush ? {} : { ...currentItems }

        for (const item of items) {
          const key = getKey(item)

          if (params?.isShallow) {
            const prev = currentItems[key]
            if (prev && shallow(item, prev)) {
              newItems[key] = prev
              continue
            }
          }

          if (params?.shallowFields?.length) {
            const prev = currentItems[key]
            if (
              prev &&
              params.shallowFields.every(
                (field) => getNestedValue(item, field) === getNestedValue(prev, field),
              )
            ) {
              newItems[key] = prev
              continue
            }
          }

          newItems[key] = item
        }

        return newItems
      }, 'addManyNested')
    },

    removeOne: (key: KeyType) => {
      if (!(key in getItemsMap())) {
        return
      }

      updateItems((items) => {
        const rest = { ...items }
        delete rest[key]
        return rest
      }, 'removeOneNested')
    },

    clear: () => {
      if (Object.keys(getItemsMap()).length === 0) {
        return
      }
      updateItems(() => ({}), 'clearNested')
    },
  }

  if (extensions) {
    return { ...defaults, ...extensions(defaults) } as NestedRepositoryStore<TEntity> & U
  }

  return defaults as NestedRepositoryStore<TEntity> & U
}
