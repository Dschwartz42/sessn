import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Image, Alert, ActivityIndicator} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { UserDoc } from '../../types';
import { colors } from '../../utils/theme';
import { getBlockedUsers, unblockUser } from '../../services/blockService';

type Props = { navigation: any };

export default function BlockedUsersScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getBlockedUsers(user.uid)
      .then(setBlocked)
      .finally(() => setLoading(false));
  }, [user]);

  const handleUnblock = (target: UserDoc) => {
    Alert.alert('Unblock', `Unblock @${target.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          await unblockUser(user!.uid, target.uid);
          setBlocked((prev) => prev.filter((u) => u.uid !== target.uid));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BLOCKED USERS</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      ) : blocked.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="ban-outline" size={32} color="rgba(255,255,255,0.3)" />
          </View>
          <Text style={styles.emptyTitle}>No blocked users</Text>
          <Text style={styles.emptyText}>Users you block will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={blocked}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <View style={styles.row}>
              {item.profilePicUrl ? (
                <Image source={{ uri: item.profilePicUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>
                    {(item.username?.[0] ?? '?').toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.username}>@{item.username}</Text>
                {item.displayName ? (
                  <Text style={styles.displayName}>{item.displayName}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.unblockBtn}
                onPress={() => handleUnblock(item)}
              >
                <Text style={styles.unblockBtnText}>Unblock</Text>
              </TouchableOpacity>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}
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
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { color: colors.text, fontFamily: 'Barlow_700Bold', fontSize: 17 },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Barlow_400Regular',
    fontSize: 14,
    textAlign: 'center',
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
  unblockBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.35)',
    backgroundColor: 'rgba(255,80,80,0.08)',
  },
  unblockBtnText: {
    color: '#FF5050',
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 13,
  },
});
