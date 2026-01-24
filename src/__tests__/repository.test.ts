import { create } from 'zustand'

import { createRepositorySlice, RepositoryStore } from '../repository'

interface TestEntity {
  id: string
  name: string
  value?: number
  nested?: {
    field: string
  }
}

describe('createRepositorySlice', () => {
  const createTestStore = () =>
    create<RepositoryStore<TestEntity, NonNullable<unknown>>>()(
      createRepositorySlice((entity) => entity.id),
    )

  describe('initial state', () => {
    it('should have an empty itemsMap', () => {
      const store = createTestStore()
      expect(store.getState().itemsMap).toEqual({})
    })
  })

  describe('itemCount', () => {
    it('should return 0 for empty store', () => {
      const store = createTestStore()
      expect(store.getState().itemCount()).toBe(0)
    })

    it('should return correct count after adding items', () => {
      const store = createTestStore()
      store.getState().addOne({ id: '1', name: 'Item 1' })
      store.getState().addOne({ id: '2', name: 'Item 2' })
      expect(store.getState().itemCount()).toBe(2)
    })
  })

  describe('items', () => {
    it('should return empty array for empty store', () => {
      const store = createTestStore()
      expect(store.getState().items()).toEqual([])
    })

    it('should return all items as array', () => {
      const store = createTestStore()
      const item1 = { id: '1', name: 'Item 1' }
      const item2 = { id: '2', name: 'Item 2' }
      store.getState().addOne(item1)
      store.getState().addOne(item2)

      const items = store.getState().items()
      expect(items).toHaveLength(2)
      expect(items).toContainEqual(item1)
      expect(items).toContainEqual(item2)
    })
  })

  describe('itemById', () => {
    it('should return undefined for non-existent id', () => {
      const store = createTestStore()
      expect(store.getState().itemById('non-existent')).toBeUndefined()
    })

    it('should return undefined when id is undefined', () => {
      const store = createTestStore()
      expect(store.getState().itemById(undefined)).toBeUndefined()
    })

    it('should return the correct item by id', () => {
      const store = createTestStore()
      const item = { id: '1', name: 'Test Item' }
      store.getState().addOne(item)
      expect(store.getState().itemById('1')).toEqual(item)
    })
  })

  describe('itemsByIds', () => {
    it('should return empty array for empty ids', () => {
      const store = createTestStore()
      expect(store.getState().itemsByIds([])).toEqual([])
    })

    it('should return items matching the ids', () => {
      const store = createTestStore()
      const item1 = { id: '1', name: 'Item 1' }
      const item2 = { id: '2', name: 'Item 2' }
      const item3 = { id: '3', name: 'Item 3' }
      store.getState().addOne(item1)
      store.getState().addOne(item2)
      store.getState().addOne(item3)

      const result = store.getState().itemsByIds(['1', '3'])
      expect(result).toHaveLength(2)
      expect(result).toContainEqual(item1)
      expect(result).toContainEqual(item3)
    })

    it('should filter out non-existent ids', () => {
      const store = createTestStore()
      const item1 = { id: '1', name: 'Item 1' }
      store.getState().addOne(item1)

      const result = store.getState().itemsByIds(['1', 'non-existent'])
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(item1)
    })
  })

  describe('itemsWhere', () => {
    it('should return empty array when no items match', () => {
      const store = createTestStore()
      store.getState().addOne({ id: '1', name: 'Item 1', value: 10 })
      store.getState().addOne({ id: '2', name: 'Item 2', value: 20 })

      const result = store.getState().itemsWhere((item) => item.value! > 100)
      expect(result).toEqual([])
    })

    it('should return matching items', () => {
      const store = createTestStore()
      store.getState().addOne({ id: '1', name: 'Item 1', value: 10 })
      store.getState().addOne({ id: '2', name: 'Item 2', value: 20 })
      store.getState().addOne({ id: '3', name: 'Item 3', value: 30 })

      const result = store.getState().itemsWhere((item) => item.value! >= 20)
      expect(result).toHaveLength(2)
      expect(result.map((i) => i.id)).toContain('2')
      expect(result.map((i) => i.id)).toContain('3')
    })

    it('should provide key as second argument', () => {
      const store = createTestStore()
      store.getState().addOne({ id: '1', name: 'Item 1' })
      store.getState().addOne({ id: '2', name: 'Item 2' })

      const result = store.getState().itemsWhere((_, key) => key === '1')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('should return all items when predicate always returns true', () => {
      const store = createTestStore()
      store.getState().addOne({ id: '1', name: 'Item 1' })
      store.getState().addOne({ id: '2', name: 'Item 2' })

      const result = store.getState().itemsWhere(() => true)
      expect(result).toHaveLength(2)
    })
  })

  describe('findItem', () => {
    it('should return undefined when no item matches', () => {
      const store = createTestStore()
      store.getState().addOne({ id: '1', name: 'Item 1', value: 10 })

      const result = store.getState().findItem((item) => item.value! > 100)
      expect(result).toBeUndefined()
    })

    it('should return first matching item', () => {
      const store = createTestStore()
      store.getState().addOne({ id: '1', name: 'Item 1', value: 10 })
      store.getState().addOne({ id: '2', name: 'Item 2', value: 20 })
      store.getState().addOne({ id: '3', name: 'Item 3', value: 30 })

      const result = store.getState().findItem((item) => item.value! >= 20)
      expect(result).toBeDefined()
      expect(['2', '3']).toContain(result!.id)
    })

    it('should provide key as second argument', () => {
      const store = createTestStore()
      store.getState().addOne({ id: '1', name: 'Item 1' })
      store.getState().addOne({ id: '2', name: 'Item 2' })

      const result = store.getState().findItem((_, key) => key === '2')
      expect(result).toBeDefined()
      expect(result!.id).toBe('2')
    })

    it('should return undefined on empty store', () => {
      const store = createTestStore()
      const result = store.getState().findItem(() => true)
      expect(result).toBeUndefined()
    })
  })

  describe('addOne', () => {
    it('should add a single item', () => {
      const store = createTestStore()
      const item = { id: '1', name: 'Test Item' }
      store.getState().addOne(item)
      expect(store.getState().itemById('1')).toEqual(item)
    })

    it('should update existing item with same id', () => {
      const store = createTestStore()
      store.getState().addOne({ id: '1', name: 'Original' })
      store.getState().addOne({ id: '1', name: 'Updated' })
      expect(store.getState().itemById('1')?.name).toBe('Updated')
      expect(store.getState().itemCount()).toBe(1)
    })

    describe('isShallow option', () => {
      it('should not update if shallow equal', () => {
        const store = createTestStore()
        const item = { id: '1', name: 'Test' }
        store.getState().addOne(item)

        const stateBefore = store.getState().itemsMap
        store.getState().addOne({ id: '1', name: 'Test' }, { isShallow: true })
        const stateAfter = store.getState().itemsMap

        expect(stateBefore).toBe(stateAfter)
      })

      it('should update if not shallow equal', () => {
        const store = createTestStore()
        store.getState().addOne({ id: '1', name: 'Original' })
        store.getState().addOne({ id: '1', name: 'Updated' }, { isShallow: true })
        expect(store.getState().itemById('1')?.name).toBe('Updated')
      })
    })

    describe('shallowFields option', () => {
      it('should not update if specified fields are equal', () => {
        const store = createTestStore()
        store.getState().addOne({ id: '1', name: 'Test', value: 10 })

        const stateBefore = store.getState().itemsMap
        store
          .getState()
          .addOne({ id: '1', name: 'Different', value: 10 }, { shallowFields: ['value'] })
        const stateAfter = store.getState().itemsMap

        expect(stateBefore).toBe(stateAfter)
      })

      it('should update if specified fields differ', () => {
        const store = createTestStore()
        store.getState().addOne({ id: '1', name: 'Test', value: 10 })
        store.getState().addOne({ id: '1', name: 'Test', value: 20 }, { shallowFields: ['value'] })
        expect(store.getState().itemById('1')?.value).toBe(20)
      })

      it('should work with nested fields', () => {
        const store = createTestStore()
        store.getState().addOne({ id: '1', name: 'Test', nested: { field: 'value1' } })

        const stateBefore = store.getState().itemsMap
        store
          .getState()
          .addOne(
            { id: '1', name: 'Different', nested: { field: 'value1' } },
            { shallowFields: ['nested.field'] },
          )
        const stateAfter = store.getState().itemsMap

        expect(stateBefore).toBe(stateAfter)
      })

      it('should process normally with empty shallowFields array', () => {
        const store = createTestStore()
        store.getState().addOne({ id: '1', name: 'Test', value: 10 })
        store.getState().addOne({ id: '1', name: 'Updated', value: 10 }, { shallowFields: [] })
        // Empty shallowFields should not skip the update
        expect(store.getState().itemById('1')?.name).toBe('Updated')
      })

      it('should check shallowFields on new entity without prior existence', () => {
        const store = createTestStore()
        // Adding an entity that doesn't exist yet with shallowFields
        store.getState().addOne({ id: '1', name: 'New', value: 10 }, { shallowFields: ['value'] })
        expect(store.getState().itemById('1')?.name).toBe('New')
      })
    })

    describe('isFlush option', () => {
      it('should clear store before adding', () => {
        const store = createTestStore()
        store.getState().addOne({ id: '1', name: 'Item 1' })
        store.getState().addOne({ id: '2', name: 'Item 2' })
        store.getState().addOne({ id: '3', name: 'Item 3' }, { isFlush: true })

        expect(store.getState().itemCount()).toBe(1)
        expect(store.getState().itemById('3')).toBeDefined()
        expect(store.getState().itemById('1')).toBeUndefined()
      })
    })

    describe('isUnique option', () => {
      it('should replace all items with just the new one', () => {
        const store = createTestStore()
        store.getState().addOne({ id: '1', name: 'Item 1' })
        store.getState().addOne({ id: '2', name: 'Item 2' })
        store.getState().addOne({ id: '3', name: 'Item 3' }, { isUnique: true })

        expect(store.getState().itemCount()).toBe(1)
        expect(store.getState().itemById('3')).toBeDefined()
      })
    })

    describe('removeKey option', () => {
      it('should remove specified key before adding', () => {
        const store = createTestStore()
        store.getState().addOne({ id: '1', name: 'Item 1' })
        store.getState().addOne({ id: '2', name: 'Item 2' }, { removeKey: '1' })

        expect(store.getState().itemById('1')).toBeUndefined()
        expect(store.getState().itemById('2')).toBeDefined()
      })
    })

    describe('isClear option', () => {
      it('should skip shallow comparison when isClear is true', () => {
        const store = createTestStore()
        store.getState().addOne({ id: '1', name: 'Test' })

        // With isClear, shallow comparison is skipped even if values are same
        store.getState().addOne({ id: '1', name: 'Test' }, { isClear: true, isShallow: true })

        // The item should still be added (isClear bypasses isShallow check)
        expect(store.getState().itemById('1')?.name).toBe('Test')
      })

      it('should skip shallowFields check when isClear is true', () => {
        const store = createTestStore()
        store.getState().addOne({ id: '1', name: 'Test', value: 10 })

        // With isClear, shallowFields comparison is skipped
        store
          .getState()
          .addOne(
            { id: '1', name: 'Updated', value: 10 },
            { isClear: true, shallowFields: ['value'] },
          )

        expect(store.getState().itemById('1')?.name).toBe('Updated')
      })

      it('should skip removeKey when isClear is true', () => {
        const store = createTestStore()
        store.getState().addOne({ id: '1', name: 'Item 1' })
        store.getState().addOne({ id: '2', name: 'Item 2' }, { isClear: true, removeKey: '1' })

        // removeKey should be skipped when isClear is true
        expect(store.getState().itemById('1')).toBeDefined()
        expect(store.getState().itemById('2')).toBeDefined()
      })
    })
  })

  describe('addMany', () => {
    it('should add multiple items from array', () => {
      const store = createTestStore()
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ]
      store.getState().addMany(items)
      expect(store.getState().itemCount()).toBe(2)
    })

    it('should add multiple items from Record', () => {
      const store = createTestStore()
      const items: Record<string, TestEntity> = {
        '1': { id: '1', name: 'Item 1' },
        '2': { id: '2', name: 'Item 2' },
      }
      store.getState().addMany(items)
      expect(store.getState().itemCount()).toBe(2)
    })

    it('should merge with existing items', () => {
      const store = createTestStore()
      store.getState().addOne({ id: '1', name: 'Item 1' })
      store.getState().addMany([{ id: '2', name: 'Item 2' }])

      expect(store.getState().itemCount()).toBe(2)
      expect(store.getState().itemById('1')).toBeDefined()
      expect(store.getState().itemById('2')).toBeDefined()
    })

    describe('isFlush option', () => {
      it('should clear store before adding many', () => {
        const store = createTestStore()
        store.getState().addOne({ id: '1', name: 'Item 1' })
        store.getState().addMany(
          [
            { id: '2', name: 'Item 2' },
            { id: '3', name: 'Item 3' },
          ],
          { isFlush: true },
        )

        expect(store.getState().itemCount()).toBe(2)
        expect(store.getState().itemById('1')).toBeUndefined()
      })

      it('should clear store even with empty array when isFlush is true', () => {
        const store = createTestStore()
        store.getState().addOne({ id: '1', name: 'Item 1' })
        store.getState().addMany([], { isFlush: true })

        expect(store.getState().itemCount()).toBe(0)
      })

      it('should not clear store with empty array when isFlush is false', () => {
        const store = createTestStore()
        store.getState().addOne({ id: '1', name: 'Item 1' })
        store.getState().addMany([])

        expect(store.getState().itemCount()).toBe(1)
      })
    })

    it('should handle null/undefined items gracefully', () => {
      const store = createTestStore()
      // @ts-expect-error - testing runtime behavior
      store.getState().addMany(null)
      expect(store.getState().itemCount()).toBe(0)
    })
  })

  describe('clear', () => {
    it('should remove all items', () => {
      const store = createTestStore()
      store.getState().addOne({ id: '1', name: 'Item 1' })
      store.getState().addOne({ id: '2', name: 'Item 2' })
      store.getState().clear()
      expect(store.getState().itemCount()).toBe(0)
    })

    it('should be a no-op when store is already empty', () => {
      const store = createTestStore()
      const stateBefore = store.getState().itemsMap
      store.getState().clear()
      const stateAfter = store.getState().itemsMap
      expect(stateBefore).toBe(stateAfter)
    })
  })

  describe('removeOne', () => {
    it('should remove an item by key', () => {
      const store = createTestStore()
      store.getState().addOne({ id: '1', name: 'Item 1' })
      store.getState().addOne({ id: '2', name: 'Item 2' })
      store.getState().removeOne('1')

      expect(store.getState().itemById('1')).toBeUndefined()
      expect(store.getState().itemById('2')).toBeDefined()
      expect(store.getState().itemCount()).toBe(1)
    })

    it('should handle removal of non-existent key', () => {
      const store = createTestStore()
      store.getState().addOne({ id: '1', name: 'Item 1' })
      store.getState().removeOne('non-existent')
      expect(store.getState().itemCount()).toBe(1)
    })
  })

  describe('extensions', () => {
    it('should allow adding custom methods via extensions', () => {
      interface CustomExtensions {
        customMethod: () => string
        customState: string
      }

      const store = create<RepositoryStore<TestEntity, CustomExtensions>>()(
        createRepositorySlice<TestEntity, CustomExtensions>(
          (entity) => entity.id,
          () => ({
            customMethod: () => 'custom value',
            customState: 'initial',
          }),
        ),
      )

      expect(store.getState().customMethod()).toBe('custom value')
      expect(store.getState().customState).toBe('initial')
    })

    it('should provide set and get to extensions', () => {
      interface CustomExtensions {
        incrementCounter: () => void
        counter: number
      }

      const store = create<RepositoryStore<TestEntity, CustomExtensions>>()(
        createRepositorySlice<TestEntity, CustomExtensions>(
          (entity) => entity.id,
          (set, get) => ({
            counter: 0,
            incrementCounter: () => {
              set((state) => ({ ...state, counter: get().counter + 1 }))
            },
          }),
        ),
      )

      store.getState().incrementCounter()
      store.getState().incrementCounter()
      expect(store.getState().counter).toBe(2)
    })
  })
})
