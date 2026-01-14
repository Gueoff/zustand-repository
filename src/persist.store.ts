import { create, Mutate, StoreApi, UseBoundStore } from 'zustand'
import { devtools, persist, PersistOptions, subscribeWithSelector } from 'zustand/middleware'

import { BaseLoadingStore, createBaseLoadingSlice } from './loading'
import { createPersistSlice, PersistStore } from './persist'
import { GetType, SetType } from './store.types'

// The final merged store types
type StorePersisted<T> = T & BaseLoadingStore & PersistStore
type PersistParam<T> = Omit<PersistOptions<StorePersisted<T>, Partial<StorePersisted<T>>>, 'name'>
type ExtensionsParam<TStore, TExt> = (
  set: SetType<TStore & TExt>,
  get: GetType<TStore & TExt>,
) => TExt

const createExtensionSlice =
  <TStore, TExt>(extensions: ExtensionsParam<TStore, TExt>) =>
  (set: SetType<TStore & TExt>, get: GetType<TStore & TExt>, _store: unknown): TExt =>
    extensions(set, get)

/**
 * Used to create a typed persisted store with devtool and subscribers
 * @param storeName
 * @param persistOptions
 * @param extensions
 */
export function createPersistedStore<TBase extends object, TExt extends object>(
  storeName: string,
  persistOptions: PersistParam<TBase & TExt>,
  extensions: ExtensionsParam<TBase & BaseLoadingStore & PersistStore, TExt>,
): UseBoundStore<
  Mutate<StoreApi<StorePersisted<TBase & TExt>>, [['zustand/subscribeWithSelector', never]]>
> {
  return create<StorePersisted<TBase & TExt>>()(
    subscribeWithSelector(
      devtools(
        persist(
          (set, get, store) => ({
            ...(get() as TBase),
            ...createBaseLoadingSlice(set, get, store),
            ...createPersistSlice(set, get, store),
            ...createExtensionSlice(extensions)(set, get, store),
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
