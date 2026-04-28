import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, Image, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, query, where, orderBy, startAt, endAt,
  getDocs, limit,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { UserDoc, Post } from '../../types';
import { colors, spacing, radius, typography } from '../../utils/theme';
import { followUser, unfollowUser, isFollowing } from '../../services/followService';

type Filter = 'all' | 'people' | 'groups' | 'splits';
type Props = { navigation: any };

export default function SearchScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [results, setResults] = useState<UserDoc[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [popularUsers, setPopularUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const loadPopular = useCallback(async () => {
    const postsSnap = await getDocs(
      query(collection(db, 'posts'), orderBy('likeCount', 'desc'), limit(5))
    );
    setPopularPosts(postsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Post)));

    const usersSnap = await getDocs(
      query(collection(db, 'users'), orderBy('followersCount', 'desc'), limit(5))
    );
    setPopularUsers(usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserDoc)));
  }, []);

  React.useEffect(() => { loadPopular(); }, []);

  const handleSearch = async (text: string) => {
    setSearchText(text);
    if (text.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    const lower = text.trim().toLowerCase();
    const snap = await getDocs(
      query(
        collection(db, 'users'),
        orderBy('username'),
        startAt(lower),
        endAt(lower + '\uf8ff'),
        limit(10)
      )
    );
    setResults(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserDoc)));
    setLoading(false);
    setSearched(true);
  };

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'people', label: 'People' },
    { key: 'groups', label: 'Groups' },
    { key: 'splits', label: 'Splits' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textDim} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search athletes, groups…"
            placeholderTextColor={colors.textDim}
            value={searchText}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(''); setResults([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={18} color={colors.textDim} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />}

      {searched && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <UserRow
              user={item}
              currentUid={user?.uid ?? ''}
              onPress={() => navigation.navigate('UserProfile', { uid: item.uid })}
            />
          )}
        />
      )}

      {!searched && (
        <FlatList
          data={[]}
          ListHeaderComponent={() => (
            <View>
              <Text style={styles.sectionTitle}>Popular Sessns</Text>
              {popularPosts.map((p) => (
                <TouchableOpacity key={p.id} style={styles.popularPost} onPress={() => navigation.navigate('ExpandedPost', { postId: p.id })}>
                  {p.imageUrl ? (
                    <Image source={{ uri: p.imageUrl }} style={styles.popularPostImage} />
                  ) : (
                    <View style={[styles.popularPostImage, styles.noImage]} />
                  )}
                  <View style={styles.popularPostInfo}>
                    <Text style={styles.popularPostTitle} numberOfLines={1}>{p.title}</Text>
                    <Text style={styles.popularPostStat}>❤️ {p.likeCount}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Popular Athletes</Text>
              {popularUsers.map((u) => (
                <UserRow
                  key={u.uid}
                  user={u}
                  currentUid={user?.uid ?? ''}
                  onPress={() => navigation.navigate('UserProfile', { uid: u.uid })}
                />
              ))}
            </View>
          )}
          renderItem={() => null}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}
    </SafeAreaView>
  );
}

function UserRow({ user, currentUid, onPress }: { user: UserDoc; currentUid: string; onPress: () => void }) {
  const [following, setFollowing] = useState(false);

  React.useEffect(() => {
    if (!currentUid || currentUid === user.uid) return;
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
    <TouchableOpacity style={styles.userRow} onPress={onPress}>
      {user.profilePicUrl ? (
        <Image source={{ uri: user.profilePicUrl }} style={styles.userAvatar} />
      ) : (
        <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
          <Ionicons name="person" size={18} color={colors.textSecondary} />
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.displayName}>{user.displayName}</Text>
      </View>
      {currentUid !== user.uid && (
        <TouchableOpacity
          style={[styles.followBtn, following && styles.followingBtn]}
          onPress={toggle}
        >
          <Text style={styles.followBtnText}>{following ? 'Following' : 'Follow'}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.text, fontFamily: 'Barlow_400Regular', fontSize: 15 },
  filters: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
  filterText: { color: colors.textSecondary, fontFamily: 'Barlow_500Medium', fontSize: 13 },
  filterTextActive: { color: colors.primaryLight, fontFamily: 'Barlow_600SemiBold' },
  sectionTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    letterSpacing: 1,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  popularPost: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  popularPostImage: { width: 60, height: 60, borderRadius: radius.xs, resizeMode: 'cover' },
  noImage: { backgroundColor: colors.surfaceElevated },
  popularPostInfo: { flex: 1 },
  popularPostTitle: { color: colors.text, fontFamily: 'Barlow_600SemiBold', fontSize: 15 },
  popularPostStat: { color: colors.textSecondary, fontFamily: 'Barlow_400Regular', fontSize: 13 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  userAvatar: { width: 48, height: 48, borderRadius: 24, resizeMode: 'cover' },
  avatarPlaceholder: { backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  userInfo: { flex: 1 },
  username: { color: colors.text, fontFamily: 'Barlow_700Bold', fontSize: 15 },
  displayName: { color: colors.textSecondary, fontFamily: 'Barlow_400Regular', fontSize: 13 },
  followBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  followingBtn: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryBorder },
  followBtnText: { color: '#fff', fontFamily: 'Barlow_600SemiBold', fontSize: 13 },
});
