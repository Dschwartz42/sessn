import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, typography, spacing, radius } from '../../utils/theme';

const MILESTONES = [
  { id: 'first_sessn', label: 'First Sessn', description: 'Log your first workout' },
  { id: 'week_1', label: '1-Week Streak', description: 'Log a Sessn every week for 1 week' },
  { id: 'month_1', label: '1-Month Streak', description: 'Log a Sessn every week for 4 consecutive weeks' },
  { id: 'sessns_50', label: '50 Sessns', description: 'Log 50 total Sessns' },
  { id: 'sessns_100', label: '100 Sessns', description: 'Log 100 total Sessns' },
  { id: 'streak_6mo', label: '6-Month Streak', description: 'Maintain a streak for 26 consecutive weeks' },
  { id: 'streak_1yr', label: '1-Year Streak', description: 'Maintain a streak for 52 consecutive weeks' },
  { id: 'lbs_10k', label: '10K Lbs Lifted', description: 'Lift a cumulative 10,000 lbs' },
  { id: 'time_100hr', label: '100 Hours', description: 'Spend 100 cumulative hours working out' },
];

type Props = { navigation: any };

export default function StreakScreen({ navigation }: Props) {
  const { userDoc } = useAuth();
  const streak = userDoc?.currentStreak ?? 0;
  const totalSessns = userDoc?.totalSessns ?? 0;
  const totalTime = userDoc?.totalTimeMinutes ?? 0;

  // Weekly goal = 1 Sessn per week; progress shown as sessions this week (0 or 1)
  const weekProgress = Math.min(1, totalSessns > 0 ? 1 : 0);

  const checkMilestone = (id: string): boolean => {
    if (!userDoc) return false;
    switch (id) {
      case 'first_sessn': return totalSessns >= 1;
      case 'week_1': return userDoc.longestStreak >= 1;
      case 'month_1': return userDoc.longestStreak >= 4;
      case 'sessns_50': return totalSessns >= 50;
      case 'sessns_100': return totalSessns >= 100;
      case 'streak_6mo': return userDoc.longestStreak >= 26;
      case 'streak_1yr': return userDoc.longestStreak >= 52;
      case 'lbs_10k': return (userDoc.totalLbsLifted ?? 0) >= 10000;
      case 'time_100hr': return totalTime >= 6000;
      default: return false;
    }
  };

  // Today's day of week (0=Mon...6=Sun)
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7;
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Streak</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Fire ring */}
        <View style={styles.ringSection}>
          <View style={styles.ring}>
            <Text style={styles.ringEmoji}>🔥</Text>
            <Text style={styles.ringStreak}>{streak}</Text>
            <Text style={styles.ringLabel}>week streak</Text>
          </View>
        </View>

        {/* Week bubbles */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>This Week</Text>
          <View style={styles.weekRow}>
            {dayLabels.map((label, i) => (
              <View key={i} style={styles.dayCol}>
                <View style={[styles.weekBubble, i <= dayOfWeek && styles.weekBubbleFilled]} />
                <Text style={styles.dayLabel}>{label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{Math.round(totalTime / 60)}h</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{Math.max(0, 7 - dayOfWeek - 1)}</Text>
              <Text style={styles.statLabel}>Rest Days</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalSessns}</Text>
              <Text style={styles.statLabel}>Sessns</Text>
            </View>
          </View>
        </View>

        {/* Monthly calendar placeholder */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>This Month</Text>
          <MonthCalendar />
        </View>

        {/* Milestones */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Milestones</Text>
          {MILESTONES.map((m) => {
            const done = checkMilestone(m.id);
            return (
              <View key={m.id} style={styles.milestone}>
                <View style={[styles.milestoneIcon, done && styles.milestoneIconDone]}>
                  <Ionicons name={done ? 'checkmark' : 'lock-closed'} size={14} color={done ? colors.text : colors.textDim} />
                </View>
                <View style={styles.milestoneText}>
                  <Text style={[styles.milestoneName, done && styles.milestoneNameDone]}>{m.label}</Text>
                  <Text style={styles.milestoneDesc}>{m.description}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MonthCalendar() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay + 6) % 7;

  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View>
      <View style={calStyles.row}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Text key={i} style={calStyles.dayHeader}>{d}</Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={calStyles.row}>
          {week.map((day, di) => (
            <View key={di} style={[calStyles.cell, day === today.getDate() && calStyles.today]}>
              {day !== null && <Text style={calStyles.dayText}>{day}</Text>}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const calStyles = StyleSheet.create({
  row: { flexDirection: 'row' },
  dayHeader: { flex: 1, textAlign: 'center', color: colors.textDim, fontSize: 11, paddingBottom: 4 },
  cell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', margin: 1, borderRadius: 4 },
  today: { backgroundColor: colors.primary + '40' },
  dayText: { color: colors.text, fontSize: 12 },
});

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
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 120 },
  ringSection: { alignItems: 'center', paddingVertical: spacing.xl },
  ring: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: colors.fire,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringEmoji: { fontSize: 32 },
  ringStreak: { color: colors.text, fontSize: 32, fontWeight: '800' },
  ringLabel: { color: colors.textSecondary, fontSize: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardTitle: { ...typography.h3 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 4 },
  weekBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekBubbleFilled: { backgroundColor: colors.fire, borderColor: colors.fire },
  dayLabel: { color: colors.textDim, fontSize: 11 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '700' },
  statLabel: { color: colors.textSecondary, fontSize: 12 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  milestone: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  milestoneIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  milestoneIconDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  milestoneText: { flex: 1 },
  milestoneName: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  milestoneNameDone: { color: colors.text },
  milestoneDesc: { color: colors.textDim, fontSize: 12 },
});
