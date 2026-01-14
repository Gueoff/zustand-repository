import { create, createStore, Mutate, StoreApi, UseBoundStore } from 'zustand'
import { devtools, persist, PersistOptions, subscribeWithSelector } from 'zustand/middleware'

import { createLoadingSlice, LoadingStore } from './loading'
import { createPersistSlice, PersistStore } from './persist'
import { createRepositorySlice, ExtensionsParam, RepositoryStore } from './repository'
import { KeyType } from './store.types'

// The final merged store types
type StorePersisted<TEntity, U> = RepositoryStore<TEntity, U> & LoadingStore & PersistStore
type Store<TEntity, U> = RepositoryStore<TEntity, U> & LoadingStore

type PersistParam<TEntity, U> = Omit<
  PersistOptions<StorePersisted<TEntity, U>, Partial<StorePersisted<TEntity, U>>>,
  'name'
>

/**
 * Create scoped store repository
 * @param storeName Name of the store
 * @param getKey Key of the entity to store like ID
 * @param extensions Additional values & functions
 */
export function createScopedRepositoryStore<TEntity, U = NonNullable<unknown>>(
  storeName: string,
  getKey: (entity: TEntity) => KeyType,
  extensions?: ExtensionsParam<TEntity, U, LoadingStore>,
) {
  return createStore<Store<TEntity, U>>()(
    subscribeWithSelector(
      devtools(
        (...params) => ({
          ...createRepositorySlice(getKey, extensions)(...params),
          ...createLoadingSlice(...params),
        }),

        {
          name: storeName,
          store: storeName,
        },
      ),
    ),
  )
}

/**
 * Create persisted store repository
 * @param storeName Name of the store
 * @param getKey Key of the entity to store like ID
 * @param persistOptions Zustand persist options
 * @param extensions Additional values & functions
 */
export function createPersistedRepositoryStore<TEntity, U = NonNullable<unknown>>(
  storeName: string,
  getKey: (entity: TEntity) => KeyType,
  persistOptions: PersistParam<TEntity, U>,
  extensions?: ExtensionsParam<TEntity, U, LoadingStore & PersistStore>,
): UseBoundStore<StoreApi<StorePersisted<TEntity, U>>> {
  return create<StorePersisted<TEntity, U>>()(
    subscribeWithSelector(
      devtools(
        persist(
          (...params) => ({
            ...createRepositorySlice(getKey, extensions)(...params),
            ...createLoadingSlice(...params),
            ...createPersistSlice(...params),
          }),
          {
            name: storeName,
            ...persistOptions,
          },
        ),
        {
          name: storeName,
          store: storeName,
        },
      ),
    ),
  )
}

/**
 * Create store repository
 * @param storeName Name of the store
 * @param getKey Key of the entity to store like ID
 * @param persistOptions Zustand persist options
 * @param extensions Additional values & functions
 */
export function createRepositoryStore<TEntity, U = NonNullable<unknown>>(
  storeName: string,
  getKey: (entity: TEntity) => KeyType,
  persistOptions: PersistParam<TEntity, U>,
  extensions?: ExtensionsParam<TEntity, U, LoadingStore & PersistStore>,
): UseBoundStore<
  Mutate<StoreApi<StorePersisted<TEntity, U>>, [['zustand/subscribeWithSelector', never]]>
>
export function createRepositoryStore<TEntity, U = NonNullable<unknown>>(
  storeName: string,
  getKey: (entity: TEntity) => KeyType,
  persistOptions?: undefined,
  extensions?: ExtensionsParam<TEntity, U, LoadingStore>,
): UseBoundStore<Mutate<StoreApi<Store<TEntity, U>>, [['zustand/subscribeWithSelector', never]]>>
export function createRepositoryStore<TEntity, U = NonNullable<unknown>>(
  storeName: string,
  getKey: (entity: TEntity) => KeyType,
  persistOptions?: PersistParam<TEntity, U>,
  extensions?: ExtensionsParam<TEntity, U, LoadingStore & PersistStore>,
) {
  if (persistOptions) {
    return createPersistedRepositoryStore(storeName, getKey, persistOptions, extensions)
  }

  return create<Store<TEntity, U>>()(
    subscribeWithSelector(
      devtools(
        (...params) => ({
          ...createRepositorySlice(getKey, extensions)(...params),
          ...createLoadingSlice(...params),
        }),
        {
          name: storeName,
          store: storeName,
        },
      ),
    ),
  )
}
