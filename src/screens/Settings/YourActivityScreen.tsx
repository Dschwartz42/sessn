import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { Post } from '../../types';
import { colors, spacing } from '../../utils/theme';
import { format, startOfMonth } from 'date-fns';

type Props = { navigation: any };

export default function YourActivityScreen({ navigation }: Props) {
  const { user, userDoc } = useAuth();
  const [sessnsThisMonth, setSessnsThisMonth] = useState<number | null>(null);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [likedLoading, setLikedLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const monthStart = Timestamp.fromDate(startOfMonth(new Date()));
    getDocs(
      query(
        collection(db, 'posts'),
        where('authorId', '==', user.uid),
        where('createdAt', '>=', monthStart),
      ),
    ).then((snap) => setSessnsThisMonth(snap.size));

    const loadLiked = async () => {
      try {
        const likedSnap = await getDocs(collection(db, 'users', user.uid, 'likedPosts'));
        const postIds = likedSnap.docs.map((d) => d.id).slice(0, 20);
        const posts = await Promise.all(
          postIds.map(async (pid) => {
            const snap = await getDoc(doc(db, 'posts', pid));
            if (!snap.exists()) return null;
            return { id: snap.id, ...snap.data() } as Post;
          }),
        );
        setLikedPosts(posts.filter(Boolean) as Post[]);
      } finally {
        setLikedLoading(false);
      }
    };
    loadLiked();
  }, [user?.uid]);

  const stats = [
    { label: 'All-Time Sessns', value: `${userDoc?.totalSessns ?? 0}` },
    { label: 'Sessns This Month', value: sessnsThisMonth === null ? '...' : `${sessnsThisMonth}` },
    { label: 'Total Time', value: `${Math.round((userDoc?.totalTimeMinutes ?? 0) / 60)} hrs` },
    { label: 'Current Streak', value: `${userDoc?.currentStreak ?? 0} weeks` },
    {
      label: 'Member Since',
      value: userDoc?.createdAt?.toDate ? format(userDoc.createdAt.toDate(), 'MMM yyyy') : '—',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>YOUR ACTIVITY</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.sectionHeader}>STATS</Text>
        <View style={styles.card}>
          {stats.map((s, idx) => (
            <View key={s.label} style={[styles.row, idx < stats.length - 1 && styles.rowBorder]}>
              <Text style={styles.label}>{s.label}</Text>
              <Text style={styles.value}>{s.value}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>LIKED POSTS</Text>
        <View style={styles.card}>
          {likedLoading ? (
            <View style={styles.centerWrap}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : likedPosts.length === 0 ? (
            <View style={styles.centerWrap}>
              <Ionicons name="heart-outline" size={28} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No liked posts yet.</Text>
            </View>
          ) : (
            likedPosts.map((p, i) => (
              <View key={p.id} style={[styles.likedRow, i < likedPosts.length - 1 && styles.rowBorder]}>
                <Ionicons name="heart" size={14} color="#FF4D6A" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.likedTitle} numberOfLines={1}>{p.title}</Text>
                  <Text style={styles.likedMeta}>
                    {p.authorUsername} · {p.createdAt?.toDate ? format(p.createdAt.toDate(), 'MMM d') : ''}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 26,
    letterSpacing: 2,
    color: colors.text,
  },
  content: { padding: 16, paddingBottom: 120 },
  sectionHeader: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#151515',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  label: { color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow_400Regular', fontSize: 15 },
  value: { color: colors.text, fontFamily: 'Barlow_700Bold', fontSize: 15 },
  centerWrap: { alignItems: 'center', paddingVertical: 28, gap: 10, paddingHorizontal: 20 },
  emptyText: {
    color: 'rgba(255,255,255,0.35)',
    fontFamily: 'Barlow_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  likedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  likedTitle: { color: colors.text, fontFamily: 'Barlow_600SemiBold', fontSize: 14 },
  likedMeta: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow_400Regular', fontSize: 12, marginTop: 2 },
});
