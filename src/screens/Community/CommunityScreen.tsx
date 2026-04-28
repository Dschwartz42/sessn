import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Group, GroupMember, UserDoc } from '../../types';
import { colors } from '../../utils/theme';
import { getUserGroups, getGroupMembers } from '../../services/groupService';
import { getFollowingIds } from '../../services/followService';

type TimeFrame = 'weekly' | 'monthly' | 'alltime';
type Metric = 'sessns' | 'lbs' | 'hrs';
type MainTab = 'groups' | 'maps';

type Props = { navigation: any };

const GOLD = '#FFD93D';
const SILVER = '#C0C0C0';
const BRONZE = '#CD7F32';

function RankCircle({ rank }: { rank: number }) {
  const isGold = rank === 1;
  const isSilver = rank === 2;
  const isBronze = rank === 3;
  const bg = isGold ? 'rgba(255,217,61,0.15)' : isSilver ? 'rgba(192,192,192,0.15)' : isBronze ? 'rgba(205,127,50,0.15)' : 'rgba(255,255,255,0.05)';
  const color = isGold ? GOLD : isSilver ? SILVER : isBronze ? BRONZE : 'rgba(255,255,255,0.4)';
  return (
    <View style={[styles.rankCircle, { backgroundColor: bg }]}>
      <Text style={[styles.rankText, { color }]}>{rank}</Text>
    </View>
  );
}

