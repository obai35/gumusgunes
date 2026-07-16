# Admin Mobile App Upgrades — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the admin mobile app with tab navigation, dashboard, agent assignment, and notification preferences.

**Architecture:** Restructure React Navigation from flat stack to bottom tabs; add 3 backend endpoint groups (conversation stats, assign/unassign, push preferences); create 3 new screens (Dashboard, NotificationPreferences, AgentAssignSheet); add PushPreference Prisma model.

**Tech Stack:** React Native 0.76 / Expo SDK 52, React Navigation 7 (native-stack + bottom-tabs), Next.js 16 API routes, Prisma 6, PostgreSQL.

---

### Task 1: Prisma schema — add PushPreference model

**Files:**
- Modify: `prisma/schema.prisma` — add PushPreference model after PushToken model (line 494)

- [ ] **Add PushPreference model to schema**

Edit `prisma/schema.prisma`. After the PushToken model (after line 494, before InventoryLog), add:

```prisma
model PushPreference {
  id                  String   @id @default(cuid())
  adminId             String   @unique
  admin               Admin    @relation(fields: [adminId], references: [id], onDelete: Cascade)
  newConversation     Boolean  @default(true)
  newMessage          Boolean  @default(true)
  assignmentChanged   Boolean  @default(true)
  sound               Boolean  @default(true)
  quietHoursEnabled   Boolean  @default(false)
  quietHoursFrom      String   @default("22:00")
  quietHoursTo        String   @default("08:00")
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

- [ ] **Run Prisma migration**

Run: `npx prisma migrate dev --name add_push_preferences`
Expected: Migration created and applied successfully.

- [ ] **Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add PushPreference model"
```

---

### Task 2: Backend — conversation stats endpoint

**Files:**
- Create: `src/app/api/admin/conversations/stats/route.ts`

- [ ] **Create stats route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async () => {
  const [
    totalConversations,
    activeConversations,
    waitingConversations,
    todayMessages,
    byChannel,
    agentWorkload,
  ] = await Promise.all([
    db.conversation.count(),
    db.conversation.count({ where: { status: 'ACTIVE' } }),
    db.conversation.count({ where: { status: 'WAITING' } }),
    db.message.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    db.conversation.groupBy({
      by: ['source'],
      _count: true,
    }),
    db.admin.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { assignedConversations: true } },
      },
      where: { assignedConversations: { some: { status: 'ACTIVE' } } },
    }),
  ])

  const total = byChannel.reduce((sum, c) => sum + c._count, 0)

  return NextResponse.json({
    totalConversations,
    activeConversations,
    waitingConversations,
    todayMessages,
    byChannel: byChannel.map(c => ({
      channel: c.source,
      count: c._count,
      percentage: total ? Math.round((c._count / total) * 100) : 0,
    })),
    agentWorkload: agentWorkload.map(a => ({
      adminId: a.id,
      name: a.name,
      activeCount: a._count.assignedConversations,
    })),
  })
})
```

- [ ] **Verify route compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Commit**

```bash
git add src/app/api/admin/conversations/stats/route.ts
git commit -m "feat: add conversation stats endpoint"
```

---

### Task 3: Backend — assign/unassign conversation endpoints

**Files:**
- Create: `src/app/api/admin/conversations/[id]/assign/route.ts`
- Create: `src/app/api/admin/conversations/[id]/unassign/route.ts`

- [ ] **Create assign route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const POST = withAdmin(async (req, { params, admin }) => {
  const body = await req.json()
  const { adminId } = body
  if (!adminId) {
    return NextResponse.json({ error: 'adminId is required' }, { status: 400 })
  }

  const target = await db.admin.findUnique({ where: { id: adminId } })
  if (!target) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
  }

  const conversation = await db.conversation.findUnique({ where: { id: params.id } })
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  await db.conversation.update({
    where: { id: params.id },
    data: { assignedTo: adminId, status: 'ACTIVE' },
  })

  return NextResponse.json({ ok: true, assignedTo: adminId })
})
```

