import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { GiftedChat, IMessage, Bubble } from 'react-native-gifted-chat'
import { api } from '../api'
import { getSocket } from '../socket'

export default function ChatScreen({ route, navigation }: any) {
  const { conversationId } = route.params
  const [messages, setMessages] = useState<IMessage[]>([])
  const [conversation, setConversation] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
    return () => { socket.off('message:new', handleNewMessage) }
  }, [conversationId, load])

  const handleClaim = async () => {
    try {
      await api.claimConversation(conversationId)
      Alert.alert('Claimed', 'You are now handling this conversation')
      load()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const handleClose = async () => {
    Alert.alert('Close', 'Mark this conversation as closed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close', style: 'destructive', onPress: async () => {
        await api.closeConversation(conversationId)
        navigation.goBack()
      }},
    ])
  }

  const onSend = async (newMessages: IMessage[]) => {
    const text = newMessages[0]?.text
    if (!text) return
    try {
      await api.sendMessage(conversationId, text)
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  useEffect(() => {
    if (conversation) {
      navigation.setOptions({
        title: conversation.customerName || 'Chat',
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {!conversation.assignedTo && (
              <TouchableOpacity onPress={handleClaim} style={styles.claimBtn}>
                <Text style={styles.claimText}>Claim</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        ),
      })
    }
  }, [conversation, navigation])

  if (loading) return <View style={styles.loading}><Text style={{ color: '#888' }}>Loading...</Text></View>

  return (
    <GiftedChat
      messages={messages}
      onSend={onSend}
      user={{ _id: 'admin', name: 'You' }}
      renderBubble={(props) => (
        <Bubble
          {...props}
          textStyle={{ right: { color: '#fff' }, left: { color: '#fff' } }}
          wrapperStyle={{
            left: { backgroundColor: '#2a2a2a' },
            right: { backgroundColor: '#d4af37' },
          }}
        />
      )}
      timeTextStyle={{ left: { color: '#888' }, right: { color: '#000' } }}
      textInputProps={{
        style: { color: '#fff', backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 16 },
        placeholderTextColor: '#666',
      }}
      isLoadingEarlier={loading}
    />
  )
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  claimBtn: { backgroundColor: '#22c55e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  claimText: { color: '#000', fontSize: 13, fontWeight: '600' },
  closeBtn: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  closeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
})
