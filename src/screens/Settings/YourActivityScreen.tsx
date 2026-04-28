import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, typography } from '../../utils/theme';
import { format } from 'date-fns';

type Props = { navigation: any };

export default function YourActivityScreen({ navigation }: Props) {
  const { userDoc } = useAuth();

  const stats = [
    { label: 'All-Time Sessns', value: `${userDoc?.totalSessns ?? 0}` },
    { label: 'Sessns This Month', value: '—' },
    { label: 'Total Time', value: `${Math.round((userDoc?.totalTimeMinutes ?? 0) / 60)} hrs` },
    { label: 'Current Streak', value: `${userDoc?.currentStreak ?? 0} weeks` },
    {
      label: 'Member Since',
      value: userDoc?.createdAt?.toDate ? format(userDoc.createdAt.toDate(), 'MMM yyyy') : '—',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Activity</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView>
        {stats.map((s) => (
          <View key={s.label} style={styles.row}>
            <Text style={styles.label}>{s.label}</Text>
            <Text style={styles.value}>{s.value}</Text>
          </View>
        ))}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liked Posts</Text>
          <Text style={styles.comingSoon}>Coming soon — tap posts to see your liked content.</Text>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.h3 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { color: colors.textSecondary, fontSize: 15 },
  value: { color: colors.text, fontSize: 15, fontWeight: '700' },
  section: { padding: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  comingSoon: { color: colors.textSecondary, fontSize: 14 },
});
