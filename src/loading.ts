import { StateCreator } from 'zustand/index'

import { GetType, KeyType, SetType, StatusRepository } from './store.types'

type LoaderFn = (...args: unknown[]) => unknown
type LoaderID = string | number | LoaderFn | { code: string }
type Func<TArgs extends unknown[], TResult> = (...args: TArgs) => TResult

interface LoaderFnWithCode extends LoaderFn {
  code: string
}

function hasCode(fn: LoaderFn): fn is LoaderFnWithCode {
  return 'code' in fn && typeof (fn as LoaderFnWithCode).code === 'string'
}

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
    if (hasCode(id)) {
      return id.code
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
  operation: <TArgs extends unknown[], TResult>(
    fn: Func<TArgs, Promise<TResult>>,
  ) => Func<TArgs, Promise<TResult>> & { code: string }
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
    Object.values(get().loadingMap).some((status) => status === StatusRepository.Loading),

  isLoadingKey: (id: LoaderID) => get().loadingMap[getID(id)] === StatusRepository.Loading,

  clearLoaders: () => {
    if (Object.keys(get().loadingMap).length === 0) {
      return
    }

    set((state) => ({ ...state, loadingMap: {} }), undefined, 'clearLoaders')
  },

  operation: <TArgs extends unknown[], TResult>(fn: Func<TArgs, Promise<TResult>>) => {
    const id = getID(fn as LoaderFn)

    const returnFn = async (...args: TArgs): Promise<TResult> => {
      // Build ids array efficiently without intermediate allocations
      const ids: string[] = [id]
      for (const arg of args) {
        if (typeof arg === 'string') {
          ids.push(arg)
        } else if (Array.isArray(arg)) {
          for (const v of arg) {
            if (typeof v === 'string') {
              ids.push(v)
            }
          }
        }
      }

      // Build loading entries directly without Object.fromEntries
      const loadingEntries: Record<string, StatusRepository> = {}
      for (const loaderID of ids) {
        loadingEntries[getID(loaderID)] = StatusRepository.Loading
      }

      set(
        (state) => ({
          ...state,
          loadingMap: {
            ...state.loadingMap,
            ...loadingEntries,
          },
        }),
        false,
        'startLoading',
      )

      try {
        return await fn(...args)
      } finally {
        // Use Set for O(1) lookup instead of Array.includes O(n)
        const idsSet = new Set(ids)

        set(
          (state) => {
            const newLoadingMap: Record<KeyType, StatusRepository> = {}
            for (const key in state.loadingMap) {
              if (!idsSet.has(key)) {
                newLoadingMap[key] = state.loadingMap[key]
              }
            }
            return { ...state, loadingMap: newLoadingMap }
          },
          false,
          'stopLoading',
        )
      }
    }

    returnFn.code = id
    return returnFn
  },
})
