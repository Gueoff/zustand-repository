"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPersistSlice = void 0;
const store_types_1 = require("./store.types");
/**
 * Additional values for persisted stores.
 * @param set
 * @param get
 */
const createPersistSlice = (set, get) => ({
    statusRehydrate: store_types_1.StatusRepository.Idle,
    isRehydrated: () => get().statusRehydrate === store_types_1.StatusRepository.Success ||
        get().statusRehydrate === store_types_1.StatusRepository.Error,
    onRehydrateStorage: (_, error) => {
        set((state) => ({
            ...state,
            statusRehydrate: error ? store_types_1.StatusRepository.Error : store_types_1.StatusRepository.Success,
        }), false, 'onRehydrateStorage');
    },
});
exports.createPersistSlice = createPersistSlice;
