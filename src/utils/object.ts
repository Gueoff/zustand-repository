/**
 * Get a specific value inside an object (ex. task.order.id)
 * @param obj
 * @param path
 */
export function getNestedValue<T, K extends string>(obj: T, path: K): unknown {
    return path
        .split('.')
        .reduce<unknown>(
            (acc, key) =>
                acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined,
            obj,
        )
}
