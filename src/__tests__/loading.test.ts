import { jest } from '@jest/globals'
import { create } from 'zustand'

import { createLoadingSlice, LoadingStore } from '../loading'
import { StatusRepository } from '../store.types'

describe('createLoadingSlice', () => {
  const createTestStore = () => create<LoadingStore>()(createLoadingSlice)

  describe('initial state', () => {
    it('should have an empty loadingMap', () => {
      const store = createTestStore()
      expect(store.getState().loadingMap).toEqual({})
    })
  })

  describe('isLoading', () => {
    it('should return false when no operations are loading', () => {
      const store = createTestStore()
      expect(store.getState().isLoading()).toBe(false)
    })

    it('should return true when an operation is loading', () => {
      const store = createTestStore()
      store.setState({
        loadingMap: { testOperation: StatusRepository.Loading },
      })
      expect(store.getState().isLoading()).toBe(true)
    })

    it('should return false when all operations are complete', () => {
      const store = createTestStore()
      store.setState({
        loadingMap: {
          op1: StatusRepository.Success,
          op2: StatusRepository.Idle,
        },
      })
      expect(store.getState().isLoading()).toBe(false)
    })
  })

  describe('isLoadingKey', () => {
    it('should handle falsy id values', () => {
      const store = createTestStore()
      store.setState({
        loadingMap: { unknown: StatusRepository.Loading },
      })
      // Falsy values (empty string, null-ish) should return 'unknown'
      // @ts-expect-error - testing falsy values
      expect(store.getState().isLoadingKey(null)).toBe(true)
      // @ts-expect-error - testing falsy values
      expect(store.getState().isLoadingKey(undefined)).toBe(true)
      expect(store.getState().isLoadingKey('')).toBe(true)
    })

    it('should return true for a loading key', () => {
      const store = createTestStore()
      store.setState({
        loadingMap: { myKey: StatusRepository.Loading },
      })
      expect(store.getState().isLoadingKey('myKey')).toBe(true)
    })

    it('should return false for a non-loading key', () => {
      const store = createTestStore()
      store.setState({
        loadingMap: { myKey: StatusRepository.Success },
      })
      expect(store.getState().isLoadingKey('myKey')).toBe(false)
    })

    it('should return false for an unknown key', () => {
      const store = createTestStore()
      expect(store.getState().isLoadingKey('unknownKey')).toBe(false)
    })

    it('should work with numeric keys', () => {
      const store = createTestStore()
      store.setState({
        loadingMap: { 123: StatusRepository.Loading },
      })
      expect(store.getState().isLoadingKey(123)).toBe(true)
    })

    it('should work with function keys using name', () => {
      const store = createTestStore()
      function myFunction() {}
      store.setState({
        loadingMap: { myFunction: StatusRepository.Loading },
      })
      expect(store.getState().isLoadingKey(myFunction)).toBe(true)
    })

    it('should work with anonymous function without name', () => {
      const store = createTestStore()
      // Create an anonymous function with no name property
      const anonymousFn = (() => {
        const fn = function () {}
        Object.defineProperty(fn, 'name', { value: '' })
        return fn
      })()
      // Anonymous functions without name fall back to toString()
      store.setState({
        loadingMap: { [anonymousFn.toString()]: StatusRepository.Loading },
      })
      expect(store.getState().isLoadingKey(anonymousFn)).toBe(true)
    })

    it('should work with function keys using code property', () => {
      const store = createTestStore()
      const fn = Object.assign(() => {}, { code: 'customCode' })
      store.setState({
        loadingMap: { customCode: StatusRepository.Loading },
      })
      expect(store.getState().isLoadingKey(fn)).toBe(true)
    })

    it('should work with object keys having code property', () => {
      const store = createTestStore()
      // Objects with code property use toString() which returns "[object Object]"
      // This is expected behavior - only functions get code property handling
      const objKey = { code: 'objectCode' }
      store.setState({
        loadingMap: { [objKey.toString()]: StatusRepository.Loading },
      })
      expect(store.getState().isLoadingKey(objKey)).toBe(true)
    })
  })

  describe('clearLoaders', () => {
    it('should clear all loading states', () => {
      const store = createTestStore()
      store.setState({
        loadingMap: {
          op1: StatusRepository.Loading,
          op2: StatusRepository.Success,
        },
      })
      store.getState().clearLoaders()
      expect(store.getState().loadingMap).toEqual({})
    })

    it('should be a no-op when loadingMap is already empty', () => {
      const store = createTestStore()
      const initialState = store.getState()
      store.getState().clearLoaders()
      expect(store.getState().loadingMap).toEqual({})
    })
  })

  describe('operation', () => {
    it('should wrap an async function and track loading state', async () => {
      const store = createTestStore()
      const mockFn = jest.fn<() => Promise<string>>().mockResolvedValue('result')

      const wrappedFn = store.getState().operation(mockFn)
      const promise = wrappedFn()

      // Should be loading during execution
      expect(store.getState().isLoading()).toBe(true)

      const result = await promise
      expect(result).toBe('result')
      expect(mockFn).toHaveBeenCalled()
    })

    it('should set loading state before execution', async () => {
      const store = createTestStore()
      let loadingDuringExecution = false

      const mockFn = jest.fn<() => Promise<string>>().mockImplementation(async () => {
        loadingDuringExecution = store.getState().isLoading()
        return 'result'
      })

      const wrappedFn = store.getState().operation(mockFn)
      await wrappedFn()

      expect(loadingDuringExecution).toBe(true)
    })

    it('should clear loading state after execution', async () => {
      const store = createTestStore()
      const mockFn = jest.fn<() => Promise<string>>().mockResolvedValue('result')

      const wrappedFn = store.getState().operation(mockFn)
      await wrappedFn()

      expect(store.getState().isLoading()).toBe(false)
    })

    it('should clear loading state even on error', async () => {
      const store = createTestStore()
      const mockFn = jest.fn<() => Promise<string>>().mockRejectedValue(new Error('test error'))

      const wrappedFn = store.getState().operation(mockFn)

      await expect(wrappedFn()).rejects.toThrow('test error')
      expect(store.getState().isLoading()).toBe(false)
    })

    it('should track string arguments as additional loading keys', async () => {
      const store = createTestStore()
      const mockFn = jest.fn<(id: string) => Promise<string>>().mockImplementation(async (id) => {
        // Check that the string argument is also tracked
        expect(store.getState().isLoadingKey(id)).toBe(true)
        return 'result'
      })

      const wrappedFn = store.getState().operation(mockFn)
      await wrappedFn('item-123')

      expect(mockFn).toHaveBeenCalledWith('item-123')
    })

    it('should track array of string arguments as loading keys', async () => {
      const store = createTestStore()
      const mockFn = jest.fn<(ids: string[]) => Promise<string>>().mockImplementation(async () => {
        expect(store.getState().isLoadingKey('id1')).toBe(true)
        expect(store.getState().isLoadingKey('id2')).toBe(true)
        return 'result'
      })

      const wrappedFn = store.getState().operation(mockFn)
      await wrappedFn(['id1', 'id2'])
    })

    it('should add code property to wrapped function', () => {
      const store = createTestStore()
      function namedFunction() {
        return Promise.resolve('result')
      }

      const wrappedFn = store.getState().operation(namedFunction)
      expect(wrappedFn.code).toBe('namedFunction')
    })

    it('should preserve the return value of the wrapped function', async () => {
      const store = createTestStore()
      const mockFn = jest.fn<() => Promise<{ data: number[] }>>().mockResolvedValue({ data: [1, 2, 3] })

      const wrappedFn = store.getState().operation(mockFn)
      const result = await wrappedFn()

      expect(result).toEqual({ data: [1, 2, 3] })
    })

    it('should pass arguments to the wrapped function', async () => {
      const store = createTestStore()
      const mockFn = jest.fn<(a: number, b: string) => Promise<string>>().mockImplementation(async (a, b) => {
        return `${a}-${b}`
      })

      const wrappedFn = store.getState().operation(mockFn)
      const result = await wrappedFn(42, 'test')

      expect(result).toBe('42-test')
      expect(mockFn).toHaveBeenCalledWith(42, 'test')
    })
  })
})
