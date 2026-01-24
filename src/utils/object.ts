// Cache pour les paths déjà parsés
const pathCache = new Map<string, string[]>()

/**
 * Get a specific value inside an object (ex. task.order.id)
 * @param obj
 * @param path
 */
export function getNestedValue<T, K extends string>(obj: T, path: K): unknown {
  let keys = pathCache.get(path)
  if (!keys) {
    keys = path.split('.')
    pathCache.set(path, keys)
  }

  let current: unknown = obj
  for (let i = 0; i < keys.length; i++) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[keys[i]]
  }

  return current
}
