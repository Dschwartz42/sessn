import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, radius } from '../../utils/theme';

type Props = { navigation: any };

const SETTINGS_SECTIONS = [
  {
    title: 'ACCOUNT',
    items: [
      { key: 'PersonalDetails', label: 'Personal Details', icon: 'person-outline' },
      { key: 'PasswordSecurity', label: 'Password & Security', icon: 'lock-closed-outline' },
      { key: 'AccountPrivacy', label: 'Account Privacy', icon: 'eye-outline' },
    ],
  },
  {
    title: 'ACTIVITY',
    items: [
      { key: 'NotificationsSettings', label: 'Notifications', icon: 'notifications-outline' },
      { key: 'BlockedUsers', label: 'Blocked Users', icon: 'ban-outline' },
      { key: 'YourActivity', label: 'Your Activity', icon: 'bar-chart-outline' },
      { key: 'RepostsSettings', label: 'Reposts', icon: 'repeat-outline' },
    ],
  },
  {
    title: 'SUPPORT',
    items: [
      { key: 'HelpCenter', label: 'Help Center', icon: 'help-circle-outline' },
      { key: 'AboutSessn', label: 'About Sessn', icon: 'information-circle-outline' },
    ],
  },
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {SETTINGS_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.row,
                    idx < section.items.length - 1 && styles.rowBorder,
                  ]}
                  onPress={() => navigation.navigate(item.key)}
                >
                  <View style={styles.rowIcon}>
                    <Ionicons name={item.icon as any} size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

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
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionHeader: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 8,
  },
  sectionCard: {
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
    paddingVertical: 15,
    gap: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, color: colors.text, fontFamily: 'Barlow_500Medium', fontSize: 15 },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#151515',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232,72,85,0.3)',
  },
  logoutText: { color: colors.red, fontFamily: 'Barlow_700Bold', fontSize: 15 },
});
