import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, StyleSheet } from 'react-native'
import * as Updates from 'expo-updates'
import { FontAwesome5 } from '@expo/vector-icons'
import { colors, borderRadius, spacing } from '../theme'
import Avatar from '../components/Avatar'
import Card from '../components/Card'
import { getSecureStore } from '../api'

async function getAdminProfile(): Promise<{ email: string; name: string; role: string }> {
  try {
    const store = await getSecureStore()
    const email = (await store.getItemAsync('admin_email')) || ''
    const name = (await store.getItemAsync('admin_name')) || 'Admin'
    const role = (await store.getItemAsync('admin_role')) || 'admin'
    return { email, name, role }
  } catch {
    return { email: '', name: 'Admin', role: 'admin' }
  }
}

function formatRole(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function SettingsScreen({ navigation }: any) {
  const [checking, setChecking] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<string | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [readyToRestart, setReadyToRestart] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('Admin')
  const [role, setRole] = useState('admin')

  useEffect(() => {
    getAdminProfile().then(p => {
      setEmail(p.email)
      setName(p.name)
      setRole(p.role)
    })
  }, [])

  async function handleCheck() {
    setChecking(true)
    setUpdateInfo(null)
    setUpdateAvailable(false)
    setReadyToRestart(false)
    try {
      const update = await Updates.checkForUpdateAsync()
      if (update.isAvailable) {
        setUpdateInfo('A new version is available')
        setUpdateAvailable(true)
      } else {
        setUpdateInfo('You\'re up to date')
      }
    } catch (err: any) {
      setUpdateInfo('Failed to check: ' + (err.message || 'Unknown error'))
    } finally {
      setChecking(false)
    }
  }

  async function handleDownload() {
    setDownloading(true)
    setUpdateInfo('Downloading...')
    try {
      await Updates.fetchUpdateAsync()
      setUpdateAvailable(false)
      setReadyToRestart(true)
      setUpdateInfo('Download complete')
    } catch (err: any) {
      setUpdateInfo('Download failed: ' + (err.message || 'Unknown error'))
    } finally {
      setDownloading(false)
    }
  }

  async function handleRestart() {
    await Updates.reloadAsync()
  }

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            const store = await getSecureStore()
            await store.removeItemAsync('admin_token')
          } catch {}
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
        },
      },
    ])
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.xxl }}>
      <Card style={styles.profileCard}>
        <View style={styles.profileRow}>
          <Avatar name={name || 'A'} size={56} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name || 'Admin'}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{formatRole(role)}</Text>
            </View>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>App Updates</Text>
      <Card>
        <Text style={styles.versionText}>
          Version {(Updates.manifest as any)?.version || '1.0.0'}
        </Text>

        <TouchableOpacity
          onPress={handleCheck}
          disabled={checking || downloading}
          style={[styles.actionBtn, { opacity: (checking || downloading) ? 0.5 : 1 }]}
        >
          {checking ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.actionBtnText}>Check for Updates</Text>
          )}
        </TouchableOpacity>

        {updateInfo && (
          <Text style={styles.updateInfo}>{updateInfo}</Text>
        )}

        {updateAvailable && !downloading && (
          <TouchableOpacity onPress={handleDownload} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Download Update</Text>
          </TouchableOpacity>
        )}

        {downloading && (
          <View style={styles.downloadingRow}>
            <ActivityIndicator color={colors.gold} size="small" />
            <Text style={styles.downloadingText}>Downloading...</Text>
          </View>
        )}

        {readyToRestart && (
          <TouchableOpacity onPress={handleRestart} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Restart to Apply</Text>
          </TouchableOpacity>
        )}
      </Card>

      <Text style={styles.sectionTitle}>Preferences</Text>
      <Card>
        <TouchableOpacity onPress={() => navigation.navigate('NotificationPreferences')} style={styles.navRow}>
          <Text style={styles.navRowText}>Notification Preferences</Text>
          <FontAwesome5 name="chevron-right" size={14} color={colors.grayLight} />
        </TouchableOpacity>
      </Card>

      <Text style={styles.sectionTitle}>Account</Text>
      <Card>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  profileCard: { marginHorizontal: 0, marginVertical: 0, marginBottom: 24 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileInfo: { marginLeft: 16, flex: 1 },
  profileName: { color: colors.white, fontSize: 18, fontWeight: '700' },
  profileEmail: { color: colors.grayLight, fontSize: 14, marginTop: 2 },
  roleBadge: {
    backgroundColor: colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleText: { color: '#000', fontSize: 11, fontWeight: '700' },
  sectionTitle: { color: colors.grayLight, fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 8, marginLeft: 4 },
  versionText: { color: colors.grayLight, fontSize: 14, marginBottom: 16 },
  actionBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: { color: '#000', fontWeight: '600', fontSize: 15 },
  updateInfo: { color: colors.grayLight, fontSize: 13, marginTop: 12, textAlign: 'center' },
  secondaryBtn: {
    backgroundColor: colors.cardBorder,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryBtnText: { color: colors.gold, fontWeight: '600', fontSize: 14 },
  downloadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 8 },
  downloadingText: { color: colors.grayLight, fontSize: 12 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  navRowText: { color: colors.white, fontSize: 15, fontWeight: '500' },
  logoutBtn: { alignItems: 'center', paddingVertical: 4 },
  logoutText: { color: colors.red, fontSize: 16, fontWeight: '600' },
})
