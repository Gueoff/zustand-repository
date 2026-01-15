# zustand-repository

A typed **repository pattern** for Zustand stores, with built-in loading and persistence helpers.
This folder gives you helper functions to use [Zustand](https://github.com/pmndrs/zustand) stores through your app.

---

## ✨ Why zustand-repository?

- 📦 Store entities as a `Record<id, entity>`
- 🔁 Built-in CRUD helpers
- ⏳ Loading state per async operation
- 💾 Easy persistence support
- 🧠 Fully typed with TypeScript
- 🧩 Composable with existing Zustand stores

---

## 📦 Installation

```bash
npm install zustand-repository
```

## Quick start

Create a repository to store your data into a Record<key, entity> and manipulate them.
To do this, you can create your store with createRepositoryStore function which will give you all you need.

```ts
import { createRepositoryStore } from "zustand-repository"

type Bear = { 
    id: string
    name: string
}

export const useBearStore = createRepositoryStore<Bear>('BearStore', (bear: Bear) => bear.id)
```

Then in your component 

```tsx
// useShallow when you want to retrieve array
const bears = useBearStore(useShallow((state) => state.items()))
const addOne = useBearStore((state) => state.addOne)
const bearAggressive = useBearStore((state) => state.itemById('1'))
```

### Persistence

To persist data into your store, use the [persist](https://zustand.docs.pmnd.rs/middlewares/persist) parameter.

```ts
export const useBearStore = createRepositoryStore<Bear>(
    'BearStore',
    (bear: Bear) => bear.id,
    {
        onRehydrateStorage: () => (state, error) => {
            state?.onRehydrateStorage(state, error)
        },
        partialize: (state) => ({
            itemsMap: state.itemsMap, // Data you want to persist
        }),
        storage: createJSONStorage(() => storage)
    },
)

```

### Extending the store

You can add custom state and actions or overrides some.

```ts
interface BearStore {
    country?: string
    setCountry: (country: string) => void
}

export const useBearStore = createRepositoryStore<Bear, BearStore>(
    'BearStore',
    (bear: Bear) => bear.id,
    undefined,
    (set) => ({
        country: undefined,
        setCountry: (country: string) => set({ country }, undefined, 'setCountry'),
        addOne: (item: Bear, params?: ParamsRepository) => {
            set(
                (state) => ({
                    ...state,
                    itemsMap: {
                        ...state.itemsMap,
                        [item.id]: { ...item, isAggressive: true },
                    },
                    country: 'France',
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
        'BearStore',
        (bear: Bear) => bear.id,
        {
            onRehydrateStorage: () => (state, error) => {
                state?.onRehydrateStorage(state, error)
            },
            partialize: (state) => ({
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
            ...createLoadingSlice(set, get, store),
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

## Avoid repository

If you just want to use zustand store without repository functions, you can use functions like `createPersistedStore` which avoid repository
