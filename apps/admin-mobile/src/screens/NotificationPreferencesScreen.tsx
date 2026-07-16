import React, { useEffect, useState } from 'react'
import { View, Text, Switch, ScrollView, StyleSheet } from 'react-native'
import { colors, borderRadius, spacing } from '../theme'
import { api } from '../api'
import { savePushPreferences, getPushPreferences } from '../store'

type Prefs = {
  newConversation: boolean
  newMessage: boolean
  assignmentChanged: boolean
  sound: boolean
  quietHoursEnabled: boolean
  quietHoursFrom: string
  quietHoursTo: string
}

const defaultPrefs: Prefs = {
  newConversation: true,
  newMessage: true,
  assignmentChanged: true,
  sound: true,
  quietHoursEnabled: false,
  quietHoursFrom: '22:00',
  quietHoursTo: '08:00',
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.cardBorder, true: colors.gold + '60' }}
        thumbColor={value ? colors.gold : colors.gray}
      />
    </View>
  )
}

export default function NotificationPreferencesScreen() {
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getPushPreferences().then(cached => {
      if (cached) { setPrefs(cached as Prefs); setLoaded(true) }
    })
    api.getPushPreferences()
      .then((data: any) => {
        const p: Prefs = { ...defaultPrefs, ...data }
        setPrefs(p)
        savePushPreferences(p)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const update = (key: keyof Prefs, value: any) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    savePushPreferences(next)
    api.updatePushPreferences(next).catch(() => {})
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.xxl }}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Events</Text>
        <ToggleRow label="New Conversation" value={prefs.newConversation} onChange={v => update('newConversation', v)} />
        <ToggleRow label="New Message" value={prefs.newMessage} onChange={v => update('newMessage', v)} />
        <ToggleRow label="Assignment Changed" value={prefs.assignmentChanged} onChange={v => update('assignmentChanged', v)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sound</Text>
        <ToggleRow label="Play Sound" value={prefs.sound} onChange={v => update('sound', v)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiet Hours</Text>
        <ToggleRow label="Enable Quiet Hours" value={prefs.quietHoursEnabled} onChange={v => update('quietHoursEnabled', v)} />
        {prefs.quietHoursEnabled && (
          <View style={styles.quietHoursRow}>
            <Text style={styles.quietHoursText}>{prefs.quietHoursFrom} — {prefs.quietHoursTo}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  sectionTitle: { color: colors.gold, fontSize: 13, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  toggleLabel: { color: colors.white, fontSize: 15, fontWeight: '500' },
  quietHoursRow: { paddingVertical: 12, alignItems: 'center' },
  quietHoursText: { color: colors.grayLight, fontSize: 16, fontWeight: '600' },
})
