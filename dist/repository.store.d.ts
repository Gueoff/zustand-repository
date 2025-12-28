import { StoreApi, UseBoundStore } from 'zustand';
import { PersistOptions } from 'zustand/middleware';
import { BaseLoadingStore } from './loading';
import { PersistStore } from './persist';
import { ExtensionsParam, RepositoryStore } from './repository';
import { KeyType } from './store.types';
type StorePersisted<TEntity, U> = RepositoryStore<TEntity, U> & BaseLoadingStore & PersistStore;
type Store<TEntity, U> = RepositoryStore<TEntity, U> & BaseLoadingStore;
type PersistParam<TEntity, U> = Omit<PersistOptions<StorePersisted<TEntity, U>, Partial<StorePersisted<TEntity, U>>>, 'name'>;
/**
 * Create scoped store repository
 * @param storeName Name of the store
 * @param getKey Key of the entity to store like ID
 * @param extensions Additional values & functions
 */
export declare function createScopedRepositoryStore<TEntity, U = NonNullable<unknown>>(storeName: string, getKey: (entity: TEntity) => KeyType, extensions?: ExtensionsParam<TEntity, U>): Omit<Omit<StoreApi<Store<TEntity, U>>, "subscribe"> & {
    subscribe: {
        (listener: (selectedState: Store<TEntity, U>, previousSelectedState: Store<TEntity, U>) => void): () => void;
        <U_1>(selector: (state: Store<TEntity, U>) => U_1, listener: (selectedState: U_1, previousSelectedState: U_1) => void, options?: {
            equalityFn?: ((a: U_1, b: U_1) => boolean) | undefined;
            fireImmediately?: boolean;
        } | undefined): () => void;
    };
}, "setState" | "devtools"> & {
    setState(partial: Store<TEntity, U> | Partial<Store<TEntity, U>> | ((state: Store<TEntity, U>) => Store<TEntity, U> | Partial<Store<TEntity, U>>), replace?: false | undefined, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    setState(state: Store<TEntity, U> | ((state: Store<TEntity, U>) => Store<TEntity, U>), replace: true, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    devtools: {
        cleanup: () => void;
    };
};
/**
 * Create persisted store repository
 * @param storeName Name of the store
 * @param getKey Key of the entity to store like ID
 * @param persistOptions Zustand persist options
 * @param extensions Additional values & functions
 */
export declare function createPersistedRepositoryStore<TEntity, U = NonNullable<unknown>>(storeName: string, getKey: (entity: TEntity) => KeyType, persistOptions: PersistParam<TEntity, U>, extensions?: ExtensionsParam<TEntity, U>): UseBoundStore<StoreApi<StorePersisted<TEntity, U>>>;
/**
 * Create store repository
 * @param storeName Name of the store
 * @param getKey Key of the entity to store like ID
 * @param persistOptions Zustand persist options
 * @param extensions Additional values & functions
 */
export declare function createRepositoryStore<TEntity, U = NonNullable<unknown>>(storeName: string, getKey: (entity: TEntity) => KeyType, persistOptions: PersistParam<TEntity, U>, extensions?: ExtensionsParam<TEntity, U>): UseBoundStore<StoreApi<StorePersisted<TEntity, U>>>;
export declare function createRepositoryStore<TEntity, U = NonNullable<unknown>>(storeName: string, getKey: (entity: TEntity) => KeyType, persistOptions?: undefined, extensions?: ExtensionsParam<TEntity, U>): UseBoundStore<StoreApi<Store<TEntity, U>>>;
export {};
