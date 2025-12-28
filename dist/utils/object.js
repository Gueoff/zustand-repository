"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNestedValue = getNestedValue;
/**
 * Get a specific value inside an object (ex. task.order.id)
 * @param obj
 * @param path
 */
function getNestedValue(obj, path) {
    return path
        .split('.')
        .reduce((acc, key) => acc && typeof acc === 'object' ? acc[key] : undefined, obj);
}
