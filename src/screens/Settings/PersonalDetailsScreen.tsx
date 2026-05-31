import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing } from '../../utils/theme';

type Props = { navigation: any };

export default function PersonalDetailsScreen({ navigation }: Props) {
  const { userDoc } = useAuth();

  const fields = [
    { label: 'NAME', value: userDoc?.displayName },
    { label: 'USERNAME', value: `@${userDoc?.username}` },
    { label: 'EMAIL', value: userDoc?.email },
    { label: 'PHONE', value: userDoc?.phone ?? 'Not set' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PERSONAL DETAILS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}>
        <View style={styles.card}>
          {fields.map((f, idx) => (
            <View key={f.label} style={[styles.row, idx < fields.length - 1 && styles.rowBorder]}>
              <Text style={styles.label}>{f.label}</Text>
              <Text style={styles.value}>{f.value ?? '—'}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.editBtnText}>EDIT DETAILS</Text>
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
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  label: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.4)',
  },
  value: {
    color: colors.text,
    fontFamily: 'Barlow_500Medium',
    fontSize: 15,
  },
  editBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  editBtnText: {
    color: '#fff',
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    letterSpacing: 2,
  },
});
