import { create, Mutate, StoreApi, UseBoundStore } from 'zustand'
import { devtools, persist, PersistOptions, subscribeWithSelector } from 'zustand/middleware'

import { createLoadingSlice, LoadingStore } from './loading'
import { createPersistSlice, PersistStore } from './persist'
import { GetType, SetType } from './store.types'

// The final merged store types
type StorePersisted<T> = T & LoadingStore & PersistStore
type PersistParam<T> = Omit<PersistOptions<StorePersisted<T>, Partial<StorePersisted<T>>>, 'name'>

type ExtensionsParam<TStore, AdditionalSliceType> = (
  set: SetType<TStore & AdditionalSliceType>,
  get: GetType<TStore & AdditionalSliceType>,
) => TStore

/**
 * Used to create a typed persisted store with devtool and subscribers
 * @param storeName
 * @param persistOptions
 * @param extensions
 */
export function createPersistedStore<TStore>(
  storeName: string,
  persistOptions: PersistParam<TStore>,
  extensions: ExtensionsParam<TStore, LoadingStore & PersistStore>,
): UseBoundStore<
  Mutate<StoreApi<TStore & LoadingStore & PersistStore>, [['zustand/subscribeWithSelector', never]]>
> {
  return create<TStore & LoadingStore & PersistStore>()(
    subscribeWithSelector(
      devtools(
        persist(
          (set, get, store) => ({
            ...createLoadingSlice(set, get, store),
            ...createPersistSlice(set, get, store),
            ...extensions(set, get),
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
