import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, Image, SafeAreaView, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, query, where, orderBy, startAt, endAt,
  getDocs, limit,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { UserDoc, Post } from '../../types';
import { colors, spacing, radius } from '../../utils/theme';
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
  const [searchError, setSearchError] = useState(false);

  const loadPopular = useCallback(async () => {
    try {
      const postsSnap = await getDocs(
        query(collection(db, 'posts'), orderBy('likeCount', 'desc'), limit(5))
      );
      setPopularPosts(postsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Post)));

      const usersSnap = await getDocs(
        query(collection(db, 'users'), orderBy('followersCount', 'desc'), limit(5))
      );
      setPopularUsers(usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserDoc)));
    } catch {
      // Popular content is non-critical; fail silently
    }
  }, []);

  React.useEffect(() => { loadPopular(); }, []);

  const handleSearch = async (text: string) => {
    setSearchText(text);
    if (text.trim().length < 2) {
      setResults([]);
      setSearched(false);
      setSearchError(false);
      return;
    }
    setLoading(true);
    setSearchError(false);
    try {
      const lower = text.trim().toLowerCase();
      const snap = await getDocs(
        query(
          collection(db, 'users'),
          orderBy('username'),
          startAt(lower),
          endAt(lower + ''),
          limit(10)
        )
      );
      setResults(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserDoc)));
    } catch {
      setSearchError(true);
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'people', label: 'People' },
    { key: 'groups', label: 'Groups' },
    { key: 'splits', label: 'Splits' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo */}
      <Text style={styles.logoText}>SESSN</Text>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.25)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search athletes, groups…"
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={searchText}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(''); setResults([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.25)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
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
      </ScrollView>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />}

      {searched && searchError && (
        <View style={styles.stateWrap}>
          <Ionicons name="warning-outline" size={32} color={colors.textDim} />
          <Text style={styles.stateText}>Search unavailable. Check your connection and try again.</Text>
        </View>
      )}

      {searched && !searchError && results.length === 0 && (
        <View style={styles.stateWrap}>
          <Ionicons name="search-outline" size={32} color={colors.textDim} />
          <Text style={styles.stateText}>No athletes found for "{searchText}".</Text>
        </View>
      )}

      {searched && !searchError && results.length > 0 && (
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
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      {!searched && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <Text style={styles.sectionTitle}>Popular Sessns</Text>
          {popularPosts.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.popularPost}
              onPress={() => navigation.navigate('ExpandedPost', { postId: p.id })}
            >
              {p.imageUrl ? (
                <Image source={{ uri: p.imageUrl }} style={styles.popularPostImage} />
              ) : (
                <View style={[styles.popularPostImage, styles.noImage]}>
                  <Ionicons name="barbell-outline" size={20} color={colors.textDim} />
                </View>
              )}
              <View style={styles.popularPostInfo}>
                <Text style={styles.popularPostTitle} numberOfLines={1}>{p.title}</Text>
                <Text style={styles.popularPostStat}>❤️ {p.likeCount}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Popular Athletes</Text>
          {popularUsers.map((u) => (
            <UserRow
              key={u.uid}
              user={u}
              currentUid={user?.uid ?? ''}
              onPress={() => navigation.navigate('UserProfile', { uid: u.uid })}
            />
          ))}
        </ScrollView>
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
          <Ionicons name="person" size={20} color={colors.textSecondary} />
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.username}>@{user.username}</Text>
        <Text style={styles.displayName}>{user.displayName}</Text>
      </View>
      {currentUid !== user.uid && (
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
  logoText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 42,
    color: colors.primaryLight,
    letterSpacing: 4,
    textAlign: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchRow: { paddingHorizontal: 16, paddingVertical: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151515',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: 'Barlow_400Regular',
    fontSize: 15,
  },
  filtersScroll: { maxHeight: 48 },
  filtersContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(99,91,255,0.12)',
    borderColor: 'rgba(99,91,255,0.25)',
  },
  filterText: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 13,
  },
  filterTextActive: { color: colors.primaryLight },
  sectionTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    letterSpacing: 1,
    color: colors.text,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  popularPost: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  popularPostImage: {
    width: 60,
    height: 60,
    borderRadius: radius.xs,
    resizeMode: 'cover',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImage: { backgroundColor: '#151515' },
  popularPostInfo: { flex: 1 },
  popularPostTitle: { color: colors.text, fontFamily: 'Barlow_600SemiBold', fontSize: 15 },
  popularPostStat: { color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow_400Regular', fontSize: 13 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  userAvatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: { flex: 1 },
  username: { color: colors.text, fontFamily: 'Barlow_700Bold', fontSize: 15 },
  displayName: { color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow_400Regular', fontSize: 13 },
  followBtn: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  followingBtn: {
    backgroundColor: 'rgba(99,91,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99,91,255,0.25)',
  },
  followBtnText: { color: '#fff', fontFamily: 'Barlow_600SemiBold', fontSize: 13 },
  followingBtnText: { color: colors.primaryLight },
  stateWrap: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32, gap: 12 },
  stateText: { color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow_400Regular', fontSize: 14, textAlign: 'center' },
});
