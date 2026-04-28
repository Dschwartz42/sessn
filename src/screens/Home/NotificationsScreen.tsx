import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, query, orderBy, onSnapshot, doc, updateDoc,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Notification } from '../../types';
import { colors, typography, spacing, radius } from '../../utils/theme';
import { followUser, unfollowUser, isFollowing } from '../../services/followService';
import { formatDistanceToNow } from 'date-fns';

type Props = { navigation: any };

export default function NotificationsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications', user.uid, 'items'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification)));
      setLoading(false);
      // Mark all read
      snap.docs.filter((d) => !d.data().read).forEach((d) => {
        updateDoc(doc(db, 'notifications', user.uid, 'items', d.id), { read: true });
      });
    });
    return unsub;
  }, [user]);

  const renderNotif = ({ item }: { item: Notification }) => (
    <NotifItem item={item} navigation={navigation} currentUid={user?.uid ?? ''} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      ) : notifs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={typography.bodySecondary}>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(item) => item.id}
          renderItem={renderNotif}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function NotifItem({ item, navigation, currentUid }: { item: Notification; navigation: any; currentUid: string }) {
  const [followState, setFollowState] = useState<'none' | 'following'>('none');

  useEffect(() => {
    if (item.type !== 'follow_request') return;
    isFollowing(currentUid, item.fromUserId).then((v) => setFollowState(v ? 'following' : 'none'));
  }, []);

  const handleFollowBack = async () => {
    if (followState === 'following') {
      await unfollowUser(currentUid, item.fromUserId);
      setFollowState('none');
    } else {
      await followUser(currentUid, item.fromUserId);
      setFollowState('following');
    }
  };

  const message = () => {
    switch (item.type) {
      case 'follow_request': return 'started following you.';
      case 'like': return 'liked your Sessn.';
      case 'repost': return 'reposted your Sessn.';
      default: return '';
    }
  };

  const timeAgo = item.createdAt?.toDate
    ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })
    : '';

  return (
    <View style={[styles.notifRow, !item.read && styles.unread]}>
      <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { uid: item.fromUserId })}>
        {item.fromUserPic ? (
          <Image source={{ uri: item.fromUserPic }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={18} color={colors.textSecondary} />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.notifBody}>
        <Text style={styles.notifText}>
          <Text style={styles.username} onPress={() => navigation.navigate('UserProfile', { uid: item.fromUserId })}>
            {item.fromUsername}
          </Text>
          {' '}{message()}{' '}
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </Text>
      </View>

      {item.type === 'follow_request' && (
        <TouchableOpacity
          style={[styles.followBtn, followState === 'following' && styles.followingBtn]}
          onPress={handleFollowBack}
        >
          <Text style={styles.followBtnText}>{followState === 'following' ? 'Following' : 'Follow Back'}</Text>
        </TouchableOpacity>
      )}

      {(item.type === 'like' || item.type === 'repost') && item.postImageUrl && (
        <TouchableOpacity onPress={() => navigation.navigate('ExpandedPost', { postId: item.postId })}>
          <Image source={{ uri: item.postImageUrl }} style={styles.postThumb} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontFamily: 'Barlow_600SemiBold', fontSize: 17, color: colors.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unread: { backgroundColor: colors.primarySoft },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  notifBody: { flex: 1 },
  notifText: { color: colors.text, fontFamily: 'Barlow_400Regular', fontSize: 14, lineHeight: 20 },
  username: { fontFamily: 'Barlow_700Bold' },
  timeAgo: { color: colors.textSecondary, fontFamily: 'Barlow_400Regular', fontSize: 12 },
  followBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  followingBtn: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryBorder },
  followBtnText: { color: '#fff', fontFamily: 'Barlow_600SemiBold', fontSize: 13 },
  postThumb: { width: 44, height: 44, borderRadius: radius.xs },
});
