# Admin Mobile App — Premium Dark UI Overhaul

## Objective
Improve the usability and visual polish of the Gümüş Güneş admin mobile app across all four screens (Login, Conversations, Chat, Settings) while keeping the existing dark theme (black backgrounds, gold accents).

## Foundation

### New Dependencies
- `expo-linear-gradient` — gradient backgrounds and buttons
- `expo-blur` — glassmorphism effect on cards

### Shared Files
- `src/theme.ts` — color palette, spacing scale, typography, shadow presets, border radii
- `src/components/Avatar.tsx` — reusable avatar circle with initials and auto-colored background
- `src/components/Badge.tsx` — reusable status badge (Waiting=gold, Active=green, Closed=gray)
- `src/components/Card.tsx` — reusable elevated dark card with rounded corners and shadow
- `src/utils/timeago.ts` — format timestamps as "2m ago", "1h ago", "3d ago"

---

## 1. Login Screen

Current: plain black background, white text title, raw inputs, flat button.

Changes:
- Full-screen gradient background (`#0a0a0a` → `#000`)
- Gümüş Güneş logo image from assets displayed at top
- Frosted glass form card (white `rgba(255,255,255,0.05)` background with `expo-blur`, rounded corners, subtle border)
- Animated entry: entire form fades in + slides up 20px via Reanimated `useSharedValue`/`useAnimatedStyle`
- Input fields: gold underline on focus (using `onFocus`/`onBlur` state), consistent padding, placeholder text `#555`
- Login button: gold gradient background (`#d4af37` → `#b8960c`), rounded, full-width
- Loading state: gold `ActivityIndicator` replaces button text

---

## 2. Conversations Screen

Current: flat list rows with border lines, plain filter buttons.

Changes:
- **Header:** subtle gradient bar below the nav header, "Conversations" title
- **Filter pills:** pill-shaped buttons with `Reanimated.Layout` transition when active state changes
  - Waiting: gold background when active
  - Active: green (`#22c55e`) when active
  - Closed: gray (`#555`) when active
- **Conversation cards** (replacing flat rows):
  - Left: `<Avatar initials={name} size={44} />` — background color derived from name string hash
  - Middle column: customer name (bold, white), last message preview (gray, 1 line truncation)
  - Right column: `<Badge status={status} />` + time-ago text (`utils/timeago`)
  - Card styling: `backgroundColor: '#1a1a1a'`, `borderRadius: 12`, `padding: 14`, `marginHorizontal: 12`, `marginVertical: 4`, subtle `elevation` shadow
- **Animations:** cards fade in on mount (`FadeIn` from Reanimated layout), `RefreshControl` with gold tint
- **Empty state:** centered "No conversations yet" in gray with a muted icon

---

## 3. Chat Screen

Current: bare GiftedChat with basic bubble styling.

Changes:
- **Customer info bar** (below header, above message list):
  - Row: avatar (initials) + name + online dot (green circle if status is ACTIVE/WAITING) + status badge + assigned admin name (if any)
  - Background: `#1a1a1a` with bottom border
- **Bubble styling:**
  - Admin (right): gold gradient background (`#d4af37` → `#b8960c`), dark text, rounded-square shape (`borderRadius: 16`)
  - Customer/Bot (left): dark card (`#2a2a2a`) with subtle 1px border (`#333`), white text, rounded-square shape
  - Timestamps inside footer, smaller font size
- **Typing indicator:** GiftedChat's built-in `renderFooter` — when socket emits typing event, show "Customer is typing..." with animated dots
- **Input bar:** pill shape (`borderRadius: 24`), dark background (`#1a1a1a`), gold send button (icon or arrow), subtle shadow elevation
- **Action bar** (above input, below messages):
  - Claim button: green (`#22c55e`), only shown if conversation is unclaimed
  - Close button: red (`#ef4444`), confirmation dialog
- **Navigation header:** customer name as title, transparent background

---

## 4. Settings Screen

Current: basic list with check/download/restart buttons.

Changes:
- **Profile card:** avatar circle with admin initials, email below, role badge
- **Update section:** glass card with same visual style as login form
  - Check for Updates → Download Update → Restart to Apply (existing logic, polished UI)
- **Account section:** Logout button
  - Red text, full-width, rounded
  - Confirmation Alert: "Are you sure you want to logout?"
  - On confirm: clear stored token, disconnect socket, navigate to Login
- **App info:** version at bottom in small gray text

---

## 5. Navigation & Global

- Screen transition animations: fade via `react-native-screens` stack animation
- Header style across all screens:
  - Background: `#0a0a0a`
  - Title color: `#d4af37`, font size 18, semibold
  - Thin bottom border: `#222`
- Status bar: `light` throughout
- Keyboard handling: keep `KeyboardProvider` wrapper, ensure input avoids keyboard

---

## Files Changed

| File | Change |
|------|--------|
| `apps/admin-mobile/src/theme.ts` | New — shared theme constants |
| `apps/admin-mobile/src/components/Avatar.tsx` | New — avatar with initials |
| `apps/admin-mobile/src/components/Badge.tsx` | New — status badge |
| `apps/admin-mobile/src/components/Card.tsx` | New — elevated card |
| `apps/admin-mobile/src/utils/timeago.ts` | New — time formatting |
| `apps/admin-mobile/src/screens/LoginScreen.tsx` | Rewrite — gradient, logo, glass card, animations |
| `apps/admin-mobile/src/screens/ConversationsScreen.tsx` | Rewrite — cards, avatars, animations |
| `apps/admin-mobile/src/screens/ChatScreen.tsx` | Rewrite — info bar, bubble styles, action bar |
| `apps/admin-mobile/src/screens/SettingsScreen.tsx` | Rewrite — profile card, sections, logout |
| `apps/admin-mobile/App.tsx` | Minor — screen transition animations |
| `apps/admin-mobile/package.json` | Add `expo-linear-gradient`, `expo-blur` |

---

## Out of Scope

- Sound/vibration for new messages
- Swipe-to-close on conversation cards
- Push notifications
- Typing indicator from socket (socket doesn't emit typing events yet — UI only shows indicator if events arrive)
