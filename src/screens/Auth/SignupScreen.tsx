import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth, db } from '../../services/firebase';
import { colors, spacing, radius } from '../../utils/theme';
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
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

      const usernameQuery = query(collection(db, 'users'), where('username', '==', usernameClean));
      const usernameSnap = await getDocs(usernameQuery);
      if (!usernameSnap.empty) {
        await cred.user.delete();
        Alert.alert('Error', 'That username is already taken.');
        setLoading(false);
        return;
      }
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
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the Sessn community</Text>

          <View style={styles.form}>
            {[
              { label: 'Full Name', value: displayName, setter: setDisplayName, placeholder: 'Your name', caps: 'words' as const },
              { label: 'Username', value: username, setter: setUsername, placeholder: '@username', caps: 'none' as const },
              { label: 'Email', value: email, setter: setEmail, placeholder: 'you@example.com', caps: 'none' as const, keyboard: 'email-address' as const },
              { label: 'Password', value: password, setter: setPassword, placeholder: '••••••••', secure: true },
              { label: 'Confirm Password', value: confirmPassword, setter: setConfirmPassword, placeholder: '••••••••', secure: true },
            ].map((field) => (
              <View key={field.label} style={styles.inputWrap}>
                <Text style={styles.inputLabel}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.textDim}
                  value={field.value}
                  onChangeText={field.setter}
                  autoCapitalize={field.caps ?? 'sentences'}
                  keyboardType={field.keyboard ?? 'default'}
                  secureTextEntry={field.secure}
                />
              </View>
            ))}

            <TouchableOpacity style={styles.primaryButton} onPress={handleSignup} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
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
  back: { marginTop: spacing.md, marginBottom: spacing.xl },
  title: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 40,
    color: colors.text,
    letterSpacing: 2,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  form: { gap: spacing.md },
  inputWrap: { gap: 6 },
  inputLabel: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 11,
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.text,
    fontFamily: 'Barlow_400Regular',
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonText: { color: '#fff', fontFamily: 'Barlow_700Bold', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { fontFamily: 'Barlow_400Regular', fontSize: 15, color: colors.textSecondary },
  footerLink: { color: colors.primary, fontFamily: 'Barlow_600SemiBold', fontSize: 15 },
});
