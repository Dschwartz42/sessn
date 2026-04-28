import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, typography } from '../../utils/theme';

type Props = { navigation: any };

export default function PersonalDetailsScreen({ navigation }: Props) {
  const { userDoc } = useAuth();

  const fields = [
    { label: 'Name', value: userDoc?.displayName },
    { label: 'Username', value: `@${userDoc?.username}` },
    { label: 'Email', value: userDoc?.email },
    { label: 'Phone', value: userDoc?.phone ?? 'Not set' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Details</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView>
        {fields.map((f) => (
          <View key={f.label} style={styles.row}>
            <Text style={styles.label}>{f.label}</Text>
            <Text style={styles.value}>{f.value ?? '—'}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.editBtnText}>Edit Details</Text>
        </TouchableOpacity>
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
    borderBottomColor: colors.background,
  },
  headerTitle: { ...typography.h3 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  label: { color: colors.textSecondary, fontSize: 15 },
  value: { color: colors.text, fontSize: 15, fontWeight: '500' },
  editBtn: {
    margin: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editBtnText: { color: colors.text, fontWeight: '700', fontSize: 15 },
});
