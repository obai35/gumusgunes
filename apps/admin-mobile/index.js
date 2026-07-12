import { AppRegistry } from 'react-native'
import React from 'react'
import { View, Text } from 'react-native'

let AppComponent: React.ComponentType<any> | null = null
let loadError: string | null = null

try {
  const AppModule = require('./App')
  AppComponent = AppModule.default || AppModule
} catch (e: any) {
  loadError = e?.message || 'Failed to load app'
}

function Root() {
  if (loadError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: '#ef4444', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>App Error</Text>
        <Text style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>{loadError}</Text>
      </View>
    )
  }
  if (!AppComponent) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#888' }}>Loading...</Text>
      </View>
    )
  }
  return <AppComponent />
}

AppRegistry.registerComponent('main', () => Root)
