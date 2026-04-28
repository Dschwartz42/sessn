# Sessn

A social fitness tracking app built with React Native + Expo (iOS only).

## Prerequisites

- Node.js 18+
- Xcode (for iOS simulator / device builds)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables and fill in your values
cp .env.example .env
```

Open `.env` and fill in the Firebase and Expo credentials (ask a team member for the values).

## Running

```bash
# Start the dev server
npx expo start

# Build and run on iOS simulator
npx expo run:ios
```

> **Note:** This app uses native modules (`react-native-svg`, `expo-camera`, etc.) that require a native build. Expo Go will not work — use `npx expo run:ios`.

## Environment Variables

| Variable | Where to find it |
|---|---|
| `FIREBASE_API_KEY` | Firebase Console → Project Settings → Your Apps |
| `FIREBASE_AUTH_DOMAIN` | Same as above |
| `FIREBASE_PROJECT_ID` | Same as above |
| `FIREBASE_STORAGE_BUCKET` | Same as above |
| `FIREBASE_MESSAGING_SENDER_ID` | Same as above |
| `FIREBASE_APP_ID` | Same as above |
| `MAPKIT_TOKEN` | Apple Developer Portal |
| `EXPO_PROJECT_ID` | [expo.dev](https://expo.dev) project dashboard |

## Tech Stack

- React Native + TypeScript + Expo SDK 52
- Firebase Auth + Firestore + Storage
- React Navigation (bottom tabs + nested stacks)
- Expo Notifications + APNs
