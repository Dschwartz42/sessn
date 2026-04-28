import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, typography } from '../../utils/theme';

type Props = { navigation: any };

export default function AccountPrivacyScreen({ navigation }: Props) {
  const { user, userDoc } = useAuth();

  const toggles = [
    { key: 'isPublic', label: 'Public Account', invert: true },
    { key: 'showActivityStatus', label: 'Show Activity Status' },
    { key: 'locationSharing', label: 'Location Sharing' },
    { key: 'showStreakToOthers', label: 'Show Streak to Others' },
    { key: 'allowReposts', label: 'Allow Group Posts' },
  ] as const;

  const getVal = (key: string) => {
    if (!userDoc) return false;
    if (key === 'isPublic') return !!(userDoc as any)[key];
    return !!(userDoc as any)[key];
  };

  const handleToggle = async (key: string, value: boolean) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), { [key]: value });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Privacy</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView>
        {toggles.map((t) => (
          <View key={t.key} style={styles.row}>
            <Text style={styles.label}>{t.label}</Text>
            <Switch
              value={getVal(t.key)}
              onValueChange={(v) => handleToggle(t.key, v)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.text}
            />
          </View>
        ))}
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.h3 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { color: colors.text, fontSize: 15 },
});
