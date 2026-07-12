import { AppRegistry } from 'react-native'
import React from 'react'
import { View, Text } from 'react-native'

function Root() {
  try {
    var AppModule = require('./App')
    var AppComponent = AppModule.default || AppModule
    return <AppComponent />
  } catch (e) {
    var msg = e && typeof e === 'object' && e.message ? e.message : 'Failed to load app'
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: '#ef4444', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>App Error</Text>
        <Text style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>{String(msg)}</Text>
      </View>
    )
  }
}

AppRegistry.registerComponent('main', () => Root)
