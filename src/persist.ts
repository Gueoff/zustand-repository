import { StateCreator } from 'zustand'

import { GetType, SetType, StatusRepository } from './store.types'

export interface PersistStore {
  statusRehydrate: StatusRepository
  isRehydrated: () => boolean
  onRehydrateStorage: (state?: PersistStore, error?: unknown) => void
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
