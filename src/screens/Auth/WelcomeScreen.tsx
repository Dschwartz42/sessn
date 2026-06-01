import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
          <Text style={styles.tagline}>Track every rep. Share every sessn.</Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.primaryButtonText}>GET STARTED</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>Already have an account? </Text>
            <Text style={styles.linkHighlight}>Log in</Text>
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
    color: colors.primaryLight,
    letterSpacing: 8,
  },
  tagline: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  buttons: { gap: 14 },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    letterSpacing: 2,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Barlow_400Regular',
    fontSize: 14,
  },
  linkHighlight: {
    color: colors.primaryLight,
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 14,
  },
  phoneButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  phoneButtonText: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Barlow_500Medium',
    fontSize: 14,
  },
});
