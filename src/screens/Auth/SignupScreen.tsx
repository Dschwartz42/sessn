import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth, db } from '../../services/firebase';
import { colors, typography, spacing, radius } from '../../utils/theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'>;
};

export default function SignupScreen({ navigation }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!displayName || !username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    const usernameClean = username.trim().toLowerCase().replace(/\s/g, '');
    if (!/^[a-z0-9._]+$/.test(usernameClean)) {
      Alert.alert('Error', 'Username can only contain letters, numbers, periods, and underscores.');
      return;
    }

    setLoading(true);
    try {
      // Check username uniqueness
      const usernameQuery = query(collection(db, 'users'), where('username', '==', usernameClean));
      const usernameSnap = await getDocs(usernameQuery);
      if (!usernameSnap.empty) {
        Alert.alert('Error', 'That username is already taken.');
        setLoading(false);
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        displayName: displayName.trim(),
        username: usernameClean,
        email: email.trim().toLowerCase(),
        phone: null,
        bio: '',
        profilePicUrl: null,
        isPublic: true,
        fitnessLevel: null,
        instagramLink: null,
        gender: null,
        createdAt: serverTimestamp(),
        followersCount: 0,
        followingCount: 0,
        postCount: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalSessns: 0,
        totalTimeMinutes: 0,
        totalLbsLifted: 0,
        allowReposts: true,
        showActivityStatus: true,
        locationSharing: false,
        showStreakToOthers: true,
        pushEnabled: true,
        likesEnabled: true,
        repostsEnabled: true,
        followersNotifEnabled: true,
        streakNotifEnabled: true,
        groupsNotifEnabled: true,
        expoPushToken: null,
      });
    } catch (e: any) {
      Alert.alert('Signup Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join the Sessn community</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={colors.textDim}
              value={displayName}
              onChangeText={setDisplayName}
            />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={colors.textDim}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textDim}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textDim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor={colors.textDim}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleSignup} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  inner: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  back: { marginTop: spacing.md, marginBottom: spacing.lg },
  backText: { color: colors.text, fontSize: 24 },
  title: { ...typography.h1, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySecondary, marginBottom: spacing.xl },
  form: { gap: spacing.md },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { ...typography.body },
  footerLink: { color: colors.primary, fontWeight: '600', fontSize: 15 },
});
