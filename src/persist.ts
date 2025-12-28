import { StateCreator } from 'zustand'
import { create, StoreApi } from 'zustand/index'
import { devtools, persist, PersistOptions } from 'zustand/middleware'
import { NamedSet } from 'zustand/middleware/devtools'

import { GetType, SetType, StatusRepository } from './store.types'

export interface PersistStore {
  statusRehydrate: StatusRepository
  isRehydrated: () => boolean
  onRehydrateStorage: (state?: any, error?: unknown) => void
}

/**
 * Additional values for persisted stores.
 * @param set
 * @param get
 */
export const createPersistSlice: StateCreator<PersistStore, [], [], PersistStore> = (
  set: SetType<PersistStore>,
  get: GetType<PersistStore>,
) => ({
  statusRehydrate: StatusRepository.Idle,

  isRehydrated: () =>
    get().statusRehydrate === StatusRepository.Success ||
    get().statusRehydrate === StatusRepository.Error,

  onRehydrateStorage: (_?: PersistStore, error?: unknown) => {
    set(
      (state) => ({
        ...state,
        statusRehydrate: error ? StatusRepository.Error : StatusRepository.Success,
      }),
      false,
      'onRehydrateStorage',
    )
  },
})

/**
 * Used to create a typed persisted store with devtool
 * @param storeCreator
 * @param persistOptions
 */
export function createPersistedStore<T, U = Partial<T>>(
  storeCreator: (set: NamedSet<T>, get: StoreApi<T>['getState'], store: StoreApi<T>) => T,
  persistOptions: PersistOptions<T, U>,
) {
  return create<T>()(
    devtools(
      persist((_set, get, store) => {
        const set: NamedSet<T> = _set
        return storeCreator(set, get, store)
      }, persistOptions),
      { name: persistOptions.name, store: persistOptions.name },
    ),
  )
}
