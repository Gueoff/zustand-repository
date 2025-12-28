import { StateCreator } from 'zustand/index';
import { KeyType, StatusRepository } from './store.types';
type LoaderID = string | number | Function | {
    code: string;
};
type Func<TArgs extends any[], TResult> = (...args: TArgs) => TResult;
/**
 * Get id as a string from anything which can be loading
 * @param id
 */
export declare function getID(id: LoaderID): string;
export interface BaseLoadingStore {
    loadingMap: Record<KeyType, StatusRepository>;
    isLoading: () => boolean;
    isLoadingKey: (id: LoaderID) => boolean;
    clearLoaders: () => void;
    operation: (fn: Func<any[], Promise<any>>) => (...args: any[]) => Promise<any>;
}
/**
 * Additional values for loading in stores.
 * @param set
 * @param get
 */
export declare const createBaseLoadingSlice: StateCreator<BaseLoadingStore, [], [], BaseLoadingStore>;
/**
 * Compute the loading value to make it a variable instead of func
 */
/**
 * Utils function to add operation on each function called "operationSomething"
 * @param storeInitializer
 */
export declare function wrapOperation<T extends Record<string, any>>(storeInitializer: (set: any, get: () => any, s?: any) => T): (set: any, get: () => any, s?: any) => T;
export {};