- [ ] **Create unassign route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const POST = withAdmin(async (req, { params }) => {
  const conversation = await db.conversation.findUnique({ where: { id: params.id } })
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  await db.conversation.update({
    where: { id: params.id },
    data: { assignedTo: null, status: 'WAITING' },
  })

  return NextResponse.json({ ok: true })
})
```

- [ ] **Create agents listing endpoint for mobile**

Create: `src/app/api/admin/conversations/agents/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async () => {
  const admins = await db.admin.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      _count: { select: { assignedConversations: { where: { status: 'ACTIVE' } } } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(
    admins.map(a => ({
      id: a.id,
      name: a.name,
      email: a.email,
      activeConversations: a._count.assignedConversations,
    }))
  )
})
```

- [ ] **Verify routes compile**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Commit**

```bash
git add src/app/api/admin/conversations/
git commit -m "feat: add assign/unassign and agents endpoints"
```

---

### Task 4: Backend — push preferences endpoints

**Files:**
- Create: `src/app/api/admin/push/preferences/route.ts`

- [ ] **Create push preferences route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (req, { admin }) => {
  let prefs = await db.pushPreference.findUnique({ where: { adminId: admin.id } })
  if (!prefs) {
    prefs = await db.pushPreference.create({
      data: { adminId: admin.id },
    })
  }
  return NextResponse.json(prefs)
})

export const PUT = withAdmin(async (req, { admin }) => {
  const body = await req.json()
  const allowedFields = [
    'newConversation', 'newMessage', 'assignmentChanged',
    'sound', 'quietHoursEnabled', 'quietHoursFrom', 'quietHoursTo',
  ]
  const data: Record<string, any> = {}
  for (const key of allowedFields) {
    if (body[key] !== undefined) data[key] = body[key]
  }

  const prefs = await db.pushPreference.upsert({
    where: { adminId: admin.id },
    create: { adminId: admin.id, ...data },
    update: data,
  })

  return NextResponse.json(prefs)
})
```

- [ ] **Verify route compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Commit**

```bash
git add src/app/api/admin/push/preferences/route.ts
git commit -m "feat: add push preferences endpoints"
```

---

### Task 5: Mobile — install dependencies and add API methods

**Files:**
- Modify: `apps/admin-mobile/package.json`
- Modify: `apps/admin-mobile/src/api.ts`
- Modify: `apps/admin-mobile/src/store.ts`

- [ ] **Install bottom tabs**

Run in `apps/admin-mobile`:
```bash
npx expo install @react-navigation/bottom-tabs
```
Expected: Package installed.

- [ ] **Add new API methods to `src/api.ts`**

After the `unregisterPushToken` method (line 120), add:

```typescript
  getConversationStats: () =>
    request('/api/admin/conversations/stats'),

  getAgents: () =>
    request('/api/admin/conversations/agents'),

  assignConversation: (id: string, adminId: string) =>
    request(`/api/admin/conversations/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ adminId }),
    }),

  unassignConversation: (id: string) =>
    request(`/api/admin/conversations/${id}/unassign`, { method: 'POST' }),

  getPushPreferences: () =>
    request('/api/admin/push/preferences'),

  updatePushPreferences: (prefs: Record<string, any>) =>
    request('/api/admin/push/preferences', {
      method: 'PUT',
      body: JSON.stringify(prefs),
    }),
```

- [ ] **Update `src/store.ts` — add push prefs cache helpers**

After `clearToken()` (line 21), add:

```typescript
export async function savePushPreferences(prefs: Record<string, any>) {
  await SecureStore.setItemAsync('push_preferences', JSON.stringify(prefs))
}

