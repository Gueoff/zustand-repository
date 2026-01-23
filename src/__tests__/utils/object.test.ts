import { getNestedValue } from '../../utils/object'

describe('getNestedValue', () => {
  it('should get a simple property value', () => {
    const obj = { name: 'test', value: 42 }
    expect(getNestedValue(obj, 'name')).toBe('test')
    expect(getNestedValue(obj, 'value')).toBe(42)
  })

  it('should get a nested property value', () => {
    const obj = {
      user: {
        profile: {
          name: 'John',
          age: 30,
        },
      },
    }
    expect(getNestedValue(obj, 'user.profile.name')).toBe('John')
    expect(getNestedValue(obj, 'user.profile.age')).toBe(30)
  })

  it('should return undefined for invalid path', () => {
    const obj = { name: 'test' }
    expect(getNestedValue(obj, 'invalid.path')).toBeUndefined()
    expect(getNestedValue(obj, 'name.invalid')).toBeUndefined()
  })

  it('should return undefined for null object', () => {
    expect(getNestedValue(null, 'path')).toBeUndefined()
  })

  it('should return undefined for undefined object', () => {
    expect(getNestedValue(undefined, 'path')).toBeUndefined()
  })

  it('should handle arrays in objects', () => {
    const obj = {
      items: [{ id: 1 }, { id: 2 }],
    }
    expect(getNestedValue(obj, 'items')).toEqual([{ id: 1 }, { id: 2 }])
  })

  it('should handle deeply nested paths', () => {
    const obj = {
      a: { b: { c: { d: { e: 'deep' } } } },
    }
    expect(getNestedValue(obj, 'a.b.c.d.e')).toBe('deep')
  })
})
