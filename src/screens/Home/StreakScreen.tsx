import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, radius } from '../../utils/theme';

const MILESTONES = [
  { id: 'first_sessn', emoji: '🏋️', label: 'First Sessn', description: 'Log your first workout' },
  { id: 'week_1', emoji: '🔥', label: '1-Week Streak', description: 'Work out every week for 1 week' },
  { id: 'month_1', emoji: '📅', label: '1-Month Streak', description: '4 consecutive weeks' },
  { id: 'sessns_50', emoji: '💪', label: '50 Sessns', description: 'Log 50 total Sessns' },
  { id: 'sessns_100', emoji: '🏆', label: '100 Sessns', description: 'Log 100 total Sessns' },
  { id: 'streak_6mo', emoji: '⚡', label: '6-Month Streak', description: '26 consecutive weeks' },
  { id: 'streak_1yr', emoji: '👑', label: '1-Year Streak', description: '52 consecutive weeks' },
  { id: 'lbs_10k', emoji: '🏗️', label: '10K Lbs Lifted', description: 'Lift 10,000 cumulative lbs' },
  { id: 'time_100hr', emoji: '⏱️', label: '100 Hours', description: '100 cumulative workout hours' },
];

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type Props = { navigation: any };

export default function StreakScreen({ navigation }: Props) {
  const { userDoc } = useAuth();
  const streak = userDoc?.currentStreak ?? 0;
  const totalSessns = userDoc?.totalSessns ?? 0;
  const totalTime = userDoc?.totalTimeMinutes ?? 0;

  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0…Sun=6

  const checkMilestone = (id: string): boolean => {
    if (!userDoc) return false;
    switch (id) {
      case 'first_sessn': return totalSessns >= 1;
      case 'week_1': return (userDoc.longestStreak ?? 0) >= 1;
      case 'month_1': return (userDoc.longestStreak ?? 0) >= 4;
      case 'sessns_50': return totalSessns >= 50;
      case 'sessns_100': return totalSessns >= 100;
      case 'streak_6mo': return (userDoc.longestStreak ?? 0) >= 26;
      case 'streak_1yr': return (userDoc.longestStreak ?? 0) >= 52;
      case 'lbs_10k': return (userDoc.totalLbsLifted ?? 0) >= 10000;
      case 'time_100hr': return totalTime >= 6000;
      default: return false;
    }
  };

  // Ring math — 220px diameter, r=100, circumference≈628
  const circumference = 628;
  const progress = Math.min(streak / 52, 1); // 52 weeks = full ring
  const dashOffset = circumference * (1 - progress);

  // Monthly calendar
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

  const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>YOUR STREAK</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* SVG Ring */}
        <View style={styles.ringContainer}>
          <View style={styles.ringWrap}>
            <Svg width={220} height={220} viewBox="0 0 220 220">
              <Defs>
                <LinearGradient id="fireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FFB347" />
                  <Stop offset="50%" stopColor="#FF8C42" />
                  <Stop offset="100%" stopColor="#FF4500" />
                </LinearGradient>
              </Defs>
              {/* Background track */}
              <Circle
                cx={110} cy={110} r={100}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={14}
                transform="rotate(-90 110 110)"
              />
              {/* Progress arc */}
              <Circle
                cx={110} cy={110} r={100}
                fill="none"
                stroke="#FF8C42"
                strokeWidth={14}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 110 110)"
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={styles.ringFlame}>🔥</Text>
              <Text style={styles.ringNumber}>{streak}</Text>
              <Text style={styles.ringLabel}>WEEK STREAK</Text>
            </View>
          </View>
          <Text style={styles.streakTagline}>
            Keep it going — stay consistent this week
          </Text>
        </View>

        {/* This Week */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>THIS WEEK</Text>
          <Text style={styles.sectionSub}>Mon – Sun</Text>
        </View>
        <View style={styles.weekCard}>
          <View style={styles.weekRow}>
            {DAY_LABELS.map((label, i) => {
              const isPast = i < todayIdx;
              const isToday = i === todayIdx;
              const isUpcoming = i > todayIdx;
              return (
                <View key={i} style={styles.weekDay}>
                  <Text style={styles.weekDayLabel}>{label}</Text>
                  <View style={[
                    styles.weekDot,
                    isPast && styles.weekDotDone,
                    isToday && styles.weekDotToday,
                    isUpcoming && styles.weekDotUpcoming,
                  ]}>
                    {isPast && <Text style={styles.weekDotCheck}>✓</Text>}
                    {isToday && <Text style={styles.weekDotTodayText}>•</Text>}
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.weekSummary}>
            <View style={styles.weekStat}>
              <Text style={styles.weekStatValue}>{Math.round(totalTime / 60)}H</Text>
              <Text style={styles.weekStatLabel}>Total Time</Text>
            </View>
            <View style={styles.weekStat}>
              <Text style={styles.weekStatValue}>{streak}</Text>
              <Text style={styles.weekStatLabel}>Week Streak</Text>
            </View>
            <View style={styles.weekStat}>
              <Text style={styles.weekStatValue}>{totalSessns}</Text>
              <Text style={styles.weekStatLabel}>Total Sessns</Text>
            </View>
          </View>
        </View>

        {/* Month Calendar */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>THIS MONTH</Text>
        </View>
        <View style={styles.monthCard}>
          <View style={styles.monthHeader}>
            <Text style={styles.monthTitle}>{monthName.toUpperCase()}</Text>
          </View>
          <View style={styles.calWeekdays}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <Text key={i} style={styles.calWeekday}>{d}</Text>
            ))}
          </View>
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.calRow}>
              {week.map((day, di) => (
                <View
                  key={di}
                  style={[
                    styles.calCell,
                    !day && styles.calCellBlank,
                    day === today.getDate() && styles.calCellToday,
                  ]}
                >
                  {day ? <Text style={styles.calCellText}>{day}</Text> : null}
                </View>
              ))}
            </View>
          ))}
          <View style={styles.calLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryBorder }]} />
              <Text style={styles.legendText}>Active</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
              <Text style={styles.legendText}>Rest</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#fff' }]} />
              <Text style={styles.legendText}>Today</Text>
            </View>
          </View>
        </View>

        {/* Milestones */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MILESTONES</Text>
        </View>
        <View style={styles.milestonesCard}>
          {MILESTONES.map((m, idx) => {
            const done = checkMilestone(m.id);
            return (
              <View key={m.id} style={[styles.milestoneRow, idx === MILESTONES.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.milestoneIcon, done ? styles.milestoneIconDone : styles.milestoneIconLocked]}>
                  <Text style={{ fontSize: 18, opacity: done ? 1 : 0.35 }}>{m.emoji}</Text>
                </View>
                <View style={styles.milestoneInfo}>
                  <Text style={[styles.milestoneName, !done && styles.milestoneNameLocked]}>{m.label}</Text>
                  <Text style={styles.milestoneDesc}>{m.description}</Text>
                </View>
                <View style={[styles.milestoneStatus, done ? styles.milestoneStatusDone : styles.milestoneStatusPending]}>
                  <Text style={[styles.milestoneStatusText, done ? styles.milestoneStatusTextDone : styles.milestoneStatusTextPending]}>
                    {done ? 'Done' : 'Locked'}
                  </Text>
                </View>
              </View>
            );
          })}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 26, letterSpacing: 2, color: '#fff' },
  content: { paddingBottom: 120 },

  ringContainer: { alignItems: 'center', paddingVertical: 20 },
  ringWrap: { width: 220, height: 220, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ringCenter: {
    position: 'absolute', inset: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  ringFlame: { fontSize: 36, marginBottom: 2 },
  ringNumber: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 56, letterSpacing: 2, lineHeight: 56,
    color: '#FF8C42',
  },
  ringLabel: {
    fontFamily: 'Barlow_700Bold', fontSize: 11,
    textTransform: 'uppercase', letterSpacing: 2,
    color: 'rgba(255,255,255,0.45)', marginTop: 2,
  },
  streakTagline: {
    textAlign: 'center',
    fontFamily: 'Barlow_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 20,
    marginTop: 4,
  },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12,
  },
  sectionTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 20, letterSpacing: 1.5, color: '#fff' },
  sectionSub: { fontFamily: 'Barlow_600SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.2 },

  weekCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#151515',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18, padding: 18,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  weekDay: { flex: 1, alignItems: 'center', gap: 8 },
  weekDayLabel: { fontFamily: 'Barlow_700Bold', fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8 },
  weekDot: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed',
  },
  weekDotDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderStyle: 'solid',
  },
  weekDotToday: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
    borderStyle: 'solid',
    borderWidth: 2,
  },
  weekDotUpcoming: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed',
  },
  weekDotCheck: { color: '#fff', fontFamily: 'Barlow_700Bold', fontSize: 16 },
  weekDotTodayText: { color: colors.primaryLight, fontSize: 20, fontFamily: 'Barlow_700Bold' },
  weekSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  weekStat: { alignItems: 'center' },
  weekStatValue: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 0.5, color: '#fff' },
  weekStatLabel: { fontFamily: 'Barlow_700Bold', fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 2 },

  monthCard: {
    marginHorizontal: 16, marginBottom: 20,
    backgroundColor: '#151515',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18, padding: 18,
  },
  monthHeader: { marginBottom: 16 },
  monthTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 20, letterSpacing: 1, color: '#fff' },
  calWeekdays: { flexDirection: 'row', marginBottom: 8 },
  calWeekday: { flex: 1, textAlign: 'center', fontFamily: 'Barlow_700Bold', fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8 },
  calRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  calCell: {
    flex: 1, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  calCellBlank: { backgroundColor: 'transparent' },
  calCellToday: { borderWidth: 2, borderColor: '#fff', backgroundColor: 'transparent' },
  calCellText: { fontFamily: 'Barlow_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  calLegend: {
    flexDirection: 'row', gap: 16,
    marginTop: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBox: { width: 12, height: 12, borderRadius: 4 },
  legendText: { fontFamily: 'Barlow_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.4)' },

  milestonesCard: {
    marginHorizontal: 16, marginBottom: 20,
    backgroundColor: '#151515',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18, padding: 16,
  },
  milestoneRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  milestoneIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  milestoneIconDone: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryBorder },
  milestoneIconLocked: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  milestoneInfo: { flex: 1 },
  milestoneName: { fontFamily: 'Barlow_700Bold', fontSize: 13, color: '#fff' },
  milestoneNameLocked: { color: 'rgba(255,255,255,0.4)' },
  milestoneDesc: { fontFamily: 'Barlow_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  milestoneStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  milestoneStatusDone: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryBorder },
  milestoneStatusPending: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  milestoneStatusText: { fontFamily: 'Barlow_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  milestoneStatusTextDone: { color: colors.primaryLight },
  milestoneStatusTextPending: { color: 'rgba(255,255,255,0.3)' },
});
