/**
 * List of entities to test zustand-repository
 */
import React from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useShallow } from 'zustand/react/shallow'

import { useEntityStore } from './entity.store'
import { Entity } from './entity.type'

/**
 * Generate random ID (test purpose)
 * @param length
 */
function randomId(length = 8) {
  return Math.random()
    .toString(36)
    .slice(2, 2 + length)
}

function App() {
  const addOne = useEntityStore((state) => state.addOne)
  const removeOne = useEntityStore((state) => state.removeOne)
  const items = useEntityStore(useShallow((state) => state.items()))

  const onAddOne = () => {
    addOne({ id: randomId(), name: `Item number ${items.length}` })
  }

  const onRemoveOne = (entity: Entity) => {
    removeOne(entity.id)
  }

  /** Render one entity from the store in list */
  const renderItem = ({ item }: { item: Entity }) => (
    <View style={styles.item}>
      <Text>{item.name}</Text>
      <Pressable onPress={() => onRemoveOne(item)} style={styles.remove}>
        <Text>Remove</Text>
      </Pressable>
    </View>
  )

  const ItemSeparatorComponent = () => <View style={styles.separator} />

  /** Render list header to add entity in store */
  const ListHeaderComponent = () => (
    <Pressable style={styles.header} onPress={onAddOne}>
      <Text>ADD</Text>
    </Pressable>
  )

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={ListHeaderComponent}
        ItemSeparatorComponent={ItemSeparatorComponent}
        data={items}
        renderItem={renderItem}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderWidth: 1,
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
    borderWidth: 1,
    padding: 4,
  },
  separator: {
    backgroundColor: 'black',
    height: 1,
  },
})

export default App
