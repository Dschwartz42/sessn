import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, radius } from '../../utils/theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>SESSN</Text>
          <Text style={styles.tagline}>Every workout. Your story.</Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.phoneButton}
            onPress={() => navigation.navigate('PhoneAuth')}
          >
            <Text style={styles.phoneButtonText}>Continue with Phone</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  logo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 56,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 8,
  },
  tagline: {
    ...typography.bodySecondary,
    marginTop: spacing.sm,
    letterSpacing: 1,
  },
  buttons: {
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  phoneButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  phoneButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
});
