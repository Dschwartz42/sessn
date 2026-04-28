import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth } from '../../services/firebase';
import { colors, spacing, radius } from '../../utils/theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      Alert.alert('Login Failed', e.message);
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
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to your Sessn</Text>

        <View style={styles.form}>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textDim}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textDim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('PhoneAuth')}>
            <Text style={styles.linkText}>Use phone number instead</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.footerLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, paddingHorizontal: spacing.xl },
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
  linkText: {
    color: colors.textSecondary,
    fontFamily: 'Barlow_400Regular',
    textAlign: 'center',
    marginTop: spacing.sm,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingBottom: spacing.xl,
  },
  footerText: { fontFamily: 'Barlow_400Regular', fontSize: 15, color: colors.textSecondary },
  footerLink: { color: colors.primary, fontFamily: 'Barlow_600SemiBold', fontSize: 15 },
});