export async function getPushPreferences(): Promise<Record<string, any> | null> {
  try {
    const data = await SecureStore.getItemAsync('push_preferences')
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}
```

- [ ] **Commit**

```bash
git add apps/admin-mobile/package.json apps/admin-mobile/src/api.ts apps/admin-mobile/src/store.ts
git commit -m "feat: add API methods and store helpers for upgrades"
```

---

### Task 6: Mobile — restructure navigation to tabs

**Files:**
- Modify: `apps/admin-mobile/App.tsx`

- [ ] **Rewrite App.tsx with tab navigation**

Replace the entire `App.tsx` content:

```typescript
import React, { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { FontAwesome5 } from '@expo/vector-icons'
import * as Notifications from 'expo-notifications'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import LoginScreen from './src/screens/LoginScreen'
import ConversationsScreen from './src/screens/ConversationsScreen'
import SettingsScreen from './src/screens/SettingsScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import NotificationPreferencesScreen from './src/screens/NotificationPreferencesScreen'
import { createNotificationChannel, setLastNotificationResponse } from './src/notifications'
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
  const notificationResponseListener = useRef<any>(null)

  useEffect(() => {
    createNotificationChannel()

    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data
      const conversationId = data?.conversationId as string | undefined
      if (conversationId && navigationRef.current?.isReady()) {
        navigationRef.current.navigate('Inbox', { screen: 'Chat', params: { conversationId } })
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
          <RootStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Main" component={TabNavigator} />
          </RootStack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </KeyboardProvider>
  )
}
```

Key changes:
- Root stack has only `Login` and `Main` (tabs)
- `Main` renders `TabNavigator` with 3 tabs: Inbox, Dashboard, Settings
- Each tab has its own stack navigator
- Settings stack now includes `NotificationPreferences` sub-screen
- Notification deep link updated to navigate via `Inbox → Chat`
- Settings icon removed from inbox header (now handled by tab bar)

- [ ] **Remove Settings nav from ConversationsScreen header**

In `src/screens/ConversationsScreen.tsx`, replace the header settings button (line 125-127):
```typescript
        <Text style={styles.headerTitle}>Inbox</Text>
```
(Basically remove the settings cog button since Settings is now a tab.)

Remove the `TouchableOpacity` wrapping the cog icon (lines 125-127), keep just the header title line.

- [ ] **Verify the app compiles**

Run in `apps/admin-mobile`:
```bash
npx tsc --noEmit
```
Expected: No type errors.

- [ ] **Commit**

```bash
git add apps/admin-mobile/App.tsx apps/admin-mobile/src/screens/ConversationsScreen.tsx
git commit -m "feat: restructure navigation to bottom tabs"
```

---

### Task 7: Mobile — Dashboard screen

**Files:**
- Create: `apps/admin-mobile/src/screens/DashboardScreen.tsx`

- [ ] **Create DashboardScreen**

```typescript
import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FontAwesome5 } from '@expo/vector-icons'
import { colors, borderRadius, spacing } from '../theme'
import { api } from '../api'

type ChannelStat = { channel: string; count: number; percentage: number }
type AgentWorkload = { adminId: string; name: string; activeCount: number }
type Stats = {
  totalConversations: number
  activeConversations: number
  waitingConversations: number
  todayMessages: number
  byChannel: ChannelStat[]
  agentWorkload: AgentWorkload[]
}

const channelIcons: Record<string, string> = {
  whatsapp: 'whatsapp',
  messenger: 'facebook-messenger',
  instagram: 'instagram',
  website: 'globe',
}

const channelColors: Record<string, string> = {
  whatsapp: '#25D366',
  messenger: '#0084FF',
  instagram: '#E4405F',
  website: '#d4af37',
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <FontAwesome5 name={icon} size={16} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export default function DashboardScreen() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await api.getConversationStats()
      setStats(data)
    } catch (e) {
      console.warn('Failed to load dashboard stats:', e)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
    >
      <LinearGradient colors={['#0f0f0f', '#111']} style={styles.headerBar}>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </LinearGradient>

      <View style={styles.statGrid}>
        <StatCard label="Total" value={stats?.totalConversations ?? 0} icon="comments" color={colors.gold} />
        <StatCard label="Active" value={stats?.activeConversations ?? 0} icon="clock" color={colors.green} />
        <StatCard label="Waiting" value={stats?.waitingConversations ?? 0} icon="hourglass-half" color="#f97316" />
        <StatCard label="Today" value={stats?.todayMessages ?? 0} icon="envelope" color="#3b82f6" />
      </View>

      <Text style={styles.sectionTitle}>By Channel</Text>
      <View style={styles.channelSection}>
        {(stats?.byChannel ?? []).map(ch => (
          <View key={ch.channel} style={styles.channelRow}>
            <View style={styles.channelLabelRow}>
              <FontAwesome5 name={channelIcons[ch.channel] || 'question'} size={14} color={channelColors[ch.channel] || '#888'} />
              <Text style={styles.channelName}>{ch.channel}</Text>
              <Text style={styles.channelCount}>{ch.count}</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${ch.percentage}%`, backgroundColor: channelColors[ch.channel] || colors.gold }]} />
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Agent Workload</Text>
      <View style={styles.channelSection}>
        {(stats?.agentWorkload ?? []).map(a => (
          <View key={a.adminId} style={styles.agentRow}>
            <Text style={styles.agentName}>{a.name}</Text>
            <View style={styles.agentBadge}>
              <Text style={styles.agentCount}>{a.activeCount} active</Text>
            </View>
          </View>
        ))}
        {(stats?.agentWorkload ?? []).length === 0 && (
          <Text style={styles.emptyText}>No active conversations</Text>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { color: colors.gold, fontSize: 18, fontWeight: '700' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  statCard: {
    width: '46%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { color: colors.white, fontSize: 28, fontWeight: '700' },
  statLabel: { color: colors.grayLight, fontSize: 13, marginTop: 4 },
  sectionTitle: { color: colors.grayLight, fontSize: 13, fontWeight: '600', marginLeft: 16, marginTop: 16, marginBottom: 8 },
  channelSection: { backgroundColor: colors.card, marginHorizontal: 12, borderRadius: borderRadius.md, padding: 16, borderWidth: 1, borderColor: colors.cardBorder },
  channelRow: { marginBottom: 16 },
  channelLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  channelName: { color: colors.white, fontSize: 14, fontWeight: '500', flex: 1 },
  channelCount: { color: colors.grayLight, fontSize: 13 },
  barBg: { height: 8, backgroundColor: colors.cardBorder, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  agentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  agentName: { color: colors.white, fontSize: 14, fontWeight: '500' },
  agentBadge: { backgroundColor: colors.gold + '20', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  agentCount: { color: colors.gold, fontSize: 12, fontWeight: '600' },
  emptyText: { color: colors.gray, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
})
```

- [ ] **Verify the screen compiles**

Run in `apps/admin-mobile`:
```bash
npx tsc --noEmit
```
Expected: No type errors.

- [ ] **Commit**

```bash
git add apps/admin-mobile/src/screens/DashboardScreen.tsx
git commit -m "feat: add dashboard screen with stats and workload"
```

---

### Task 8: Mobile — Agent Assign bottom sheet + Chat integration

**Files:**
- Create: `apps/admin-mobile/src/components/AgentAssignSheet.tsx`
- Modify: `apps/admin-mobile/src/screens/ChatScreen.tsx`

- [ ] **Create AgentAssignSheet component**

```typescript
import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal, ActivityIndicator } from 'react-native'
import { FontAwesome5 } from '@expo/vector-icons'
import { colors, borderRadius } from '../theme'
import Avatar from './Avatar'
import { api } from '../api'

type Agent = { id: string; name: string; email: string; activeConversations: number }

interface Props {
  visible: boolean
  currentAssignee?: { id: string; name: string } | null
  conversationId: string
  onAssign: (adminId: string) => void
  onUnassign: () => void
  onClose: () => void
}

export default function AgentAssignSheet({ visible, currentAssignee, conversationId, onAssign, onUnassign, onClose }: Props) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!visible) return
    setLoading(true)
    api.getAgents()
      .then((data: any) => setAgents(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [visible])

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Assign To</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome5 name="times" size={18} color={colors.grayLight} />
            </TouchableOpacity>
          </View>

          {currentAssignee && (
            <TouchableOpacity style={styles.unassignBtn} onPress={onUnassign}>
              <FontAwesome5 name="user-slash" size={14} color={colors.red} />
              <Text style={styles.unassignText}>Unassign ({currentAssignee.name})</Text>
            </TouchableOpacity>
          )}

          {loading ? (
            <ActivityIndicator color={colors.gold} style={{ marginVertical: 40 }} />
          ) : (
            <FlatList
              data={agents}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const isCurrent = currentAssignee?.id === item.id
                return (
                  <TouchableOpacity
                    style={styles.agentRow}
                    onPress={() => { if (!isCurrent) onAssign(item.id) }}
                    disabled={isCurrent}
                  >
                    <Avatar name={item.name} size={40} />
                    <View style={styles.agentInfo}>
                      <Text style={styles.agentName}>{item.name}</Text>
                      <Text style={styles.agentActive}>{item.activeConversations} active</Text>
                    </View>
                    {isCurrent && (
                      <FontAwesome5 name="check-circle" size={20} color={colors.green} />
                    )}
                  </TouchableOpacity>
                )
              }}
              ListEmptyComponent={<Text style={styles.empty}>No agents found</Text>}
            />
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  title: { color: colors.white, fontSize: 17, fontWeight: '700' },
  unassignBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, marginHorizontal: 16, marginTop: 12,
    borderRadius: 8, borderWidth: 1, borderColor: colors.red, backgroundColor: colors.red + '10',
  },
  unassignText: { color: colors.red, fontWeight: '600', fontSize: 14 },
  agentRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    marginHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  agentInfo: { flex: 1, marginLeft: 12 },
  agentName: { color: colors.white, fontSize: 15, fontWeight: '500' },
  agentActive: { color: colors.grayLight, fontSize: 12, marginTop: 2 },
  empty: { color: colors.gray, textAlign: 'center', paddingVertical: 40 },
})
```

- [ ] **Update ChatScreen — add assign button and sheet**

In `src/screens/ChatScreen.tsx`:

1. After line 9 (`import { getSocket } from '../socket'`), add:
```typescript
import AgentAssignSheet from '../components/AgentAssignSheet'
```

2. Add state variable after line 32 (`const onSendRef = useRef(false)`):
```typescript
  const [showAssignSheet, setShowAssignSheet] = useState(false)
```

3. Replace the assignedAdmin display in the infoBar (lines 197-200) with a tappable row:
```typescript
              {conversation.assignedAdmin?.name ? (
                <TouchableOpacity onPress={() => setShowAssignSheet(true)} style={styles.assignRow}>
                  <Text style={styles.assigned}>Assigned to {conversation.assignedAdmin.name}</Text>
                  <FontAwesome5 name="chevron-down" size={10} color={colors.grayLight} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setShowAssignSheet(true)}>
                  <Text style={styles.assignLink}>Assign</Text>
                </TouchableOpacity>
              )}
```

4. Add assign/unassign handlers after `handleClose`:
```typescript
  const handleAssign = async (adminId: string) => {
    try {
      await api.assignConversation(conversationId, adminId)
      setShowAssignSheet(false)
      await load()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const handleUnassign = async () => {
    try {
      await api.unassignConversation(conversationId)
      setShowAssignSheet(false)
      await load()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }
```

5. Add the AgentAssignSheet before the closing `</View>` of the container (before line 244):
```typescript
      <AgentAssignSheet
        visible={showAssignSheet}
        currentAssignee={conversation?.assignedAdmin ? { id: conversation.assignedAdmin.id, name: conversation.assignedAdmin.name } : null}
        conversationId={conversationId}
        onAssign={handleAssign}
        onUnassign={handleUnassign}
        onClose={() => setShowAssignSheet(false)}
      />
```

6. Add styles at the end of the StyleSheet:
```typescript
  assignRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  assignLink: { color: colors.gold, fontSize: 11, fontWeight: '600' },
```

- [ ] **Verify the app compiles**

Run in `apps/admin-mobile`:
```bash
npx tsc --noEmit
```
Expected: No type errors.

- [ ] **Commit**

```bash
git add apps/admin-mobile/src/components/AgentAssignSheet.tsx apps/admin-mobile/src/screens/ChatScreen.tsx
git commit -m "feat: add agent assignment with bottom sheet"
```

---

### Task 9: Mobile — Notification Preferences screen + push gating

**Files:**
- Create: `apps/admin-mobile/src/screens/NotificationPreferencesScreen.tsx`
- Modify: `apps/admin-mobile/src/notifications.ts`

- [ ] **Create NotificationPreferencesScreen**

```typescript
import React, { useEffect, useState } from 'react'
import { View, Text, Switch, ScrollView, StyleSheet, Platform } from 'react-native'
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
```

- [ ] **Update `src/screens/SettingsScreen.tsx` — add Notification Preferences link**

After the "App Updates" section and before the "Account" section (around line 155), add:

```typescript
      <Text style={styles.sectionTitle}>Preferences</Text>
      <Card>
        <TouchableOpacity onPress={() => navigation.navigate('NotificationPreferences')} style={styles.navRow}>
          <Text style={styles.navRowText}>Notification Preferences</Text>
          <FontAwesome5 name="chevron-right" size={14} color={colors.grayLight} />
        </TouchableOpacity>
      </Card>
```

Add the import at the top of the file:
```typescript
import { FontAwesome5 } from '@expo/vector-icons'
```

Add styles:
```typescript
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  navRowText: { color: colors.white, fontSize: 15, fontWeight: '500' },
```

- [ ] **Update `src/notifications.ts` — gate push registration by prefs**

Replace the `registerForPushNotifications` function return block (around line 49):
```typescript
    const prefs = await import('./store').then(m => m.getPushPreferences())
    const resolvedPrefs = prefs || { newConversation: true, newMessage: true, assignmentChanged: true }
    const tokenData: any = { token, platform: Platform.OS, preferences: resolvedPrefs }
    return tokenData
```

And update the handler (around line 6-12) to respect quiet hours:
```typescript
import { getPushPreferences } from './store'

async function shouldShowNotification(): Promise<boolean> {
  const prefs = await getPushPreferences()
  if (!prefs) return true
  if (prefs.quietHoursEnabled) {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const current = `${hours}:${minutes}`
    if (current >= prefs.quietHoursFrom || current < prefs.quietHoursTo) return false
  }
  return true
}

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const show = await shouldShowNotification()
    const prefs = await getPushPreferences()
    return {
      shouldShowAlert: show,
      shouldPlaySound: show && (prefs?.sound ?? true),
      shouldSetBadge: true,
    }
  },
})
```

- [ ] **Verify the app compiles**

Run in `apps/admin-mobile`:
```bash
npx tsc --noEmit
```
Expected: No type errors.

- [ ] **Commit**

```bash
git add apps/admin-mobile/src/screens/NotificationPreferencesScreen.tsx apps/admin-mobile/src/screens/SettingsScreen.tsx apps/admin-mobile/src/notifications.ts
git commit -m "feat: add notification preferences screen and push gating"
```
