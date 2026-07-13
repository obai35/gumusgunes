import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

const COLORS = ['#d4af37', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#f97316', '#06b6d4']

function hashColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'
}

interface Props {
  name: string
  size?: number
}

export default function Avatar({ name, size = 40 }: Props) {
  const bg = hashColor(name || '?')
  const initials = getInitials(name || '?')
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center' },
  text: { color: '#000', fontWeight: '700' },
})
