import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing } from '../../utils/theme';

type Props = { navigation: any };

export default function RepostsSettingsScreen({ navigation }: Props) {
  const { user, userDoc } = useAuth();

  const toggle = async (v: boolean) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), { allowReposts: v });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>REPOSTS</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionHeader}>REPOST SETTINGS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Allow Reposts</Text>
              <Text style={styles.desc}>Let others repost your Sessns to their profile</Text>
            </View>
            <Switch
              value={userDoc?.allowReposts ?? true}
              onValueChange={toggle}
              trackColor={{ false: 'rgba(255,255,255,0.06)', true: colors.primary }}
              thumbColor={colors.text}
            />
          </View>
        </View>
      </View>
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
  content: { padding: 16 },
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
    paddingVertical: 16,
    gap: 12,
  },
  label: { color: colors.text, fontFamily: 'Barlow_500Medium', fontSize: 15 },
  desc: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow_400Regular', fontSize: 13, marginTop: 2 },
});
