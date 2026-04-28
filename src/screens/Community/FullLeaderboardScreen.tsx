import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, SafeAreaView, ActivityIndicator, Alert, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Group, GroupMember } from '../../types';
import { colors, spacing, radius, typography } from '../../utils/theme';
import { getGroupMembers, leaveGroup } from '../../services/groupService';

type Metric = 'sessns' | 'lbs' | 'hrs';
type Props = { navigation: any; route: any };

export default function FullLeaderboardScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [metric, setMetric] = useState<Metric>('sessns');
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, 'groups', groupId));
      if (snap.exists()) setGroup({ id: snap.id, ...snap.data() } as Group);
      const m = await getGroupMembers(groupId);
      setMembers(m);
      setLoading(false);
    };
    load();
  }, [groupId]);

  const sorted = [...members].sort((a, b) => {
    if (metric === 'sessns') return (b.totalSessns ?? 0) - (a.totalSessns ?? 0);
    if (metric === 'lbs') return (b.totalLbsLifted ?? 0) - (a.totalLbsLifted ?? 0);
    return (b.totalTimeMinutes ?? 0) - (a.totalTimeMinutes ?? 0);
  });

  const streakSorted = [...members].sort((a, b) => (b.currentStreak ?? 0) - (a.currentStreak ?? 0));

  const getValue = (m: GroupMember) => {
    if (metric === 'sessns') return `${m.totalSessns ?? 0} SESSNS`;
    if (metric === 'lbs') return `${m.totalLbsLifted ?? 0} LBS`;
    return `${Math.round((m.totalTimeMinutes ?? 0) / 60)} HRS`;
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
                <Text style={styles.value}>{m.currentStreak ?? 0} WEEKS</Text>
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
