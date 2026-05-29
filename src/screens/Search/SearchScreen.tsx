import React, { useState, useCallback, useEffect } from 'react';
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
import { UserDoc, Post, Group } from '../../types';
import { colors } from '../../utils/theme';
import { followUser, unfollowUser, isFollowing } from '../../services/followService';

type Filter = 'people' | 'groups' | 'splits';
const FILTERS: Filter[] = ['people', 'groups', 'splits'];
const FILTER_LABELS: Record<Filter, string> = { people: 'People', groups: 'Groups', splits: 'Splits' };
const FILTER_PLACEHOLDERS: Record<Filter, string> = {
  people: 'Search athletes…',
  groups: 'Search groups…',
  splits: 'Search splits…',
};

type Props = { navigation: any };

export default function SearchScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState<Filter>('people');
  const [userResults, setUserResults] = useState<UserDoc[]>([]);
  const [groupResults, setGroupResults] = useState<Group[]>([]);
  const [postResults, setPostResults] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [popularUsers, setPopularUsers] = useState<UserDoc[]>([]);
  const [popularGroups, setPopularGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const loadPopular = useCallback(async () => {
    try {
      const [postsSnap, usersSnap, groupsSnap] = await Promise.all([
        getDocs(query(collection(db, 'posts'), orderBy('likeCount', 'desc'), limit(5))),
        getDocs(query(collection(db, 'users'), orderBy('followersCount', 'desc'), limit(5))),
        getDocs(query(collection(db, 'groups'), orderBy('memberCount', 'desc'), limit(5))),
      ]);
      setPopularPosts(postsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Post)));
      setPopularUsers(usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserDoc)));
      setPopularGroups(groupsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Group)));
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => { loadPopular(); }, []);

  // Re-run search when filter changes (if there's already text)
  useEffect(() => {
    if (searchText.trim().length >= 2) runSearch(searchText, filter);
    else { clearResults(); setSearched(false); }
  }, [filter]);

  const clearResults = () => {
    setUserResults([]);
    setGroupResults([]);
    setPostResults([]);
    setSearchError(false);
  };

  const cycleFilter = () => {
    const next = FILTERS[(FILTERS.indexOf(filter) + 1) % FILTERS.length];
    setFilter(next);
  };

  const runSearch = async (text: string, activeFilter: Filter) => {
    setLoading(true);
    setSearchError(false);
    clearResults();
    try {
      const lower = text.trim().toLowerCase();
      const upper = lower + '';

      if (activeFilter === 'people') {
        const snap = await getDocs(
          query(collection(db, 'users'), orderBy('username'), startAt(lower), endAt(upper), limit(10))
        );
        setUserResults(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserDoc)));
      } else if (activeFilter === 'groups') {
        const snap = await getDocs(
          query(collection(db, 'groups'), orderBy('name'), startAt(text.trim()), endAt(text.trim() + ''), limit(10))
        );
        setGroupResults(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group)));
      } else if (activeFilter === 'splits') {
        const snap = await getDocs(
          query(collection(db, 'posts'), orderBy('split'), startAt(lower), endAt(upper), limit(10))
        );
        setPostResults(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post)));
      }
    } catch {
      setSearchError(true);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim().length < 2) {
      clearResults();
      setSearched(false);
      return;
    }
    runSearch(text, filter);
  };

  const hasResults =
    userResults.length > 0 || groupResults.length > 0 || postResults.length > 0;

  const emptyLabel =
    filter === 'people' ? `No athletes found for "${searchText}".`
    : filter === 'groups' ? `No groups found for "${searchText}".`
    : `No splits found for "${searchText}".`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo */}
      <Text style={styles.logoText}>SESSN</Text>

      {/* Search bar with inline filter */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          {/* Filter selector — left side */}
          <TouchableOpacity style={styles.filterSelector} onPress={cycleFilter}>
            <Text style={styles.filterLabel}>{FILTER_LABELS[filter]}</Text>
            <Ionicons name="chevron-down" size={12} color={colors.primaryLight} />
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Search icon + input */}
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.25)" />
          <TextInput
            style={styles.searchInput}
            placeholder={FILTER_PLACEHOLDERS[filter]}
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={searchText}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(''); clearResults(); setSearched(false); }}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.25)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />}

      {/* Search error */}
      {searched && searchError && (
        <View style={styles.stateWrap}>
          <Ionicons name="warning-outline" size={32} color={colors.textDim} />
          <Text style={styles.stateText}>Search unavailable. Check your connection and try again.</Text>
        </View>
      )}

      {/* No results */}
      {searched && !searchError && !hasResults && !loading && (
        <View style={styles.stateWrap}>
          <Ionicons name="search-outline" size={32} color={colors.textDim} />
          <Text style={styles.stateText}>{emptyLabel}</Text>
        </View>
      )}

      {/* People results */}
      {searched && !searchError && userResults.length > 0 && (
        <FlatList
          data={userResults}
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

      {/* Group results */}
      {searched && !searchError && groupResults.length > 0 && (
        <FlatList
          data={groupResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <GroupRow group={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      {/* Split / post results */}
      {searched && !searchError && postResults.length > 0 && (
        <FlatList
          data={postResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostRow post={item} onPress={() => navigation.navigate('ExpandedPost', { postId: item.id })} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      {/* Default state — filter-appropriate popular content */}
      {!searched && !loading && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {filter === 'people' && (
            <>
              <Text style={styles.sectionTitle}>Popular Athletes</Text>
              {popularUsers.map((u) => (
                <UserRow
                  key={u.uid}
                  user={u}
                  currentUid={user?.uid ?? ''}
                  onPress={() => navigation.navigate('UserProfile', { uid: u.uid })}
                />
              ))}
            </>
          )}
          {filter === 'groups' && (
            <>
              <Text style={styles.sectionTitle}>Popular Groups</Text>
              {popularGroups.map((g) => (
                <GroupRow key={g.id} group={g} />
              ))}
            </>
          )}
          {filter === 'splits' && (
            <>
              <Text style={styles.sectionTitle}>Popular Sessns</Text>
              {popularPosts.map((p) => (
                <PostRow
                  key={p.id}
                  post={p}
                  onPress={() => navigation.navigate('ExpandedPost', { postId: p.id })}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function UserRow({ user, currentUid, onPress }: { user: UserDoc; currentUid: string; onPress: () => void }) {
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!currentUid || currentUid === user.uid) return;
    isFollowing(currentUid, user.uid).then(setFollowing);
  }, []);

  const toggle = async () => {
    if (following) { await unfollowUser(currentUid, user.uid); setFollowing(false); }
    else { await followUser(currentUid, user.uid); setFollowing(true); }
  };

  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      {user.profilePicUrl ? (
        <Image source={{ uri: user.profilePicUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarInitial}>{(user.username?.[0] ?? '?').toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>@{user.username}</Text>
        <Text style={styles.rowSub}>{user.displayName}</Text>
      </View>
      {currentUid !== user.uid && (
        <TouchableOpacity style={[styles.followBtn, following && styles.followingBtn]} onPress={toggle}>
          <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
            {following ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

function GroupRow({ group }: { group: Group }) {
  return (
    <View style={styles.row}>
      {group.pictureUrl ? (
        <Image source={{ uri: group.pictureUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Ionicons name="people" size={20} color={colors.primaryLight} />
        </View>
      )}
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{group.name}</Text>
        <Text style={styles.rowSub}>{group.memberCount ?? 0} members</Text>
      </View>
      {group.isPrivate && (
        <Ionicons name="lock-closed-outline" size={16} color="rgba(255,255,255,0.3)" />
      )}
    </View>
  );
}

function PostRow({ post, onPress }: { post: Post; onPress: () => void }) {
  const splitLabel = post.split ?? post.workoutTypes?.[0] ?? '';
  const dateStr = post.createdAt?.toDate
    ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })
    : '';
  return (
    <TouchableOpacity style={styles.postRow} onPress={onPress}>
      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={styles.postThumb} />
      ) : (
        <View style={[styles.postThumb, styles.avatarPlaceholder]}>
          <Ionicons name="barbell-outline" size={20} color={colors.textDim} />
        </View>
      )}
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={1}>{post.title}</Text>
        <Text style={styles.rowSub}>{splitLabel ? `${splitLabel} · ` : ''}{dateStr}</Text>
        <Text style={styles.postLikes}>♥ {post.likeCount ?? 0}</Text>
      </View>
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

  // Search bar
  searchRow: { paddingHorizontal: 16, paddingVertical: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151515',
    borderRadius: 50,
    paddingLeft: 14,
    paddingRight: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  filterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterLabel: {
    fontFamily: 'Barlow_700Bold',
    fontSize: 13,
    color: colors.primaryLight,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: 'Barlow_400Regular',
    fontSize: 15,
  },

  // Section
  sectionTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    letterSpacing: 1,
    color: colors.text,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // Shared row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
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
  rowInfo: { flex: 1 },
  rowTitle: { color: colors.text, fontFamily: 'Barlow_700Bold', fontSize: 15 },
  rowSub: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow_400Regular', fontSize: 13, marginTop: 2 },

  // Follow button
  followBtn: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  followingBtn: {
    backgroundColor: 'rgba(99,91,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99,91,255,0.25)',
  },
  followBtnText: { color: '#fff', fontFamily: 'Barlow_600SemiBold', fontSize: 13 },
  followingBtnText: { color: colors.primaryLight },

  // Post row
  postRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  postThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  postLikes: {
    color: '#FF4D6A',
    fontFamily: 'Barlow_500Medium',
    fontSize: 12,
    marginTop: 3,
  },

  // State views
  stateWrap: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32, gap: 12 },
  stateText: { color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow_400Regular', fontSize: 14, textAlign: 'center' },
});
