import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal, ActivityIndicator } from 'react-native'
import { FontAwesome5 } from '@expo/vector-icons'
import { colors, borderRadius } from '../theme'
import Avatar from './Avatar'
import { api } from '../api'

type Agent = { id: string; name: string; email: string; activeConversations: number }

interface Props {
  visible: boolean
  currentAssignee?: { id: string; name: string } | null
  conversationId: string
  onAssign: (adminId: string) => void
  onUnassign: () => void
  onClose: () => void
}

export default function AgentAssignSheet({ visible, currentAssignee, conversationId, onAssign, onUnassign, onClose }: Props) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!visible) return
    setLoading(true)
    api.getAgents()
      .then((data: any) => setAgents(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [visible])

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Assign To</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome5 name="times" size={18} color={colors.grayLight} />
            </TouchableOpacity>
          </View>

          {currentAssignee && (
            <TouchableOpacity style={styles.unassignBtn} onPress={onUnassign}>
              <FontAwesome5 name="user-slash" size={14} color={colors.red} />
              <Text style={styles.unassignText}>Unassign ({currentAssignee.name})</Text>
            </TouchableOpacity>
          )}

          {loading ? (
            <ActivityIndicator color={colors.gold} style={{ marginVertical: 40 }} />
          ) : (
            <FlatList
              data={agents}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const isCurrent = currentAssignee?.id === item.id
                return (
                  <TouchableOpacity
                    style={styles.agentRow}
                    onPress={() => { if (!isCurrent) onAssign(item.id) }}
                    disabled={isCurrent}
                  >
                    <Avatar name={item.name} size={40} />
                    <View style={styles.agentInfo}>
                      <Text style={styles.agentName}>{item.name}</Text>
                      <Text style={styles.agentActive}>{item.activeConversations} active</Text>
                    </View>
                    {isCurrent && (
                      <FontAwesome5 name="check-circle" size={20} color={colors.green} />
                    )}
                  </TouchableOpacity>
                )
              }}
              ListEmptyComponent={<Text style={styles.empty}>No agents found</Text>}
            />
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  title: { color: colors.white, fontSize: 17, fontWeight: '700' },
  unassignBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, marginHorizontal: 16, marginTop: 12,
    borderRadius: 8, borderWidth: 1, borderColor: colors.red, backgroundColor: colors.red + '10',
  },
  unassignText: { color: colors.red, fontWeight: '600', fontSize: 14 },
  agentRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    marginHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  agentInfo: { flex: 1, marginLeft: 12 },
  agentName: { color: colors.white, fontSize: 15, fontWeight: '500' },
  agentActive: { color: colors.grayLight, fontSize: 12, marginTop: 2 },
  empty: { color: colors.gray, textAlign: 'center', paddingVertical: 40 },
})
