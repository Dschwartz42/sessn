import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  Dimensions, SafeAreaView, Alert, ActivityIndicator, Linking, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../../types';
import { getPost, likePost, unlikePost, isLiked, savePost, unsavePost, isSaved, repostPost } from '../../services/postService';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, radius, typography } from '../../utils/theme';
import WorkoutDetailsPanel from '../../components/WorkoutDetailsPanel';
import ShareSheet from '../../components/ShareSheet';

const { width, height } = Dimensions.get('window');

type Props = { navigation: any; route: any };

export default function ExpandedPostScreen({ navigation, route }: Props) {
  const { postId } = route.params;
  const { user, userDoc } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    getPost(postId).then(setPost);
  }, [postId]);

  useEffect(() => {
    if (!post || !user) return;
    isLiked(post.id, user.uid).then(setLiked);
    isSaved(post.id, user.uid).then(setSaved);
  }, [post?.id, user?.uid]);

  if (!post) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const handleLike = async () => {
    if (!user) return;
    if (liked) { await unlikePost(post.id, user.uid); setLiked(false); }
    else { await likePost(post.id, user.uid); setLiked(true); }
  };

  const handleSave = async () => {
    if (!user) return;
    if (saved) { await unsavePost(post.id, user.uid); setSaved(false); }
    else { await savePost(post.id, user.uid); setSaved(true); }
  };

  const handleRepost = () => {
    if (!user || !userDoc) return;
    Alert.alert('Repost', 'Share this Sessn to your profile?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Repost', onPress: () => repostPost(post, user.uid, userDoc.username, userDoc.profilePicUrl) },
    ]);
  };

  const handleLocation = () => {
    if (!post.location) return;
    Alert.alert('Open in Maps', 'Choose an app', [
      {
        text: 'Apple Maps',
        onPress: () => Linking.openURL(`maps:?q=${post.location!.lat},${post.location!.lng}`),
      },
      {
        text: 'Google Maps',
        onPress: () => Linking.openURL(`https://maps.google.com/?q=${post.location!.lat},${post.location!.lng}`),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const tag = post.type === 'class' ? post.classType : post.split ?? post.workoutTypes.join(' · ');

  return (
    <View style={styles.container}>
      {/* Full-screen image */}
      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={styles.bgImage} />
      ) : (
        <View style={[styles.bgImage, styles.bgPlaceholder]} />
      )}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('UserProfile', { uid: post.authorId })}
            style={styles.authorRow}
          >
            {post.authorPicUrl ? (
              <Image source={{ uri: post.authorPicUrl }} style={styles.authorAvatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={14} color={colors.textSecondary} />
              </View>
            )}
            <Text style={styles.authorName}>{post.authorUsername}</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom info */}
        <View style={styles.bottomInfo}>
          <View style={styles.tagRow}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
            {post.type === 'class' && post.classDetails && (
              <View style={styles.starRow}>
                {Array.from({ length: post.classDetails.rating }, (_, i) => (
                  <Ionicons key={i} name="star" size={14} color={colors.orange} />
                ))}
              </View>
            )}
          </View>

          <Text style={styles.title}>{post.title}</Text>
          {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

          {post.location && (
            <TouchableOpacity style={styles.locationRow} onPress={handleLocation}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.locationText}>{post.location.name}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.action} onPress={handleLike}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={26} color={liked ? colors.red : colors.text} />
              <Text style={styles.actionCount}>{post.likeCount + (liked ? 1 : 0)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.action} onPress={handleRepost}>
              <Ionicons name="repeat" size={26} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.action} onPress={() => setShowShare(true)}>
              <Ionicons name="share-outline" size={26} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.action} onPress={handleSave}>
              <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={26} color={saved ? colors.primary : colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.detailsBtn} onPress={() => setShowDetails(true)}>
              <Text style={styles.detailsBtnText}>Workout Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {showDetails && (
        <WorkoutDetailsPanel post={post} saved={saved} onSave={handleSave} onClose={() => setShowDetails(false)} />
      )}
      {showShare && (
        <ShareSheet type="post" postId={post.id} imageUrl={post.imageUrl} onClose={() => setShowShare(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  bgImage: { position: 'absolute', width, height, resizeMode: 'cover' },
  bgPlaceholder: { backgroundColor: colors.surfaceElevated },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  safeArea: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  topBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  authorAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.text },
  avatarPlaceholder: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  authorName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  bottomInfo: { padding: spacing.md, gap: spacing.sm },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tagBadge: {
    backgroundColor: 'rgba(255,87,51,0.25)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.primary + '60',
  },
  tagText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  starRow: { flexDirection: 'row', gap: 2 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  caption: { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCount: { color: colors.text, fontSize: 14 },
  detailsBtn: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  detailsBtnText: { color: colors.text, fontSize: 13, fontWeight: '600' },
});
