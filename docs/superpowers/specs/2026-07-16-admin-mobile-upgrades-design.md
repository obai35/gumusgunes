# Admin Mobile App Upgrades

Date: 2026-07-16

## Overview

Upgrade the React Native (Expo SDK 52) admin mobile app with three new features: Dashboard, Agent Assignment, and Notification Preferences. Restructure navigation from a flat stack to a tab-based layout.

## Navigation Restructure

Current: `Stack(Login → Conversations → Chat → Settings)`

New:

```
Stack.Navigator (root)
├── LoginScreen
└── Tab.Navigator (authenticated, bottom tabs)
    ├── Inbox Tab
    │   └── Stack: Conversations → Chat
    ├── Dashboard Tab
    │   └── Stack: DashboardHome
    └── Settings Tab
        └── Stack: SettingsHome → NotificationPreferences
```

- Tabs visible only after authentication
- Settings promoted from an inbox stack screen to its own tab
- Notification Prefs added as a sub-screen in the Settings tab
- Agent Assignment: "Assign" action in Chat header opens a bottom sheet with agent list

## Feature 1: Dashboard

### Backend

New endpoint: `GET /api/admin/conversations/stats`

Returns:
- `totalConversations` — total in system
- `activeConversations` — currently active
- `waitingConversations` — unassigned/waiting
- `todayMessages` — messages sent today
- `byChannel` — breakdown: [{ channel: "whatsapp", count, percentage }]
- `agentWorkload` — [{ adminId, name, avatar, activeCount }]

### Mobile UI

- 4 stat cards in a 2x2 grid (total, active, waiting, today's messages)
- Channel breakdown as horizontal bar list (no external chart library)
- Agent workload list showing each admin and their active conversation count
- Pull-to-refresh
- Dark theme with gold accent (consistent with existing app)

## Feature 2: Agent Assignment

### Backend

New endpoints:
- `GET /api/admin/admins` — list all admins with their current active conversation count
- `POST /api/admin/conversations/:id/assign` — body: `{ adminId }`; reassigns or assigns unassigned conversation
- `POST /api/admin/conversations/:id/unassign` — removes assignment, returns to unassigned pool

Existing `claim` endpoint preserved for backwards compatibility.

### Mobile UI

- Chat header shows current assignee
- Tap assignee area → bottom sheet with scrollable agent list
- Each agent row: avatar (initials), name, workload badge
- Current assignee marked with checkmark
- "Unassign" action to release conversation
- Optimistic update on assign/unassign
- Socket event emitted on reassign so the assigned agent gets notified

## Feature 3: Notification Preferences

### Backend

New endpoints:
- `GET /api/admin/push/preferences` — load preferences
- `PUT /api/admin/push/preferences` — save preferences

Preference schema (stored per admin in DB):
- `newConversation` (boolean)
- `newMessage` (boolean)
- `assignmentChanged` (boolean)
- `sound` (boolean)
- `quietHoursEnabled` (boolean)
- `quietHoursFrom` (string, HH:mm)
- `quietHoursTo` (string, HH:mm)

### Mobile UI

- Sub-screen in Settings tab: Settings → Notification Preferences
- Toggle list for event types
- Sound toggle
- Quiet Hours section with time pickers for start/end
- Local SecureStore cache for instant toggle response; sync to backend
- Only send push if the notification type is enabled AND outside quiet hours

## Files Changed

### Backend (Next.js API routes)
- `src/app/api/admin/conversations/stats/route.ts` — NEW
- `src/app/api/admin/admins/route.ts` — NEW
- `src/app/api/admin/conversations/[id]/assign/route.ts` — NEW
- `src/app/api/admin/conversations/[id]/unassign/route.ts` — NEW
- `src/app/api/admin/push/preferences/route.ts` — NEW

### Mobile App (`apps/admin-mobile/`)
- `app.json` — update scheme if needed
- `App.tsx` — restructure to Tab + Stack navigation
- `src/theme.ts` — possibly add tab bar colors
- `src/screens/DashboardScreen.tsx` — NEW
- `src/screens/NotificationPreferencesScreen.tsx` — NEW
- `src/api.ts` — add new API methods
- `src/components/AgentAssignSheet.tsx` — NEW (bottom sheet for agent assignment)
- `src/screens/ChatScreen.tsx` — add assign button in header, open sheet
- `src/screens/SettingsScreen.tsx` — add "Notification Preferences" row
- `src/screens/ConversationsScreen.tsx` — minor updates if needed
- `src/store.ts` — add notification prefs cache
- `src/notifications.ts` — respect notification prefs before sending push
- `src/socket.ts` — handle new assignment socket events

## Implementation Order

1. Restructure navigation (tabs)
2. Dashboard (backend endpoint + screen)
3. Agent Assignment (backend endpoints + bottom sheet + chat integration)
4. Notification Preferences (backend endpoints + screen + push gating)
