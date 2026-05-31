import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Post } from '../types';
import { colors } from '../utils/theme';
import { likePost, unlikePost, isLiked, savePost, unsavePost, isSaved, repostPost, deletePost } from '../services/postService';
import { followUser, unfollowUser, isFollowing, requestFollow, isPendingRequest, cancelFollowRequest } from '../services/followService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import ShareSheet from './ShareSheet';
import WorkoutDetailsPanel from './WorkoutDetailsPanel';

const { width } = Dimensions.get('window');

interface Props {
  post: Post;
  onPress: () => void;
  onUserPress: () => void;
  onDelete?: () => void;
}

export default function PostCard({ post, onPress, onUserPress, onDelete }: Props) {
  const { user, userDoc } = useAuth();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [requestPending, setRequestPending] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [repostCount, setRepostCount] = useState(post.repostCount ?? 0);
  const [showDetails, setShowDetails] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const isOwn = post.authorId === user?.uid;

  useEffect(() => {
    if (!user) return;
    isLiked(post.id, user.uid).then(setLiked);
    isSaved(post.id, user.uid).then(setSaved);
    if (!isOwn) {
      isFollowing(user.uid, post.authorId).then(setFollowing);
      isPendingRequest(user.uid, post.authorId).then(setRequestPending);
    }
  }, [post.id, user?.uid]);

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
      { text: 'Repost', onPress: async () => { await repostPost(post, user.uid, userDoc.username, userDoc.profilePicUrl); setRepostCount((c) => c + 1); } },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Sessn', 'This will permanently remove this post.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePost(post.id, post.authorId, post.durationMinutes, post.exercises);
          onDelete?.();
        },
      },
    ]);
  };

  const handleReport = () => {
    Alert.alert('Report Post', 'Why are you reporting this post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Spam', onPress: () => Alert.alert('Reported', 'Thank you. We\'ll review this post.') },
      { text: 'Inappropriate Content', onPress: () => Alert.alert('Reported', 'Thank you. We\'ll review this post.') },
      { text: 'Harassment', onPress: () => Alert.alert('Reported', 'Thank you. We\'ll review this post.') },
    ]);
  };

  const handleFollow = async () => {
    if (!user) return;
    if (following) {
      await unfollowUser(user.uid, post.authorId);
      setFollowing(false);
    } else if (requestPending) {
      await cancelFollowRequest(user.uid, post.authorId);
      setRequestPending(false);
    } else {
      const authorSnap = await getDoc(doc(db, 'users', post.authorId));
      const isPublic = authorSnap.data()?.isPublic !== false;
      if (isPublic) {
        await followUser(user.uid, post.authorId);
        setFollowing(true);
      } else {
        await requestFollow(user.uid, post.authorId);
        setRequestPending(true);
      }
    }
  };

  const splitLabel = post.type === 'class'
    ? post.classType
    : (post.split ?? post.workoutTypes?.[0] ?? 'Workout');
  const splitLabelKey = post.type === 'class' ? 'Class Type' : 'Split';

  const dateStr = post.createdAt?.toDate
    ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })
    : '';

  return (
    <View style={styles.card}>
      {/* Repost header */}
      {post.isRepost && post.originalAuthorUsername && (
        <View style={styles.repostHeader}>
          <Ionicons name="repeat" size={13} color="rgba(255,255,255,0.4)" />
          <Text style={styles.repostText}>Originally by @{post.originalAuthorUsername}</Text>
        </View>
      )}

      {/* Image with gradient overlay */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.97} style={styles.imageContainer}>
        {post.imageUrl ? (
          <Image source={{ uri: post.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="barbell-outline" size={48} color={colors.textDim} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.85)']}
          locations={[0, 0.35, 0.7, 1]}
          style={styles.imageGradient}
        />
        <View style={styles.imageOverlayContent}>
          {post.location?.name ? (
            <View style={styles.locationPill}>
              <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.75)" />
              <Text style={styles.locationText}>{post.location.name}</Text>
            </View>
          ) : null}
          <Text style={styles.workoutTitle}>{post.title?.toUpperCase()}</Text>
        </View>
      </TouchableOpacity>

      {/* Username + date row */}
      <View style={styles.usernameRow}>
        <TouchableOpacity onPress={onUserPress} style={styles.usernameLeft}>
          <Text style={styles.username}>{post.authorUsername}</Text>
          {!isOwn && (
            <TouchableOpacity
              style={[styles.followBtn, (following || requestPending) && styles.followingBtn]}
              onPress={handleFollow}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text style={[styles.followBtnText, (following || requestPending) && styles.followingBtnText]}>
                {following ? 'Following' : requestPending ? 'Requested' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        <View style={styles.dateRight}>
          <Text style={styles.dateText}>{dateStr}</Text>
          <TouchableOpacity
            onPress={isOwn ? handleDelete : handleReport}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color="rgba(255,255,255,0.35)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {splitLabel ? (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{splitLabelKey}</Text>
            <Text style={styles.statValue}>{String(splitLabel).toUpperCase()}</Text>
          </View>
        ) : null}
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Time</Text>
          <Text style={styles.statValue}>{post.durationMinutes} MIN</Text>
        </View>
        {post.exercises && post.exercises.length > 0 ? (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Exercises</Text>
            <Text style={styles.statValue}>{post.exercises.length}</Text>
          </View>
        ) : null}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} onPress={handleLike}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={20}
            color={liked ? '#FF4D6A' : 'rgba(255,255,255,0.45)'}
          />
          {likeCount > 0 && (
            <Text style={[styles.actionCount, liked && styles.actionCountLiked]}>{likeCount}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={handleRepost}>
          <Ionicons name="repeat" size={20} color="rgba(255,255,255,0.45)" />
          {repostCount > 0 && <Text style={styles.actionCount}>{repostCount}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={() => setShowShare(true)}>
          <Ionicons name="send-outline" size={19} color="rgba(255,255,255,0.45)" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.action, styles.saveAction]} onPress={handleSave}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={saved ? colors.primaryLight : 'rgba(255,255,255,0.45)'}
          />
        </TouchableOpacity>
      </View>

      {/* Caption */}
      {post.caption ? (
        <Text style={styles.caption} numberOfLines={2}>{post.caption}</Text>
      ) : null}

      {/* Tap for details */}
      <TouchableOpacity style={styles.tapHint} onPress={() => setShowDetails(true)}>
        <Text style={styles.tapHintText}>Tap to see workout details ›</Text>
      </TouchableOpacity>

      {showDetails && (
        <WorkoutDetailsPanel post={post} saved={saved} onSave={handleSave} onClose={() => setShowDetails(false)} />
      )}
      {showShare && (
        <ShareSheet type="post" postId={post.id} imageUrl={post.imageUrl} title={post.title} username={post.authorUsername} onClose={() => setShowShare(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },

  // Repost header
  repostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  repostText: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },

  // Image
  imageContainer: { position: 'relative', height: 300, width: '100%' },
  image: { position: 'absolute', width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: {
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '75%',
  },
  imageOverlayContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  locationText: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Barlow_500Medium',
    fontSize: 11,
  },
  workoutTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 26,
    letterSpacing: 1.5,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  // Username row
  usernameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 0,
  },
  usernameLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  username: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  followBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(99,91,255,0.35)',
  },
  followBtnText: {
    fontFamily: 'Barlow_700Bold',
    fontSize: 11,
    color: '#fff',
  },
  followingBtnText: {
    color: colors.primaryLight,
  },
  dateRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    fontFamily: 'Barlow_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 24,
  },
  statItem: {},
  statLabel: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 9,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  statValue: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    color: '#fff',
    letterSpacing: 0.5,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 20,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionCount: {
    fontFamily: 'Barlow_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },
  actionCountLiked: { color: '#FF4D6A' },
  saveAction: { marginLeft: 'auto' },

  // Caption
  caption: {
    paddingHorizontal: 16,
    paddingTop: 10,
    fontFamily: 'Barlow_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 19,
  },

  // Tap hint
  tapHint: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tapHintText: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 12,
    color: colors.primaryLight,
  },
});
