import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  Dimensions, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Post } from '../types';
import { colors, spacing, radius, typography } from '../utils/theme';
import { likePost, unlikePost, isLiked, savePost, unsavePost, isSaved, repostPost } from '../services/postService';
import ShareSheet from './ShareSheet';
import WorkoutDetailsPanel from './WorkoutDetailsPanel';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = width * 0.6;

interface Props {
  post: Post;
  onPress: () => void;
  onUserPress: () => void;
}

export default function PostCard({ post, onPress, onUserPress }: Props) {
  const { user, userDoc } = useAuth();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showDetails, setShowDetails] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (!user) return;
    isLiked(post.id, user.uid).then(setLiked);
    isSaved(post.id, user.uid).then(setSaved);
  }, [post.id, user?.uid]);

  const handleLike = async () => {
    if (!user) return;
    if (liked) {
      await unlikePost(post.id, user.uid);
      setLiked(false);
      setLikeCount((c) => c - 1);
    } else {
      await likePost(post.id, user.uid);
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (saved) {
      await unsavePost(post.id, user.uid);
      setSaved(false);
    } else {
      await savePost(post.id, user.uid);
      setSaved(true);
    }
  };

  const handleRepost = async () => {
    if (!user || !userDoc) return;
    Alert.alert('Repost', 'Share this Sessn to your profile?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Repost',
        onPress: async () => {
          await repostPost(post, user.uid, userDoc.username, userDoc.profilePicUrl);
        },
      },
    ]);
  };

  const tag = post.type === 'class' ? post.classType : post.split ?? post.workoutTypes.join(' · ');

  return (
    <View style={styles.card}>
      {/* Author row */}
      <View style={styles.authorRow}>
        <TouchableOpacity style={styles.authorLeft} onPress={onUserPress}>
          {post.authorPicUrl ? (
            <Image source={{ uri: post.authorPicUrl }} style={styles.authorAvatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={14} color={colors.textSecondary} />
            </View>
          )}
          <Text style={styles.authorName}>{post.authorUsername}</Text>
        </TouchableOpacity>
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      </View>

      {/* Image */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.95}>
        {post.imageUrl ? (
          <Image source={{ uri: post.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="barbell-outline" size={48} color={colors.textDim} />
          </View>
        )}
      </TouchableOpacity>

      {/* Title + stats */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{post.title}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>{post.durationMinutes}min</Text>
          {post.exercises && (
            <Text style={styles.stat}> · {post.exercises.length} exercises</Text>
          )}
          {post.type === 'class' && post.classDetails?.rating != null && (
            <Text style={styles.stat}> · {'★'.repeat(post.classDetails.rating)}</Text>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} onPress={handleLike}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? colors.red : colors.textSecondary} />
          <Text style={styles.actionCount}>{likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={handleRepost}>
          <Ionicons name="repeat" size={22} color={colors.textSecondary} />
          <Text style={styles.actionCount}>{post.repostCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={() => setShowShare(true)}>
          <Ionicons name="share-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={handleSave}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={saved ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.action, styles.detailsBtn]} onPress={() => setShowDetails(true)}>
          <Text style={styles.detailsBtnText}>Workout Details</Text>
        </TouchableOpacity>
      </View>

      {showDetails && (
        <WorkoutDetailsPanel
          post={post}
          saved={saved}
          onSave={handleSave}
          onClose={() => setShowDetails(false)}
        />
      )}

      {showShare && (
        <ShareSheet
          type="post"
          postId={post.id}
          imageUrl={post.imageUrl}
          onClose={() => setShowShare(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  authorLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  authorAvatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: { color: colors.text, fontWeight: '600', fontSize: 14 },
  tagBadge: {
    backgroundColor: colors.primaryDim,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  tagText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  image: { width: '100%', height: IMAGE_HEIGHT, resizeMode: 'cover' },
  imagePlaceholder: {
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  title: { ...typography.h3, marginBottom: 2 },
  statsRow: { flexDirection: 'row' },
  stat: { ...typography.caption, color: colors.textSecondary },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCount: { color: colors.textSecondary, fontSize: 13 },
  detailsBtn: {
    marginLeft: 'auto',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailsBtnText: { color: colors.text, fontSize: 12, fontWeight: '600' },
});
