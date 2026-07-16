import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FontAwesome5 } from '@expo/vector-icons'
import { colors, borderRadius, spacing } from '../theme'
import { api } from '../api'

type ChannelStat = { channel: string; count: number; percentage: number }
type AgentWorkload = { adminId: string; name: string; activeCount: number }
type Stats = {
  totalConversations: number
  activeConversations: number
  waitingConversations: number
  todayMessages: number
  byChannel: ChannelStat[]
  agentWorkload: AgentWorkload[]
}

const channelIcons: Record<string, string> = {
  whatsapp: 'whatsapp',
  messenger: 'facebook-messenger',
  instagram: 'instagram',
  website: 'globe',
}

const channelColors: Record<string, string> = {
  whatsapp: '#25D366',
  messenger: '#0084FF',
  instagram: '#E4405F',
  website: '#d4af37',
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <FontAwesome5 name={icon} size={16} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export default function DashboardScreen() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await api.getConversationStats()
      setStats(data)
    } catch (e) {
      console.warn('Failed to load dashboard stats:', e)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
    >
      <LinearGradient colors={['#0f0f0f', '#111']} style={styles.headerBar}>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </LinearGradient>

      <View style={styles.statGrid}>
        <StatCard label="Total" value={stats?.totalConversations ?? 0} icon="comments" color={colors.gold} />
        <StatCard label="Active" value={stats?.activeConversations ?? 0} icon="clock" color={colors.green} />
        <StatCard label="Waiting" value={stats?.waitingConversations ?? 0} icon="hourglass-half" color="#f97316" />
        <StatCard label="Today" value={stats?.todayMessages ?? 0} icon="envelope" color="#3b82f6" />
      </View>

      <Text style={styles.sectionTitle}>By Channel</Text>
      <View style={styles.channelSection}>
        {(stats?.byChannel ?? []).map(ch => (
          <View key={ch.channel} style={styles.channelRow}>
            <View style={styles.channelLabelRow}>
              <FontAwesome5 name={channelIcons[ch.channel] || 'question'} size={14} color={channelColors[ch.channel] || '#888'} />
              <Text style={styles.channelName}>{ch.channel}</Text>
              <Text style={styles.channelCount}>{ch.count}</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${ch.percentage}%`, backgroundColor: channelColors[ch.channel] || colors.gold }]} />
            </View>
          </View>
        ))}
        {(stats?.byChannel ?? []).length === 0 && (
          <Text style={styles.emptyText}>No channel data</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Agent Workload</Text>
      <View style={styles.channelSection}>
        {(stats?.agentWorkload ?? []).map(a => (
          <View key={a.adminId} style={styles.agentRow}>
            <Text style={styles.agentName}>{a.name}</Text>
            <View style={styles.agentBadge}>
              <Text style={styles.agentCount}>{a.activeCount} active</Text>
            </View>
          </View>
        ))}
        {(stats?.agentWorkload ?? []).length === 0 && (
          <Text style={styles.emptyText}>No active conversations</Text>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { color: colors.gold, fontSize: 18, fontWeight: '700' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  statCard: {
    width: '46%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { color: colors.white, fontSize: 28, fontWeight: '700' },
  statLabel: { color: colors.grayLight, fontSize: 13, marginTop: 4 },
  sectionTitle: { color: colors.grayLight, fontSize: 13, fontWeight: '600', marginLeft: 16, marginTop: 16, marginBottom: 8 },
  channelSection: { backgroundColor: colors.card, marginHorizontal: 12, borderRadius: borderRadius.md, padding: 16, borderWidth: 1, borderColor: colors.cardBorder },
  channelRow: { marginBottom: 16 },
  channelLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  channelName: { color: colors.white, fontSize: 14, fontWeight: '500', flex: 1 },
  channelCount: { color: colors.grayLight, fontSize: 13 },
  barBg: { height: 8, backgroundColor: colors.cardBorder, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  agentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  agentName: { color: colors.white, fontSize: 14, fontWeight: '500' },
  agentBadge: { backgroundColor: colors.gold + '20', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  agentCount: { color: colors.gold, fontSize: 12, fontWeight: '600' },
  emptyText: { color: colors.gray, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
})
