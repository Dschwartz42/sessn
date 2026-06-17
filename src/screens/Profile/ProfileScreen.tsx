import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  FlatList, ScrollView, Dimensions, Alert} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { UserDoc, Post, Group } from '../../types';
import { getUserGroups } from '../../services/groupService';
import { colors, spacing, radius } from '../../utils/theme';
import { getSavedWorkouts } from '../../services/postService';
import { SavedWorkout } from '../../types';
import {
  followUser, unfollowUser, isFollowing,
  requestFollow, cancelFollowRequest, isPendingRequest,
} from '../../services/followService';
import { blockUser, unblockUser, isBlocked } from '../../services/blockService';
import ShareSheet from '../../components/ShareSheet';
import { unsavePost } from '../../services/postService';

function timeAgo(ts: any): string {
  if (!ts?.toDate) return '';
  const diff = Date.now() - ts.toDate().getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

const { width } = Dimensions.get('window');
const GAP = 2;
const THUMB = (width - GAP * 2) / 3;

type OwnTab = 'posts' | 'reposts' | 'saved';
type OtherTab = 'posts' | 'groups' | 'reposts';

type Props = { navigation: any; route?: any };

export default function ProfileScreen({ navigation, route }: Props) {
  const { user, userDoc: currentUserDoc } = useAuth();
  const targetUid = route?.params?.uid ?? user?.uid;
  const isOwn = targetUid === user?.uid;

  const [profileDoc, setProfileDoc] = useState<UserDoc | null>(isOwn ? currentUserDoc : null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tab, setTab] = useState<OwnTab | OtherTab>('posts');
  const [following, setFollowing] = useState(false);
  const [requestPending, setRequestPending] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);

  useEffect(() => {
    if (!isOwn && targetUid) {
      getDoc(doc(db, 'users', targetUid)).then((snap) => {
        if (snap.exists()) setProfileDoc({ uid: snap.id, ...snap.data() } as UserDoc);
      });
      if (user) {
        isFollowing(user.uid, targetUid).then(setFollowing);
        isPendingRequest(user.uid, targetUid).then(setRequestPending);
        isBlocked(user.uid, targetUid).then(setBlocked);
      }
    } else {
      setProfileDoc(currentUserDoc);
    }
  }, [targetUid, currentUserDoc]);

  // Heal follower/following counters if Firestore doc is out of sync with actual follows
  useEffect(() => {
    if (!targetUid) return;
    const syncCounts = async () => {
      try {
        const [followerSnap, followingSnap] = await Promise.all([
          getDocs(query(collection(db, 'follows'), where('followeeId', '==', targetUid))),
          getDocs(query(collection(db, 'follows'), where('followerId', '==', targetUid))),
        ]);
        const actualFollowers = followerSnap.size;
        const actualFollowing = followingSnap.size;
        const docFollowers = isOwn ? (currentUserDoc?.followersCount ?? 0) : (profileDoc?.followersCount ?? 0);
        const docFollowing = isOwn ? (currentUserDoc?.followingCount ?? 0) : (profileDoc?.followingCount ?? 0);
        if (actualFollowers !== docFollowers || actualFollowing !== docFollowing) {
          await updateDoc(doc(db, 'users', targetUid), {
            followersCount: actualFollowers,
            followingCount: actualFollowing,
          });
        }
      } catch {
        // non-critical
      }
    };
    syncCounts();
  }, [targetUid]);

  useEffect(() => {
    if (!targetUid) return;
    const loadPosts = async () => {
      try {
        if (tab === 'groups') {
          setPosts([]);
          setGroups([]);
          getUserGroups(targetUid).then(setGroups);
          return;
        }
        if (tab === 'saved') {
          if (isOwn) getSavedWorkouts(targetUid).then((w) => setSavedWorkouts(w as any)).catch(() => {});
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
        const q = query(collection(db, 'posts'), where('authorId', '==', targetUid));
        const snap = await getDocs(q);
        const all = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Post))
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        if (tab === 'reposts') setPosts(all.filter((p) => p.isRepost));
        else setPosts(all.filter((p) => !p.isRepost));
      } catch {
        setPosts([]);
      }
    };
    loadPosts();
  }, [tab, targetUid]);

  const handleFollow = async () => {
    if (!user || !targetUid) return;
    if (following) {
      await unfollowUser(user.uid, targetUid);
      setFollowing(false);
    } else if (requestPending) {
      await cancelFollowRequest(user.uid, targetUid);
      setRequestPending(false);
    } else if (profileDoc && !profileDoc.isPublic) {
      await requestFollow(user.uid, targetUid);
      setRequestPending(true);
    } else {
      await followUser(user.uid, targetUid);
      setFollowing(true);
    }
  };

  const handleUnsaveSavedPost = async (postId: string) => {
    if (!user) return;
    await unsavePost(postId, user.uid);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleBlock = async () => {
    if (!user || !targetUid) return;
    if (blocked) {
      Alert.alert('Unblock', `Unblock @${profileDoc?.username}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            await unblockUser(user.uid, targetUid);
            setBlocked(false);
          },
        },
      ]);
    } else {
      Alert.alert('Block', `Block @${profileDoc?.username}? They won't be able to see your posts or find your profile.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            await blockUser(user.uid, targetUid);
            setBlocked(true);
            if (following) { await unfollowUser(user.uid, targetUid); setFollowing(false); }
          },
        },
      ]);
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header bar */}
        {isOwn ? (
          <View style={styles.topBar}>
            <View style={{ width: 40 }} />
            <Text style={styles.logoText}>SESSN</Text>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{profileDoc?.username ?? ''}</Text>
            <TouchableOpacity style={styles.iconBtn} onPress={handleBlock}>
              <Ionicons
                name={blocked ? 'ban' : 'ellipsis-horizontal'}
                size={20}
                color={blocked ? '#FF5050' : colors.text}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Profile info */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            onPress={() => { if (tab !== 'posts') setTab('posts'); }}
            activeOpacity={tab !== 'posts' ? 0.7 : 1}
            disabled={tab === 'posts'}
          >
            {profileDoc?.profilePicUrl ? (
              <Image source={{ uri: profileDoc.profilePicUrl }} style={styles.profilePic} />
            ) : (
              <View style={[styles.profilePic, styles.picPlaceholder]}>
                <Ionicons name="person" size={38} color={colors.textDim} />
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.username}>@{profileDoc?.username}</Text>
          <Text style={styles.displayName}>{profileDoc?.displayName}</Text>
          {profileDoc?.bio ? (
            <Text style={styles.bio}>{profileDoc.bio}</Text>
          ) : null}

          {!isOwn && profileDoc?.showStreakToOthers && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {profileDoc?.currentStreak ?? 0} week streak</Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {isOwn ? (
            <>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('EditProfile')}>
                <Text style={styles.primaryBtnText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowShare(true)}>
                <Text style={styles.secondaryBtnText}>Share</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (following || requestPending) && styles.followingBtn,
                  blocked && styles.blockedBtn,
                ]}
                onPress={handleFollow}
                disabled={blocked}
              >
                <Text style={[
                  styles.primaryBtnText,
                  (following || requestPending) && styles.followingBtnText,
                ]}>
                  {blocked ? 'Blocked' : following ? 'Following' : requestPending ? 'Requested' : 'Follow'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowShare(true)}>
                <Text style={styles.secondaryBtnText}>Share</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{profileDoc?.postCount ?? 0}</Text>
            <Text style={styles.statLabel}>POSTS</Text>
          </View>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() =>
              navigation.navigate('FollowerList', {
                uid: targetUid,
                type: 'followers',
                username: profileDoc?.username ?? '',
              })
            }
          >
            <Text style={styles.statNum}>{profileDoc?.followersCount ?? 0}</Text>
            <Text style={styles.statLabel}>FOLLOWERS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() =>
              navigation.navigate('FollowerList', {
                uid: targetUid,
                type: 'following',
                username: profileDoc?.username ?? '',
              })
            }
          >
            <Text style={styles.statNum}>{profileDoc?.followingCount ?? 0}</Text>
            <Text style={styles.statLabel}>FOLLOWING</Text>
          </TouchableOpacity>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={styles.tabItem}
              onPress={() => setTab(t.key as any)}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
              {tab === t.key && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Groups list */}
        {tab === 'groups' && (
          <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 10 }}>
            {groups.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
                <Ionicons name="people-outline" size={36} color="rgba(255,255,255,0.2)" />
                <Text style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow_400Regular', fontSize: 14 }}>
                  Not in any groups yet.
                </Text>
              </View>
            ) : (
              groups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={styles.groupRow}
                  onPress={() => navigation.navigate('FullLeaderboard', { groupId: g.id })}
                >
                  {g.pictureUrl ? (
                    <Image source={{ uri: g.pictureUrl }} style={styles.groupPic} />
                  ) : (
                    <View style={[styles.groupPic, styles.groupPicPlaceholder]}>
                      <Ionicons name="people" size={16} color="rgba(255,255,255,0.4)" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupName}>{g.name}</Text>
                    <Text style={styles.groupMeta}>{g.memberCount} member{g.memberCount !== 1 ? 's' : ''}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Saved workout templates */}
        {tab === 'saved' && isOwn && savedWorkouts.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
            <Text style={styles.savedWorkoutsLabel}>SAVED WORKOUTS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {savedWorkouts.map((w) => (
                <View key={w.id} style={styles.savedWorkoutChip}>
                  <Text style={styles.savedWorkoutChipTitle} numberOfLines={1}>{w.workoutTypes?.[0] ?? 'Workout'}</Text>
                  <Text style={styles.savedWorkoutChipMeta}>{w.durationMinutes} min · {w.exercises?.length ?? 0} ex</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Saved posts list */}
        {tab === 'saved' && (
          <View style={styles.savedList}>
            {posts.length === 0 ? (
              <View style={styles.savedEmpty}>
                <Ionicons name="bookmark-outline" size={36} color="rgba(255,255,255,0.2)" />
                <Text style={styles.savedEmptyText}>No saved sessns yet.</Text>
              </View>
            ) : posts.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.savedItem}
                onPress={() => navigation.navigate('ExpandedPost', { postId: p.id })}
                activeOpacity={0.8}
              >
                {p.imageUrl ? (
                  <Image source={{ uri: p.imageUrl }} style={styles.savedThumb} />
                ) : (
                  <View style={[styles.savedThumb, styles.savedThumbPlaceholder]}>
                    <Ionicons name="barbell-outline" size={20} color="rgba(255,255,255,0.3)" />
                  </View>
                )}
                <View style={styles.savedInfo}>
                  <Text style={styles.savedTitle} numberOfLines={1}>{p.title}</Text>
                  <View style={styles.savedMeta}>
                    <Text style={styles.savedMetaText}>{p.workoutTypes?.[0] ?? p.classType ?? 'Workout'}</Text>
                    <View style={styles.savedMetaDot} />
                    <Text style={styles.savedMetaText}>{timeAgo(p.createdAt)}</Text>
                  </View>
                  <Text style={styles.savedAuthor}>@{p.authorUsername}</Text>
                </View>
                <TouchableOpacity
                  style={styles.savedBookmark}
                  onPress={() => handleUnsaveSavedPost(p.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="bookmark" size={14} color="#8B85FF" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Grid for posts/reposts */}
        {tab !== 'groups' && tab !== 'saved' && (
          <View style={styles.grid}>
            {posts.map((p, idx) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.thumb,
                  idx % 3 === 1 && { marginHorizontal: GAP },
                ]}
                onPress={() => navigation.navigate('ExpandedPost', { postId: p.id })}
              >
                {p.imageUrl ? (
                  <Image source={{ uri: p.imageUrl }} style={styles.thumbImage} />
                ) : (
                  <View style={[styles.thumbImage, styles.thumbPlaceholder]}>
                    <Ionicons name="barbell-outline" size={22} color={colors.textDim} />
                  </View>
                )}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.thumbOverlay}
                >
                  <Text style={styles.thumbTitle} numberOfLines={1}>{p.title}</Text>
                  {p.likeCount != null && (
                    <View style={styles.thumbLikes}>
                      <Ionicons name="heart" size={10} color="#fff" />
                      <Text style={styles.thumbLikeCount}>{p.likeCount}</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {showShare && (
        <ShareSheet
          type="profile"
          profileUid={targetUid}
          username={profileDoc?.username}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 42,
    color: colors.primaryLight,
    letterSpacing: 4,
  },
  headerTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    color: colors.text,
    letterSpacing: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  profilePic: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: 'rgba(99,91,255,0.25)',
    shadowColor: 'rgba(99,91,255,0.35)',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    shadowOpacity: 1,
  },
  picPlaceholder: {
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    color: colors.text,
    fontFamily: 'Barlow_700Bold',
    fontSize: 20,
    marginTop: 14,
  },
  displayName: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Barlow_500Medium',
    fontSize: 14,
  },
  bio: {
    color: 'rgba(255,255,255,0.55)',
    fontFamily: 'Barlow_400Regular',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
    paddingHorizontal: spacing.md,
  },
  streakBadge: {
    backgroundColor: colors.fireSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.fireBorder,
    marginTop: 4,
  },
  streakText: { color: colors.fire, fontFamily: 'Barlow_700Bold', fontSize: 13 },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 18,
    width: '100%',
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontFamily: 'Barlow_700Bold',
    fontSize: 13,
  },
  followingBtn: {
    backgroundColor: 'rgba(99,91,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99,91,255,0.25)',
  },
  followingBtnText: { color: colors.primaryLight },
  blockedBtn: {
    backgroundColor: 'rgba(255,80,80,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.25)',
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  secondaryBtnText: {
    color: colors.text,
    fontFamily: 'Barlow_700Bold',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    color: colors.text,
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    letterSpacing: 1,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabText: {
    fontFamily: 'Barlow_700Bold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
  },
  tabTextActive: {
    color: colors.primaryLight,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    overflow: 'hidden',
    marginBottom: GAP,
  },
  thumbImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  thumbPlaceholder: { backgroundColor: '#151515', alignItems: 'center', justifyContent: 'center' },
  thumbOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    paddingTop: 12,
  },
  thumbTitle: {
    color: '#fff',
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  thumbLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  thumbLikeCount: {
    color: '#fff',
    fontFamily: 'Barlow_400Regular',
    fontSize: 10,
  },
  savedList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 10,
  },
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
  },
  savedThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    resizeMode: 'cover',
    flexShrink: 0,
  },
  savedThumbPlaceholder: {
    backgroundColor: '#1e1e1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedInfo: { flex: 1, minWidth: 0 },
  savedTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 17,
    letterSpacing: 0.8,
    color: '#fff',
    marginBottom: 3,
  },
  savedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savedMetaText: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  savedMetaDot: {
    width: 3,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
  },
  savedAuthor: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 11,
    color: '#8B85FF',
    marginTop: 3,
  },
  savedBookmark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(99,91,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99,91,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  savedEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  savedEmptyText: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#151515',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  groupPic: { width: 44, height: 44, borderRadius: 12 },
  groupPicPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: { color: colors.text, fontFamily: 'Barlow_600SemiBold', fontSize: 14 },
  groupMeta: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow_400Regular', fontSize: 12, marginTop: 2 },
  savedWorkoutsLabel: {
    fontFamily: 'Barlow_700Bold', fontSize: 11, color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
  savedWorkoutChip: {
    backgroundColor: '#151515', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8, minWidth: 100,
  },
  savedWorkoutChipTitle: { color: '#fff', fontFamily: 'Barlow_700Bold', fontSize: 13 },
  savedWorkoutChipMeta: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow_400Regular', fontSize: 11, marginTop: 2 },
});
