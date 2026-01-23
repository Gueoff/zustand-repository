import { createStore, StoreApi } from 'zustand/vanilla'

import { createSelectors } from '../selector'

interface TestStore {
  count: number
  name: string
  items: string[]
  increment: () => void
}

// Note: createSelectors is designed to work with React's UseBoundStore
// For testing purposes, we create a minimal mock that simulates the store behavior
const createMockUseBoundStore = <T extends object>(initialState: T) => {
  const store = createStore<T>()(() => initialState)

  // Create a mock that simulates UseBoundStore behavior
  const useBoundStore = ((selector?: (state: T) => unknown) => {
    if (selector) {
      return selector(store.getState())
    }
    return store.getState()
  }) as StoreApi<T> & {
    (selector?: (state: T) => unknown): unknown
    getState: () => T
    setState: StoreApi<T>['setState']
    subscribe: StoreApi<T>['subscribe']
  }

  useBoundStore.getState = store.getState
  useBoundStore.setState = store.setState
  useBoundStore.subscribe = store.subscribe

  return useBoundStore
}

describe('createSelectors', () => {
  const createTestStore = () => {
    const initialState: TestStore = {
      count: 0,
      name: 'test',
      items: ['a', 'b', 'c'],
      increment: function () {
        // Implementation would be handled by zustand
      },
    }
    return createMockUseBoundStore(initialState)
  }

  it('should add use object to store', () => {
    const store = createTestStore()
    // @ts-expect-error - testing with mock
    const storeWithSelectors = createSelectors(store)

    expect(storeWithSelectors.use).toBeDefined()
    expect(typeof storeWithSelectors.use).toBe('object')
  })

  it('should create selectors for all state properties', () => {
    const store = createTestStore()
    // @ts-expect-error - testing with mock
    const storeWithSelectors = createSelectors(store)
    const use = storeWithSelectors.use as Record<string, () => unknown>

    expect(typeof use.count).toBe('function')
    expect(typeof use.name).toBe('function')
    expect(typeof use.items).toBe('function')
    expect(typeof use.increment).toBe('function')
  })

  it('should return correct values from selectors', () => {
    const store = createTestStore()
    // @ts-expect-error - testing with mock
    const storeWithSelectors = createSelectors(store)
    const use = storeWithSelectors.use as Record<string, () => unknown>

    // Since our mock simulates the selector behavior, we can call them directly
    expect(use.count()).toBe(0)
    expect(use.name()).toBe('test')
    expect(use.items()).toEqual(['a', 'b', 'c'])
  })

  it('should preserve original store functionality', () => {
    const store = createTestStore()
    // @ts-expect-error - testing with mock
    const storeWithSelectors = createSelectors(store)

    expect(storeWithSelectors.getState()).toEqual(store.getState())
    expect(storeWithSelectors.setState).toBe(store.setState)
    expect(storeWithSelectors.subscribe).toBe(store.subscribe)
  })

  it('should work with stores having nested objects', () => {
    interface NestedStore {
      user: {
        name: string
        age: number
      }
      settings: {
        theme: string
      }
    }

    const nestedStore = createMockUseBoundStore<NestedStore>({
      user: { name: 'John', age: 30 },
      settings: { theme: 'dark' },
    })

    // @ts-expect-error - testing with mock
    const storeWithSelectors = createSelectors(nestedStore)
    const use = storeWithSelectors.use as Record<string, () => unknown>

    expect(use.user()).toEqual({ name: 'John', age: 30 })
    expect(use.settings()).toEqual({ theme: 'dark' })
  })

  it('should generate selector keys for all state keys', () => {
    const store = createTestStore()
    // @ts-expect-error - testing with mock
    const storeWithSelectors = createSelectors(store)

    const stateKeys = Object.keys(store.getState())
    const selectorKeys = Object.keys(storeWithSelectors.use)

    expect(selectorKeys.sort()).toEqual(stateKeys.sort())
  })
})
