"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRepositorySlice = void 0;
const shallow_1 = require("zustand/vanilla/shallow");
const object_1 = require("./utils/object");
/**
 * Create repository slice
 * @param getKey Key of the entity to store like ID
 * @param extensions Additional values & functions
 */
const createRepositorySlice = (getKey, extensions) => (set, get) => ({
    itemsMap: {},
    itemCount: () => Object.keys(get().itemsMap).length,
    items: () => {
        return Object.values(get().itemsMap);
    },
    itemById: (key) => {
        return key ? get().itemsMap[key] : undefined;
    },
    itemsByIds: (keys) => {
        return keys.map(get().itemById).filter((item) => item !== undefined);
    },
    addOne: (item, params) => {
        var _a;
        const id = getKey(item);
        // Same entity
        if ((params === null || params === void 0 ? void 0 : params.isShallow) && (0, shallow_1.shallow)(item, get().itemById(id))) {
            return;
        }
        // Shallow fields are matching
        if ((_a = params === null || params === void 0 ? void 0 : params.shallowFields) === null || _a === void 0 ? void 0 : _a.length) {
            const previousEntity = get().itemById(id);
            const isIdentical = params === null || params === void 0 ? void 0 : params.shallowFields.every((field) => (0, object_1.getNestedValue)(item, field) === (0, object_1.getNestedValue)(previousEntity, field));
            if (isIdentical) {
                return;
            }
        }
        if (params === null || params === void 0 ? void 0 : params.removeKey) {
            get().removeOne(params === null || params === void 0 ? void 0 : params.removeKey);
        }
        set((state) => ({
            ...state,
            itemsMap: (params === null || params === void 0 ? void 0 : params.isUnique)
                ? {
                    [id]: item,
                }
                : {
                    ...state.itemsMap,
                    [id]: item,
                },
        }), undefined, 'addOne');
    },
    addMany: (items, params) => {
        if (!items) {
            return;
        }
        const itemsArray = Array.isArray(items) ? items : Object.values(items);
        if (itemsArray.length === 0) {
            if (params === null || params === void 0 ? void 0 : params.isFlush) {
                get().clear();
            }
            return;
        }
        set((state) => {
            const newItemsMap = (params === null || params === void 0 ? void 0 : params.isFlush) ? {} : { ...state.itemsMap };
            for (const item of itemsArray) {
                newItemsMap[getKey(item)] = item;
            }
            return { ...state, itemsMap: newItemsMap };
        }, undefined, 'addMany');
    },
    clear: () => {
        if (Object.keys(get().itemsMap).length === 0) {
            return;
        }
        set((state) => ({ ...state, itemsMap: {} }), undefined, 'clear');
    },
    removeOne: (key) => {
        set((state) => ({
            ...state,
            itemsMap: Object.fromEntries(Object.entries(state.itemsMap).filter(([k]) => k !== key)),
        }), undefined, 'removeOne');
    },
    ...(extensions ? extensions(set, get) : {}),
});
exports.createRepositorySlice = createRepositorySlice;
