import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, Image, SafeAreaView, ActivityIndicator, ScrollView,
  Modal, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, query, orderBy, startAt, endAt,
  getDocs, limit,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { UserDoc, Post, Group } from '../../types';
import { colors } from '../../utils/theme';
import { followUser, unfollowUser, isFollowing } from '../../services/followService';

type FilterOption = 'people' | 'groups' | 'splits';
const ALL_FILTERS: FilterOption[] = ['people', 'groups', 'splits'];
const FILTER_LABELS: Record<FilterOption, string> = { people: 'People', groups: 'Groups', splits: 'Splits' };

type Props = { navigation: any };

export default function SearchScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userResults, setUserResults] = useState<UserDoc[]>([]);
  const [groupResults, setGroupResults] = useState<Group[]>([]);
  const [postResults, setPostResults] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [popularUsers, setPopularUsers] = useState<UserDoc[]>([]);
  const [popularGroups, setPopularGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState(false);

  // Which collections to search — empty means all
  const filtersToRun = activeFilters.length === 0 ? ALL_FILTERS : activeFilters;

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

  const clearResults = () => {
    setUserResults([]);
    setGroupResults([]);
    setPostResults([]);
    setSearchError(false);
  };

  const runSearch = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      clearResults();
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearchError(false);
    clearResults();
    try {
      const lower = text.trim().toLowerCase();
      const suffix = '';

      await Promise.all(filtersToRun.map(async (f) => {
        if (f === 'people') {
          const snap = await getDocs(
            query(collection(db, 'users'), orderBy('username'), startAt(lower), endAt(lower + ''), limit(10))
          );
          setUserResults(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserDoc)));
        } else if (f === 'groups') {
          const snap = await getDocs(
            query(collection(db, 'groups'), orderBy('name'), startAt(text.trim()), endAt(text.trim() + ''), limit(10))
          );
          setGroupResults(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group)));
        } else if (f === 'splits') {
          const snap = await getDocs(
            query(collection(db, 'posts'), orderBy('split'), startAt(lower), endAt(lower + ''), limit(10))
          );
          setPostResults(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post)));
        }
      }));
    } catch {
      setSearchError(true);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [filtersToRun]);

  const handleSearch = (text: string) => {
    setSearchText(text);
    runSearch(text);
  };

  const toggleFilter = (f: FilterOption) => {
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const hasResults = userResults.length > 0 || groupResults.length > 0 || postResults.length > 0;

  const filterBtnLabel =
    activeFilters.length === 0 ? 'Filter'
    : activeFilters.length === ALL_FILTERS.length ? 'All'
    : activeFilters.map((f) => FILTER_LABELS[f]).join(', ');

  const isFiltered = activeFilters.length > 0 && activeFilters.length < ALL_FILTERS.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo */}
      <Text style={styles.logoText}>SESSN</Text>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.25)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search athletes, groups, splits…"
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={searchText}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => { setSearchText(''); clearResults(); setSearched(false); }}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Ionicons name="close-circle" size={17} color="rgba(255,255,255,0.25)" />
            </TouchableOpacity>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Filter button — right side */}
          <TouchableOpacity
            style={[styles.filterBtn, isFiltered && styles.filterBtnActive]}
            onPress={() => setShowDropdown(true)}
          >
            <Ionicons
              name="options-outline"
              size={14}
              color={isFiltered ? colors.primaryLight : 'rgba(255,255,255,0.5)'}
            />
            <Text style={[styles.filterBtnText, isFiltered && styles.filterBtnTextActive]}>
              {filterBtnLabel}
            </Text>
            <Ionicons
              name="chevron-down"
              size={11}
              color={isFiltered ? colors.primaryLight : 'rgba(255,255,255,0.4)'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter dropdown */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdown}>
                <Text style={styles.dropdownTitle}>Filter by</Text>
                {ALL_FILTERS.map((f) => {
                  const checked = activeFilters.includes(f);
                  return (
                    <TouchableOpacity
                      key={f}
                      style={styles.dropdownItem}
                      onPress={() => toggleFilter(f)}
                    >
                      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                        {checked && <Ionicons name="checkmark" size={12} color="#fff" />}
                      </View>
                      <Text style={[styles.dropdownItemText, checked && styles.dropdownItemTextActive]}>
                        {FILTER_LABELS[f]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {activeFilters.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearFiltersBtn}
                    onPress={() => setActiveFilters([])}
                  >
                    <Text style={styles.clearFiltersText}>Clear filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />}

      {/* Error */}
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
          <Text style={styles.stateText}>No results found for "{searchText}".</Text>
        </View>
      )}

      {/* Results */}
      {searched && !searchError && hasResults && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {userResults.length > 0 && (
            <>
              {(groupResults.length > 0 || postResults.length > 0) && (
                <Text style={styles.sectionTitle}>Athletes</Text>
              )}
              {userResults.map((u) => (
                <UserRow
                  key={u.uid}
                  user={u}
                  currentUid={user?.uid ?? ''}
                  onPress={() => navigation.navigate('UserProfile', { uid: u.uid })}
                />
              ))}
            </>
          )}
          {groupResults.length > 0 && (
            <>
              {(userResults.length > 0 || postResults.length > 0) && (
                <Text style={styles.sectionTitle}>Groups</Text>
              )}
              {groupResults.map((g) => (
                <GroupRow key={g.id} group={g} />
              ))}
            </>
          )}
          {postResults.length > 0 && (
            <>
              {(userResults.length > 0 || groupResults.length > 0) && (
                <Text style={styles.sectionTitle}>Splits</Text>
              )}
              {postResults.map((p) => (
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

      {/* Default — popular content */}
      {!searched && !loading && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <Text style={styles.sectionTitle}>Popular Athletes</Text>
          {popularUsers.map((u) => (
            <UserRow
              key={u.uid}
              user={u}
              currentUid={user?.uid ?? ''}
              onPress={() => navigation.navigate('UserProfile', { uid: u.uid })}
            />
          ))}
          <Text style={styles.sectionTitle}>Popular Groups</Text>
          {popularGroups.map((g) => (
            <GroupRow key={g.id} group={g} />
          ))}
          <Text style={styles.sectionTitle}>Popular Sessns</Text>
          {popularPosts.map((p) => (
            <PostRow
              key={p.id}
              post={p}
              onPress={() => navigation.navigate('ExpandedPost', { postId: p.id })}
            />
          ))}
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
    <TouchableOpacity style={styles.row} onPress={onPress}>
      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={[styles.avatar, { borderRadius: 10 }]} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder, { borderRadius: 10 }]}>
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

  searchRow: { paddingHorizontal: 16, paddingVertical: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151515',
    borderRadius: 50,
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: 'Barlow_400Regular',
    fontSize: 15,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  filterBtnActive: {
    backgroundColor: 'rgba(99,91,255,0.12)',
  },
  filterBtnText: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    maxWidth: 80,
  },
  filterBtnTextActive: { color: colors.primaryLight },

  // Dropdown modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 140,
    paddingRight: 16,
  },
  dropdown: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minWidth: 180,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  dropdownTitle: {
    fontFamily: 'Barlow_700Bold',
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginBottom: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dropdownItemText: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
  dropdownItemTextActive: { color: '#fff' },
  clearFiltersBtn: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  clearFiltersText: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 13,
    color: '#FF4D6A',
  },

  sectionTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    letterSpacing: 1,
    color: colors.text,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, resizeMode: 'cover' },
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
  postLikes: { color: '#FF4D6A', fontFamily: 'Barlow_500Medium', fontSize: 12, marginTop: 3 },

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

  stateWrap: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32, gap: 12 },
  stateText: { color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow_400Regular', fontSize: 14, textAlign: 'center' },
});
