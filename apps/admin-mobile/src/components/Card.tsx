import React from 'react'
import { View, StyleSheet } from 'react-native'
import { colors, shadows, borderRadius } from '../theme'

interface Props {
  children: React.ReactNode
  style?: any
}

export default function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 4,
    ...shadows.card,
  },
})
