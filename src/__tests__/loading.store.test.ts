import { jest } from '@jest/globals'

import { createLoadingStore } from '../loading.store'
import { StatusRepository } from '../store.types'

interface CustomStore {
  counter: number
  increment: () => void
  asyncAction: () => Promise<void>
}

describe('createLoadingStore', () => {
  it('should create a store with loading capabilities', () => {
    const store = createLoadingStore<CustomStore>('testStore', (set) => ({
      counter: 0,
      increment: () => set((state) => ({ ...state, counter: state.counter + 1 })),
      asyncAction: async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      },
    }))

    expect(store.getState().counter).toBe(0)
    expect(store.getState().loadingMap).toEqual({})
    expect(typeof store.getState().isLoading).toBe('function')
    expect(typeof store.getState().isLoadingKey).toBe('function')
    expect(typeof store.getState().clearLoaders).toBe('function')
    expect(typeof store.getState().operation).toBe('function')
  })

  it('should allow custom extensions to access set and get', () => {
    const store = createLoadingStore<CustomStore>('testStore', (set, get) => ({
      counter: 0,
      increment: () => set((state) => ({ ...state, counter: state.counter + 1 })),
      asyncAction: async () => {
        const currentCount = get().counter
        set((state) => ({ ...state, counter: currentCount + 10 }))
      },
    }))

    store.getState().increment()
    expect(store.getState().counter).toBe(1)
  })

  it('should integrate loading functions with custom store', async () => {
    const store = createLoadingStore<CustomStore>('testStore', (set) => ({
      counter: 0,
      increment: () => set((state) => ({ ...state, counter: state.counter + 1 })),
      asyncAction: async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      },
    }))

    const wrappedAction = store.getState().operation(store.getState().asyncAction)

    expect(store.getState().isLoading()).toBe(false)
    const promise = wrappedAction()
    expect(store.getState().isLoading()).toBe(true)
    await promise
    expect(store.getState().isLoading()).toBe(false)
  })

  it('should support subscribeWithSelector middleware', () => {
    const store = createLoadingStore<CustomStore>('testStore', (set) => ({
      counter: 0,
      increment: () => set((state) => ({ ...state, counter: state.counter + 1 })),
      asyncAction: async () => {},
    }))

    const callback = jest.fn()
    store.subscribe((state) => state.counter, callback)

    store.getState().increment()
    expect(callback).toHaveBeenCalledWith(1, 0)
  })
})
