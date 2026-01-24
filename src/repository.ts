import { StateCreator } from 'zustand'
import { shallow } from 'zustand/vanilla/shallow'

import { GetType, KeyType, ParamsRepository, SetType } from './store.types'
import { getNestedValue } from './utils/object'

interface BaseRepositoryStore<TEntity> {
  itemsMap: Record<KeyType, TEntity>

  itemCount: () => number
  items: () => TEntity[]
  itemById: (key?: KeyType) => TEntity | undefined
  itemsByIds: (keys: KeyType[]) => TEntity[]
  itemsWhere: (predicate: (item: TEntity, key: KeyType) => boolean) => TEntity[]
  findItem: (predicate: (item: TEntity, key: KeyType) => boolean) => TEntity | undefined

  addOne: (item: TEntity, params?: ParamsRepository) => void
  addMany: (
    items: TEntity[],
    params?: Pick<ParamsRepository, 'isFlush' | 'isShallow' | 'shallowFields'>,
  ) => void
  clear: () => void
  removeOne: (key: KeyType) => void
}

export type RepositoryStore<TEntity, U> = BaseRepositoryStore<TEntity> & U

export type ExtensionsParam<TEntity, U, AdditionalStore> = (
  set: SetType<RepositoryStore<TEntity, U> & AdditionalStore>,
  get: GetType<RepositoryStore<TEntity, U> & AdditionalStore>,
) => U

/**
 * Create repository slice
 * @param getKey Key of the entity to store like ID
 * @param extensions Additional values & functions
 */
export const createRepositorySlice =
  <TEntity, U = NonNullable<unknown>, AdditionalStore = NonNullable<unknown>>(
    getKey: (entity: TEntity) => KeyType,
    extensions?: ExtensionsParam<TEntity, U, AdditionalStore>,
  ): StateCreator<RepositoryStore<TEntity, U>, [], [], RepositoryStore<TEntity, U>> =>
  (set: SetType<RepositoryStore<TEntity, U>>, get: GetType<RepositoryStore<TEntity, U>>) => ({
    itemsMap: {},

    itemCount: () => Object.keys(get().itemsMap).length,

    items: () => Object.values(get().itemsMap),

    itemById: (key?: KeyType) => (key ? get().itemsMap[key] : undefined),

    itemsByIds: (keys: KeyType[]) => {
      const result: TEntity[] = []
      const itemsMap = get().itemsMap
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
      const itemsMap = get().itemsMap
      for (const key in itemsMap) {
        const item = itemsMap[key]
        if (predicate(item, key)) {
          result.push(item)
        }
      }
      return result
    },

    findItem: (predicate: (item: TEntity, key: KeyType) => boolean) => {
      const itemsMap = get().itemsMap
      for (const key in itemsMap) {
        const item = itemsMap[key]
        if (predicate(item, key)) {
          return item
        }
      }
      return undefined
    },

    addOne: (item: TEntity, params?: ParamsRepository) => {
      const id = getKey(item)

      if (!params?.isClear) {
        // Same entity with shallow comparison
        if (params?.isShallow && shallow(item, get().itemById(id))) {
          return
        }

        // Shallow fields are matching
        if (params?.shallowFields?.length) {
          const previousEntity = get().itemById(id)
          const isIdentical = params?.shallowFields.every(
            (field) => getNestedValue(item, field) === getNestedValue(previousEntity, field),
          )

          if (isIdentical) {
            return
          }
        }

        // Remove entity
        if (params?.removeKey) {
          get().removeOne(params?.removeKey)
        }
      }

      // Clear the items
      if (params?.isFlush) {
        get().clear()
      }

      set(
        (state) => ({
          ...state,
          itemsMap: params?.isUnique
            ? {
                [id]: item,
              }
            : {
                ...state.itemsMap,
                [id]: item,
              },
        }),
        undefined,
        'addOne',
      )
    },

    addMany: (
      items: TEntity[],
      params?: Pick<ParamsRepository, 'isFlush' | 'isShallow' | 'shallowFields'>,
    ) => {
      if (!items || items.length === 0) {
        return params?.isFlush ? get().clear() : undefined
      }

      // Early exit only if isShallow or shallowFields is set
      if (!params?.isFlush && (params?.isShallow || params?.shallowFields?.length)) {
        let hasChanges = false

        if (params.isShallow) {
          for (const item of items) {
            const previousEntity = get().itemById(getKey(item))
            if (!previousEntity || !shallow(item, previousEntity)) {
              hasChanges = true
              break
            }
          }
        } else {
          for (const item of items) {
            const previousEntity = get().itemById(getKey(item))
            if (!previousEntity) {
              hasChanges = true
              break
            }

            hasChanges = params?.shallowFields!.some(
              (field) => getNestedValue(item, field) !== getNestedValue(previousEntity, field),
            )

            if (hasChanges) {
              break
            }
          }
        }

        if (!hasChanges) {
          return
        }
      }

      set(
        (state) => {
          const newItemsMap: Record<KeyType, TEntity> = params?.isFlush
            ? {}
            : Object.assign({}, state.itemsMap)

          if (params?.isFlush) {
            for (const item of items) {
              newItemsMap[getKey(item)] = item
            }
          } else if (params?.isShallow) {
            for (const item of items) {
              const key = getKey(item)
              const previousEntity = state.itemsMap[key]
              newItemsMap[key] =
                previousEntity && shallow(item, previousEntity) ? previousEntity : item
            }
          } else if (params?.shallowFields?.length) {
            const fields = params.shallowFields
            for (const item of items) {
              const key = getKey(item)
              const previousEntity = state.itemsMap[key]
              if (
                previousEntity &&
                fields.every(
                  (field) => getNestedValue(item, field) === getNestedValue(previousEntity, field),
                )
              ) {
                newItemsMap[key] = previousEntity
              } else {
                newItemsMap[key] = item
              }
            }
          } else {
            for (const item of items) {
              newItemsMap[getKey(item)] = item
            }
          }

          return { ...state, itemsMap: newItemsMap }
        },
        undefined,
        'addMany',
      )
    },

    clear: () => {
      if (get().itemCount() === 0) {
        return
      }

      set((state) => ({ ...state, itemsMap: {} }), undefined, 'clear')
    },

    removeOne: (key: KeyType) => {
      if (!(key in get().itemsMap)) {
        return
      }

      set(
        (state) => {
          const { [key]: _, ...rest } = state.itemsMap
          return { ...state, itemsMap: rest }
        },
        undefined,
        'removeOne',
      )
    },

    ...((extensions
      ? extensions(
          set as unknown as SetType<RepositoryStore<TEntity, U> & AdditionalStore>,
          get as unknown as GetType<RepositoryStore<TEntity, U> & AdditionalStore>,
        )
      : {}) as U),
  })
