# zustand-store

This folder gives you helper functions to use [Zustand](https://github.com/pmndrs/zustand) stores through your app.


## Simple repository

You can create a repository to store your data into a Record<key, entity> and manipulate them.
To do this, you can create your store with createRepositoryStore function which will give you all you need.

```ts
export const useBearStore = createRepositoryStore<Bear>(
    // Store name
    'MyBearStore',
    // Key function to store your entity into a Record<key, value>
    (bear: Bear) => bear.id,
    // Extension for persisted state (see Persist section)
    undefined,
    // Additional features for the store (see Additional values section)
    undefined
)
```

Then use it into you component 

```ts
// useShallow when you want to retrieve array
const bears = useBearStore(useShallow((state) => state.items()))
const addOne = useBearStore((state) => state.addOne)
const bearAggressive = useBearStore((state) => state.itemById('1'))
```

### Persist

To persist data into your store, use the [persist](https://zustand.docs.pmnd.rs/middlewares/persist) parameter.

```ts
{
    onRehydrateStorage: () => (state, error) => {
        // Trigger the default onRehydrateStorage to set the rehydrate status once it's done
        state?.onRehydrateStorage(state, error)
    },
    partialize: (state) => ({
        // Data you want to persist
        itemsMap: state.itemsMap,
    }),
        // Storage to use
        storage: createJSONStorage(() => storage)
}
```

### Additional values

Sometimes you want to add some variables, functions or just overrides some into your store. 

```ts
interface BearStore {
    valueA?: string
    valueB?: string
    setValueA: (value: string) => void
}

export const useBearStore = createRepositoryStore<Bear, BearStore>(
    'BearStore',
    (bear: Bear) => bear.id,
    undefined,
    (set) => ({
        valueA: undefined,
        valueB: undefined,
        setValueA: (value: string) => set({ valueA }, undefined, 'setValueA'),
        addOne: (item: Bear, params?: ParamsRepository) => {
            set(
                (state) => ({
                    ...state,
                    itemsMap: {
                        ...state.itemsMap,
                        [item.id]: { ...item, isAggressive: true },
                    },
                    valueB: 'random value added',
                }),
                undefined,
                'addOne',
            )
        }
    }),
)
```

## Repository with parameters

Sometimes you want to pass params to you store creation (for specific platform, config).
To do so, wrap your store creation into a function and call it into your specific platform.

```ts
// Generic persisted bear store
export const createBearStore = (storage: StateStorage) => {
    return createRepositoryStore<Bear>(
        // Store name
        'MyBearStore',
        // Key function to store your entity into a Record<key, value>
        (bear: Bear) => bear.id,
        // Extension for persisted state (see Persist section)
        {
            onRehydrateStorage: () => (state, error) => {
                // Trigger the default onRehydrateStorage to set the rehydrate status once it's done
                state?.onRehydrateStorage(state, error)
            },
            partialize: (state) => ({
                // Data you want to persist
                itemsMap: state.itemsMap,
            }),
            // Storage to use
            storage: createJSONStorage(() => storage)
        },
    )
}
```

```tsx
// React Native persisted bear store with async storage
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createSpecificStore } from 'core/modules/specific.store'

export const useBearStore = createBearStore(AsyncStorage)
```

## Loader slice repository

Repository comes with a loading slice strategy to know the state of an async api call for example.
To trigger a change of loading, just wrap a function with "operation" function then check the loading state in your store.
The strategy is included in repositories by default, but you can add it in your non-repositories zustand store with createPersistSlice.

Let's imagine a custom store which handle current user with login async function

```ts
interface AuthStore {
    user?: User
    setUser: (user: User) => void
    login: (email: string, password: string) => User | undefined
    getUser: (id: string) => User | undefined
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get, store) => ({
            user: undefined,
            setUser: (user: User) => {
                set({user})
            },
            login: async (email: string, password: string) => {
                return get().operation(async function loginOperation() {
                    try {
                        const response = await api.login(email, password)
                        get().setUser(response.data)
                        return response.data
                    } catch (error) {
                        logger.error(error)
                    }
                })()
            },
            getUser: async (id: string) => {
                return get().operation(async function getUserOperation() {
                    try {
                        const response = await api.getUser(id)
                        return response.data
                    } catch (error) {
                        logger.error(error)
                    }
                })(id) // Can be array
            },
            
            // Add persist slice utils
            ...createPersistSlice(set, get, store),
    
            // Add loading slice utils
            ...createBaseLoadingSlice(set, get, store),
        }),
        {
            name: 'userStore',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                user: state.user,
            }),
        }
    ),
    { name: 'userStore', store: 'userStore' },
)
```

Then in your component
```tsx
    // Loading in all store
    const isLoading = useEntityStore(state => state.isLoading())

    // Loading for specific function "loginOperation"
    const isLoginLoading = useEntityStore(state => state.isLoadingKey('loginOperation'))

    // Loading for specific function "loginOperation"
    const isGetUserLoading = useEntityStore(state => state.isLoadingKey('getUserOperation'))

    // Loading for specific user "12"
    const isAuthLoadingUser12 = useEntityStore(state => state.isLoadingKey('12'))
```

You can also wrap your repository with wrapOperation(). It will trigger the operation function for all named function with the keywork "operation".

```ts
export const useBearStore = createRepositoryStore<Bear>(
  'Bear',
    (bear: Bear) => bear.id,
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


## Scoped store

Sometimes you want to create multiple stores, one for ComponentA and one for ComponentB which don't share the same state.
To do it, wrap your store creation into a function then use the createScope function.
It will create one store as a ref, so you can use it multiple times.

```ts
const createScopedStore = () => {
  return create(...)
}

export const useScopedStore = () => createScope(createScopedStore)
```