function LeaderRow({
  rank, initials, avatarGradient, name, detail, stat, statUnit, isYou, onPress,
}: {
  rank: number; initials: string; avatarGradient: string[]; name: string;
  detail?: string; stat: string; statUnit: string; isYou?: boolean; onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.leaderRow, isYou && styles.leaderRowYou]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <RankCircle rank={rank} />
      <View style={[styles.leaderAvatar, { backgroundColor: avatarGradient[0] }]}>
        <Text style={styles.leaderAvatarText}>{initials}</Text>
      </View>
      <View style={styles.leaderInfo}>
        <Text style={[styles.leaderName, isYou && styles.leaderNameYou]}>{name}{isYou ? ' (you)' : ''}</Text>
        {detail ? <Text style={styles.leaderDetail}>{detail}</Text> : null}
      </View>
      <View style={styles.leaderStatWrap}>
        <Text style={styles.leaderStat}>{stat}</Text>
        <Text style={styles.leaderStatUnit}>{statUnit}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CommunityScreen({ navigation }: Props) {
  const { user, userDoc } = useAuth();
  const [mainTab, setMainTab] = useState<MainTab>('groups');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('monthly');
  const [groups, setGroups] = useState<Group[]>([]);
  const [friendStreaks, setFriendStreaks] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const g = await getUserGroups(user.uid);
      setGroups(g);
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

  const getInitials = (u: UserDoc) => {
    const n = u.displayName || u.username || '?';
    return n.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* SESSN Logo */}
      <View style={styles.logoRow}>
        <Text style={styles.logo}>SESSN</Text>
      </View>

      {/* Main tabs: Groups / Maps */}
      <View style={styles.mainTabs}>
        <TouchableOpacity
          style={[styles.mainTab, mainTab === 'groups' && styles.mainTabActive]}
          onPress={() => setMainTab('groups')}
        >
          <Ionicons name="people" size={16} color={mainTab === 'groups' ? '#fff' : 'rgba(255,255,255,0.4)'} />
          <Text style={[styles.mainTabText, mainTab === 'groups' && styles.mainTabTextActive]}>Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTab, mainTab === 'maps' && styles.mainTabActive]}
          onPress={() => setMainTab('maps')}
        >
          <Ionicons name="map" size={16} color={mainTab === 'maps' ? '#fff' : 'rgba(255,255,255,0.4)'} />
          <Text style={[styles.mainTabText, mainTab === 'maps' && styles.mainTabTextActive]}>Maps</Text>
        </TouchableOpacity>
      </View>

      {mainTab === 'groups' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Create / Join buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('CreateGroup')}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.createBtnText}>Create Group</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.joinBtn}
              onPress={() => navigation.navigate('JoinGroup')}
            >
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.7)" />
              <Text style={styles.joinBtnText}>Join Group</Text>
            </TouchableOpacity>
          </View>

          {/* YOUR GROUPS header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>YOUR GROUPS</Text>
          </View>

          {/* Time filter */}
          <View style={styles.timeFilter}>
            {timeFrames.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.timeTab, timeFrame === t.key && styles.timeTabActive]}
                onPress={() => setTimeFrame(t.key)}
              >
                <Text style={[styles.timeTabText, timeFrame === t.key && styles.timeTabTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Group cards */}
          {groups.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="people-outline" size={44} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptyText}>Create or join a group to compete with friends.</Text>
            </View>
          ) : (
            groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                timeFrame={timeFrame}
                currentUid={user?.uid ?? ''}
                navigation={navigation}
              />
            ))
          )}

          {/* Streak leaderboard section */}
          {friendStreaks.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>STREAK LEADERBOARD</Text>
                <Text style={styles.sectionSub}>All Friends</Text>
              </View>
              <View style={styles.groupCard}>
                {/* Group header row */}
                <View style={styles.groupCardHeader}>
                  <View style={[styles.groupIcon, { backgroundColor: 'rgba(255,140,66,0.15)' }]}>
                    <Text style={{ fontSize: 22 }}>🔥</Text>
                  </View>
                  <View style={styles.groupIconInfo}>
                    <Text style={styles.groupName}>Friend Streaks</Text>
                    <Text style={styles.groupMeta}>{friendStreaks.length} friends · Weekly streak</Text>
                  </View>
                  <View style={[styles.categoryBadge, { backgroundColor: 'rgba(255,140,66,0.1)', borderColor: 'rgba(255,140,66,0.3)' }]}>
                    <Text style={[styles.categoryText, { color: '#FF8C42' }]}>Streak</Text>
                  </View>
                </View>
                {/* Leaderboard rows */}
                {friendStreaks.slice(0, 5).map((u, i) => (
                  <LeaderRow
                    key={u.uid}
                    rank={i + 1}
                    initials={getInitials(u)}
                    avatarGradient={[colors.primary]}
                    name={u.username ?? 'user'}
                    stat={String(u.currentStreak ?? 0)}
                    statUnit="WEEKS"
                    isYou={u.uid === user?.uid}
                    onPress={() => navigation.navigate('UserProfile', { uid: u.uid })}
                  />
                ))}
                <TouchableOpacity
                  style={styles.viewAllBtn}
                  onPress={() => navigation.navigate('FullLeaderboard', { type: 'streaks' })}
                >
                  <Text style={styles.viewAllText}>VIEW FULL LEADERBOARD</Text>
                  <Ionicons name="chevron-forward" size={12} color={colors.primaryLight} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      ) : (
        /* Maps placeholder */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.mapOptIn}>
            <View style={styles.mapOptInIcon}>
              <Ionicons name="location" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mapOptInTitle}>Location sharing on</Text>
              <Text style={styles.mapOptInText}>See where your friends hit their last sessn. You can opt out anytime in settings.</Text>
            </View>
          </View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>FRIENDS NEARBY</Text>
          </View>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={48} color="rgba(255,255,255,0.15)" />
            <Text style={styles.mapPlaceholderText}>Map coming soon</Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function GroupCard({
  group, timeFrame, currentUid, navigation,
}: {
  group: Group; timeFrame: TimeFrame; currentUid: string; navigation: any;
}) {
  const [members, setMembers] = useState<GroupMember[]>([]);

  useEffect(() => {
    getGroupMembers(group.id).then((m) => {
      const sorted = [...m].sort((a, b) => {
        if (timeFrame === 'lbs') return (b.totalLbsLifted ?? 0) - (a.totalLbsLifted ?? 0);
        if (timeFrame === 'hrs') return (b.totalTimeMinutes ?? 0) - (a.totalTimeMinutes ?? 0);
        return (b.totalSessns ?? 0) - (a.totalSessns ?? 0);
      });
      setMembers(sorted);
    });
  }, [group.id, timeFrame]);

  const getStat = (m: GroupMember): [string, string] => {
    return [`${m.totalSessns ?? 0}`, 'SESSNS'];
  };

  const getInitials = (username: string) =>
    username.slice(0, 2).toUpperCase();

  return (
    <View style={styles.groupCard}>
      <View style={styles.groupCardHeader}>
        {group.pictureUrl ? (
          <Image source={{ uri: group.pictureUrl }} style={styles.groupPic} />
        ) : (
          <View style={[styles.groupIcon, { backgroundColor: 'rgba(91,140,255,0.15)' }]}>
            <Text style={{ fontSize: 22 }}>🏋️</Text>
          </View>
        )}
        <View style={styles.groupIconInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupMeta}>{group.memberCount} members</Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>Sessns</Text>
        </View>
      </View>

      {members.slice(0, 4).map((m, i) => {
        const [stat, unit] = getStat(m);
        return (
          <LeaderRow
            key={m.uid}
            rank={i + 1}
            initials={getInitials(m.username ?? 'U')}
            avatarGradient={[colors.primary]}
            name={m.username ?? 'user'}
            stat={stat}
            statUnit={unit}
            isYou={m.uid === currentUid}
            onPress={() => navigation.navigate('UserProfile', { uid: m.uid })}
          />
        );
      })}

      <TouchableOpacity
        style={styles.viewAllBtn}
        onPress={() => navigation.navigate('FullLeaderboard', { groupId: group.id })}
      >
        <Text style={styles.viewAllText}>VIEW FULL LEADERBOARD</Text>
        <Ionicons name="chevron-forward" size={12} color={colors.primaryLight} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  logoRow: { alignItems: 'center', paddingTop: 18, paddingBottom: 4 },
  logo: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 42, letterSpacing: 4,
    color: colors.primaryLight,
  },

  /* Main tabs */
  mainTabs: {
    flexDirection: 'row',
    margin: 8,
    marginHorizontal: 16,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  mainTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 10,
  },
  mainTabActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  mainTabText: { fontFamily: 'Barlow_700Bold', fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  mainTabTextActive: { color: '#fff' },

  /* Action buttons */
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  createBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 14,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  createBtnText: { fontFamily: 'Barlow_700Bold', fontSize: 13, color: '#fff' },
  joinBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  joinBtnText: { fontFamily: 'Barlow_700Bold', fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  /* Section header */
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 22, paddingBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'BebasNeue_400Regular', fontSize: 22,
    letterSpacing: 1.5, color: '#fff',
  },
  sectionSub: {
    fontFamily: 'Barlow_700Bold', fontSize: 10,
    color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1,
  },

  /* Time filter */
  timeFilter: {
    flexDirection: 'row',
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: '#151515',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12, padding: 3, gap: 3,
  },
  timeTab: {
    flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center',
  },
  timeTabActive: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1, borderColor: colors.primaryBorder,
  },
  timeTabText: {
    fontFamily: 'Barlow_600SemiBold', fontSize: 12,
    color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8,
  },
  timeTabTextActive: { color: colors.primaryLight },

  /* Group card */
  groupCard: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: '#151515',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18, overflow: 'hidden',
  },
  groupCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  groupIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  groupPic: { width: 44, height: 44, borderRadius: 12 },
  groupIconInfo: { flex: 1 },
  groupName: { fontFamily: 'Barlow_700Bold', fontSize: 15, color: '#fff' },
  groupMeta: { fontFamily: 'Barlow_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  categoryBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryBorder,
  },
  categoryText: {
    fontFamily: 'Barlow_700Bold', fontSize: 10,
    textTransform: 'uppercase', letterSpacing: 0.8, color: colors.primaryLight,
  },

  /* Leaderboard rows */
  leaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 16,
  },
  leaderRowYou: {
    backgroundColor: colors.primarySoft,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.primaryBorder,
  },
  rankCircle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  rankText: {
    fontFamily: 'BebasNeue_400Regular', fontSize: 14,
  },
  leaderAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.06)',
  },
  leaderAvatarText: { fontFamily: 'Barlow_700Bold', fontSize: 13, color: '#fff' },
  leaderInfo: { flex: 1, minWidth: 0 },
  leaderName: { fontFamily: 'Barlow_600SemiBold', fontSize: 14, color: '#fff' },
  leaderNameYou: { color: colors.primaryLight },
  leaderDetail: { fontFamily: 'Barlow_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 },
  leaderStatWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  leaderStat: {
    fontFamily: 'BebasNeue_400Regular', fontSize: 18,
    letterSpacing: 0.5, color: 'rgba(255,255,255,0.85)',
  },
  leaderStatUnit: {
    fontFamily: 'Barlow_600SemiBold', fontSize: 11,
    color: 'rgba(255,255,255,0.4)', marginLeft: 2,
  },

  /* View all button */
  viewAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    margin: 6, marginHorizontal: 12, marginBottom: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
  },
  viewAllText: {
    fontFamily: 'Barlow_700Bold', fontSize: 12,
    color: colors.primaryLight, textTransform: 'uppercase', letterSpacing: 1,
  },

  /* Empty state */
  emptyWrap: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, color: '#fff', letterSpacing: 1 },
  emptyText: { fontFamily: 'Barlow_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingHorizontal: 32 },

  /* Maps */
  mapOptIn: {
    margin: 16, marginTop: 12,
    backgroundColor: colors.primarySoft,
    borderWidth: 1, borderColor: colors.primaryBorder,
    borderRadius: 14, padding: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  mapOptInIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  mapOptInTitle: { fontFamily: 'Barlow_700Bold', fontSize: 12, color: colors.primaryLight, marginBottom: 2 },
  mapOptInText: { fontFamily: 'Barlow_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 16 },
  mapPlaceholder: {
    marginHorizontal: 16,
    height: 300,
    backgroundColor: '#151515',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  mapPlaceholderText: { fontFamily: 'Barlow_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.25)' },
});
