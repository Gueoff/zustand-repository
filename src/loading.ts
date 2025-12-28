import { StateCreator } from 'zustand/index'

import { GetType, KeyType, SetType, StatusRepository } from './store.types'

// eslint-disable-next-line @typescript-eslint/ban-types
type LoaderID = string | number | Function | { code: string }
type Func<TArgs extends any[], TResult> = (...args: TArgs) => TResult

/**
 * Get id as a string from anything which can be loading
 * @param id
 */
export function getID(id: LoaderID): string {
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

export interface BaseLoadingStore {
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
export const createBaseLoadingSlice: StateCreator<BaseLoadingStore, [], [], BaseLoadingStore> = (
  set: SetType<BaseLoadingStore>,
  get: GetType<BaseLoadingStore>,
): BaseLoadingStore => ({
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
      const ids = [id, ...args.filter((arg: any) => typeof arg === 'string')]

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
      } catch (error) {
        throw error
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
 * Compute the loading value to make it a variable instead of func
 */
// export interface ComputedLoadingStore {
//  isLoading: boolean
// }
// export const computedLoading = createComputed<BaseLoadingStore & any, ComputedLoadingStore>(
//  (state) => ({
//    isLoading:
//      Object.values(state.loadingMap).filter((loading) => loading === StatusRepository.Loading)
//        .length > 0,
//  }),
//)
//)

/**
 * Utils function to add operation on each function called "operationSomething"
 * @param storeInitializer
 */
export function wrapOperation<T extends Record<string, any>>(
  storeInitializer: (set: any, get: () => any, s?: any) => T,
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
