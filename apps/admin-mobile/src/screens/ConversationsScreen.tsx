import React, { useEffect, useState, useCallback, useRef } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ScrollView } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { FontAwesome5 } from '@expo/vector-icons'
import { colors, borderRadius } from '../theme'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import { timeAgo } from '../utils/timeago'
import { api } from '../api'
import { getSocket } from '../socket'

const FilterButton = ({ label, value, filter, setFilter }: { label: string; value: '' | 'WAITING' | 'ACTIVE' | 'CLOSED'; filter: string; setFilter: (v: any) => void }) => {
  const active = filter === value
  return (
    <TouchableOpacity
      style={[styles.filterBtn, active && styles.filterBtnActive]}
      onPress={() => setFilter(value === filter ? '' : value)}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

type Conversation = {
  id: string
  customerName: string
  status: string
  source: string
  lastMessage: { content: string; createdAt: string } | null
  updatedAt: string
}

const platforms = [
  { key: 'all', label: 'All', icon: 'layer-group' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp' },
  { key: 'messenger', label: 'Messenger', icon: 'facebook-messenger' },
  { key: 'instagram', label: 'Instagram', icon: 'instagram' },
  { key: 'website', label: 'Website', icon: 'globe' },
] as const

const brandColors: Record<string, string> = {
  whatsapp: '#25D366',
  messenger: '#0084FF',
  instagram: '#E4405F',
  website: colors.gold,
  all: '#ffffff',
}

const sourceIcons: Record<string, string> = {
  whatsapp: 'whatsapp',
  messenger: 'facebook-messenger',
  instagram: 'instagram',
  website: 'globe',
}

export default function ConversationsScreen({ navigation }: any) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'WAITING' | 'ACTIVE' | 'CLOSED' | ''>('')
  const [source, setSource] = useState<'all' | 'whatsapp' | 'messenger' | 'instagram' | 'website'>('all')

  const load = useCallback(async () => {
    try {
      const data = await api.getConversations(filter || undefined, source)
      setConversations(data.conversations || [])
    } catch (e) { console.warn('Failed to load conversations:', e) }
  }, [filter, source])

  useEffect(() => {
    load()
    const socket = getSocket()
    if (!socket) return
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    const debouncedLoad = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(load, 500)
    }
    socket.on('message:new', debouncedLoad)
    socket.on('conversation:waiting', debouncedLoad)
    socket.on('conversation:updated', debouncedLoad)
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      socket.off('message:new', debouncedLoad)
      socket.off('conversation:waiting', debouncedLoad)
      socket.off('conversation:updated', debouncedLoad)
    }
  }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const renderItem = ({ item, index }: { item: Conversation; index: number }) => (
    <Animated.View entering={FadeIn.delay(index * 50).duration(300)}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
      >
        <View style={[styles.sourceBadge, { backgroundColor: brandColors[item.source] || '#555' }]}>
          <FontAwesome5 name={sourceIcons[item.source] || 'question'} size={12} color="#fff" />
        </View>
        <Avatar name={item.customerName || '?'} size={44} />
        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Text style={styles.customerName} numberOfLines={1}>{item.customerName || 'Unknown'}</Text>
            <Badge status={item.status} />
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage?.content || 'No messages'}
          </Text>
          <Text style={styles.time}>{timeAgo(item.updatedAt)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f0f0f', '#111']} style={styles.headerBar}>
        <Text style={styles.headerTitle}>Inbox</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <FontAwesome5 name="cog" size={20} color={colors.gold} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
        {platforms.map(p => {
          const active = source === p.key
          return (
            <TouchableOpacity
              key={p.key}
              style={[
                styles.tab,
                active && { backgroundColor: p.key === 'all' ? '#333' : brandColors[p.key] },
              ]}
              onPress={() => setSource(p.key as typeof source)}
              activeOpacity={0.7}
            >
              <FontAwesome5
                name={p.icon}
                size={16}
                color={active ? '#fff' : colors.grayLight}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <View style={styles.filters}>
        <FilterButton label="Waiting" value="WAITING" filter={filter} setFilter={setFilter} />
        <FilterButton label="Active" value="ACTIVE" filter={filter} setFilter={setFilter} />
        <FilterButton label="Closed" value="CLOSED" filter={filter} setFilter={setFilter} />
        {filter ? <FilterButton label="\u00D7" value="" filter={filter} setFilter={setFilter} /> : null}
      </View>

      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : { paddingBottom: 16, paddingTop: 4 }}
        ListEmptyComponent={<Text style={styles.empty}>No conversations</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { color: colors.gold, fontSize: 18, fontWeight: '700' },
  tabScroll: { maxHeight: 48, marginTop: 4 },
  tabContent: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.card,
  },
  tabLabel: { color: colors.grayLight, fontSize: 13, fontWeight: '500' },
  tabLabelActive: { color: '#fff', fontWeight: '700' },
  filters: { flexDirection: 'row', padding: 12, gap: 6, paddingBottom: 4 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.card },
  filterBtnActive: { backgroundColor: colors.gold },
  filterText: { color: colors.grayLight, fontSize: 12 },
  filterTextActive: { color: '#000', fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 4,
  },
  cardBody: { flex: 1, marginLeft: 12 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  customerName: { color: colors.white, fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  lastMessage: { color: colors.grayLight, fontSize: 13, marginTop: 2 },
  time: { color: colors.gray, fontSize: 11, marginTop: 2 },
  sourceBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: colors.gray, fontSize: 16 },
})
