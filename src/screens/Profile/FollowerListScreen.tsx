import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { UserDoc } from '../../types';
import { colors, spacing, radius } from '../../utils/theme';
import { followUser, unfollowUser, isFollowing } from '../../services/followService';

type Props = { navigation: any; route: any };

export default function FollowerListScreen({ navigation, route }: Props) {
  const { uid, type, username } = route.params as {
    uid: string;
    type: 'followers' | 'following';
    username: string;
  };
  const { user } = useAuth();
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const followSnap = await getDocs(
          query(
            collection(db, 'follows'),
            where(type === 'followers' ? 'followeeId' : 'followerId', '==', uid)
          )
        );
        const ids = followSnap.docs.map((d) =>
          type === 'followers'
            ? (d.data().followerId as string)
            : (d.data().followeeId as string)
        );
        if (ids.length === 0) { setLoading(false); return; }

        // Firestore 'in' limit is 30; batch if needed.
        const fetched: UserDoc[] = [];
        for (let i = 0; i < ids.length; i += 30) {
          const chunk = ids.slice(i, i + 30);
          const snap = await getDocs(
            query(collection(db, 'users'), where(documentId(), 'in', chunk))
          );
          snap.docs.forEach((d) => fetched.push({ uid: d.id, ...d.data() } as UserDoc));
        }
        setUsers(fetched);
      } catch (e) {
        console.warn('FollowerListScreen load error:', e);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uid, type]);

  const title = type === 'followers'
    ? `${username}'s Followers`
    : `${username} is Following`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title.toUpperCase()}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      ) : loadError ? (
        <View style={styles.empty}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textDim} />
          <Text style={styles.emptyText}>Could not load list. Check your connection and try again.</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={48} color={colors.textDim} />
          <Text style={styles.emptyText}>
            {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <UserRow
              user={item}
              currentUid={user?.uid ?? ''}
              onPress={() => navigation.navigate('UserProfile', { uid: item.uid })}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}
    </SafeAreaView>
  );
}

function UserRow({
  user,
  currentUid,
  onPress,
}: {
  user: UserDoc;
  currentUid: string;
  onPress: () => void;
}) {
  const [following, setFollowing] = useState(false);
  const isMe = user.uid === currentUid;

  useEffect(() => {
    if (!currentUid || isMe) return;
    isFollowing(currentUid, user.uid).then(setFollowing);
  }, []);

  const toggle = async () => {
    if (following) {
      await unfollowUser(currentUid, user.uid);
      setFollowing(false);
    } else {
      await followUser(currentUid, user.uid);
      setFollowing(true);
    }
  };

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {user.profilePicUrl ? (
        <Image source={{ uri: user.profilePicUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarInitial}>
            {(user.username?.[0] ?? '?').toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.username}>@{user.username}</Text>
        {user.displayName ? (
          <Text style={styles.displayName}>{user.displayName}</Text>
        ) : null}
      </View>
      {!isMe && (
        <TouchableOpacity
          style={[styles.followBtn, following && styles.followingBtn]}
          onPress={toggle}
        >
          <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
            {following ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
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
    fontSize: 20,
    letterSpacing: 2,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Barlow_400Regular',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontFamily: 'Barlow_700Bold', fontSize: 18 },
  info: { flex: 1 },
  username: { color: colors.text, fontFamily: 'Barlow_700Bold', fontSize: 15 },
  displayName: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Barlow_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  followBtn: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  followingBtn: {
    backgroundColor: 'rgba(99,91,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99,91,255,0.25)',
  },
  followBtnText: { color: '#fff', fontFamily: 'Barlow_600SemiBold', fontSize: 13 },
  followingBtnText: { color: colors.primaryLight },
});
