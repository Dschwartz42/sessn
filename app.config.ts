import 'dotenv/config';
import { ExpoConfig, ConfigContext } from 'expo/config';

// Single source of truth for Expo config. This file previously coexisted with a
// static app.json, and the two disagreed (bundle id, Info.plist strings, plugin
// config). Because app.config.ts wins and shallow-overrides app.json, the richer
// app.json values were silently dropped at build time. app.json has been removed
// and all of its correct values folded in here.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Sessn',
  slug: 'sessn-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0a0a0a',
  },
  ios: {
    supportsTablet: false,
    // Confirmed against GoogleService-Info.plist (BUNDLE_ID).
    bundleIdentifier: 'com.danielschwartzman.sessn',
    infoPlist: {
      NSCameraUsageDescription:
        'Sessn uses your camera to add photos to your workout posts.',
      NSPhotoLibraryUsageDescription:
        'Sessn accesses your photo library to add images to your workout posts.',
      NSPhotoLibraryAddUsageDescription:
        'Sessn saves workout images to your photo library.',
      NSLocationWhenInUseUsageDescription:
        'Sessn uses your location to tag your workouts with a gym or spot.',
      NSLocationAlwaysUsageDescription:
        'Sessn uses your location to geotag workouts.',
      NSMicrophoneUsageDescription:
        'Sessn may use your microphone when recording workout clips.',
      NSUserNotificationsUsageDescription:
        'Sessn sends push notifications for likes, follows, and group activity.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0a0a0a',
    },
    package: 'com.danielschwartzman.sessn',
    permissions: [
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE',
    ],
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-font',
    'expo-camera',
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#635BFF',
        sounds: [],
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Sessn accesses your photo library to add images to your workout posts.',
        cameraPermission:
          'Sessn uses your camera to add photos to your workout posts.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Sessn uses your location to tag your workouts with a gym or spot.',
        locationAlwaysAndWhenInUsePermission:
          'Allow Sessn to use your location.',
      },
    ],
    [
      'expo-media-library',
      {
        photosPermission:
          'Sessn accesses your photo library to add images to your workout posts.',
        savePhotosPermission:
          'Sessn saves workout images to your photo library.',
        isAccessMediaLocationEnabled: false,
      },
    ],
  ],
  extra: {
    firebaseApiKey: process.env.FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.FIREBASE_APP_ID,
    mapkitToken: process.env.MAPKIT_TOKEN,
    expoProjectId: process.env.EXPO_PROJECT_ID,
    eas: {
      projectId: process.env.EXPO_PROJECT_ID,
    },
  },
});
