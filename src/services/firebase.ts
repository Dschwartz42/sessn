import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
// `getReactNativePersistence` ships in Firebase's React Native entry point, which
// Metro resolves at runtime, but it is absent from the web type definitions the
// TypeScript compiler sees. Pull it off the module via a typed cast so we keep the
// real runtime behavior without a compile error.
import * as firebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const {
  firebaseApiKey,
  firebaseAuthDomain,
  firebaseProjectId,
  firebaseStorageBucket,
  firebaseMessagingSenderId,
  firebaseAppId,
} = Constants.expoConfig?.extra ?? {};

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  storageBucket: firebaseStorageBucket,
  messagingSenderId: firebaseMessagingSenderId,
  appId: firebaseAppId,
};

const getReactNativePersistence = (
  firebaseAuth as unknown as {
    getReactNativePersistence: (storage: typeof AsyncStorage) => unknown;
  }
).getReactNativePersistence;

let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage) as never,
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
