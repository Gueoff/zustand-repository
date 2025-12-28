"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScopedRepositoryStore = createScopedRepositoryStore;
exports.createPersistedRepositoryStore = createPersistedRepositoryStore;
exports.createRepositoryStore = createRepositoryStore;
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
const loading_1 = require("./loading");
const persist_1 = require("./persist");
const repository_1 = require("./repository");
/**
 * Create scoped store repository
 * @param storeName Name of the store
 * @param getKey Key of the entity to store like ID
 * @param extensions Additional values & functions
 */
function createScopedRepositoryStore(storeName, getKey, extensions) {
    return (0, zustand_1.createStore)()((0, middleware_1.subscribeWithSelector)((0, middleware_1.devtools)((...params) => ({
        ...(0, repository_1.createRepositorySlice)(getKey, extensions)(...params),
        ...(0, loading_1.createBaseLoadingSlice)(...params),
    }), {
        name: storeName,
        store: storeName,
    })));
}
/**
 * Create persisted store repository
 * @param storeName Name of the store
 * @param getKey Key of the entity to store like ID
 * @param persistOptions Zustand persist options
 * @param extensions Additional values & functions
 */
function createPersistedRepositoryStore(storeName, getKey, persistOptions, extensions) {
    return (0, zustand_1.create)()((0, middleware_1.subscribeWithSelector)((0, middleware_1.devtools)((0, middleware_1.persist)((...params) => ({
        ...(0, repository_1.createRepositorySlice)(getKey, extensions)(...params),
        ...(0, loading_1.createBaseLoadingSlice)(...params),
        ...(0, persist_1.createPersistSlice)(...params),
    }), {
        name: storeName,
        ...persistOptions,
    }), {
        name: storeName,
        store: storeName,
    })));
}
function createRepositoryStore(storeName, getKey, persistOptions, extensions) {
    if (persistOptions) {
        return createPersistedRepositoryStore(storeName, getKey, persistOptions, extensions);
    }
    return (0, zustand_1.create)()((0, middleware_1.subscribeWithSelector)((0, middleware_1.devtools)((...params) => ({
        ...(0, repository_1.createRepositorySlice)(getKey, extensions)(...params),
        ...(0, loading_1.createBaseLoadingSlice)(...params),
    }), {
        name: storeName,
        store: storeName,
    })));
}
