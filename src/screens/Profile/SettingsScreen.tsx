import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, radius } from '../../utils/theme';

type Props = { navigation: any };

const SETTINGS_ITEMS = [
  { key: 'PersonalDetails', label: 'Personal Details', icon: 'person-outline' },
  { key: 'PasswordSecurity', label: 'Password & Security', icon: 'lock-closed-outline' },
  { key: 'NotificationsSettings', label: 'Notifications', icon: 'notifications-outline' },
  { key: 'AccountPrivacy', label: 'Account Privacy', icon: 'eye-outline' },
  { key: 'BlockedUsers', label: 'Blocked Users', icon: 'ban-outline' },
  { key: 'YourActivity', label: 'Your Activity', icon: 'bar-chart-outline' },
  { key: 'RepostsSettings', label: 'Reposts', icon: 'repeat-outline' },
  { key: 'HelpCenter', label: 'Help Center', icon: 'help-circle-outline' },
  { key: 'AboutSessn', label: 'About Sessn', icon: 'information-circle-outline' },
] as const;

export default function SettingsScreen({ navigation }: Props) {
  const { signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {SETTINGS_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.row}
              onPress={() => navigation.navigate(item.key)}
            >
              <View style={styles.rowIcon}>
                <Ionicons name={item.icon as any} size={20} color={colors.primary} />
              </View>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
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
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 17,
    color: colors.text,
  },
  section: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, color: colors.text, fontFamily: 'Barlow_500Medium', fontSize: 15 },
  logoutBtn: {
    margin: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232, 72, 85, 0.3)',
  },
  logoutText: { color: colors.red, fontFamily: 'Barlow_700Bold', fontSize: 15 },
});
