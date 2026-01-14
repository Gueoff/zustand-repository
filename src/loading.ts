import { StateCreator } from 'zustand/index'

import { RepositoryStore } from './repository'
import { GetType, KeyType, SetType, StatusRepository } from './store.types'

type LoaderFn = (...args: unknown[]) => unknown
type LoaderID = string | number | LoaderFn | { code: string }
type Func<TArgs extends any[], TResult> = (...args: TArgs) => TResult

/**
 * Get id as a string from anything which can be loading
 * @param id
 */
function getID(id: LoaderID): string {
  if (!id) {
    return 'unknown'
  }
  if (typeof id === 'string') {
    return id
  }
  if (typeof id === 'function') {
    if ((id as any).code) {
      return (id as any).code
    }
    if (id.name) {
      return id.name
    }
  }

  return id?.toString()
}

export interface LoadingStore {
  loadingMap: Record<KeyType, StatusRepository>

  isLoading: () => boolean
  isLoadingKey: (id: LoaderID) => boolean
  clearLoaders: () => void
  operation: (fn: Func<any[], Promise<any>>) => (...args: any[]) => Promise<any>
}

/**
 * Additional values for loading in stores.
 * @param set
 * @param get
 */
export const createLoadingSlice: StateCreator<LoadingStore, [], [], LoadingStore> = (
  set: SetType<LoadingStore>,
  get: GetType<LoadingStore>,
): LoadingStore => ({
  loadingMap: {},

  isLoading: () =>
    Object.values(get().loadingMap).filter((loading) => loading === StatusRepository.Loading)
      .length > 0,

  isLoadingKey: (id: LoaderID) => get().loadingMap[getID(id)] === StatusRepository.Loading,

  clearLoaders: () => {
    set((state) => ({ ...state, loadingMap: {} }), undefined, 'clearLoaders')
  },

  operation: (fn) => {
    const id = getID(fn)

    const returnFn = async (...args: any[]): Promise<any> => {
      const ids = [
        id,
        ...args.flatMap((arg) =>
          Array.isArray(arg)
            ? arg.filter((v) => typeof v === 'string')
            : typeof arg === 'string'
              ? [arg]
              : [],
        ),
      ]

      set(
        (state) => ({
          ...state,
          loadingMap: {
            ...state.loadingMap,
            ...Object.fromEntries(ids.map((id) => [getID(id), StatusRepository.Loading])),
          },
        }),
        false,
        'startLoading',
      )

      try {
        return await fn(...args)
      } finally {
        set(
          (state) => ({
            ...state,
            loadingMap:
              Object.fromEntries(
                Object.entries(state.loadingMap).filter(([key]) => !ids.includes(key)),
              ) || {},
          }),
          false,
          'stopLoading',
        )
      }
    }

    returnFn.code = id
    return returnFn
  },
})

/**
 * Utils function to add operation on each function called "operationSomething"
 * @param storeInitializer
 */
export function wrapOperation<S, T extends Record<string, any>>(
  storeInitializer: (
    set: SetType<RepositoryStore<S, T> & LoadingStore>,
    get: GetType<RepositoryStore<S, T> & LoadingStore>,
    s?: any,
  ) => T,
): (set: any, get: () => any, s?: any) => T {
  return (set, get, s) => {
    const store = storeInitializer(set, get, s)
    const wrappedStore = {} as T

    for (const key in store) {
      const value = store[key]

      if (typeof value === 'function' && value.name?.toLowerCase()?.includes('operation')) {
        wrappedStore[key] = ((...args: unknown[]) =>
          get().operation(value)(...args)) as typeof value
      } else {
        wrappedStore[key] = value
      }
    }

    return wrappedStore
  }
}
