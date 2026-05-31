import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { auth, db } from '../services/firebase';
import { UserDoc } from '../types';

async function registerPushToken(uid: string) {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    const { status } = existing !== 'granted'
      ? await Notifications.requestPermissionsAsync()
      : { status: existing };
    if (status !== 'granted') return;

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await updateDoc(doc(db, 'users', uid), { expoPushToken: token });

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }
  } catch {
    // Silently ignored: simulator, missing EAS projectId, or permissions denied
  }
}

interface AuthContextValue {
  user: User | null;
  userDoc: UserDoc | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userDoc: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserDoc(null);
        setLoading(false);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user) return;
    registerPushToken(user.uid);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setUserDoc({ uid: snap.id, ...snap.data() } as UserDoc);
      }
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userDoc, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
