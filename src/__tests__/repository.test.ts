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
    // =====================================================
    // BASIC FUNCTIONALITY
    // =====================================================
    describe('basic functionality', () => {
      describe('with Array input', () => {
        it('should add multiple items from array', () => {
          const store = createTestStore()
          const items = [
            { id: '1', name: 'Item 1' },
            { id: '2', name: 'Item 2' },
          ]
          store.getState().addMany(items)
          expect(store.getState().itemCount()).toBe(2)
        })

        it('should handle empty array', () => {
          const store = createTestStore()
          store.getState().addOne({ id: '1', name: 'Item 1' })
          store.getState().addMany([])
          expect(store.getState().itemCount()).toBe(1)
        })

        it('should merge with existing items', () => {
          const store = createTestStore()
          store.getState().addOne({ id: '1', name: 'Item 1' })
          store.getState().addMany([{ id: '2', name: 'Item 2' }])

          expect(store.getState().itemCount()).toBe(2)
          expect(store.getState().itemById('1')).toBeDefined()
          expect(store.getState().itemById('2')).toBeDefined()
        })

        it('should update existing items with same key', () => {
          const store = createTestStore()
          store.getState().addMany([{ id: '1', name: 'Original' }])
          store.getState().addMany([{ id: '1', name: 'Updated' }])

          expect(store.getState().itemById('1')?.name).toBe('Updated')
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

    // =====================================================
    // DEFAULT BEHAVIOR (no options) - Always updates
    // =====================================================
    describe('default behavior (no options)', () => {
      describe('with Array input', () => {
        it('should always update state even with same references', () => {
          const store = createTestStore()
          const item1 = { id: '1', name: 'Item 1' }
          const item2 = { id: '2', name: 'Item 2' }

          store.getState().addMany([item1, item2])
          const stateAfterFirstAdd = store.getState()

          // Add the same items again (same references) - should still update
          store.getState().addMany([item1, item2])
          const stateAfterSecondAdd = store.getState()

          // State reference should be different (update triggered)
          expect(stateAfterSecondAdd).not.toBe(stateAfterFirstAdd)
        })

        it('should always update state with new references and same values', () => {
          const store = createTestStore()
          store.getState().addMany([{ id: '1', name: 'Item 1' }])
          const stateAfterFirstAdd = store.getState()

          store.getState().addMany([{ id: '1', name: 'Item 1' }])
          const stateAfterSecondAdd = store.getState()

          expect(stateAfterSecondAdd).not.toBe(stateAfterFirstAdd)
        })

        it('should update state with partially new items', () => {
          const store = createTestStore()
          const item1 = { id: '1', name: 'Item 1' }
          const item2 = { id: '2', name: 'Item 2' }

          store.getState().addMany([item1])
          const stateAfterFirstAdd = store.getState()

          store.getState().addMany([item1, item2])
          const stateAfterSecondAdd = store.getState()

          expect(stateAfterSecondAdd).not.toBe(stateAfterFirstAdd)
          expect(store.getState().itemCount()).toBe(2)
        })
      })

    })

    // =====================================================
    // isFlush OPTION
    // =====================================================
    describe('isFlush option', () => {
      describe('with Array input', () => {
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
          expect(store.getState().itemById('2')).toBeDefined()
          expect(store.getState().itemById('3')).toBeDefined()
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

        it('should replace all content with single item', () => {
          const store = createTestStore()
          store.getState().addMany([
            { id: '1', name: 'Item 1' },
            { id: '2', name: 'Item 2' },
            { id: '3', name: 'Item 3' },
          ])
          store.getState().addMany([{ id: '4', name: 'Item 4' }], { isFlush: true })

          expect(store.getState().itemCount()).toBe(1)
          expect(store.getState().itemById('4')).toBeDefined()
        })
      })

      it('should handle null with isFlush (clears store)', () => {
        const store = createTestStore()
        store.getState().addOne({ id: '1', name: 'Item 1' })
        // @ts-expect-error - testing runtime behavior
        store.getState().addMany(null, { isFlush: true })

        expect(store.getState().itemCount()).toBe(0)
      })
    })

    // =====================================================
    // isShallow OPTION - Shallow comparison
    // =====================================================
    describe('isShallow option', () => {
      describe('with primitive values (1 level)', () => {
        describe('with Array input', () => {
          it('should not update when all items are shallow equal', () => {
            const store = createTestStore()
            store.getState().addMany([
              { id: '1', name: 'Item 1', value: 10 },
              { id: '2', name: 'Item 2', value: 20 },
            ])
            const stateAfterFirstAdd = store.getState()

            // Add items with same values but new references
            store.getState().addMany(
              [
                { id: '1', name: 'Item 1', value: 10 },
                { id: '2', name: 'Item 2', value: 20 },
              ],
              { isShallow: true },
            )
            const stateAfterSecondAdd = store.getState()

            expect(stateAfterSecondAdd).toBe(stateAfterFirstAdd)
          })

          it('should update when at least one item differs', () => {
            const store = createTestStore()
            store.getState().addMany([
              { id: '1', name: 'Item 1', value: 10 },
              { id: '2', name: 'Item 2', value: 20 },
            ])
            const stateAfterFirstAdd = store.getState()

            // Add items with one value changed
            store.getState().addMany(
              [
                { id: '1', name: 'Item 1', value: 10 },
                { id: '2', name: 'Item 2', value: 999 }, // Changed
              ],
              { isShallow: true },
            )
            const stateAfterSecondAdd = store.getState()

            expect(stateAfterSecondAdd).not.toBe(stateAfterFirstAdd)
            expect(store.getState().itemById('2')?.value).toBe(999)
          })

          it('should update when adding new items', () => {
            const store = createTestStore()
            store.getState().addMany([{ id: '1', name: 'Item 1' }])
            const stateAfterFirstAdd = store.getState()

            store.getState().addMany(
              [
                { id: '1', name: 'Item 1' },
                { id: '2', name: 'Item 2' }, // New item
              ],
              { isShallow: true },
            )
            const stateAfterSecondAdd = store.getState()

            expect(stateAfterSecondAdd).not.toBe(stateAfterFirstAdd)
            expect(store.getState().itemCount()).toBe(2)
          })

          it('should update when item does not exist', () => {
            const store = createTestStore()
            const stateBeforeAdd = store.getState()

            store.getState().addMany([{ id: '1', name: 'New Item' }], { isShallow: true })
            const stateAfterAdd = store.getState()

            expect(stateAfterAdd).not.toBe(stateBeforeAdd)
            expect(store.getState().itemById('1')).toBeDefined()
          })
        })

      })

      describe('with nested objects (2+ levels)', () => {
        interface NestedEntity {
          id: string
          name: string
          nested: {
            field: string
            deep?: {
              value: number
            }
          }
        }

        const createNestedStore = () =>
          create<RepositoryStore<NestedEntity, NonNullable<unknown>>>()(
            createRepositorySlice((entity) => entity.id),
          )

        describe('with Array input', () => {
          it('should detect changes when nested object reference changes', () => {
            const store = createNestedStore()
            const nested = { field: 'value1' }
            store.getState().addMany([{ id: '1', name: 'Item 1', nested }])
            const stateAfterFirstAdd = store.getState()

            // New nested object with same values (shallow checks first level)
            store.getState().addMany([{ id: '1', name: 'Item 1', nested: { field: 'value1' } }], {
              isShallow: true,
            })
            const stateAfterSecondAdd = store.getState()

            // Shallow comparison: nested object reference is different, so it should update
            expect(stateAfterSecondAdd).not.toBe(stateAfterFirstAdd)
          })

          it('should not update when nested object reference is same', () => {
            const store = createNestedStore()
            const nested = { field: 'value1' }
            const item = { id: '1', name: 'Item 1', nested }
            store.getState().addMany([item])
            const stateAfterFirstAdd = store.getState()

            // Same item with same nested reference
            store.getState().addMany([{ id: '1', name: 'Item 1', nested }], { isShallow: true })
            const stateAfterSecondAdd = store.getState()

            expect(stateAfterSecondAdd).toBe(stateAfterFirstAdd)
          })

          it('should handle deeply nested objects', () => {
            const store = createNestedStore()
            const deep = { value: 42 }
            const nested = { field: 'value1', deep }

            store.getState().addMany([{ id: '1', name: 'Item 1', nested }])
            const stateAfterFirstAdd = store.getState()

            // Different deep reference but same values
            store
              .getState()
              .addMany(
                [{ id: '1', name: 'Item 1', nested: { field: 'value1', deep: { value: 42 } } }],
                { isShallow: true },
              )
            const stateAfterSecondAdd = store.getState()

            // Shallow compares first level: nested ref is different
            expect(stateAfterSecondAdd).not.toBe(stateAfterFirstAdd)
          })
        })

      })
    })

    // =====================================================
    // shallowFields OPTION - Field-specific comparison
    // =====================================================
    describe('shallowFields option', () => {
      describe('with primitive values (1 level)', () => {
        describe('with Array input', () => {
          it('should not update when watched field is equal', () => {
            const store = createTestStore()
            store.getState().addMany([{ id: '1', name: 'Item 1', value: 10 }])
            const stateAfterFirstAdd = store.getState()

            // Only watching 'value', name change should be ignored
            store.getState().addMany([{ id: '1', name: 'Changed', value: 10 }], {
              shallowFields: ['value'],
            })
            const stateAfterSecondAdd = store.getState()

            expect(stateAfterSecondAdd).toBe(stateAfterFirstAdd)
          })

          it('should update when watched field differs', () => {
            const store = createTestStore()
            store.getState().addMany([{ id: '1', name: 'Item 1', value: 10 }])

            store.getState().addMany([{ id: '1', name: 'Item 1', value: 999 }], {
              shallowFields: ['value'],
            })

            expect(store.getState().itemById('1')?.value).toBe(999)
          })

          it('should check multiple fields', () => {
            const store = createTestStore()
            store.getState().addMany([{ id: '1', name: 'Item 1', value: 10 }])
            const stateAfterFirstAdd = store.getState()

            // Both name and value are same
            store.getState().addMany([{ id: '1', name: 'Item 1', value: 10 }], {
              shallowFields: ['name', 'value'],
            })
            const stateAfterSecondAdd = store.getState()

            expect(stateAfterSecondAdd).toBe(stateAfterFirstAdd)
          })

          it('should update when one of multiple fields differs', () => {
            const store = createTestStore()
            store.getState().addMany([{ id: '1', name: 'Item 1', value: 10 }])

            store.getState().addMany([{ id: '1', name: 'Changed', value: 10 }], {
              shallowFields: ['name', 'value'],
            })

            expect(store.getState().itemById('1')?.name).toBe('Changed')
          })

          it('should update when item does not exist', () => {
            const store = createTestStore()
            const stateBeforeAdd = store.getState()

            store.getState().addMany([{ id: '1', name: 'New', value: 10 }], {
              shallowFields: ['value'],
            })
            const stateAfterAdd = store.getState()

            expect(stateAfterAdd).not.toBe(stateBeforeAdd)
          })

          it('should process normally with empty shallowFields array', () => {
            const store = createTestStore()
            store.getState().addMany([{ id: '1', name: 'Item 1', value: 10 }])
            const stateAfterFirstAdd = store.getState()

            // Empty shallowFields = no early exit
            store.getState().addMany([{ id: '1', name: 'Item 1', value: 10 }], {
              shallowFields: [],
            })
            const stateAfterSecondAdd = store.getState()

            expect(stateAfterSecondAdd).not.toBe(stateAfterFirstAdd)
          })
        })

      })

      describe('with nested objects (2+ levels)', () => {
        interface DeepNestedEntity {
          id: string
          name: string
          level1: {
            field1: string
            level2: {
              field2: number
              level3?: {
                field3: boolean
              }
            }
          }
        }

        const createDeepNestedStore = () =>
          create<RepositoryStore<DeepNestedEntity, NonNullable<unknown>>>()(
            createRepositorySlice((entity) => entity.id),
          )

        describe('with Array input', () => {
          it('should work with nested field path (2 levels)', () => {
            const store = createDeepNestedStore()
            store.getState().addMany([
              {
                id: '1',
                name: 'Item',
                level1: { field1: 'value1', level2: { field2: 10 } },
              },
            ])
            const stateAfterFirstAdd = store.getState()

            // Only watching level1.field1, level2 change should be ignored
            store.getState().addMany(
              [
                {
                  id: '1',
                  name: 'Item',
                  level1: { field1: 'value1', level2: { field2: 999 } }, // field2 changed
                },
              ],
              { shallowFields: ['level1.field1'] },
            )
            const stateAfterSecondAdd = store.getState()

            expect(stateAfterSecondAdd).toBe(stateAfterFirstAdd)
          })

          it('should detect changes in watched nested field (2 levels)', () => {
            const store = createDeepNestedStore()
            store.getState().addMany([
              {
                id: '1',
                name: 'Item',
                level1: { field1: 'value1', level2: { field2: 10 } },
              },
            ])

            store.getState().addMany(
              [
                {
                  id: '1',
                  name: 'Item',
                  level1: { field1: 'CHANGED', level2: { field2: 10 } },
                },
              ],
              { shallowFields: ['level1.field1'] },
            )

            expect(store.getState().itemById('1')?.level1.field1).toBe('CHANGED')
          })

          it('should work with deep nested field path (3 levels)', () => {
            const store = createDeepNestedStore()
            store.getState().addMany([
              {
                id: '1',
                name: 'Item',
                level1: { field1: 'v1', level2: { field2: 10 } },
              },
            ])
            const stateAfterFirstAdd = store.getState()

            // Watching level1.level2.field2
            store.getState().addMany(
              [
                {
                  id: '1',
                  name: 'Changed',
                  level1: { field1: 'changed', level2: { field2: 10 } }, // Same field2
                },
              ],
              { shallowFields: ['level1.level2.field2'] },
            )
            const stateAfterSecondAdd = store.getState()

            expect(stateAfterSecondAdd).toBe(stateAfterFirstAdd)
          })

          it('should detect changes in watched deep nested field', () => {
            const store = createDeepNestedStore()
            store.getState().addMany([
              {
                id: '1',
                name: 'Item',
                level1: { field1: 'v1', level2: { field2: 10 } },
              },
            ])

            store.getState().addMany(
              [
                {
                  id: '1',
                  name: 'Item',
                  level1: { field1: 'v1', level2: { field2: 999 } }, // Changed
                },
              ],
              { shallowFields: ['level1.level2.field2'] },
            )

            expect(store.getState().itemById('1')?.level1.level2.field2).toBe(999)
          })

          it('should handle multiple nested field paths', () => {
            const store = createDeepNestedStore()
            store.getState().addMany([
              {
                id: '1',
                name: 'Item',
                level1: { field1: 'v1', level2: { field2: 10 } },
              },
            ])
            const stateAfterFirstAdd = store.getState()

            // Both paths match
            store.getState().addMany(
              [
                {
                  id: '1',
                  name: 'Changed', // Not watched
                  level1: { field1: 'v1', level2: { field2: 10 } },
                },
              ],
              { shallowFields: ['level1.field1', 'level1.level2.field2'] },
            )
            const stateAfterSecondAdd = store.getState()

            expect(stateAfterSecondAdd).toBe(stateAfterFirstAdd)
          })

          it('should handle non-existent nested path gracefully', () => {
            const store = createDeepNestedStore()
            store.getState().addMany([
              {
                id: '1',
                name: 'Item',
                level1: { field1: 'v1', level2: { field2: 10 } },
              },
            ])
            const stateAfterFirstAdd = store.getState()

            // Both have undefined for non-existent path
            store.getState().addMany(
              [
                {
                  id: '1',
                  name: 'Item',
                  level1: { field1: 'v1', level2: { field2: 10 } },
                },
              ],
              { shallowFields: ['nonExistent.path'] },
            )
            const stateAfterSecondAdd = store.getState()

            // Both undefined === undefined, so no update
            expect(stateAfterSecondAdd).toBe(stateAfterFirstAdd)
          })
        })

      })
    })

    // =====================================================
    // COMBINED OPTIONS
    // =====================================================
    describe('combined options', () => {
      describe('isFlush + isShallow', () => {
        it('should flush and not skip even if shallow equal (flush bypasses early exit)', () => {
          const store = createTestStore()
          store.getState().addMany([
            { id: '1', name: 'Item 1' },
            { id: '2', name: 'Item 2' },
          ])

          // With isFlush, isShallow early exit is skipped
          store
            .getState()
            .addMany([{ id: '3', name: 'Item 3' }], { isFlush: true, isShallow: true })

          expect(store.getState().itemCount()).toBe(1)
          expect(store.getState().itemById('3')).toBeDefined()
          expect(store.getState().itemById('1')).toBeUndefined()
        })
      })

      describe('isFlush + shallowFields', () => {
        it('should flush and not skip even if fields equal (flush bypasses early exit)', () => {
          const store = createTestStore()
          store.getState().addMany([{ id: '1', name: 'Item 1', value: 10 }])

          store.getState().addMany([{ id: '2', name: 'Item 2', value: 10 }], {
            isFlush: true,
            shallowFields: ['value'],
          })

          expect(store.getState().itemCount()).toBe(1)
          expect(store.getState().itemById('2')).toBeDefined()
          expect(store.getState().itemById('1')).toBeUndefined()
        })
      })

      describe('isShallow takes precedence over shallowFields', () => {
        it('when both provided, isShallow should be used', () => {
          const store = createTestStore()
          // Item with nested object
          const nested = { field: 'value' }
          store.getState().addMany([{ id: '1', name: 'Item 1', nested }])
          const stateAfterFirstAdd = store.getState()

          // With isShallow: true, it compares all first-level props
          // shallowFields would only check nested.field but isShallow takes precedence
          store.getState().addMany([{ id: '1', name: 'Changed', nested }], {
            isShallow: true,
            shallowFields: ['nested.field'], // Should be ignored
          })
          const stateAfterSecondAdd = store.getState()

          // isShallow detects name change
          expect(stateAfterSecondAdd).not.toBe(stateAfterFirstAdd)
          expect(store.getState().itemById('1')?.name).toBe('Changed')
        })
      })
    })

    // =====================================================
    // MULTIPLE ITEMS BEHAVIOR
    // =====================================================
    describe('multiple items behavior', () => {
      describe('with isShallow', () => {
        it('should exit early only when ALL items are equal', () => {
          const store = createTestStore()
          store.getState().addMany([
            { id: '1', name: 'Item 1' },
            { id: '2', name: 'Item 2' },
            { id: '3', name: 'Item 3' },
          ])
          const stateAfterFirstAdd = store.getState()

          // One item changed
          store.getState().addMany(
            [
              { id: '1', name: 'Item 1' },
              { id: '2', name: 'CHANGED' },
              { id: '3', name: 'Item 3' },
            ],
            { isShallow: true },
          )
          const stateAfterSecondAdd = store.getState()

          expect(stateAfterSecondAdd).not.toBe(stateAfterFirstAdd)
        })

        it('should preserve reference for unchanged items to avoid re-renders', () => {
          const store = createTestStore()
          store.getState().addMany([
            { id: '1', name: 'Item 1' },
            { id: '2', name: 'Item 2' },
            { id: '3', name: 'Item 3' },
          ])
          const item1Before = store.getState().itemById('1')
          const item2Before = store.getState().itemById('2')
          const item3Before = store.getState().itemById('3')

          // Only item 2 changed
          store.getState().addMany(
            [
              { id: '1', name: 'Item 1' },
              { id: '2', name: 'CHANGED' },
              { id: '3', name: 'Item 3' },
            ],
            { isShallow: true },
          )

          const item1After = store.getState().itemById('1')
          const item2After = store.getState().itemById('2')
          const item3After = store.getState().itemById('3')

          // Items 1 and 3 should keep their original reference (no re-render)
          expect(item1After).toBe(item1Before)
          expect(item3After).toBe(item3Before)

          // Item 2 should have a new reference (updated)
          expect(item2After).not.toBe(item2Before)
          expect(item2After?.name).toBe('CHANGED')
        })

        it('should not update when all items are equal', () => {
          const store = createTestStore()
          store.getState().addMany([
            { id: '1', name: 'Item 1' },
            { id: '2', name: 'Item 2' },
          ])
          const stateAfterFirstAdd = store.getState()

          store.getState().addMany(
            [
              { id: '1', name: 'Item 1' },
              { id: '2', name: 'Item 2' },
            ],
            { isShallow: true },
          )
          const stateAfterSecondAdd = store.getState()

          expect(stateAfterSecondAdd).toBe(stateAfterFirstAdd)
        })
      })

      describe('with shallowFields', () => {
        it('should exit early only when ALL items watched fields are equal', () => {
          const store = createTestStore()
          store.getState().addMany([
            { id: '1', name: 'Item 1', value: 10 },
            { id: '2', name: 'Item 2', value: 20 },
          ])
          const stateAfterFirstAdd = store.getState()

          // One item's value changed
          store.getState().addMany(
            [
              { id: '1', name: 'Changed', value: 10 }, // name changed but not watched
              { id: '2', name: 'Changed', value: 999 }, // value changed
            ],
            { shallowFields: ['value'] },
          )
          const stateAfterSecondAdd = store.getState()

          expect(stateAfterSecondAdd).not.toBe(stateAfterFirstAdd)
        })

        it('should not update when all items watched fields are equal', () => {
          const store = createTestStore()
          store.getState().addMany([
            { id: '1', name: 'Item 1', value: 10 },
            { id: '2', name: 'Item 2', value: 20 },
          ])
          const stateAfterFirstAdd = store.getState()

          store.getState().addMany(
            [
              { id: '1', name: 'Changed 1', value: 10 }, // name changed but not watched
              { id: '2', name: 'Changed 2', value: 20 }, // name changed but not watched
            ],
            { shallowFields: ['value'] },
          )
          const stateAfterSecondAdd = store.getState()

          expect(stateAfterSecondAdd).toBe(stateAfterFirstAdd)
        })
      })

      describe('partial existence', () => {
        it('should update when some items exist and some are new (isShallow)', () => {
          const store = createTestStore()
          store.getState().addMany([{ id: '1', name: 'Item 1' }])
          const stateAfterFirstAdd = store.getState()

          store.getState().addMany(
            [
              { id: '1', name: 'Item 1' }, // Exists
              { id: '2', name: 'Item 2' }, // New
            ],
            { isShallow: true },
          )
          const stateAfterSecondAdd = store.getState()

          expect(stateAfterSecondAdd).not.toBe(stateAfterFirstAdd)
          expect(store.getState().itemCount()).toBe(2)
        })

        it('should update when some items exist and some are new (shallowFields)', () => {
          const store = createTestStore()
          store.getState().addMany([{ id: '1', name: 'Item 1', value: 10 }])
          const stateAfterFirstAdd = store.getState()

          store.getState().addMany(
            [
              { id: '1', name: 'Changed', value: 10 }, // Exists, value same
              { id: '2', name: 'Item 2', value: 20 }, // New
            ],
            { shallowFields: ['value'] },
          )
          const stateAfterSecondAdd = store.getState()

          expect(stateAfterSecondAdd).not.toBe(stateAfterFirstAdd)
          expect(store.getState().itemCount()).toBe(2)
        })
      })
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
