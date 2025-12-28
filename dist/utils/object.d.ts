/**
 * Get a specific value inside an object (ex. task.order.id)
 * @param obj
 * @param path
 */
export declare function getNestedValue<T, K extends string>(obj: T, path: K): unknown;
