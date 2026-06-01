import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, Alert, Share} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, collection, getDocs, documentId, query, where, Timestamp } from 'firebase/firestore';

import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Group, GroupMember, UserDoc } from '../../types';
import { colors, spacing, radius, typography } from '../../utils/theme';
import { getGroupMembers, leaveGroup } from '../../services/groupService';
import { calcLbs } from '../../services/postService';
import { getFollowingIds } from '../../services/followService';

type Metric = 'sessns' | 'lbs' | 'hrs';
type Props = { navigation: any; route: any };

type PeriodStats = Record<string, { sessns: number; lbs: number; mins: number }>;

export default function FullLeaderboardScreen({ navigation, route }: Props) {
  const { groupId, type, timeFrame: initialTimeFrame } = route.params;
  const isStreaksMode = type === 'streaks';
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [friendStreaks, setFriendStreaks] = useState<UserDoc[]>([]);
  const [metric, setMetric] = useState<Metric>('sessns');
  const [timeFrame, setTimeFrame] = useState<string>(initialTimeFrame ?? 'alltime');
  const [periodStats, setPeriodStats] = useState<PeriodStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (isStreaksMode) {
          if (!user) return;
          const ids = await getFollowingIds(user.uid);
          if (ids.length > 0) {
            const snap = await getDocs(
              query(collection(db, 'users'), where(documentId(), 'in', ids.slice(0, 30)))
            );
            const friends = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserDoc));
            friends.sort((a, b) => (b.currentStreak ?? 0) - (a.currentStreak ?? 0));
            setFriendStreaks(friends);
          }
        } else {
          const snap = await getDoc(doc(db, 'groups', groupId));
          if (snap.exists()) setGroup({ id: snap.id, ...snap.data() } as Group);
          const m = await getGroupMembers(groupId);
          setMembers(m);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [groupId, isStreaksMode]);

  useEffect(() => {
    if (timeFrame === 'alltime' || members.length === 0) { setPeriodStats(null); return; }
    const now = new Date();
    let start: Date;
    if (timeFrame === 'weekly') {
      const day = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      start.setHours(0, 0, 0, 0);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    const uids = members.map((m) => m.uid);
    const chunks: string[][] = [];
    for (let i = 0; i < uids.length; i += 30) chunks.push(uids.slice(i, i + 30));
    Promise.all(
      chunks.map((chunk) =>
        getDocs(query(
          collection(db, 'posts'),
          where('authorId', 'in', chunk),
          where('createdAt', '>=', Timestamp.fromDate(start)),
        )),
      ),
    ).then((snaps) => {
      const stats: PeriodStats = {};
      snaps.flatMap((s) => s.docs).forEach((d) => {
        const data = d.data();
        if (data.isRepost) return;
        const uid: string = data.authorId;
        if (!stats[uid]) stats[uid] = { sessns: 0, lbs: 0, mins: 0 };
        stats[uid].sessns += 1;
        stats[uid].mins += data.durationMinutes ?? 0;
        stats[uid].lbs += calcLbs(data.exercises);
      });
      setPeriodStats(stats);
    });
  }, [timeFrame, members]);

  const getVal = (m: GroupMember, met: Metric): number => {
    if (periodStats) {
      const p = periodStats[m.uid] ?? { sessns: 0, lbs: 0, mins: 0 };
      if (met === 'lbs') return p.lbs;
      if (met === 'hrs') return p.mins;
      return p.sessns;
    }
    if (met === 'lbs') return m.totalLbsLifted ?? 0;
    if (met === 'hrs') return m.totalTimeMinutes ?? 0;
    return m.totalSessns ?? 0;
  };

  const sorted = [...members].sort((a, b) => getVal(b, metric) - getVal(a, metric));
  const streakSorted = [...members].sort((a, b) => (b.currentStreak ?? 0) - (a.currentStreak ?? 0));

  const getValue = (m: GroupMember) => {
    const val = getVal(m, metric);
    if (metric === 'sessns') return `${val} SESSNS`;
    if (metric === 'lbs') return `${Math.round(val)} LBS`;
    return `${Math.round(val / 60)} HRS`;
  };

  const handleLeave = () => {
    Alert.alert('Leave Group', `Leave ${group?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          if (!user) return;
          await leaveGroup(groupId, user.uid);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleInvite = async () => {
    await Share.share({ message: `Join my group on Sessn! https://sessn.app/group/${groupId}` });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      </SafeAreaView>
    );
  }

  const metrics: { key: Metric; label: string }[] = [
    { key: 'sessns', label: 'SESSNS' },
    { key: 'lbs', label: 'LBS' },
    { key: 'hrs', label: 'HRS' },
  ];

  if (isStreaksMode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.groupInfo}>
            <View style={[styles.groupPic, styles.picPlaceholder]}>
              <Text style={{ fontSize: 18 }}>🔥</Text>
            </View>
            <View>
              <Text style={styles.groupName}>Friend Streaks</Text>
              <Text style={styles.memberCount}>{friendStreaks.length} friends</Text>
            </View>
          </View>
        </View>
        <FlatList
          data={friendStreaks}
          keyExtractor={(item) => item.uid}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.row, item.uid === user?.uid && styles.highlighted]}
              onPress={() => navigation.navigate('UserProfile', { uid: item.uid })}
            >
              <Text style={styles.rank}>#{index + 1}</Text>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.value}>{item.currentStreak ?? 0} {(item.currentStreak ?? 0) === 1 ? 'WEEK' : 'WEEKS'}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.groupInfo}>
          {group?.pictureUrl ? (
            <Image source={{ uri: group.pictureUrl }} style={styles.groupPic} />
          ) : (
            <View style={[styles.groupPic, styles.picPlaceholder]}>
              <Ionicons name="people" size={16} color={colors.textSecondary} />
            </View>
          )}
          <View>
            <Text style={styles.groupName}>{group?.name}</Text>
            <Text style={styles.memberCount}>{group?.memberCount} members</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowMenu(true)}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Time frame selector */}
      <View style={styles.metricRow}>
        {(['weekly', 'monthly', 'alltime'] as const).map((tf) => (
          <TouchableOpacity
            key={tf}
            style={[styles.metricBtn, timeFrame === tf && styles.metricBtnActive]}
            onPress={() => setTimeFrame(tf)}
          >
            <Text style={[styles.metricText, timeFrame === tf && styles.metricTextActive]}>
              {tf === 'alltime' ? 'ALL TIME' : tf === 'monthly' ? 'MONTH' : 'WEEK'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Metric selector */}
      <View style={styles.metricRow}>
        {metrics.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.metricBtn, metric === m.key && styles.metricBtnActive]}
            onPress={() => setMetric(m.key)}
          >
            <Text style={[styles.metricText, metric === m.key && styles.metricTextActive]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.uid}
        ListHeaderComponent={() => null}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.row, item.uid === user?.uid && styles.highlighted]}
            onPress={() => navigation.navigate('UserProfile', { uid: item.uid })}
          >
            <Text style={styles.rank}>#{index + 1}</Text>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.value}>{getValue(item)}</Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={() => (
          <View style={styles.streakSection}>
            <Text style={styles.sectionTitle}>🔥 In-Group Streak Leaderboard</Text>
            {streakSorted.map((m, i) => (
              <TouchableOpacity
                key={m.uid}
                style={[styles.row, m.uid === user?.uid && styles.highlighted]}
                onPress={() => navigation.navigate('UserProfile', { uid: m.uid })}
              >
                <Text style={styles.rank}>#{i + 1}</Text>
                <Text style={styles.username}>{m.username}</Text>
                <Text style={styles.value}>{m.currentStreak ?? 0} {(m.currentStreak ?? 0) === 1 ? 'WEEK' : 'WEEKS'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Dots menu */}
      {showMenu && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity style={styles.menuBackdrop} onPress={() => setShowMenu(false)} />
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); handleInvite(); }}>
              <Text style={styles.menuItemText}>Invite</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); handleLeave(); }}>
              <Text style={[styles.menuItemText, { color: colors.red }]}>Leave Group</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowMenu(false)}>
              <Text style={styles.menuItemText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  groupInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  groupPic: { width: 40, height: 40, borderRadius: 20 },
  picPlaceholder: { backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  groupName: { color: colors.text, fontWeight: '700', fontSize: 16 },
  memberCount: { color: colors.textSecondary, fontSize: 13 },
  metricRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  metricBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricBtnActive: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
  metricText: { color: colors.textSecondary, fontWeight: '700', fontSize: 12 },
  metricTextActive: { color: colors.primary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  highlighted: { backgroundColor: colors.primaryDim },
  rank: { color: colors.textSecondary, fontWeight: '700', width: 32, fontSize: 14 },
  username: { flex: 1, color: colors.text, fontWeight: '600', fontSize: 15 },
  value: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  streakSection: { padding: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  menuOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  menuBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  menu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: 48,
  },
  menuItem: { paddingHorizontal: spacing.md, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuItemText: { color: colors.text, fontSize: 16 },
});
