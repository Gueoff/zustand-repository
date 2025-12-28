"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBaseLoadingSlice = void 0;
exports.getID = getID;
exports.wrapOperation = wrapOperation;
const store_types_1 = require("./store.types");
/**
 * Get id as a string from anything which can be loading
 * @param id
 */
function getID(id) {
    if (!id) {
        return 'unknown';
    }
    if (typeof id === 'string') {
        return id;
    }
    if (typeof id === 'function') {
        if (id.code) {
            return id.code;
        }
        if (id.name) {
            return id.name;
        }
    }
    return id === null || id === void 0 ? void 0 : id.toString();
}
/**
 * Additional values for loading in stores.
 * @param set
 * @param get
 */
const createBaseLoadingSlice = (set, get) => ({
    loadingMap: {},
    isLoading: () => Object.values(get().loadingMap).filter((loading) => loading === store_types_1.StatusRepository.Loading)
        .length > 0,
    isLoadingKey: (id) => get().loadingMap[getID(id)] === store_types_1.StatusRepository.Loading,
    clearLoaders: () => {
        set((state) => ({ ...state, loadingMap: {} }), undefined, 'clearLoaders');
    },
    operation: (fn) => {
        const id = getID(fn);
        const returnFn = async (...args) => {
            const ids = [id, ...args.filter((arg) => typeof arg === 'string')];
            set((state) => ({
                ...state,
                loadingMap: {
                    ...state.loadingMap,
                    ...Object.fromEntries(ids.map((id) => [getID(id), store_types_1.StatusRepository.Loading])),
                },
            }), false, 'startLoading');
            try {
                return await fn(...args);
            }
            catch (error) {
                throw error;
            }
            finally {
                set((state) => ({
                    ...state,
                    loadingMap: Object.fromEntries(Object.entries(state.loadingMap).filter(([key]) => !ids.includes(key))) || {},
                }), false, 'stopLoading');
            }
        };
        returnFn.code = id;
        return returnFn;
    },
});
exports.createBaseLoadingSlice = createBaseLoadingSlice;
/**
 * Compute the loading value to make it a variable instead of func
 */
// export interface ComputedLoadingStore {
//  isLoading: boolean
// }
// export const computedLoading = createComputed<BaseLoadingStore & any, ComputedLoadingStore>(
//  (state) => ({
//    isLoading:
//      Object.values(state.loadingMap).filter((loading) => loading === StatusRepository.Loading)
//        .length > 0,
//  }),
//)
//)
/**
 * Utils function to add operation on each function called "operationSomething"
 * @param storeInitializer
 */
function wrapOperation(storeInitializer) {
    return (set, get, s) => {
        var _a, _b;
        const store = storeInitializer(set, get, s);
        const wrappedStore = {};
        for (const key in store) {
            const value = store[key];
            if (typeof value === 'function' && ((_b = (_a = value.name) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === null || _b === void 0 ? void 0 : _b.includes('operation'))) {
                wrappedStore[key] = ((...args) => get().operation(value)(...args));
            }
            else {
                wrappedStore[key] = value;
            }
        }
        return wrappedStore;
    };
}
