import {
  createPersistedRepositoryStore,
  createRepositoryStore,
  createScopedRepositoryStore,
} from '../repository.store'
import { StatusRepository } from '../store.types'

interface TestEntity {
  id: string
  name: string
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

describe('createScopedRepositoryStore', () => {
  it('should create a scoped store with repository and loading capabilities', () => {
    const store = createScopedRepositoryStore<TestEntity>('testScopedStore', (entity) => entity.id)

    // Check repository slice
    expect(store.getState().itemsMap).toEqual({})
    expect(typeof store.getState().addOne).toBe('function')
    expect(typeof store.getState().addMany).toBe('function')
    expect(typeof store.getState().removeOne).toBe('function')
    expect(typeof store.getState().clear).toBe('function')
    expect(typeof store.getState().items).toBe('function')
    expect(typeof store.getState().itemById).toBe('function')
    expect(typeof store.getState().itemsByIds).toBe('function')
    expect(typeof store.getState().itemCount).toBe('function')

    // Check loading slice
    expect(store.getState().loadingMap).toEqual({})
    expect(typeof store.getState().isLoading).toBe('function')
    expect(typeof store.getState().operation).toBe('function')
  })

  it('should support custom extensions', () => {
    interface Extensions {
      customMethod: () => string
    }

    const store = createScopedRepositoryStore<TestEntity, Extensions>(
      'testScopedStore',
      (entity) => entity.id,
      () => ({
        customMethod: () => 'custom value',
      }),
    )

    expect(store.getState().customMethod()).toBe('custom value')
  })

  it('should allow extensions to access set and get', () => {
    interface Extensions {
      totalItems: () => number
    }

    const store = createScopedRepositoryStore<TestEntity, Extensions>(
      'testScopedStore',
      (entity) => entity.id,
      (_set, get) => ({
        totalItems: () => get().itemCount(),
      }),
    )

    store.getState().addOne({ id: '1', name: 'Item 1' })
    store.getState().addOne({ id: '2', name: 'Item 2' })

    expect(store.getState().totalItems()).toBe(2)
  })
})

describe('createPersistedRepositoryStore', () => {
  it('should create a persisted store with repository, loading, and persist capabilities', () => {
    const mockStorage = createMockStorage()

    const store = createPersistedRepositoryStore<TestEntity>(
      'testPersistedRepoStore',
      (entity) => entity.id,
      { storage: mockStorage },
    )

    // Check repository slice
    expect(store.getState().itemsMap).toEqual({})
    expect(typeof store.getState().addOne).toBe('function')

    // Check loading slice
    expect(typeof store.getState().isLoading).toBe('function')

    // Check persist slice
    expect(typeof store.getState().isRehydrated).toBe('function')
    expect(store.getState().statusRehydrate).toBe(StatusRepository.Idle)
  })

  it('should support custom extensions with persisted store', () => {
    const mockStorage = createMockStorage()

    interface Extensions {
      findByName: (name: string) => TestEntity | undefined
    }

    const store = createPersistedRepositoryStore<TestEntity, Extensions>(
      'testPersistedRepoStore',
      (entity) => entity.id,
      { storage: mockStorage },
      (_set, get) => ({
        findByName: (name) => get().items().find((item) => item.name === name),
      }),
    )

    store.getState().addOne({ id: '1', name: 'Alice' })
    store.getState().addOne({ id: '2', name: 'Bob' })

    expect(store.getState().findByName('Alice')).toEqual({ id: '1', name: 'Alice' })
    expect(store.getState().findByName('Charlie')).toBeUndefined()
  })

  it('should integrate loading with repository operations', async () => {
    const mockStorage = createMockStorage()

    const store = createPersistedRepositoryStore<TestEntity>(
      'testPersistedRepoStore',
      (entity) => entity.id,
      { storage: mockStorage },
    )

    const fetchEntities = async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      store.getState().addMany([
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ])
    }

    const wrappedFetch = store.getState().operation(fetchEntities)

    expect(store.getState().isLoading()).toBe(false)
    const promise = wrappedFetch()
    expect(store.getState().isLoading()).toBe(true)
    await promise
    expect(store.getState().isLoading()).toBe(false)
    expect(store.getState().itemCount()).toBe(2)
  })
})

describe('createRepositoryStore', () => {
  describe('without persist options', () => {
    it('should create a non-persisted store with repository and loading', () => {
      const store = createRepositoryStore<TestEntity>('testRepoStore', (entity) => entity.id)

      // Check repository slice
      expect(store.getState().itemsMap).toEqual({})
      expect(typeof store.getState().addOne).toBe('function')

      // Check loading slice
      expect(typeof store.getState().isLoading).toBe('function')

      // Should NOT have persist slice
      expect((store.getState() as unknown as Record<string, unknown>).statusRehydrate).toBeUndefined()
    })

    it('should support custom extensions without persistence', () => {
      interface Extensions {
        getFirstItem: () => TestEntity | undefined
      }

      const store = createRepositoryStore<TestEntity, Extensions>(
        'testRepoStore',
        (entity) => entity.id,
        undefined,
        (_set, get) => ({
          getFirstItem: () => get().items()[0],
        }),
      )

      store.getState().addOne({ id: '1', name: 'First' })
      expect(store.getState().getFirstItem()).toEqual({ id: '1', name: 'First' })
    })
  })

  describe('with persist options', () => {
    it('should create a persisted store when persist options are provided', () => {
      const mockStorage = createMockStorage()

      const store = createRepositoryStore<TestEntity>(
        'testRepoStore',
        (entity) => entity.id,
        { storage: mockStorage },
      )

      // Check repository slice
      expect(typeof store.getState().addOne).toBe('function')

      // Check loading slice
      expect(typeof store.getState().isLoading).toBe('function')

      // Should have persist slice
      expect(typeof store.getState().isRehydrated).toBe('function')
      expect(store.getState().statusRehydrate).toBe(StatusRepository.Idle)
    })

    it('should support custom extensions with persistence', () => {
      const mockStorage = createMockStorage()

      interface Extensions {
        getAllNames: () => string[]
      }

      const store = createRepositoryStore<TestEntity, Extensions>(
        'testRepoStore',
        (entity) => entity.id,
        { storage: mockStorage },
        (_set, get) => ({
          getAllNames: () => get().items().map((item) => item.name),
        }),
      )

      store.getState().addOne({ id: '1', name: 'Alice' })
      store.getState().addOne({ id: '2', name: 'Bob' })

      expect(store.getState().getAllNames()).toEqual(['Alice', 'Bob'])
    })
  })
})
