import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { colors, spacing, typography } from '../../utils/theme';

type Props = { navigation: any };

export default function AboutSessnScreen({ navigation }: Props) {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Sessn</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Version</Text>
        <Text style={styles.value}>{version}</Text>
      </View>
      <TouchableOpacity style={styles.row}>
        <Text style={styles.link}>Terms of Service</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row}>
        <Text style={styles.link}>Privacy Policy</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.h3 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { color: colors.textSecondary, fontSize: 15 },
  value: { color: colors.text, fontSize: 15, fontWeight: '600' },
  link: { color: colors.primary, fontSize: 15 },
});
