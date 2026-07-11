import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { api } from '../api'
import { getSocket } from '../socket'
import { disconnectSocket } from '../socket'

type Conversation = {
  id: string
  customerName: string
  status: string
  lastMessage: { content: string; createdAt: string } | null
  updatedAt: string
}

export default function ConversationsScreen({ navigation }: any) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'WAITING' | 'ACTIVE' | 'CLOSED' | ''>('')

  const load = useCallback(async () => {
    try {
      const data = await api.getConversations(filter || undefined)
      setConversations(data.conversations || [])
    } catch {}
  }, [filter])

  useEffect(() => {
    load()
    const socket = getSocket()
    if (!socket) return

    socket.on('message:new', load)
    socket.on('conversation:waiting', load)
    socket.on('conversation:updated', load)

    return () => {
      socket.off('message:new', load)
      socket.off('conversation:waiting', load)
      socket.off('conversation:updated', load)
    }
  }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
    >
      <View style={styles.conversationHeader}>
        <Text style={styles.customerName}>{item.customerName || 'Unknown'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'WAITING' ? '#d4af37' : item.status === 'ACTIVE' ? '#22c55e' : '#555' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.lastMessage} numberOfLines={1}>
        {item.lastMessage?.content || 'No messages'}
      </Text>
      <Text style={styles.time}>{new Date(item.updatedAt).toLocaleString()}</Text>
    </TouchableOpacity>
  )

  const FilterButton = ({ label, value }: { label: string; value: typeof filter }) => (
    <TouchableOpacity
      style={[styles.filterBtn, filter === value && styles.filterBtnActive]}
      onPress={() => setFilter(value === filter ? '' : value)}
    >
      <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <FilterButton label="Waiting" value="WAITING" />
        <FilterButton label="Active" value="ACTIVE" />
        <FilterButton label="Closed" value="CLOSED" />
        {filter ? <FilterButton label="Clear" value="" /> : null}
      </View>
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d4af37" />}
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={<Text style={styles.empty}>No conversations</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  filters: { flexDirection: 'row', padding: 12, gap: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1a1a1a' },
  filterBtnActive: { backgroundColor: '#d4af37' },
  filterText: { color: '#888', fontSize: 14 },
  filterTextActive: { color: '#000', fontWeight: '600' },
  conversationItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  customerName: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10 },
  statusText: { color: '#000', fontSize: 11, fontWeight: '600' },
  lastMessage: { color: '#888', fontSize: 14, marginBottom: 4 },
  time: { color: '#555', fontSize: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#555', fontSize: 16 },
})
