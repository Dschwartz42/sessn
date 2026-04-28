import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  FlatList, SafeAreaView, ScrollView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, query, where, orderBy, getDocs, doc, getDoc,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { UserDoc, Post } from '../../types';
import { colors, spacing, radius, typography } from '../../utils/theme';
import { followUser, unfollowUser, isFollowing } from '../../services/followService';
import ShareSheet from '../../components/ShareSheet';

const { width } = Dimensions.get('window');
const THUMB = (width - spacing.md * 2 - spacing.sm * 2) / 3;

type OwnTab = 'posts' | 'reposts' | 'saved';
type OtherTab = 'posts' | 'groups' | 'reposts';

type Props = { navigation: any; route?: any };

export default function ProfileScreen({ navigation, route }: Props) {
  const { user, userDoc: currentUserDoc } = useAuth();
  const targetUid = route?.params?.uid ?? user?.uid;
  const isOwn = targetUid === user?.uid;

  const [profileDoc, setProfileDoc] = useState<UserDoc | null>(isOwn ? currentUserDoc : null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<OwnTab | OtherTab>('posts');
  const [following, setFollowing] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (!isOwn && targetUid) {
      getDoc(doc(db, 'users', targetUid)).then((snap) => {
        if (snap.exists()) setProfileDoc({ uid: snap.id, ...snap.data() } as UserDoc);
      });
      if (user) isFollowing(user.uid, targetUid).then(setFollowing);
    } else {
      setProfileDoc(currentUserDoc);
    }
  }, [targetUid, currentUserDoc]);

  useEffect(() => {
    if (!targetUid) return;
    const loadPosts = async () => {
      let q;
      if (tab === 'posts') {
        q = query(
          collection(db, 'posts'),
          where('authorId', '==', targetUid),
          where('isRepost', '==', false),
          orderBy('createdAt', 'desc')
        );
      } else if (tab === 'reposts') {
        q = query(
          collection(db, 'posts'),
          where('authorId', '==', targetUid),
          where('isRepost', '==', true),
          orderBy('createdAt', 'desc')
        );
      } else if (tab === 'saved') {
        const savedSnap = await getDocs(collection(db, 'users', targetUid, 'savedPosts'));
        const ids = savedSnap.docs.map((d) => d.data().postId as string);
        if (ids.length === 0) { setPosts([]); return; }
        // Fetch first 20 saved posts
        const fetched: Post[] = [];
        for (const id of ids.slice(0, 20)) {
          const snap = await getDoc(doc(db, 'posts', id));
          if (snap.exists()) fetched.push({ id: snap.id, ...snap.data() } as Post);
        }
        setPosts(fetched);
        return;
      }
      if (!q) return;
      const snap = await getDocs(q);
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post)));
    };
    loadPosts();
  }, [tab, targetUid]);

  const handleFollow = async () => {
    if (!user || !targetUid) return;
    if (following) {
      await unfollowUser(user.uid, targetUid);
      setFollowing(false);
    } else {
      await followUser(user.uid, targetUid);
      setFollowing(true);
    }
  };

  const ownTabs: { key: OwnTab; label: string }[] = [
    { key: 'posts', label: 'Posts' },
    { key: 'reposts', label: 'Reposts' },
    { key: 'saved', label: 'Saved' },
  ];
  const otherTabs: { key: OtherTab; label: string }[] = [
    { key: 'posts', label: 'Posts' },
    { key: 'groups', label: 'Groups' },
    { key: 'reposts', label: 'Reposts' },
  ];
  const tabs = isOwn ? ownTabs : otherTabs;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header bar */}
        {!isOwn && (
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}
        {isOwn && (
          <View style={styles.topBar}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}

        {/* Profile info */}
        <View style={styles.profileSection}>
          {profileDoc?.profilePicUrl ? (
            <Image source={{ uri: profileDoc.profilePicUrl }} style={styles.profilePic} />
          ) : (
            <View style={[styles.profilePic, styles.picPlaceholder]}>
              <Ionicons name="person" size={36} color={colors.textSecondary} />
            </View>
          )}
          <Text style={styles.username}>@{profileDoc?.username}</Text>
          <Text style={styles.displayName}>{profileDoc?.displayName}</Text>
          {profileDoc?.bio ? <Text style={styles.bio}>{profileDoc.bio}</Text> : null}

          {!isOwn && profileDoc?.showStreakToOthers && (
            <View style={styles.streakRow}>
              <Text style={styles.streakText}>🔥 {profileDoc?.currentStreak ?? 0} week streak</Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNum}>{profileDoc?.postCount ?? 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNum}>{profileDoc?.followersCount ?? 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNum}>{profileDoc?.followingCount ?? 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            {isOwn ? (
              <>
                <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
                  <Text style={styles.editBtnText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareBtn} onPress={() => setShowShare(true)}>
                  <Ionicons name="share-outline" size={18} color={colors.text} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.editBtn, following && styles.followingBtnStyle]}
                  onPress={handleFollow}
                >
                  <Text style={styles.editBtnText}>{following ? 'Following' : 'Follow'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareBtn} onPress={() => setShowShare(true)}>
                  <Ionicons name="share-outline" size={18} color={colors.text} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabItem, tab === t.key && styles.tabItemActive]}
              onPress={() => setTab(t.key as any)}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {posts.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.thumb}
              onPress={() => navigation.navigate('ExpandedPost', { postId: p.id })}
            >
              {p.imageUrl ? (
                <Image source={{ uri: p.imageUrl }} style={styles.thumbImage} />
              ) : (
                <View style={[styles.thumbImage, styles.thumbPlaceholder]}>
                  <Ionicons name="barbell-outline" size={24} color={colors.textDim} />
                </View>
              )}
              <View style={styles.thumbOverlay}>
                <Text style={styles.thumbTitle} numberOfLines={1}>{p.title}</Text>
                <Text style={styles.thumbLikes}>❤️ {p.likeCount}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {showShare && (
        <ShareSheet
          type="profile"
          profileUid={targetUid}
          onClose={() => setShowShare(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'flex-end',
  },
  profileSection: { alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm },
  profilePic: { width: 90, height: 90, borderRadius: 45 },
  picPlaceholder: { backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  username: { color: colors.text, fontWeight: '700', fontSize: 18 },
  displayName: { color: colors.textSecondary, fontSize: 15 },
  bio: { color: colors.text, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  streakRow: { backgroundColor: colors.primaryDim, borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 6 },
  streakText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  statsRow: { flexDirection: 'row', width: '100%', paddingVertical: spacing.sm },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { color: colors.text, fontWeight: '800', fontSize: 20 },
  statLabel: { color: colors.textSecondary, fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  editBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  followingBtnStyle: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
  editBtnText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  shareBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
  },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: spacing.sm },
  thumb: { width: THUMB, height: THUMB, borderRadius: radius.sm, overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  thumbPlaceholder: { backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  thumbOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
  },
  thumbTitle: { color: colors.text, fontSize: 10, fontWeight: '600' },
  thumbLikes: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },
});
