import React, { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { FontAwesome5 } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import LoginScreen from './src/screens/LoginScreen'
import ConversationsScreen from './src/screens/ConversationsScreen'
import SettingsScreen from './src/screens/SettingsScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import NotificationPreferencesScreen from './src/screens/NotificationPreferencesScreen'
import { colors } from './src/theme'

const RootStack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()
const InboxStack = createNativeStackNavigator()
const DashboardStack = createNativeStackNavigator()
const SettingsStack = createNativeStackNavigator()

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

function InboxNavigator() {
  return (
    <InboxStack.Navigator screenOptions={{
      headerStyle: { backgroundColor: '#0a0a0a' },
      headerTintColor: '#d4af37',
      headerTitleStyle: { fontWeight: '600', fontSize: 18 },
      contentStyle: { backgroundColor: '#111' },
      animation: 'fade',
    }}>
      <InboxStack.Screen name="ConversationsList" component={ConversationsScreen} options={{ headerShown: false }} />
      <InboxStack.Screen name="Chat" component={LazyChatScreen} options={{ title: 'Chat' }} />
    </InboxStack.Navigator>
  )
}

function DashboardNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{
      headerStyle: { backgroundColor: '#0a0a0a' },
      headerTintColor: '#d4af37',
      headerTitleStyle: { fontWeight: '600', fontSize: 18 },
      contentStyle: { backgroundColor: '#111' },
    }}>
      <DashboardStack.Screen name="DashboardHome" component={DashboardScreen} options={{ headerShown: false }} />
    </DashboardStack.Navigator>
  )
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{
      headerStyle: { backgroundColor: '#0a0a0a' },
      headerTintColor: '#d4af37',
      headerTitleStyle: { fontWeight: '600', fontSize: 18 },
      contentStyle: { backgroundColor: '#111' },
    }}>
      <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} options={{ headerShown: false }} />
      <SettingsStack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} options={{ title: 'Notifications' }} />
    </SettingsStack.Navigator>
  )
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: '#222',
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.gray,
      }}
    >
      <Tab.Screen
        name="Inbox"
        component={InboxNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <FontAwesome5 name="inbox" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <FontAwesome5 name="chart-bar" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <FontAwesome5 name="cog" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  )
}

export default function App() {
  const [fatalError, setFatalError] = useState<string | null>(null)
  const navigationRef = useRef<NavigationContainerRef<any>>(null)

  useEffect(() => {
    const handler = (error: Error, isFatal?: boolean) => {
      console.error('Fatal error:', error.message, error.stack)
      if (isFatal) setFatalError(error.message || 'Unknown error')
    }
    if ((ErrorUtils as any)?.setGlobalHandler) {
      (ErrorUtils as any).setGlobalHandler(handler)
    }
    return () => {
      if ((ErrorUtils as any)?.setGlobalHandler) {
        (ErrorUtils as any).setGlobalHandler(undefined)
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
          <RootStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Main" component={TabNavigator} />
          </RootStack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </KeyboardProvider>
  )
}
