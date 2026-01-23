import { create } from 'zustand'

import { createPersistSlice, PersistStore } from '../persist'
import { StatusRepository } from '../store.types'

describe('createPersistSlice', () => {
  const createTestStore = () => create<PersistStore>()(createPersistSlice)

  describe('initial state', () => {
    it('should have Idle status initially', () => {
      const store = createTestStore()
      expect(store.getState().statusRehydrate).toBe(StatusRepository.Idle)
    })
  })

  describe('isRehydrated', () => {
    it('should return false when status is Idle', () => {
      const store = createTestStore()
      expect(store.getState().isRehydrated()).toBe(false)
    })

    it('should return false when status is Loading', () => {
      const store = createTestStore()
      store.setState({ statusRehydrate: StatusRepository.Loading })
      expect(store.getState().isRehydrated()).toBe(false)
    })

    it('should return true when status is Success', () => {
      const store = createTestStore()
      store.setState({ statusRehydrate: StatusRepository.Success })
      expect(store.getState().isRehydrated()).toBe(true)
    })

    it('should return true when status is Error', () => {
      const store = createTestStore()
      store.setState({ statusRehydrate: StatusRepository.Error })
      expect(store.getState().isRehydrated()).toBe(true)
    })
  })

  describe('onRehydrateStorage', () => {
    it('should set status to Success when called without error', () => {
      const store = createTestStore()
      store.getState().onRehydrateStorage()
      expect(store.getState().statusRehydrate).toBe(StatusRepository.Success)
    })

    it('should set status to Success when called with state but no error', () => {
      const store = createTestStore()
      const mockState = store.getState()
      store.getState().onRehydrateStorage(mockState)
      expect(store.getState().statusRehydrate).toBe(StatusRepository.Success)
    })

    it('should set status to Error when called with an error', () => {
      const store = createTestStore()
      store.getState().onRehydrateStorage(undefined, new Error('Rehydration failed'))
      expect(store.getState().statusRehydrate).toBe(StatusRepository.Error)
    })

    it('should set status to Error when called with state and error', () => {
      const store = createTestStore()
      const mockState = store.getState()
      store.getState().onRehydrateStorage(mockState, new Error('Rehydration failed'))
      expect(store.getState().statusRehydrate).toBe(StatusRepository.Error)
    })

    it('should handle various error types', () => {
      const store = createTestStore()

      // String error
      store.getState().onRehydrateStorage(undefined, 'string error')
      expect(store.getState().statusRehydrate).toBe(StatusRepository.Error)

      // Reset
      store.setState({ statusRehydrate: StatusRepository.Idle })

      // Object error
      store.getState().onRehydrateStorage(undefined, { message: 'object error' })
      expect(store.getState().statusRehydrate).toBe(StatusRepository.Error)
    })
  })

  describe('integration with zustand persist', () => {
    it('should work as expected in persist onRehydrateStorage callback pattern', () => {
      const store = createTestStore()

      // Simulate zustand persist behavior
      // 1. Initial state (before rehydration)
      expect(store.getState().isRehydrated()).toBe(false)

      // 2. Rehydration completes successfully
      store.getState().onRehydrateStorage(store.getState())
      expect(store.getState().isRehydrated()).toBe(true)
      expect(store.getState().statusRehydrate).toBe(StatusRepository.Success)
    })

    it('should handle rehydration failure correctly', () => {
      const store = createTestStore()

      // Simulate rehydration failure
      store.getState().onRehydrateStorage(undefined, new Error('Storage unavailable'))

      // Even on error, isRehydrated should be true (process completed, just with error)
      expect(store.getState().isRehydrated()).toBe(true)
      expect(store.getState().statusRehydrate).toBe(StatusRepository.Error)
    })
  })
})
