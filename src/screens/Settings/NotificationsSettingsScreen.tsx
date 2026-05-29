import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing } from '../../utils/theme';

type Props = { navigation: any };

export default function NotificationsSettingsScreen({ navigation }: Props) {
  const { user, userDoc } = useAuth();

  const toggles = [
    { key: 'pushEnabled', label: 'Push Notifications', desc: 'Receive push notifications from Sessn' },
    { key: 'likesEnabled', label: 'Likes', desc: 'When someone likes your Sessn' },
    { key: 'repostsEnabled', label: 'Reposts', desc: 'When someone reposts your Sessn' },
    { key: 'followersNotifEnabled', label: 'Followers', desc: 'When someone follows you' },
    { key: 'streakNotifEnabled', label: 'Streak Reminders', desc: 'Reminders to keep your streak alive' },
    { key: 'groupsNotifEnabled', label: 'Group Activity', desc: 'Updates from your groups' },
  ] as const;

  const handleToggle = async (key: string, value: boolean) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), { [key]: value });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.sectionHeader}>PREFERENCES</Text>
        <View style={styles.card}>
          {toggles.map((t, idx) => (
            <View key={t.key} style={[styles.row, idx < toggles.length - 1 && styles.rowBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t.label}</Text>
                <Text style={styles.desc}>{t.desc}</Text>
              </View>
              <Switch
                value={!!(userDoc as any)?.[t.key]}
                onValueChange={(v) => handleToggle(t.key, v)}
                trackColor={{ false: 'rgba(255,255,255,0.06)', true: colors.primary }}
                thumbColor={colors.text}
              />
            </View>
          ))}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  label: { color: colors.text, fontFamily: 'Barlow_500Medium', fontSize: 15 },
  desc: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow_400Regular', fontSize: 13, marginTop: 2 },
});
