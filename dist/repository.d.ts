import { StateCreator } from 'zustand';
import { GetType, KeyType, ParamsRepository, SetType } from './store.types';
interface BaseRepositoryStore<TEntity> {
    itemsMap: Record<KeyType, TEntity>;
    itemCount: () => number;
    items: () => TEntity[];
    itemById: (key?: KeyType) => TEntity | undefined;
    itemsByIds: (keys: KeyType[]) => TEntity[];
    addOne: (item: TEntity, params?: ParamsRepository) => void;
    addMany: (items: Record<KeyType, TEntity> | TEntity[], params?: ParamsRepository) => void;
    clear: () => void;
    removeOne: (key: KeyType) => void;
}
export type RepositoryStore<TEntity, U> = BaseRepositoryStore<TEntity> & U;
export type ExtensionsParam<TEntity, U> = (set: SetType<RepositoryStore<TEntity, U>>, get: GetType<RepositoryStore<TEntity, U>>) => U;
/**
 * Create repository slice
 * @param getKey Key of the entity to store like ID
 * @param extensions Additional values & functions
 */
export declare const createRepositorySlice: <TEntity, U = NonNullable<unknown>>(getKey: (entity: TEntity) => KeyType, extensions?: ExtensionsParam<TEntity, U>) => StateCreator<RepositoryStore<TEntity, U>, [], [], RepositoryStore<TEntity, U>>;
export {};
