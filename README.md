# zustand-store

This folder gives you helper functions to use [Zustand](https://github.com/pmndrs/zustand) stores through your app.


## Repository

You can create a repository to store your data into a Record<key, entity>.
To do this, you can create your store with createRepositoryStore function which will give you all you need.

The 1st parameter is the name of your store
The 2nd parameter is the key function to store your entity into a Record<key, value>
The 3rd parameter in an extension for persisted stores
The 4th parameter is the additional features

```js
export const useOrderStore = createRepositoryStore<OrderResponse>('Order', (order: OrderResponse) => order.id)
```

Then use it into you component 

```js
const orderStore = useOrderStore()
const orders = orderStore.items()
```

or to have only what you want

```js
const orders = useOrderStore(useShallow((state) => state.items()))
const { itemMap, itemX, addOne } = useOrderStore(useShallow((state) => ({
  itemMap: state.itemMap,
  itemX: state.itemById('X'),
  addOne: state.addOne,
})))
```

### Persist

To persist data into your store, use the [persist](https://zustand.docs.pmnd.rs/middlewares/persist) parameter (3rd). If you don't want to use it, just put undefined.

```js
{
  onRehydrateStorage: () => (state, error) => {
    state?.onRehydrateStorage(state, error) // Trigger the default onRehydrateStorage to set the rehydrate status once it's done
  },
  partialize: (state) => ({
    itemsMap: state.itemsMap, // Data you want to persist
  }),
  storage: createJSONStorage(() => storage) // Storage to use
}
```

#### Specific params

If you use the persist in different platforms, you wat to use a different storage. To do it, wrap your store creation into a function and call it into your specific platform.

```js
export const createSpecificStore = (storage: StateStorage) => {
  return createRepositoryStore(...)
}
```

```js
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createSpecificStore } from 'core/modules/specific.store'

export const useSpecificStore = createSpecificStore(AsyncStorage)
```

Do that trick for every specific parameters, like config, persist etc.

### Additional values

Sometimes you want to add some variables or functions into your store. To do that use the 4th parameter to add specifi code

```js
export const useOrderStore = createRepositoryStore<OrderResponse>(
  'Order',
    (order: OrderResponse) => order.id,
    undefined,
    (set, get) => ({
      valueA: undefined,
      valueB: undefined,
      setValueA: (valueA: any) => set({ valueA }, undefined, 'setValueA'),
    }),
)
```

### Loader
You have access to loading state in repository, you can see at any moment the state of each loader.
For that, you have the loading helper in loading.ts. By default it's included into the repository store.

If you want to create a store with loading state, just add the loading logic into your store into the 4th parameter

```js
...createBaseLoadingSlice(set, get),
```

Do not forget to wrap your store with computedLoadingSlice() to access the main isLoading computed state.

#### Create a loading
To change the loading state, just wrap your named function with operation() and you'll see the state change.
Then use isLoading or isLoadingKey into your component to display the logic.

You can also wrap your repository with wrapOperation(). It will trigger the operation function for all named function with the keywork "operation".

```js
export const useOrderStore = createRepositoryStore<any>(
  'Order',
    (order: any) => order.id,
    undefined,
    wrapOperation((set) => ({
      valueA: undefined,
      valueB: undefined,
      setValueA: (valueA: any) => set({ valueA }, undefined, 'setValueA'),
      fetchData: async function operationFetch(id: string) { // This function will trigger a loading change state
        await fetch(id)
      },
    })),
)
```

### Scoped store

Sometimes you want to create multiple stores, one for ComponantA and one for ComponentB which don't share the same state.
To do it, wrap your store creation into a function then use the createScope function.
It will create one store as a ref, so you can use it multiple times.

```js
const createScopedStore = () => {
  return create(...)
}

export const useScopedStore = () => createScope(createScopedStore)
```
