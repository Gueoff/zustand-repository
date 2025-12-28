/**
 * List of entities to test zustand-repository (async call with loading)
 */
import React from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useShallow } from 'zustand/react/shallow'

import { useEntityStore } from './entity.store'
import { Entity } from './entity.type'
import { randomId } from './utils'

function App() {
  const addOne = useEntityStore((state) => state.addOne)
  const removeOne = useEntityStore((state) => state.removeOne)
  const items = useEntityStore(useShallow((state) => state.items()))
  const isLoading = useEntityStore((state) => state.isLoading())
  const isAddLoading = useEntityStore((state) => state.isLoadingKey('addOneOperation'))
  const isLoadingKey = useEntityStore((state) => state.isLoadingKey)

  const operation = useEntityStore((state) => state.operation)

  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  const onAddOne = () => {
    addOne({ id: randomId(), name: `Item number ${items.length}` })
  }

  const onAddOneAsync = async () => {
    await operation(async function addOneOperation() {
      await delay(500)
      onAddOne()
    })()
  }

  const onRemoveOne = (entity: Entity) => {
    removeOne(entity.id)
  }

  const onRemoveOneAsync = async (entity: Entity) => {
    await operation(async function removeOneOperation() {
      await delay(500)
      onRemoveOne(entity)
    })(entity.id)
  }

  /** Render one entity from the store in list */
  const renderItem = ({ item }: { item: Entity }) => (
    <View style={styles.item}>
      <Text>{item.name}</Text>
      <Pressable onPress={() => onRemoveOneAsync(item)} style={styles.remove}>
        {isLoadingKey(item.id) && <ActivityIndicator />}
        <Text>Remove</Text>
      </Pressable>
    </View>
  )

  const ItemSeparatorComponent = () => <View style={styles.separator} />

  /** Render list header to add entity in store */
  const ListHeaderComponent = () => (
    <Pressable style={styles.header} onPress={onAddOneAsync}>
      {isAddLoading && <ActivityIndicator />}
      <Text>ADD</Text>
    </Pressable>
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        ItemSeparatorComponent={ItemSeparatorComponent}
        ListHeaderComponent={ListHeaderComponent}
        renderItem={renderItem}
      />

      {isLoading && (
        <View style={styles.absolute}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  absolute: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 24,
  },
  item: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
  },
  remove: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 4,
  },
  separator: {
    backgroundColor: 'black',
    height: 1,
  },
})

export default App
