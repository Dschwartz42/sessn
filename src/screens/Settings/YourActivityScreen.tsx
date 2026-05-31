import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing } from '../../utils/theme';
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>YOUR ACTIVITY</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.sectionHeader}>STATS</Text>
        <View style={styles.card}>
          {stats.map((s, idx) => (
            <View key={s.label} style={[styles.row, idx < stats.length - 1 && styles.rowBorder]}>
              <Text style={styles.label}>{s.label}</Text>
              <Text style={styles.value}>{s.value}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>LIKED POSTS</Text>
        <View style={styles.card}>
          <View style={styles.comingSoonWrap}>
            <Ionicons name="heart-outline" size={28} color="rgba(255,255,255,0.2)" />
            <Text style={styles.comingSoonText}>Coming soon — tap posts to see your liked content.</Text>
          </View>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  label: { color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow_400Regular', fontSize: 15 },
  value: { color: colors.text, fontFamily: 'Barlow_700Bold', fontSize: 15 },
  comingSoonWrap: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
    paddingHorizontal: 20,
  },
  comingSoonText: {
    color: 'rgba(255,255,255,0.35)',
    fontFamily: 'Barlow_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
});
