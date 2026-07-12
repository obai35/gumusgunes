import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import * as Updates from 'expo-updates'

export default function SettingsScreen({ navigation }: any) {
  const [checking, setChecking] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<string | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [downloading, setDownloading] = useState(false)

  async function handleCheck() {
    setChecking(true)
    setUpdateInfo(null)
    setUpdateAvailable(false)
    try {
      const update = await Updates.checkForUpdateAsync()
      if (update.isAvailable) {
        setUpdateInfo('Update available')
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
      setUpdateInfo('Download complete. Restart to apply.')
      setUpdateAvailable(false)
    } catch (err: any) {
      setUpdateInfo('Download failed: ' + (err.message || 'Unknown error'))
    } finally {
      setDownloading(false)
    }
  }

  async function handleRestart() {
    await Updates.reloadAsync()
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#111', padding: 24 }}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
        Settings
      </Text>
      <Text style={{ color: '#888', fontSize: 14, marginBottom: 32 }}>
        Version {Updates.manifest?.version || '1.0.0'}
      </Text>

      <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <Text style={{ color: '#d4af37', fontSize: 16, fontWeight: '600', marginBottom: 16 }}>
          App Updates
        </Text>

        <TouchableOpacity
          onPress={handleCheck}
          disabled={checking || downloading}
          style={{
            backgroundColor: '#d4af37',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            alignItems: 'center',
            opacity: (checking || downloading) ? 0.5 : 1,
          }}
        >
          {checking ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={{ color: '#000', fontWeight: '600', fontSize: 15 }}>
              Check for Updates
            </Text>
          )}
        </TouchableOpacity>

        {updateInfo && (
          <Text style={{ color: '#888', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
            {updateInfo}
          </Text>
        )}

        {updateAvailable && !downloading && (
          <TouchableOpacity
            onPress={handleDownload}
            style={{
              backgroundColor: '#333',
              paddingVertical: 10,
              paddingHorizontal: 24,
              borderRadius: 8,
              alignItems: 'center',
              marginTop: 12,
            }}
          >
            <Text style={{ color: '#d4af37', fontWeight: '600', fontSize: 14 }}>
              Download Update
            </Text>
          </TouchableOpacity>
        )}

        {downloading && (
          <View style={{ marginTop: 12, alignItems: 'center' }}>
            <ActivityIndicator color="#d4af37" size="small" />
            <Text style={{ color: '#888', fontSize: 12, marginTop: 8 }}>Downloading...</Text>
          </View>
        )}

        {updateInfo === 'Download complete. Restart to apply.' && (
          <TouchableOpacity
            onPress={handleRestart}
            style={{
              backgroundColor: '#d4af37',
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
              alignItems: 'center',
              marginTop: 12,
            }}
          >
            <Text style={{ color: '#000', fontWeight: '600', fontSize: 15 }}>
              Restart to Apply
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
