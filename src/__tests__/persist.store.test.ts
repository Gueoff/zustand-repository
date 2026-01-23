import { jest } from '@jest/globals'

import { createPersistedStore } from '../persist.store'
import { StatusRepository } from '../store.types'

interface CustomStore {
  counter: number
  increment: () => void
}

// Mock storage for testing - uses type assertion for zustand v5 compatibility
const createMockStorage = () => {
  const store: Record<string, unknown> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: unknown) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

describe('createPersistedStore', () => {
  it('should create a persisted store with loading and persist capabilities', () => {
    const mockStorage = createMockStorage()

    const store = createPersistedStore<CustomStore>(
      'testPersistedStore',
      { storage: mockStorage },
      (set) => ({
        counter: 0,
        increment: () => set((state) => ({ ...state, counter: state.counter + 1 })),
      }),
    )

    // Check custom state
    expect(store.getState().counter).toBe(0)

    // Check loading slice
    expect(store.getState().loadingMap).toEqual({})
    expect(typeof store.getState().isLoading).toBe('function')
    expect(typeof store.getState().operation).toBe('function')

    // Check persist slice
    expect(typeof store.getState().isRehydrated).toBe('function')
    expect(typeof store.getState().onRehydrateStorage).toBe('function')
    expect(store.getState().statusRehydrate).toBe(StatusRepository.Idle)
  })

  it('should allow custom extensions to work with set and get', () => {
    const mockStorage = createMockStorage()

    const store = createPersistedStore<CustomStore>(
      'testPersistedStore',
      { storage: mockStorage },
      (set, get) => ({
        counter: 0,
        increment: () => {
          const current = get().counter
          set((state) => ({ ...state, counter: current + 1 }))
        },
      }),
    )

    store.getState().increment()
    expect(store.getState().counter).toBe(1)

    store.getState().increment()
    expect(store.getState().counter).toBe(2)
  })

  it('should integrate loading functions with persisted store', async () => {
    const mockStorage = createMockStorage()

    const store = createPersistedStore<CustomStore>(
      'testPersistedStore',
      { storage: mockStorage },
      (set) => ({
        counter: 0,
        increment: () => set((state) => ({ ...state, counter: state.counter + 1 })),
      }),
    )

    const asyncAction = async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      store.getState().increment()
    }

    const wrappedAction = store.getState().operation(asyncAction)

    expect(store.getState().isLoading()).toBe(false)
    const promise = wrappedAction()
    expect(store.getState().isLoading()).toBe(true)
    await promise
    expect(store.getState().isLoading()).toBe(false)
    expect(store.getState().counter).toBe(1)
  })

  it('should support onRehydrateStorage callback', () => {
    const mockStorage = createMockStorage()

    const store = createPersistedStore<CustomStore>(
      'testPersistedStore',
      { storage: mockStorage },
      (set) => ({
        counter: 0,
        increment: () => set((state) => ({ ...state, counter: state.counter + 1 })),
      }),
    )

    // Simulate rehydration complete
    store.getState().onRehydrateStorage(store.getState())
    expect(store.getState().isRehydrated()).toBe(true)
    expect(store.getState().statusRehydrate).toBe(StatusRepository.Success)
  })

  it('should handle rehydration errors', () => {
    const mockStorage = createMockStorage()

    const store = createPersistedStore<CustomStore>(
      'testPersistedStore',
      { storage: mockStorage },
      (set) => ({
        counter: 0,
        increment: () => set((state) => ({ ...state, counter: state.counter + 1 })),
      }),
    )

    // Simulate rehydration error
    store.getState().onRehydrateStorage(undefined, new Error('Storage error'))
    expect(store.getState().isRehydrated()).toBe(true)
    expect(store.getState().statusRehydrate).toBe(StatusRepository.Error)
  })

  it('should support subscribeWithSelector middleware', () => {
    const mockStorage = createMockStorage()

    const store = createPersistedStore<CustomStore>(
      'testPersistedStore',
      { storage: mockStorage },
      (set) => ({
        counter: 0,
        increment: () => set((state) => ({ ...state, counter: state.counter + 1 })),
      }),
    )

    const callback = jest.fn()
    store.subscribe((state) => state.counter, callback)

    store.getState().increment()
    expect(callback).toHaveBeenCalledWith(1, 0)
  })
})
