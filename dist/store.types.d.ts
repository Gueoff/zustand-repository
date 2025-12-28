export type KeyType = string | number;
export declare enum StatusRepository {
    Idle = "Idle",
    Loading = "Loading",
    Success = "Success",
    Error = "Error"
}
export interface ParamsRepository {
    isClear?: boolean;
    isFlush?: boolean;
    isShallow?: boolean;
    isUnique?: boolean;
    removeKey?: KeyType;
    shallowFields?: string[];
}
export type GetType<Store> = () => Store;
export type SetType<Store> = (partial: Store | Partial<Store> | ((state: Store) => Store | Partial<Store>), replace?: false, actionName?: string) => void;
