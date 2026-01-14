import { create, Mutate, StoreApi, UseBoundStore } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'

import { createLoadingSlice, LoadingStore } from './loading'
import { GetType, SetType } from './store.types'

type ExtensionsParam<TStore, AdditionalSliceType> = (
  set: SetType<TStore & AdditionalSliceType>,
  get: GetType<TStore & AdditionalSliceType>,
) => TStore

/**
 * Used to create a typed store with loading functions, devtool and subscribers
 * @param storeName
 * @param extensions
 */
export function createLoadingStore<TStore>(
  storeName: string,
  extensions: ExtensionsParam<TStore, LoadingStore>,
): UseBoundStore<
  Mutate<StoreApi<TStore & LoadingStore>, [['zustand/subscribeWithSelector', never]]>
> {
  return create<TStore & LoadingStore>()(
    subscribeWithSelector(
      devtools(
        (set, get, store) => ({
          ...createLoadingSlice(set, get, store),
          ...extensions(set, get),
        }),

        {
          name: storeName,
          store: storeName,
        },
      ),
    ),
  )
}
