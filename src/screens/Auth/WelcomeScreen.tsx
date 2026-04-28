import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius } from '../../utils/theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.logoSection}>
          <Text style={styles.logoText}>SESSN</Text>
          <Text style={styles.tagline}>Every workout deserves a post.</Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostButton}
            onPress={() => navigation.navigate('PhoneAuth')}
          >
            <Text style={styles.ghostButtonText}>Continue with Phone</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 72,
    color: colors.text,
    letterSpacing: 12,
  },
  tagline: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    letterSpacing: 0.5,
  },
  buttons: { gap: 12 },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 17,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontFamily: 'Barlow_700Bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: radius.pill,
    paddingVertical: 17,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  secondaryButtonText: {
    color: colors.text,
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 16,
  },
  ghostButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: colors.textSecondary,
    fontFamily: 'Barlow_500Medium',
    fontSize: 15,
  },
});
