import { StoreApi, UseBoundStore } from 'zustand';
type WithSelectors<S> = S extends {
    getState: () => infer T;
} ? S & {
    use: {
        [K in keyof T]: () => T[K];
    };
} : never;
/**
 * Create store selectors
 * https://zustand.docs.pmnd.rs/guides/auto-generating-selectors
 * @param _store
 */
export declare const createSelectors: <S extends UseBoundStore<StoreApi<object>>>(_store: S) => WithSelectors<S>;
export {};
