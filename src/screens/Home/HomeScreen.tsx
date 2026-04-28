import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, query, where, orderBy, limit,
  getDocs, startAfter, DocumentSnapshot, doc, getDoc,
} from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Post } from '../../types';
import { colors, spacing, typography, radius } from '../../utils/theme';
import { HomeStackParamList } from '../../navigation/types';
import PostCard from '../../components/PostCard';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Home'>;
};

const PAGE_SIZE = 10;

export default function HomeScreen({ navigation }: Props) {
  const { user, userDoc } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const lastDoc = useRef<DocumentSnapshot | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  // Load who the user follows
  useEffect(() => {
    if (!user) return;
    const loadFollowing = async () => {
      const snap = await getDocs(
        query(collection(db, 'follows'), where('followerId', '==', user.uid))
      );
      const ids = snap.docs.map((d) => d.data().followeeId as string);
      setFollowingIds(ids);
    };
    loadFollowing();
  }, [user]);

  const loadPosts = useCallback(async (refresh = false) => {
    if (!user) return;
    const ids = refresh ? followingIds : followingIds;
    if (ids.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    // Firestore 'in' supports up to 30 items; chunk if needed
    const chunk = ids.slice(0, 30);
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

    if (refresh) {
      setPosts(fetched);
    } else {
      setPosts((prev) => [...prev, ...fetched]);
    }
    setLoading(false);
  }, [user, followingIds]);

  useEffect(() => {
    if (followingIds.length > 0 || !loading) loadPosts(true);
  }, [followingIds]);

  const onRefresh = async () => {
    setRefreshing(true);
    lastDoc.current = null;
    await loadPosts(true);
    setRefreshing(false);
  };

  const streakBubbles = Array.from({ length: 7 }, (_, i) => {
    const today = new Date();
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - i));
    return { day, filled: false }; // Will be computed from real data in streakService
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { uid: user?.uid ?? '' })}>
          {userDoc?.profilePicUrl ? (
            <Image source={{ uri: userDoc.profilePicUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={18} color={colors.textSecondary} />
            </View>
          )}
        </TouchableOpacity>

        {/* Streak strip */}
        <TouchableOpacity style={styles.streakStrip} onPress={() => navigation.navigate('Streak')}>
          <Text style={styles.fireEmoji}>🔥</Text>
          <Text style={styles.streakCount}>{userDoc?.currentStreak ?? 0}</Text>
          <View style={styles.bubbles}>
            {streakBubbles.map((b, i) => (
              <View key={i} style={[styles.bubble, b.filled && styles.bubbleFilled]} />
            ))}
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <View>
            <Ionicons name="notifications-outline" size={26} color={colors.text} />
            {hasUnread && <View style={styles.notifDot} />}
          </View>
        </TouchableOpacity>
      </View>

      {/* Feed */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Follow athletes to see their Sessns here.</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
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
          contentContainerStyle={{ paddingBottom: 100 }}
        />
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakStrip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  fireEmoji: { fontSize: 20 },
  streakCount: { color: colors.text, fontWeight: '700', fontSize: 16 },
  bubbles: { flexDirection: 'row', gap: 4, marginLeft: spacing.xs },
  bubble: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleFilled: { backgroundColor: colors.fire, borderColor: colors.fire },
  notifDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...typography.bodySecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
});
