export type KeyType = string | number

export enum StatusRepository {
  Idle = 'Idle',
  Loading = 'Loading',
  Success = 'Success',
  Error = 'Error',
}

export interface ParamsRepository {
  // Whether the store doesn't have the entity.
  isClear?: boolean

  // Whether we should empty the store before the action.
  isFlush?: boolean

  // Do not update the entity if shallow comparison is the same https://zustand.docs.pmnd.rs/guides/prevent-rerenders-with-use-shallow
  isShallow?: boolean

  // Whether the entity should be the only one on the store
  isUnique?: boolean

  // If the remove key is passed, that item will be removed before the action.
  removeKey?: KeyType

  // Do nothing if the entity fields in this array are equals to the one stored.
  shallowFields?: string[]
}

export type GetType<Store> = () => Store
export type SetType<Store> = (
  partial: Store | Partial<Store> | ((state: Store) => Store | Partial<Store>),
  replace?: false,
  actionName?: string,
) => void
