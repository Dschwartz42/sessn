import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { colors, spacing } from '../../utils/theme';

type Props = { navigation: any };

export default function AboutSessnScreen({ navigation }: Props) {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ABOUT SESSN</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>SESSN</Text>
          <Text style={styles.tagline}>Track every rep. Share every sessn.</Text>
          <Text style={styles.version}>Version {version}</Text>
        </View>

        <Text style={styles.sectionHeader}>LEGAL</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => Alert.alert('Terms of Service', 'By using Sessn you agree to use the app for personal fitness tracking only. Do not post harmful, misleading, or offensive content. Sessn reserves the right to suspend accounts that violate these terms.', [{ text: 'OK' }])}
          >
            <Text style={styles.rowLabel}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
          <View style={styles.rowBorder} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => Alert.alert('Privacy Policy', 'Sessn collects only the data you provide (name, workouts, photos). Your data is stored securely in Firebase and is never sold to third parties. You can delete your account at any time to remove all data.', [{ text: 'OK' }])}
          >
            <Text style={styles.rowLabel}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 26,
    letterSpacing: 2,
    color: colors.text,
  },
  content: { padding: 16, paddingBottom: 120 },
  logoWrap: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 8,
  },
  logoText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 48,
    color: colors.primaryLight,
    letterSpacing: 6,
  },
  tagline: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Barlow_400Regular',
    fontSize: 14,
    marginTop: 6,
  },
  version: {
    color: 'rgba(255,255,255,0.25)',
    fontFamily: 'Barlow_400Regular',
    fontSize: 13,
    marginTop: 8,
  },
  sectionHeader: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#151515',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowBorder: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  rowLabel: { color: colors.text, fontFamily: 'Barlow_500Medium', fontSize: 15 },
});
