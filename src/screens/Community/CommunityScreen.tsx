import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Group, GroupMember, UserDoc } from '../../types';
import { colors, spacing, radius, typography } from '../../utils/theme';
import { getUserGroups, getGroupMembers, leaveGroup } from '../../services/groupService';
import { getFollowingIds } from '../../services/followService';

type TimeFrame = 'weekly' | 'monthly' | 'alltime';
type Metric = 'sessns' | 'lbs' | 'hrs';

type Props = { navigation: any };

export default function CommunityScreen({ navigation }: Props) {
  const { user, userDoc } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('weekly');
  const [metric, setMetric] = useState<Metric>('sessns');
  const [friendStreaks, setFriendStreaks] = useState<UserDoc[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const g = await getUserGroups(user.uid);
      setGroups(g);

      // Load friend streaks
      const ids = await getFollowingIds(user.uid);
      if (ids.length > 0) {
        const snap = await getDocs(
          query(collection(db, 'users'), where('uid', 'in', ids.slice(0, 30)))
        );
        const friends = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserDoc));
        friends.sort((a, b) => (b.currentStreak ?? 0) - (a.currentStreak ?? 0));
        setFriendStreaks(friends);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const timeFrames: { key: TimeFrame; label: string }[] = [
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'alltime', label: 'All Time' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
      </View>

      {/* Time frame toggle */}
      <View style={styles.toggleRow}>
        {timeFrames.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.toggleBtn, timeFrame === t.key && styles.toggleBtnActive]}
            onPress={() => setTimeFrame(t.key)}
          >
            <Text style={[styles.toggleText, timeFrame === t.key && styles.toggleTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {groups.length === 0 ? (
          <View style={styles.emptyGroups}>
            <Ionicons name="people-outline" size={48} color={colors.textDim} />
            <Text style={styles.emptyText}>You're not in any groups yet.</Text>
            <Text style={styles.emptySubText}>Search for groups to join or create your own.</Text>
          </View>
        ) : (
          groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              metric={metric}
              onMetricChange={setMetric}
              currentUid={user?.uid ?? ''}
              navigation={navigation}
            />
          ))
        )}

        {/* Overall streak leaderboard */}
        {friendStreaks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔥 Friends Streak Leaderboard</Text>
              <TouchableOpacity>
                <Text style={styles.viewAll}>View Full</Text>
              </TouchableOpacity>
            </View>
            {friendStreaks.slice(0, 5).map((u, i) => (
              <TouchableOpacity
                key={u.uid}
                style={[styles.leaderboardRow, u.uid === user?.uid && styles.highlighted]}
                onPress={() => navigation.navigate('UserProfile', { uid: u.uid })}
              >
                <Text style={styles.rank}>#{i + 1}</Text>
                {u.profilePicUrl ? (
                  <Image source={{ uri: u.profilePicUrl }} style={styles.rowAvatar} />
                ) : (
                  <View style={[styles.rowAvatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={14} color={colors.textSecondary} />
                  </View>
                )}
                <Text style={styles.rowUsername}>{u.username}</Text>
                <Text style={styles.rowValue}>{u.currentStreak ?? 0} wks</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function GroupCard({
  group, metric, onMetricChange, currentUid, navigation,
}: {
  group: Group;
  metric: Metric;
  onMetricChange: (m: Metric) => void;
  currentUid: string;
  navigation: any;
}) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    getGroupMembers(group.id).then((m) => {
      const sorted = [...m].sort((a, b) => {
        if (metric === 'sessns') return (b.totalSessns ?? 0) - (a.totalSessns ?? 0);
        if (metric === 'lbs') return (b.totalLbsLifted ?? 0) - (a.totalLbsLifted ?? 0);
        return (b.totalTimeMinutes ?? 0) - (a.totalTimeMinutes ?? 0);
      });
      setMembers(sorted);
    });
  }, [group.id, metric]);

  const metrics: { key: Metric; label: string }[] = [
    { key: 'sessns', label: 'SESSNS' },
    { key: 'lbs', label: 'LBS' },
    { key: 'hrs', label: 'HRS' },
  ];

  const getValue = (m: GroupMember) => {
    if (metric === 'sessns') return `${m.totalSessns ?? 0}`;
    if (metric === 'lbs') return `${m.totalLbsLifted ?? 0}`;
    return `${Math.round((m.totalTimeMinutes ?? 0) / 60)}`;
  };

  return (
    <View style={styles.groupCard}>
      <View style={styles.groupHeader}>
        {group.pictureUrl ? (
          <Image source={{ uri: group.pictureUrl }} style={styles.groupPic} />
        ) : (
          <View style={[styles.groupPic, styles.avatarPlaceholder]}>
            <Ionicons name="people" size={18} color={colors.textSecondary} />
          </View>
        )}
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupMembers}>{group.memberCount} members</Text>
        </View>
        <TouchableOpacity onPress={() => setShowMenu(true)}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Metric selector */}
      <View style={styles.metricRow}>
        {metrics.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.metricBtn, metric === m.key && styles.metricBtnActive]}
            onPress={() => onMetricChange(m.key)}
          >
            <Text style={[styles.metricText, metric === m.key && styles.metricTextActive]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {members.slice(0, 3).map((m, i) => (
        <View key={m.uid} style={[styles.leaderboardRow, m.uid === currentUid && styles.highlighted]}>
          <Text style={styles.rank}>#{i + 1}</Text>
          <Text style={styles.rowUsername}>{m.username}</Text>
          <Text style={styles.rowValue}>{getValue(m)}</Text>
        </View>
      ))}

      <TouchableOpacity
        style={styles.viewFullBtn}
        onPress={() => navigation.navigate('FullLeaderboard', { groupId: group.id })}
      >
        <Text style={styles.viewFullText}>View Full Leaderboard →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.h2 },
  toggleRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  toggleTextActive: { color: colors.text },
  section: { margin: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { ...typography.h3 },
  viewAll: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  highlighted: { backgroundColor: colors.primaryDim, borderRadius: radius.sm, paddingHorizontal: spacing.sm },
  rank: { color: colors.textSecondary, fontWeight: '700', width: 28, fontSize: 14 },
  rowAvatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: { backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  rowUsername: { flex: 1, color: colors.text, fontWeight: '600', fontSize: 14 },
  rowValue: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  emptyGroups: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyText: { ...typography.h3 },
  emptySubText: { ...typography.bodySecondary, textAlign: 'center' },
  groupCard: {
    margin: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  groupPic: { width: 48, height: 48, borderRadius: 24 },
  groupInfo: { flex: 1 },
  groupName: { color: colors.text, fontWeight: '700', fontSize: 16 },
  groupMembers: { color: colors.textSecondary, fontSize: 13 },
  metricRow: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.xs },
  metricBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricBtnActive: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
  metricText: { color: colors.textSecondary, fontWeight: '700', fontSize: 12 },
  metricTextActive: { color: colors.primary },
  viewFullBtn: { paddingTop: spacing.sm },
  viewFullText: { color: colors.primary, fontWeight: '600', fontSize: 13, textAlign: 'center' },
});
