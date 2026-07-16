import React, { useEffect, useState, useCallback, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { GiftedChat, IMessage, Bubble, InputToolbar } from 'react-native-gifted-chat'
import { FontAwesome5 } from '@expo/vector-icons'
import { colors, borderRadius } from '../theme'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import { api } from '../api'
import { getSocket } from '../socket'
import AgentAssignSheet from '../components/AgentAssignSheet'

const sourceIcons: Record<string, string> = {
  whatsapp: 'whatsapp',
  messenger: 'facebook-messenger',
  instagram: 'instagram',
  website: 'globe',
}

const brandColors: Record<string, string> = {
  whatsapp: '#25D366',
  messenger: '#0084FF',
  instagram: '#E4405F',
  website: '#D4AF37',
}

export default function ChatScreen({ route, navigation }: any) {
  const { conversationId } = route.params
  const [messages, setMessages] = useState<IMessage[]>([])
  const [conversation, setConversation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const onSendRef = useRef(false)
  const [showAssignSheet, setShowAssignSheet] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await api.getConversation(conversationId)
      setConversation(data.conversation)
      const msgs: IMessage[] = (data.conversation.messages || []).map((m: any) => ({
        _id: m.id,
        text: m.content,
        createdAt: new Date(m.createdAt),
        user: {
          _id: m.role === 'ADMIN' ? 'admin' : m.role === 'BOT' ? 'bot' : 'customer',
          name: m.role === 'ADMIN'
            ? (data.conversation.assignedAdmin?.name || 'You')
            : m.role === 'BOT'
              ? 'Gümüş Güneş'
              : data.conversation.customerName || 'Customer',
        },
      }))
      setMessages(msgs.reverse())
    } catch {
      Alert.alert('Error', 'Failed to load conversation')
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    load()
    const socket = getSocket()
    if (!socket) return

    const handleNewMessage = (msg: any) => {
      if (msg.conversationId === conversationId) {
        setMessages(prev => GiftedChat.append(prev, [{
          _id: msg.id,
          text: msg.content,
          createdAt: new Date(msg.createdAt),
          user: {
            _id: msg.role === 'ADMIN' ? 'admin' : msg.role === 'BOT' ? 'bot' : 'customer',
            name: msg.role || '',
          },
        }]))
      }
    }

    socket.on('message:new', handleNewMessage)
    socket.on('conversation:typing', (data: any) => {
      if (data.conversationId === conversationId) {
        setIsTyping(data.isTyping)
      }
    })

    return () => {
      socket.off('message:new', handleNewMessage)
      socket.off('conversation:typing')
    }
  }, [conversationId, load])

  const handleClaim = async () => {
    setClaiming(true)
    try {
      await api.claimConversation(conversationId)
      Alert.alert('Claimed', 'You are now handling this conversation')
      await load()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setClaiming(false)
    }
  }

  const handleAssign = async (adminId: string) => {
    try {
      await api.assignConversation(conversationId, adminId)
      setShowAssignSheet(false)
      await load()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const handleUnassign = async () => {
    try {
      await api.unassignConversation(conversationId)
      setShowAssignSheet(false)
      await load()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const handleClose = () => {
    Alert.alert('Close Conversation', 'Mark this conversation as closed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close', style: 'destructive', onPress: async () => {
        try {
          await api.closeConversation(conversationId)
          navigation.goBack()
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Failed to close conversation')
        }
      }},
    ])
  }

  const onSend = async (newMessages: IMessage[]) => {
    const text = newMessages[0]?.text
    if (!text || sending) return
    const optimisticMsg: IMessage = {
      _id: `temp-${Date.now()}`,
      text,
      createdAt: new Date(),
      user: { _id: 'admin', name: 'You' },
    }
    setMessages(prev => GiftedChat.append(prev, [optimisticMsg]))
    setSending(true)
    onSendRef.current = true
    try {
      await api.sendMessage(conversationId, text)
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id))
      Alert.alert('Error', err.message)
    } finally {
      setSending(false)
      onSendRef.current = false
    }
  }

  const renderBubble = (props: any) => {
    return (
      <Bubble
        {...props}
        textStyle={{
          right: { color: '#000' },
          left: { color: colors.white },
        }}
        wrapperStyle={{
          left: {
            backgroundColor: colors.bubbleLeft,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.bubbleBorder,
          },
          right: {
            backgroundColor: colors.gold,
            borderRadius: 16,
          },
        }}
        timeTextStyle={{
          left: { color: colors.gray },
          right: { color: 'rgba(0,0,0,0.6)', fontSize: 11 },
        }}
      />
    )
  }

  const renderTypingIndicator = () => {
    if (!isTyping) return null
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingDot} />
        <View style={[styles.typingDot, styles.typingDotMiddle]} />
        <View style={styles.typingDot} />
        <Text style={styles.typingText}>Customer is typing...</Text>
      </View>
    )
  }

  if (loading) return <View style={styles.loading}><Text style={{ color: colors.grayLight }}>Loading...</Text></View>

  return (
    <View style={styles.container}>
      {conversation && (
        <View style={styles.infoBar}>
          <FontAwesome5 name={sourceIcons[conversation.source] || 'question'} size={20} color={brandColors[conversation.source] || '#888'} />
          <Avatar name={conversation.customerName || '?'} size={36} />
          <View style={styles.infoBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoName}>{conversation.customerName || 'Unknown'}</Text>
              <View style={[styles.onlineDot, { backgroundColor: conversation.status === 'CLOSED' ? colors.gray : colors.green }]} />
            </View>
            <View style={styles.infoRow}>
              <Badge status={conversation.status} />
              {conversation.assignedAdmin?.name ? (
                <TouchableOpacity onPress={() => setShowAssignSheet(true)} style={styles.assignRow}>
                  <Text style={styles.assigned}>Assigned to {conversation.assignedAdmin.name}</Text>
                  <FontAwesome5 name="chevron-down" size={10} color={colors.grayLight} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setShowAssignSheet(true)}>
                  <Text style={styles.assignLink}>Assign</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{ _id: 'admin', name: 'You' }}
        renderBubble={renderBubble}
        renderFooter={renderTypingIndicator}
        renderInputToolbar={(props: any) => (
          <View>
            <View style={styles.actionBar}>
              {(!conversation?.assignedAdmin && !conversation?.assignedTo) && (
                <TouchableOpacity style={styles.claimBtn} onPress={handleClaim} disabled={claiming}>
                  {claiming ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.claimText}>Claim Conversation</Text>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
            <InputToolbar {...props} />
          </View>
        )}
        textInputProps={{
          style: {
            color: colors.white,
            backgroundColor: colors.inputBg,
            borderRadius: 24,
            paddingHorizontal: 20,
            paddingVertical: 10,
            marginHorizontal: 8,
          },
          placeholderTextColor: colors.gray,
        }}
        timeTextStyle={{ left: { color: colors.gray }, right: { color: 'rgba(0,0,0,0.6)' } }}
        isLoadingEarlier={loading}
      />
      <AgentAssignSheet
        visible={showAssignSheet}
        currentAssignee={conversation?.assignedAdmin ? { id: conversation.assignedAdmin.id, name: conversation.assignedAdmin.name } : null}
        conversationId={conversationId}
        onAssign={handleAssign}
        onUnassign={handleUnassign}
        onClose={() => setShowAssignSheet(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  infoBody: { flex: 1, marginLeft: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  infoName: { color: colors.white, fontSize: 15, fontWeight: '600' },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  assigned: { color: colors.grayLight, fontSize: 11 },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 3,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  typingDotMiddle: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },
  typingText: { color: colors.grayLight, fontSize: 12, marginLeft: 6 },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  claimBtn: {
    flex: 1,
    backgroundColor: colors.green,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  claimText: { color: '#000', fontWeight: '600', fontSize: 14 },
  closeBtn: {
    backgroundColor: colors.red,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  assignRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  assignLink: { color: colors.gold, fontSize: 11, fontWeight: '600' },
})
