import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, query, where, orderBy, limit,
  getDocs, startAfter, DocumentSnapshot,
} from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Post } from '../../types';
import { colors, spacing, radius } from '../../utils/theme';
import { HomeStackParamList } from '../../navigation/types';
import PostCard from '../../components/PostCard';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Home'>;
};

const PAGE_SIZE = 10;
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function HomeScreen({ navigation }: Props) {
  const { user, userDoc } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const lastDoc = useRef<DocumentSnapshot | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadFollowing = async () => {
      const snap = await getDocs(
        query(collection(db, 'follows'), where('followerId', '==', user.uid))
      );
      const ids = snap.docs.map((d) => d.data().followeeId as string);
      setFollowingIds(ids);
      if (ids.length === 0) { setPosts([]); setLoading(false); }
    };
    loadFollowing();
  }, [user]);

  const loadPosts = useCallback(async (refresh = false) => {
    if (!user || followingIds.length === 0) return;
    const chunk = followingIds.slice(0, 30);
    let q = query(
      collection(db, 'posts'),
      where('authorId', 'in', chunk),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );
    if (!refresh && lastDoc.current) {
      q = query(
        collection(db, 'posts'),
        where('authorId', 'in', chunk),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc.current),
        limit(PAGE_SIZE)
      );
    }
    const snap = await getDocs(q);
    const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
    lastDoc.current = snap.docs[snap.docs.length - 1] ?? null;
    if (refresh) setPosts(fetched);
    else setPosts((prev) => [...prev, ...fetched]);
    setLoading(false);
  }, [user, followingIds]);

  useEffect(() => {
    if (followingIds.length > 0) loadPosts(true);
  }, [followingIds]);

  const onRefresh = async () => {
    setRefreshing(true);
    lastDoc.current = null;
    await loadPosts(true);
    setRefreshing(false);
  };

  // current day of week Mon=0 … Sun=6
  const todayIdx = (new Date().getDay() + 6) % 7;
  const streak = userDoc?.currentStreak ?? 0;

  const header = (
    <>
      {/* SESSN logo */}
      <View style={styles.logoRow}>
        <Text style={styles.logo}>SESSN</Text>
      </View>

      {/* Greeting + notif */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.topHeaderLeft}
          onPress={() => navigation.navigate('UserProfile', { uid: user?.uid ?? '' })}
        >
          {userDoc?.profilePicUrl ? (
            <Image source={{ uri: userDoc.profilePicUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {userDoc?.displayName?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <Text style={styles.greeting}>{userDoc?.displayName ?? 'Athlete'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.7)" />
          {hasUnread && <View style={styles.notifDot} />}
        </TouchableOpacity>
      </View>

      {/* Streak Banner */}
      <TouchableOpacity style={styles.streakBanner} onPress={() => navigation.navigate('Streak')} activeOpacity={0.8}>
        <View style={styles.streakLeft}>
          <Text style={styles.streakFire}>🔥</Text>
          <View>
            <Text style={styles.streakNum}>{streak} WEEK STREAK</Text>
            <Text style={styles.streakSub}>Keep it going!</Text>
          </View>
        </View>
        <View style={styles.streakDots}>
          {DAY_LABELS.map((label, i) => {
            const isPast = i < todayIdx;
            const isToday = i === todayIdx;
            return (
              <View
                key={i}
                style={[
                  styles.streakDot,
                  isPast && styles.streakDotDone,
                  isToday && styles.streakDotToday,
                  !isPast && !isToday && styles.streakDotUpcoming,
                ]}
              >
                <Text style={[
                  styles.streakDotLabel,
                  isPast && styles.streakDotLabelDone,
                  isToday && styles.streakDotLabelToday,
                ]}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </TouchableOpacity>

      {/* Feed header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>YOUR FEED</Text>
      </View>
    </>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {header}
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {header}
        <View style={styles.center}>
          <Ionicons name="barbell-outline" size={40} color={colors.textDim} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>Your feed is empty</Text>
          <Text style={styles.emptyText}>Follow athletes to see their Sessns here.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => navigation.navigate('ExpandedPost', { postId: item.id })}
            onUserPress={() => navigation.navigate('UserProfile', { uid: item.authorId })}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        onEndReached={() => loadPosts(false)}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  logoRow: { alignItems: 'center', paddingTop: 18, paddingBottom: 0 },
  logo: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 42,
    letterSpacing: 4,
    color: colors.primaryLight,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  topHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: colors.primaryBorder },
  avatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.primaryBorder,
  },
  avatarInitial: { color: '#fff', fontFamily: 'Barlow_700Bold', fontSize: 16 },
  greeting: { color: '#fff', fontFamily: 'Barlow_700Bold', fontSize: 18 },
  headerIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#FF4D6A',
    borderWidth: 2, borderColor: colors.background,
  },
  streakBanner: {
    margin: 8,
    marginHorizontal: 16,
    backgroundColor: 'rgba(99,91,255,0.1)',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 16,
    padding: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakFire: { fontSize: 28 },
  streakNum: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    color: '#fff',
    letterSpacing: 1,
  },
  streakSub: { fontFamily: 'Barlow_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  streakDots: { flexDirection: 'row', gap: 5 },
  streakDot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  streakDotDone: { backgroundColor: colors.primary },
  streakDotToday: {
    backgroundColor: 'transparent',
    borderWidth: 2, borderColor: colors.primary,
  },
  streakDotUpcoming: { backgroundColor: 'rgba(255,255,255,0.06)' },
  streakDotLabel: {
    fontFamily: 'Barlow_700Bold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
  },
  streakDotLabelDone: { color: '#fff' },
  streakDotLabelToday: { color: colors.primaryLight },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 26,
    letterSpacing: 2,
    color: '#fff',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  emptyTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 24, color: colors.text, letterSpacing: 1, marginBottom: 6 },
  emptyText: { fontFamily: 'Barlow_400Regular', fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
