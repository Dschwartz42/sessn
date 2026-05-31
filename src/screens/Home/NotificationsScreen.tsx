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
import { colors, spacing, radius } from '../../utils/theme';
import { followUser, unfollowUser, isFollowing, acceptFollowRequest, declineFollowRequest } from '../../services/followService';
import { formatDistanceToNow, isToday, isThisWeek } from 'date-fns';

type Props = { navigation: any };

function getGroup(item: Notification): 'Today' | 'This Week' | 'Earlier' {
  if (!item.createdAt?.toDate) return 'Earlier';
  const d = item.createdAt.toDate();
  if (isToday(d)) return 'Today';
  if (isThisWeek(d)) return 'This Week';
  return 'Earlier';
}

export default function NotificationsScreen({ navigation }: Props) {
  const { user, userDoc } = useAuth();
  const isPrivateAccount = userDoc?.isPublic === false;
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

  // Group notifs
  type GroupedItem = { type: 'header'; title: string } | { type: 'notif'; item: Notification };
  const grouped: GroupedItem[] = [];
  let lastGroup = '';
  notifs.forEach((n) => {
    const g = getGroup(n);
    if (g !== lastGroup) {
      grouped.push({ type: 'header', title: g });
      lastGroup = g;
    }
    grouped.push({ type: 'notif', item: n });
  });

  const renderItem = ({ item }: { item: GroupedItem }) => {
    if (item.type === 'header') {
      return <Text style={styles.sectionLabel}>{item.title}</Text>;
    }
    return (
      <NotifItem
        item={item.item}
        navigation={navigation}
        currentUid={user?.uid ?? ''}
        isPrivateAccount={isPrivateAccount}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
        <View style={styles.bellWrap}>
          <Ionicons name="notifications-outline" size={20} color={colors.textDim} />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      ) : notifs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-outline" size={48} color={colors.textDim} />
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item, idx) =>
            item.type === 'header' ? `header-${item.title}` : item.item.id
          }
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}
    </SafeAreaView>
  );
}

function NotifItem({
  item, navigation, currentUid, isPrivateAccount,
}: {
  item: Notification; navigation: any; currentUid: string; isPrivateAccount: boolean;
}) {
  const [followState, setFollowState] = useState<'none' | 'following'>('none');
  const [requestHandled, setRequestHandled] = useState(false);

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

  const handleAccept = async () => {
    await acceptFollowRequest(currentUid, item.fromUserId);
    setRequestHandled(true);
  };

  const handleDecline = async () => {
    await declineFollowRequest(currentUid, item.fromUserId);
    setRequestHandled(true);
  };

  const message = () => {
    switch (item.type) {
      case 'follow_request': return isPrivateAccount ? 'requested to follow you.' : 'started following you.';
      case 'follow_accepted': return 'accepted your follow request.';
      case 'like': return 'liked your Sessn.';
      case 'repost': return 'reposted your Sessn.';
      default: return '';
    }
  };

  const timeAgo = item.createdAt?.toDate
    ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })
    : '';

  const isUnread = !item.read;

  return (
    <View style={[styles.notifRow, isUnread && styles.unread]}>
      {isUnread && <View style={styles.unreadBar} />}
      <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { uid: item.fromUserId })}>
        {item.fromUserPic ? (
          <Image source={{ uri: item.fromUserPic }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, isUnread && styles.avatarUnread]}>
            <Text style={styles.avatarInitials}>
              {(item.fromUsername ?? '?').slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.notifBody}>
        <Text style={styles.notifText}>
          <Text
            style={styles.notifUsername}
            onPress={() => navigation.navigate('UserProfile', { uid: item.fromUserId })}
          >
            {item.fromUsername}
          </Text>
          {' '}{message()}
        </Text>
        <Text style={styles.timeAgo}>{timeAgo}</Text>
      </View>

      {item.type === 'follow_request' && !requestHandled && (
        isPrivateAccount ? (
          <View style={styles.requestBtns}>
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.followBtn, followState === 'following' && styles.followingBtn]}
            onPress={handleFollowBack}
          >
            <Text style={[styles.followBtnText, followState === 'following' && styles.followingBtnText]}>
              {followState === 'following' ? 'Following' : 'Follow Back'}
            </Text>
          </TouchableOpacity>
        )
      )}
      {item.type === 'follow_request' && requestHandled && (
        <Text style={styles.handledText}>Done</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 26,
    letterSpacing: 2,
    color: colors.text,
  },
  bellWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontFamily: 'Barlow_700Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Barlow_400Regular',
    fontSize: 15,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
  },
  unread: {
    backgroundColor: 'rgba(99,91,255,0.06)',
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.primary,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUnread: {
    backgroundColor: colors.primary,
  },
  avatarInitials: {
    color: '#fff',
    fontFamily: 'Barlow_700Bold',
    fontSize: 14,
  },
  notifBody: { flex: 1 },
  notifText: {
    color: colors.text,
    fontFamily: 'Barlow_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  notifUsername: { fontFamily: 'Barlow_700Bold' },
  timeAgo: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Barlow_400Regular',
    fontSize: 12,
    marginTop: 4,
  },
  followBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(99,91,255,0.35)',
  },
  followBtnText: {
    color: '#fff',
    fontFamily: 'Barlow_700Bold',
    fontSize: 12,
  },
  followingBtnText: {
    color: colors.primaryLight,
  },
  postThumb: { width: 44, height: 44, borderRadius: 8 },
  requestBtns: { flexDirection: 'column', gap: 6 },
  acceptBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  acceptBtnText: { color: '#fff', fontFamily: 'Barlow_700Bold', fontSize: 12 },
  declineBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  declineBtnText: { color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow_600SemiBold', fontSize: 12 },
  handledText: { color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow_400Regular', fontSize: 12 },
});
