import 'dotenv/config';
import { ExpoConfig, ConfigContext } from 'expo/config';

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
    backgroundColor: '#0D0D0D',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.danielschwartzman.sessn',
    infoPlist: {
      NSCameraUsageDescription: 'Sessn uses your camera to add photos to workouts.',
      NSPhotoLibraryUsageDescription: 'Sessn uses your photo library to add images to workouts.',
      NSLocationWhenInUseUsageDescription: 'Sessn uses your location to geotag workouts.',
      NSLocationAlwaysUsageDescription: 'Sessn uses your location to geotag workouts.',
    },
  },
  plugins: [
    'expo-camera',
    'expo-image-picker',
    ['expo-location', { locationAlwaysAndWhenInUsePermission: 'Allow Sessn to use your location.' }],
    'expo-notifications',
    'expo-media-library',
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
