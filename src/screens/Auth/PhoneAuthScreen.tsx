import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth, db } from '../../services/firebase';
import { colors, typography, spacing, radius } from '../../utils/theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'PhoneAuth'>;
};

export default function PhoneAuthScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone) {
      Alert.alert('Error', 'Please enter your phone number.');
      return;
    }
    setLoading(true);
    try {
      const confirmation = await signInWithPhoneNumber(auth, phone.trim());
      setVerificationId(confirmation.verificationId);
      Alert.alert('Code sent', 'Enter the 6-digit code we sent you.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp || !verificationId) return;
    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const result = await signInWithCredential(auth, credential);
      // Create user doc if first login
      const userRef = doc(db, 'users', result.user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: result.user.uid,
          displayName: '',
          username: `user_${result.user.uid.slice(0, 6)}`,
          email: result.user.email ?? '',
          phone: result.user.phoneNumber ?? phone.trim(),
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
      }
    } catch (e: any) {
      Alert.alert('Verification Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{verificationId ? 'Enter code' : 'Your number'}</Text>
        <Text style={styles.subtitle}>
          {verificationId
            ? 'Enter the 6-digit code sent to your phone'
            : "We'll text you a verification code"}
        </Text>

        <View style={styles.form}>
          {!verificationId ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor={colors.textDim}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <TouchableOpacity style={styles.primaryButton} onPress={handleSendOtp} disabled={loading}>
                {loading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.primaryButtonText}>Send Code</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor={colors.textDim}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity style={styles.primaryButton} onPress={handleVerify} disabled={loading}>
                {loading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.primaryButtonText}>Verify</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setVerificationId(null)}>
                <Text style={styles.linkText}>Change phone number</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, paddingHorizontal: spacing.xl },
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
  linkText: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});
