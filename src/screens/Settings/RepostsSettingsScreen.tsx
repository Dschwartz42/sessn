import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, typography } from '../../utils/theme';

type Props = { navigation: any };

export default function RepostsSettingsScreen({ navigation }: Props) {
  const { user, userDoc } = useAuth();

  const toggle = async (v: boolean) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), { allowReposts: v });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reposts</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Allow others to repost your Sessns</Text>
        <Switch
          value={userDoc?.allowReposts ?? true}
          onValueChange={toggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.text}
        />
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { color: colors.text, fontSize: 15, flex: 1, marginRight: spacing.md },
});
