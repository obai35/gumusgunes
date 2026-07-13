import React, { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as Notifications from 'expo-notifications'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import LoginScreen from './src/screens/LoginScreen'
import ConversationsScreen from './src/screens/ConversationsScreen'
import SettingsScreen from './src/screens/SettingsScreen'
import { createNotificationChannel, setLastNotificationResponse } from './src/notifications'

const Stack = createNativeStackNavigator()

let ChatScreen: React.ComponentType<any> | null = null

function ErrorFallback({ error, retry }: { error: string; retry: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ color: '#ef4444', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>App Error</Text>
      <Text style={{ color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>{error}</Text>
      <TouchableOpacity onPress={retry} style={{ backgroundColor: '#d4af37', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}>
        <Text style={{ color: '#000', fontWeight: '600' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  )
}

function LazyChatScreen(props: any) {
  const [Screen, setScreen] = useState<React.ComponentType<any> | null>(ChatScreen)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!Screen) {
      import('./src/screens/ChatScreen')
        .then(mod => {
          ChatScreen = mod.default
          setScreen(() => mod.default)
        })
        .catch((err: Error) => {
          setLoadError(err.message || 'Failed to load chat screen')
        })
    }
  }, [Screen])

  if (loadError) return <ErrorFallback error={loadError} retry={() => { setLoadError(null); ChatScreen = null; setScreen(null) }} />
  if (!Screen) return <View style={{ flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#888' }}>Loading...</Text></View>
  return <Screen {...props} />
}

export default function App() {
  const [fatalError, setFatalError] = useState<string | null>(null)
  const navigationRef = useRef<NavigationContainerRef<any>>(null)
  const notificationResponseListener = useRef<any>(null)

  useEffect(() => {
    createNotificationChannel()

    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data
      const conversationId = data?.conversationId as string | undefined
      if (conversationId && navigationRef.current?.isReady()) {
        navigationRef.current.navigate('Chat' as never, { conversationId } as never)
      }
    })

    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        setLastNotificationResponse(response)
      }
    })

    return () => {
      if (notificationResponseListener.current) {
        Notifications.removeNotificationSubscription(notificationResponseListener.current)
      }
    }
  }, [])

  useEffect(() => {
    const handler = (error: Error, isFatal: boolean) => {
      console.error('Fatal error:', error.message, error.stack)
      if (isFatal) setFatalError(error.message || 'Unknown error')
    }
    if (ErrorUtils?.setGlobalHandler) {
      ErrorUtils.setGlobalHandler(handler)
    }
    return () => {
      if (ErrorUtils?.setGlobalHandler) {
        ErrorUtils.setGlobalHandler(undefined as any)
      }
    }
  }, [])

  if (fatalError) {
    return <ErrorFallback error={fatalError} retry={() => setFatalError(null)} />
  }

  return (
    <KeyboardProvider>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerStyle: { backgroundColor: '#0a0a0a' },
              headerTintColor: '#d4af37',
              headerTitleStyle: { fontWeight: '600', fontSize: 18 },
              contentStyle: { backgroundColor: '#111' },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Conversations" component={ConversationsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Chat" component={LazyChatScreen} options={{ title: 'Chat' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </KeyboardProvider>
  )
}
