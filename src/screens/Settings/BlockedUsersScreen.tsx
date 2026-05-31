import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../utils/theme';

type Props = { navigation: any };

export default function BlockedUsersScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BLOCKED USERS</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name="ban-outline" size={32} color="rgba(255,255,255,0.3)" />
        </View>
        <Text style={styles.emptyTitle}>No blocked users</Text>
        <Text style={styles.emptyText}>Users you block will appear here.</Text>
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
  emptyTitle: {
    color: colors.text,
    fontFamily: 'Barlow_700Bold',
    fontSize: 17,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Barlow_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
});
