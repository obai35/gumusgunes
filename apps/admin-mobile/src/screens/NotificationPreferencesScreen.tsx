import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../theme'

export default function NotificationPreferencesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Notification Preferences</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  text: { color: colors.gold, fontSize: 18 },
})
