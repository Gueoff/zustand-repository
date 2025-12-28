"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSelectors = void 0;
/**
 * Create store selectors
 * https://zustand.docs.pmnd.rs/guides/auto-generating-selectors
 * @param _store
 */
const createSelectors = (_store) => {
    const store = _store;
    store.use = {};
    for (const k of Object.keys(store.getState())) {
        ;
        store.use[k] = () => store((s) => s[k]);
    }
    return store;
};
exports.createSelectors = createSelectors;
