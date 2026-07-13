import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../theme'

const STATUS_COLORS: Record<string, string> = {
  WAITING: colors.gold,
  ACTIVE: colors.green,
  CLOSED: colors.gray,
}

interface Props {
  status: string
}

export default function Badge({ status }: Props) {
  const bg = STATUS_COLORS[status] || colors.gray
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.text}>{status}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  text: { color: '#000', fontSize: 11, fontWeight: '600' },
})
