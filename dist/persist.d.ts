import { StateCreator } from 'zustand';
import { StatusRepository } from './store.types';
export interface PersistStore {
    statusRehydrate: StatusRepository;
    isRehydrated: () => boolean;
    onRehydrateStorage: (state?: any, error?: unknown) => void;
}
/**
 * Additional values for persisted stores.
 * @param set
 * @param get
 */
export declare const createPersistSlice: StateCreator<PersistStore, [], [], PersistStore>;
