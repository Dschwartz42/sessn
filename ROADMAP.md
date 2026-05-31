# Sessn — App Roadmap & Feature Documentation

> **Stack:** React Native · TypeScript · Expo SDK 54 · Firebase (Auth, Firestore, Storage, Cloud Functions) · iOS-first

---

## Table of Contents

1. [What the App Does](#1-what-the-app-does)
2. [Architecture Overview](#2-architecture-overview)
3. [Feature Reference](#3-feature-reference)
   - [Authentication](#31-authentication)
   - [Home Feed](#32-home-feed)
   - [Streak System](#33-streak-system)
   - [Notifications](#34-notifications)
   - [Search](#35-search)
   - [Community & Groups](#36-community--groups)
   - [Post Creation](#37-post-creation)
   - [Profile](#38-profile)
   - [Settings](#39-settings)
   - [Push Notifications (Cloud Functions)](#310-push-notifications-cloud-functions)
4. [Data Model](#4-data-model)
5. [Known Limitations](#5-known-limitations)
6. [Next Steps — Detailed Instructions](#6-next-steps--detailed-instructions)

---

## 1. What the App Does

Sessn is a social fitness tracking app for iOS. Users log workouts ("Sessns"), build weekly streaks, follow other athletes, compete in group leaderboards, and share their training. The core loop is: **log a workout → share it → maintain your streak → compete with friends**.

The app is currently in active development on the `feature/testing-push-followers` branch. All core features are implemented and functional. The app is not yet on the App Store.

---

## 2. Architecture Overview

### Frontend
- **React Native + Expo SDK 54** — Managed workflow, iOS-only targeting
- **React Navigation** — Bottom tab navigator with nested stack navigators (Home, Search, Community, Profile, Auth)
- **TypeScript** throughout

### Backend
- **Firebase Auth** — Email/password and phone OTP
- **Cloud Firestore** — Primary database, document model
- **Firebase Storage** — Profile pictures, post images, group images
- **Firebase Cloud Functions** — Push notification triggers (5 functions deployed)

### Navigation Structure
```
Root
├── Auth Stack (Welcome → Login / Signup / PhoneAuth)
└── Main Tabs
    ├── Home Stack    (Feed → ExpandedPost → UserProfile → Streak → Notifications → FollowerList)
    ├── Search Stack  (Search → UserProfile → ExpandedPost)
    ├── Post Modal    (NewPost — presented as modal over tabs)
    ├── Community Stack (Community → FullLeaderboard → UserProfile → ExpandedPost → CreateGroup)
    └── Profile Stack   (Profile → Settings → all sub-settings → UserProfile → ExpandedPost → FollowerList → FullLeaderboard)
```

---

## 3. Feature Reference

### 3.1 Authentication

| Feature | Status | Notes |
|---|---|---|
| Email/password signup | ✅ | Username uniqueness checked before account creation |
| Phone OTP login | ✅ | Firebase phone auth |
| Email/password login | ✅ | |
| Sign out | ✅ | Confirmation dialog |
| Account deletion | ✅ | Double confirmation; handles re-auth error |

**Signup flow:** Username is validated (alphanumeric + . _ only), checked for uniqueness in Firestore, then Firebase Auth account is created, then UserDoc is written. The uniqueness check happens before auth account creation to avoid orphaned accounts.

**UserDoc fields created at signup:**
`uid`, `displayName`, `username`, `email`, `phone`, `bio`, `profilePicUrl`, `isPublic`, `fitnessLevel`, `instagramLink`, `gender`, `createdAt`, `followersCount`, `followingCount`, `postCount`, `currentStreak`, `longestStreak`, `lastStreakWeek`, `totalSessns`, `totalTimeMinutes`, `totalLbsLifted`, `groupIds`, `allowReposts`, `showActivityStatus`, `locationSharing`, `showStreakToOthers`, `pushEnabled`, `likesEnabled`, `repostsEnabled`, `followersNotifEnabled`, `streakNotifEnabled`, `groupsNotifEnabled`, `expoPushToken`

---

### 3.2 Home Feed

The feed shows posts from all accounts the current user follows, sorted by recency.

| Feature | Status | Notes |
|---|---|---|
| Feed from followed users | ✅ | Batched queries handle 30+ following (Firestore `in` limit) |
| Pull-to-refresh | ✅ | |
| Infinite scroll (load more) | ✅ | Deduplication via ref to avoid stale closure |
| Like / unlike | ✅ | Optimistic UI; updates `likedPosts` subcollection |
| Save / unsave | ✅ | Updates `savedPosts` subcollection |
| Repost | ✅ | Respects author's `allowReposts` setting; live-checked |
| Share | ✅ | Native iOS share sheet with workout title + username |
| Delete own post | ✅ | 3-dot menu; decrements user stats + GroupMember stats |
| Report other posts | ✅ | 3-dot menu with category picker (Spam, Inappropriate, Harassment) |
| Follow / unfollow from feed | ✅ | Inline follow button on non-own posts |
| Streak banner | ✅ | Shows current week streak; dots reflect actual workout days |
| Notification badge | ✅ | Real-time unread count via Firestore `onSnapshot` |
| Navigate to expanded post | ✅ | |
| Navigate to user profile | ✅ | |

**PostCard actions:** Like, Repost (with allowReposts check), Share, Save, 3-dot (Delete for own / Report for others). Workout details available via "Tap to see workout details" bottom hint → `WorkoutDetailsPanel` modal.

---

### 3.3 Streak System

Streaks are counted in **weeks** — posting at least once in a calendar week maintains the streak.

| Feature | Status | Notes |
|---|---|---|
| Weekly streak counter | ✅ | Increments once per ISO week; tracked via `lastStreakWeek` |
| Streak ring (SVG) | ✅ | 52-week full ring; animated arc |
| Longest streak tracking | ✅ | `longestStreak` updated on every new week best |
| This-week dot row | ✅ | 7 dots; filled only on days with actual posts |
| Monthly calendar | ✅ | Days with posts highlighted purple; today outlined |
| Milestone badges | ✅ | 9 milestones based on real stats |
| Sessns this week stat | ✅ | Firestore query on mount |
| Rest days stat | ✅ | Computed from days elapsed vs sessns logged |
| Total time stat | ✅ | From `totalTimeMinutes` on UserDoc |

**Milestones:** First Sessn, 1-Week Streak, 1-Month Streak, 50 Sessns, 100 Sessns, 6-Month Streak, 1-Year Streak, 10K Lbs Lifted, 100 Hours.

---

### 3.4 Notifications

| Feature | Status | Notes |
|---|---|---|
| Real-time notification list | ✅ | Firestore `onSnapshot` on `notifications/{uid}/items` |
| Grouped by time | ✅ | Today / This Week / Earlier |
| Auto mark-as-read | ✅ | All notifications marked read on screen open |
| Notification types | ✅ | `like`, `repost`, `follow_request`, `follow_accepted` |
| Accept follow request (inline) | ✅ | For private account owners |
| Decline follow request (inline) | ✅ | |
| Follow back (inline) | ✅ | For public accounts receiving follows |
| Navigate to liker/follower profile | ✅ | |
| Unread badge on home tab | ✅ | Bell icon gets a red dot |

---

### 3.5 Search

| Feature | Status | Notes |
|---|---|---|
| People search | ✅ | Prefix search on `username` field (lowercase) |
| Groups search | ✅ | Prefix search on `nameLower` field (case-insensitive) |
| Splits search | ✅ | Prefix search on `split` field |
| Multi-filter selector | ✅ | Dropdown with checkboxes; default searches all three |
| Follow / unfollow from results | ✅ | Inline with live state |
| Join / leave group from results | ✅ | Inline with membership state check |
| Popular athletes (default) | ✅ | Ordered by `followersCount` desc |
| Popular groups (default) | ✅ | Ordered by `memberCount` desc |
| Popular sessns (default) | ✅ | Ordered by `likeCount` desc |
| No results state | ✅ | |
| Error state | ✅ | |

**Note:** Group search requires `nameLower` field. Groups created before the current codebase version won't appear in search results — only newly created groups have this field.

---

### 3.6 Community & Groups

#### Groups Tab

| Feature | Status | Notes |
|---|---|---|
| List user's groups | ✅ | From `groupIds` array on UserDoc |
| GroupCard leaderboard | ✅ | Shows top 4 members |
| Metric toggle (SESSNS/LBS/HRS) | ✅ | Sorts by selected metric |
| Time filter (Weekly/Monthly/All Time) | ✅ | Weekly/Monthly query actual posts; All Time uses stored stats |
| Leave group (from GroupCard) | ✅ | Dots menu; card removes immediately |
| Create Group | ✅ | Name (3-40 chars), photo, public/private toggle |
| Join Group button | ✅ | Navigates to Search tab |
| Full Leaderboard screen | ✅ | All members; time + metric filters; in-group streak section |
| Friend streak leaderboard | ✅ | All followed users sorted by `currentStreak` |

#### GroupMember stats
- Seeded from UserDoc on join/create (so historical stats carry over)
- Updated on every `createPost`: `totalSessns`, `totalTimeMinutes`, `totalLbsLifted`, `currentStreak`
- Updated on `deletePost`: `totalSessns`, `totalTimeMinutes`, `totalLbsLifted`
- Profile picture synced when user updates EditProfile

#### Maps Tab
- **Placeholder** — "Map coming soon" screen. Not yet implemented.

---

### 3.7 Post Creation

Two post types: **Independent** (your own workout) and **Class** (a class you attended).

| Feature | Status | Notes |
|---|---|---|
| Independent post | ✅ | Lifting, Cardio, Sports, CrossFit, Yoga, Recovery |
| Class post | ✅ | CrossFit, Lifting, Cardio, Sports, Yoga, Pilates + star rating |
| Post title + caption | ✅ | |
| Post image (camera roll) | ✅ | Uploaded to Firebase Storage |
| GPS location tag | ✅ | Reverse-geocoded to city/region; stores lat/lng |
| Duration (minutes) | ✅ | |
| Exercises (sets/reps/weight/bodyweight) | ✅ | Unlimited exercises; individual remove |
| Warmup description | ✅ | Toggle |
| Cardio section | ✅ | Type, duration, distance, before/after timing |
| Workout instructions | ✅ | Toggle |
| Muscle group tags | ✅ | Multi-select chips |
| Sport selector | ✅ | For Sports type |
| Save as workout template | ✅ | Writes to `users/{uid}/workouts` |
| Use saved workout template | ✅ | Loads templates; pre-fills form |
| Streak + stats update on post | ✅ | `currentStreak`, `longestStreak`, `totalSessns`, `totalTimeMinutes`, `totalLbsLifted` |
| GroupMember stats update on post | ✅ | All groups the user belongs to |

**On post creation, the following are updated atomically:**
1. Post document added to `posts/`
2. `users/{uid}`: `postCount+1`, `totalSessns+1`, `totalTimeMinutes += duration`, `totalLbsLifted += calculated lbs`, `currentStreak`, `longestStreak`, `lastStreakWeek`
3. Each `groups/{gid}/members/{uid}`: same stat increments

**Lbs calculation:** `sum(sets × reps × weight)` for all non-bodyweight exercises.

---

### 3.8 Profile

#### Own Profile
| Feature | Status | Notes |
|---|---|---|
| Posts tab (grid) | ✅ | Own non-repost posts |
| Reposts tab (grid) | ✅ | Own reposted content |
| Saved tab (grid) | ✅ | Posts saved by this user |
| Post count, followers, following | ✅ | Followers/following tappable → full list |
| Edit Profile | ✅ | Name, username (uniqueness checked), bio, photo, fitness level, Instagram, gender |
| Share profile | ✅ | Native share with @username |
| Navigate to expanded post | ✅ | |

#### Other User's Profile
| Feature | Status | Notes |
|---|---|---|
| Posts / Groups / Reposts tabs | ✅ | |
| Groups tab | ✅ | Tappable rows → FullLeaderboard |
| Follow (public account) | ✅ | Instant; updates follower/following counts |
| Request follow (private account) | ✅ | Writes to `followRequests/` |
| Cancel follow request | ✅ | |
| Unfollow | ✅ | |
| Block / unblock | ✅ | Confirmation; writes to `blockedUsers/` subcollection |
| "..." menu (ellipsis) | ✅ | Toggles block/unblock |
| Streak badge | ✅ | Shown if target user has `showStreakToOthers: true` |
| Share profile | ✅ | |

#### Follower / Following List
Full-screen list of followers or following. Inline follow/unfollow buttons per row. Batched Firestore queries (30 per chunk).

---

### 3.9 Settings

| Screen | Feature | Status |
|---|---|---|
| Personal Details | Read-only display → Edit Profile | ✅ |
| Password & Security | Change password (re-auth required) | ✅ |
| Password & Security | 2FA toggle | Coming Soon badge |
| Account Privacy | Public/private account toggle | ✅ |
| Notifications | Push on/off, likes, reposts, followers | ✅ |
| Blocked Users | List + unblock with confirmation | ✅ |
| Your Activity | Sessns this month (live query), total time, streak, member since, liked posts (live list) | ✅ |
| Reposts | Allow/disallow reposts of your posts | ✅ |
| Help Center | FAQ, Report (mailto), Contact Support (mailto), Community Guidelines (alert) | ✅ |
| About Sessn | Version, Terms of Service (inline), Privacy Policy (inline) | ✅ |
| Log Out | Confirmation dialog | ✅ |
| Delete Account | Double confirmation; handles `auth/requires-recent-login` | ✅ |

---

### 3.10 Push Notifications (Cloud Functions)

Five Cloud Functions deployed to Firebase (requires Blaze plan):

| Function | Trigger | Action |
|---|---|---|
| `onNotificationCreated` | New doc in `notifications/{uid}/items/` | Sends Expo push to recipient's `expoPushToken`; respects per-type prefs |
| `onFollowRequestCreated` | New doc in `followRequests/` | Writes `follow_request` notification to followee |
| `onFollowCreated` | New doc in `follows/` | Writes `follow` notification to followee |
| `onLikeCreated` | New doc in `posts/{postId}/likes/` | Writes `like` notification to post author |
| `onRepostCreated` | Write to `posts/{postId}` where `isRepost: true` | Writes `repost` notification to original author |

**Push flow:** User logs in → `AuthContext` calls `registerPushToken` → requests permission → gets Expo push token → saves to `users/{uid}.expoPushToken`. Cloud Functions read this token when writing notifications.

---

## 4. Data Model

### `users/{uid}`
```
uid, displayName, username, email, phone, bio, profilePicUrl
isPublic, fitnessLevel, instagramLink, gender
createdAt, followersCount, followingCount, postCount
currentStreak, longestStreak, lastStreakWeek
totalSessns, totalTimeMinutes, totalLbsLifted
groupIds[]
allowReposts, showActivityStatus, locationSharing, showStreakToOthers
pushEnabled, likesEnabled, repostsEnabled, followersNotifEnabled
streakNotifEnabled, groupsNotifEnabled, expoPushToken
```

Subcollections: `likedPosts/`, `savedPosts/`, `workouts/`, `blockedUsers/`

### `posts/{postId}`
```
authorId, authorUsername, authorPicUrl
type ('independent'|'class'), workoutTypes[], split, classType
title, caption, imageUrl, location {name, lat, lng}
durationMinutes, exercises[], cardio {}, classDetails {}, muscleGroups[]
warmupDescription, workoutInstructions
likeCount, repostCount, saveCount, createdAt
isRepost, originalPostId, originalAuthorId, originalAuthorUsername
```

Subcollections: `likes/`

### `follows/{followerId_followeeId}`
```
followerId, followeeId, createdAt
```

### `followRequests/{followerId_followeeId}`
```
followerId, followeeId, createdAt
```

### `groups/{groupId}`
```
name, nameLower, isPrivate, ownerId, ownerUsername
pictureUrl, memberCount, createdAt
```

### `groups/{groupId}/members/{uid}`
```
uid, username, profilePicUrl, joinedAt
totalSessns, totalLbsLifted, totalTimeMinutes, currentStreak
```

### `notifications/{uid}/items/{notifId}`
```
type ('like'|'repost'|'follow_request'|'follow_accepted')
fromUserId, fromUsername, fromUserPic
postId, postImageUrl, read, createdAt
```

### Firestore Indexes (deployed)
- `posts`: `authorId ASC` + `createdAt DESC`

### Firestore Security Rules (deployed)
- Users: read by any authenticated user; write only own doc
- Posts: read by any authenticated user; create by author; update like/repost/save counts by anyone
- Follows/FollowRequests: follower controls create/delete; followee can delete requests
- Groups + members: read by any authenticated user; create/update/delete with auth
- Notifications: read/write only by recipient

---

## 5. Known Limitations

| Area | Limitation |
|---|---|
| Maps tab | Placeholder — not implemented |
| Group search | Only finds groups created with current codebase (need `nameLower` field) |
| `showActivityStatus` | Toggle exists in settings but no "active now" UI anywhere in the app |
| Group activity feed | No screen showing recent posts by group members |
| Workout templates | Save/use works; no management screen (rename, delete templates) |
| 2FA | UI shows "Coming Soon" badge — not implemented |
| Deep links | Share sends text, not a tappable URL (app has no web companion yet) |
| Post editing | Users can delete posts but not edit them |
| Old user data | Users who joined before current version lack `groupIds`; their Groups tabs show empty |
| Push in standalone builds | Requires valid EAS `projectId` in `app.json` |
| Cloud Functions | Require Firebase Blaze (pay-as-you-go) plan |

---

## 6. Next Steps — Detailed Instructions

### Step 1: Deploy Cloud Functions (Push Notifications)

Cloud Functions require Firebase's **Blaze (pay-as-you-go) plan**. The free Spark plan does not support them.

**Upgrade Firebase:**
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Select the **Sessn** project (`sessn-c01e5`)
3. Click **Upgrade** in the bottom-left → choose **Blaze plan**
4. Add a billing account (Google Cloud). You won't be charged unless you exceed free tier limits — a normal app costs ~$0 at low volume

**Deploy the functions:**
```bash
cd functions
npm install
npx tsc
cd ..
npx firebase deploy --only functions
```

You should see 5 functions created: `onNotificationCreated`, `onFollowRequestCreated`, `onFollowCreated`, `onLikeCreated`, `onRepostCreated`.

**Verify:** After deploying, post a workout on one test account and like it from another — the second account should receive a push notification within a few seconds.

---

### Step 2: Set Up EAS Build (for TestFlight + App Store)

EAS (Expo Application Services) builds the native iOS binary.

**Create an EAS account and project:**
```bash
npx eas login                  # log in with your Expo account (create one at expo.dev if needed)
npx eas init                   # links this project to EAS; prints a real project ID
```

**Update `app.json`** — replace the placeholder with the real project ID:
```json
"extra": {
  "eas": {
    "projectId": "YOUR_REAL_PROJECT_ID_FROM_EAS_INIT"
  }
}
```

**Set up Apple credentials:**
You need an [Apple Developer Program](https://developer.apple.com/programs/) membership ($99/yr). Once enrolled:

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **+** → **New App** → fill in name ("Sessn"), bundle ID (`com.sessn.app`), SKU
3. Copy the **Apple ID** (a 10-digit number shown in App Information)
4. Your **Team ID** is at [developer.apple.com/account](https://developer.apple.com/account) → Membership

**Update `eas.json`:**
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your@email.com",
      "ascAppId": "YOUR_10_DIGIT_APP_ID",
      "appleTeamId": "YOUR_TEAM_ID"
    }
  }
}
```

---

### Step 3: Configure Firebase for Push Notifications in Production

Firebase needs your APNs (Apple Push Notification service) certificate to forward pushes to Apple.

1. Go to [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles**
2. Click **+** → **Apple Push Notification service SSL (Sandbox & Production)**
3. Select App ID: `com.sessn.app` → Download the `.cer` file
4. Double-click to add it to Keychain → export as `.p8` or `.p12`

**Upload to Firebase:**
1. Firebase Console → Sessn project → **Project Settings** → **Cloud Messaging**
2. Under **Apple app configuration** → upload your APNs certificate or Auth Key (`.p8` is simpler — download from developer.apple.com → Keys → Create a key with APNs enabled)

---

### Step 4: Build and Submit to App Store

**Prepare App Store assets** (do this in App Store Connect before submitting):
- **App icon:** Already at `./assets/icon.png`. EAS uses this. Make sure it is 1024×1024 PNG with no alpha/transparency.
- **Screenshots:** Required sizes:
  - 6.7" (iPhone 16 Pro Max): 1320×2868 or 1290×2796
  - 6.1" (iPhone 16): 1179×2556
  - Optionally: 5.5" (iPhone 8 Plus) and iPad if supporting tablets
- **App Preview video:** Optional but recommended (30s max)
- **Description:** Max 4000 characters. Write your App Store description.
- **Subtitle:** Max 30 characters. e.g. "Track every rep. Share every sessn."
- **Keywords:** Max 100 characters. e.g. "fitness,workout,gym,lifting,streak,social"
- **Privacy Policy URL:** Must be a real hosted URL. Options:
  - Use [Termly](https://termly.io), [PrivacyPolicies.com](https://privacypolicies.com), or similar generator
  - Or host a simple HTML page on GitHub Pages

**Run the production build:**
```bash
npx eas build --platform ios --profile production
```
This uploads your code to Expo's build servers and returns a `.ipa` file. Takes 10–30 minutes. Monitor at [expo.dev](https://expo.dev) → your project → Builds.

**Submit to App Store:**
```bash
npx eas submit --platform ios --latest
```
This sends the build to App Store Connect for review. Alternatively, download the `.ipa` and upload via [Transporter](https://apps.apple.com/us/app/transporter/id1450874784) (Mac App Store, free).

**App Store Review process:**
- Fill in all required fields in App Store Connect (including age rating, pricing)
- First review typically takes 1–3 business days
- Apple will test: all permission prompts, account creation/deletion, core features
- Common rejection reasons:
  - Missing NSUserTrackingUsageDescription (not needed here — no ad tracking)
  - Broken links in the app (check all "Contact Support" flows work)
  - Account deletion not working — test this carefully before submitting

---

### Step 5: Before Going Live

**Set Firebase budget alerts** — prevent unexpected bills:
1. Firebase Console → Project Settings → **Usage and billing**
2. Or Google Cloud Console → Billing → **Budgets & alerts** → Create budget → set $10/month alert

**Enable Firebase App Check** — prevents API abuse:
1. Firebase Console → App Check → Get started
2. Register your iOS app with DeviceCheck or App Attest
3. Requires updating the app with the App Check SDK

**Remove test data** — if you've been testing with dummy accounts, clear the Firestore database before launching:
```bash
# Delete all documents in a collection (use with caution):
# Use Firebase Console → Firestore → select collection → delete
```

**Run on multiple devices** — before submitting, test on:
- iPhone SE (small screen, oldest supported)
- iPhone 16 Pro Max (largest screen)
- iOS 16, 17, and 18

---

### Step 6: Post-Launch — Feature Roadmap

#### High Priority
| Feature | Complexity | Description |
|---|---|---|
| Community Maps | High | Show gym locations on a map. Use `expo-maps` or `react-native-maps`. Store lat/lng on posts (already collected). |
| Deep linking | Medium | Allow share links to open the app directly to a post or profile. Use `expo-linking` + Universal Links. |
| Workout template management | Low | Screen to view, rename, and delete saved workout templates from `users/{uid}/workouts`. |
| Activity status | Low | Show "active today" indicator on profiles when `showActivityStatus: true`. Read `lastStreakWeek` or a `lastActiveAt` timestamp. |

#### Medium Priority
| Feature | Complexity | Description |
|---|---|---|
| Group activity feed | Medium | A tab in FullLeaderboard or Community showing recent posts by group members. |
| In-app messaging | High | Direct messages between users. Would need a new Firestore `messages/` collection and a real-time listener. |
| Post editing | Medium | Allow users to edit title, caption, and exercises after posting. |
| Explore / Discover feed | Medium | A non-following feed of popular or nearby posts. |
| Workout split analytics | Medium | Charts showing workout frequency by split type over time. |

#### Lower Priority
| Feature | Complexity | Description |
|---|---|---|
| Workout program/plan builder | High | Multi-week training programs users can follow. |
| PR (personal record) tracking | Medium | Track best lift per exercise over time. |
| Apple Health integration | High | Sync workout data from Apple Health via `expo-health`. |
| Wearable sync (Apple Watch) | Very High | Requires a separate watchOS target. |
| Leaderboards (global) | Medium | Public leaderboard beyond friends/groups. |
| Challenges | High | Time-limited competitions between users or groups. |

---

### Quick Reference: Common Commands

```bash
# Development
npx expo start                                    # Start Expo dev server
npx expo start --clear                           # Clear cache and start

# Type checking
npx tsc --noEmit                                 # Check for TypeScript errors

# Firebase
npx firebase deploy --only firestore:rules       # Deploy security rules
npx firebase deploy --only firestore:indexes     # Deploy indexes
npx firebase deploy --only functions             # Deploy Cloud Functions
npx firebase deploy                              # Deploy everything

# EAS Build
npx eas build --platform ios --profile development   # Dev build (for Expo Go replacement)
npx eas build --platform ios --profile preview       # Internal TestFlight build
npx eas build --platform ios --profile production    # App Store build
npx eas submit --platform ios --latest               # Submit latest build to App Store

# Git
git checkout master
git merge feature/testing-push-followers         # Merge all work to master
git push origin master
```

---

*Last updated: May 2026. Branch: `feature/testing-push-followers`.*
