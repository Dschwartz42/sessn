import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  Dimensions, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getPost, likePost, unlikePost, isLiked, savePost, unsavePost, isSaved, repostPost, deletePost } from '../../services/postService';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../utils/theme';
import WorkoutDetailsPanel from '../../components/WorkoutDetailsPanel';
import ShareSheet from '../../components/ShareSheet';

const { width, height } = Dimensions.get('window');

type Props = { navigation: any; route: any };

export default function ExpandedPostScreen({ navigation, route }: Props) {
  const { postId } = route.params;
  const { user, userDoc } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [postError, setPostError] = useState(false);

  useEffect(() => {
    getPost(postId).then((p) => {
      if (!p) setPostError(true);
      else setPost(p);
    });
  }, [postId]);

  useEffect(() => {
    if (!post || !user) return;
    setLikeCount(post.likeCount);
    isLiked(post.id, user.uid).then(setLiked);
    isSaved(post.id, user.uid).then(setSaved);
  }, [post?.id, user?.uid]);

  if (postError) {
    return (
      <View style={styles.loading}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.textDim} />
        <Text style={{ color: colors.textDim, fontFamily: 'Barlow_400Regular', marginTop: 12 }}>
          This post is no longer available.
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primaryLight, fontFamily: 'Barlow_600SemiBold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const isOwn = post.authorId === user?.uid;

  const handleLike = async () => {
    if (!user) return;
    if (liked) { await unlikePost(post.id, user.uid); setLiked(false); setLikeCount((c) => c - 1); }
    else { await likePost(post.id, user.uid); setLiked(true); setLikeCount((c) => c + 1); }
  };

  const handleSave = async () => {
    if (!user) return;
    if (saved) { await unsavePost(post.id, user.uid); setSaved(false); }
    else { await savePost(post.id, user.uid); setSaved(true); }
  };

  const handleRepost = async () => {
    if (!user || !userDoc) return;
    if (!isOwn) {
      const authorSnap = await getDoc(doc(db, 'users', post.authorId));
      if (authorSnap.exists() && authorSnap.data().allowReposts === false) {
        Alert.alert('Reposts disabled', `@${post.authorUsername} has turned off reposts.`);
        return;
      }
    }
    Alert.alert('Repost', 'Share this Sessn to your profile?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Repost',
        onPress: async () => {
          try {
            await repostPost(post, user.uid, userDoc.username, userDoc.profilePicUrl);
          } catch {
            Alert.alert('Error', 'Could not repost. Try again.');
          }
        },
      },
    ]);
  };

  const handleOwnPostMenu = () => {
    Alert.alert(post.title, undefined, [
      { text: 'Edit', onPress: () => navigation.navigate('EditPost', { postId: post.id }) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete Sessn', 'This will permanently remove this post.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deletePost(post.id, post.authorId, post.durationMinutes, post.exercises, post.isRepost, post.originalPostId);
                  navigation.goBack();
                } catch {
                  Alert.alert('Error', 'Could not delete post. Try again.');
                }
              },
            },
          ]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleLocation = () => {
    if (!post.location) return;
    Alert.alert('Open in Maps', 'Choose an app', [
      { text: 'Apple Maps', onPress: () => Linking.openURL(`maps:?q=${post.location!.lat},${post.location!.lng}`) },
      { text: 'Google Maps', onPress: () => Linking.openURL(`https://maps.google.com/?q=${post.location!.lat},${post.location!.lng}`) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const splitTag = post.type === 'class'
    ? post.classType ?? ''
    : post.split ?? post.workoutTypes?.join(' · ') ?? '';

  const splitLabel = post.type === 'class' ? 'CLASS TYPE' : 'SPLIT';

  const dateStr = post.createdAt?.toDate
    ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })
    : '';

  const initials = post.authorUsername?.[0]?.toUpperCase() ?? '?';
  const avatarColors: [string, string] = isOwn
    ? ['#635BFF', '#8B85FF']
    : ['#FF6B9D', '#C44DFF'];

  return (
    <View style={styles.container}>
      {/* Background */}
      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.bgPlaceholder]} />
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.78)']}
        locations={[0, 0.2, 0.45, 0.65, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* 2a — Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.topBarRight}>
            {isOwn && (
              <TouchableOpacity onPress={handleOwnPostMenu} style={styles.ellipsisBtn}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            <Text style={styles.logo}>SESSN</Text>
          </View>
        </View>

        {/* 2b — User row */}
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => navigation.navigate('UserProfile', { uid: post.authorId })}
          activeOpacity={0.8}
        >
          {post.authorPicUrl ? (
            <Image source={{ uri: post.authorPicUrl }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={avatarColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </LinearGradient>
          )}
          <View>
            <Text style={styles.authorName}>@{post.authorUsername}</Text>
            <Text style={styles.authorDate}>{dateStr}</Text>
          </View>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        {/* 2c — Bottom content */}
        <View style={styles.bottomContent}>
          {/* Title / stats two-column row */}
          <View style={styles.titleStatsRow}>
            <View style={styles.titleColumn}>
              {post.location?.name ? (
                <TouchableOpacity style={styles.locationPill} onPress={handleLocation}>
                  <Ionicons name="location" size={11} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.locationText}>{post.location.name}</Text>
                </TouchableOpacity>
              ) : null}
              <Text style={styles.title}>{post.title?.toUpperCase()}</Text>
            </View>
            <View style={styles.statsColumn}>
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>{splitLabel}</Text>
                <Text style={styles.statValue}>{String(splitTag).toUpperCase()}</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>TIME</Text>
                <Text style={styles.statValueNum}>
                  {post.durationMinutes}
                  <Text style={styles.statValueUnit}> MIN</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* 2d — Actions bar */}
          <View style={styles.actionsBar}>
            <TouchableOpacity style={styles.actionItem} onPress={handleLike}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={22}
                color={liked ? '#FF4D6A' : 'rgba(255,255,255,0.6)'}
              />
              <Text style={[styles.actionCount, liked && { color: '#FF4D6A' }]}>{likeCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={handleRepost}>
              <Ionicons name="repeat" size={22} color="rgba(255,255,255,0.6)" />
              {(post.repostCount ?? 0) > 0 && (
                <Text style={styles.actionCount}>{post.repostCount}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => setShowShare(true)}>
              <Ionicons name="send-outline" size={22} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            <TouchableOpacity
              style={[styles.saveBtn, saved && styles.saveBtnSaved]}
              onPress={handleSave}
            >
              <Ionicons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={14}
                color={saved ? colors.primaryLight : '#fff'}
              />
              <Text style={[styles.saveBtnText, saved && styles.saveBtnTextSaved]}>
                {saved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 2e — View workout details */}
          <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => setShowDetails(true)}>
            <Text style={styles.viewDetailsBtnText}>
              View {post.type === 'class' ? 'class' : 'workout'} details ▲
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {showDetails && (
        <WorkoutDetailsPanel post={post} saved={saved} onSave={handleSave} onClose={() => setShowDetails(false)} />
      )}
      {showShare && (
        <ShareSheet
          type="post"
          postId={post.id}
          imageUrl={post.imageUrl}
          title={post.title}
          username={post.authorUsername}
          onClose={() => setShowShare(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  bgPlaceholder: { backgroundColor: colors.surfaceElevated },

  safeArea: { flex: 1 },

  // 2a Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ellipsisBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  logo: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 32,
    letterSpacing: 4,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },

  // 2b User row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitials: {
    fontFamily: 'Barlow_700Bold',
    fontSize: 11,
    color: '#fff',
  },
  authorName: {
    fontFamily: 'Barlow_700Bold',
    fontSize: 12,
    color: '#fff',
  },
  authorDate: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
  },

  // 2c Bottom content
  bottomContent: {
    paddingHorizontal: 28,
    paddingBottom: 36,
  },
  titleStatsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  titleColumn: {
    flex: 1,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  locationText: {
    fontFamily: 'Barlow_500Medium',
    fontSize: 11,
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.85)',
  },
  title: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 30,
    letterSpacing: 1.5,
    lineHeight: 29,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 20,
    marginBottom: 8,
  },
  statsColumn: {
    flexShrink: 0,
    alignItems: 'flex-end',
    gap: 8,
  },
  statBlock: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 2,
  },
  statValue: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    color: '#fff',
    textAlign: 'right',
  },
  statValueNum: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 26,
    color: '#fff',
    textAlign: 'right',
  },
  statValueUnit: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },

  // 2d Actions bar
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginTop: 24,
    paddingTop: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#635BFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#635BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  saveBtnSaved: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(99,91,255,0.25)',
  },
  saveBtnText: {
    fontFamily: 'Barlow_700Bold',
    fontSize: 12,
    color: '#fff',
  },
  saveBtnTextSaved: {
    color: '#8B85FF',
  },

  // 2e View details button
  viewDetailsBtn: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  viewDetailsBtnText: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 12,
    color: '#8B85FF',
  },
});
