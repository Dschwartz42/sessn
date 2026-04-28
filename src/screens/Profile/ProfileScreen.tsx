import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  FlatList, SafeAreaView, ScrollView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, query, where, getDocs, doc, getDoc,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { UserDoc, Post } from '../../types';
import { colors, spacing, radius } from '../../utils/theme';
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
      if (tab === 'posts' || tab === 'reposts') {
        q = query(collection(db, 'posts'), where('authorId', '==', targetUid));
      } else if (tab === 'saved') {
        const savedSnap = await getDocs(collection(db, 'users', targetUid, 'savedPosts'));
        const ids = savedSnap.docs.map((d) => d.data().postId as string);
        if (ids.length === 0) { setPosts([]); return; }
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
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Post))
        .sort((a, b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.());
      if (tab === 'posts') setPosts(all.filter((p) => !p.isRepost));
      else if (tab === 'reposts') setPosts(all.filter((p) => p.isRepost));
      else setPosts(all);
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
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}
        {isOwn && (
          <View style={styles.topBar}>
            <Text style={styles.logoText}>SESSN</Text>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}

        {/* Profile info */}
        <View style={styles.profileSection}>
          {profileDoc?.profilePicUrl ? (
            <Image source={{ uri: profileDoc.profilePicUrl }} style={styles.profilePic} />
          ) : (
            <View style={[styles.profilePic, styles.picPlaceholder]}>
              <Ionicons name="person" size={38} color={colors.textDim} />
            </View>
          )}

          <Text style={styles.username}>@{profileDoc?.username}</Text>
          <Text style={styles.displayName}>{profileDoc?.displayName}</Text>
          {profileDoc?.bio ? <Text style={styles.bio}>{profileDoc.bio}</Text> : null}

          {!isOwn && profileDoc?.showStreakToOthers && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {profileDoc?.currentStreak ?? 0} week streak</Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{profileDoc?.postCount ?? 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{profileDoc?.followersCount ?? 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{profileDoc?.followingCount ?? 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {/* Action buttons */}
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
                  style={[styles.followBtn, following && styles.followingBtn]}
                  onPress={handleFollow}
                >
                  <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
                    {following ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareBtn} onPress={() => setShowShare(true)}>
                  <Ionicons name="share-outline" size={18} color={colors.text} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Tab bar */}
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
                  <Ionicons name="barbell-outline" size={22} color={colors.textDim} />
                </View>
              )}
              <View style={styles.thumbOverlay}>
                <Text style={styles.thumbTitle} numberOfLines={1}>{p.title}</Text>
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
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    color: colors.text,
    letterSpacing: 4,
  },
  profileSection: { alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.md },
  profilePic: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: colors.border },
  picPlaceholder: {
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    color: colors.text,
    fontFamily: 'Barlow_700Bold',
    fontSize: 18,
    marginTop: 4,
  },
  displayName: {
    color: colors.textSecondary,
    fontFamily: 'Barlow_400Regular',
    fontSize: 15,
  },
  bio: {
    color: colors.text,
    fontFamily: 'Barlow_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  streakBadge: {
    backgroundColor: colors.fireSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.fireBorder,
  },
  streakText: { color: colors.fire, fontFamily: 'Barlow_700Bold', fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    width: '100%',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  statItem: { alignItems: 'center' },
  statNum: {
    color: colors.text,
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
    letterSpacing: 1,
  },
  statLabel: {
    color: colors.textSecondary,
    fontFamily: 'Barlow_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  editBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  editBtnText: { color: colors.text, fontFamily: 'Barlow_600SemiBold', fontSize: 14 },
  followBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 11,
    alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  followBtnText: { color: '#fff', fontFamily: 'Barlow_600SemiBold', fontSize: 14 },
  followingBtnText: { color: colors.primaryLight },
  shareBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: spacing.sm,
  },
  tabItem: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: {
    color: colors.textSecondary,
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabTextActive: { color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: spacing.sm },
  thumb: { width: THUMB, height: THUMB, borderRadius: radius.xs, overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  thumbPlaceholder: { backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  thumbOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 5,
  },
  thumbTitle: { color: '#fff', fontFamily: 'Barlow_600SemiBold', fontSize: 10 },
});
