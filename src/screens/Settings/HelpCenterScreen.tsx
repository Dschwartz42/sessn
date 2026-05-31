import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../utils/theme';

type Props = { navigation: any };

const FAQS = [
  { q: 'How does the streak work?', a: 'Log at least one Sessn per week to maintain your streak. Streaks are counted in weeks.' },
  { q: 'Can I make my account private?', a: 'Yes — go to Account Privacy in settings and toggle Private Account.' },
  { q: 'How do I join a group?', a: 'Search for a group on the Community page. Public groups can be joined instantly, private groups require approval.' },
  { q: 'Can I delete a post?', a: 'Tap the three dots (...) on any of your posts to access the delete option.' },
];

const SUPPORT_EMAIL = 'support@sessn.app';

const LINKS: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }[] = [
  {
    icon: 'flag-outline',
    label: 'Report a Problem',
    onPress: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Problem%20Report`),
  },
  {
    icon: 'mail-outline',
    label: 'Contact Support',
    onPress: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`),
  },
  {
    icon: 'document-text-outline',
    label: 'Community Guidelines',
    onPress: () => Alert.alert(
      'Community Guidelines',
      'Be respectful, keep content fitness-related, no spam or harassment. Violations may result in account suspension.',
      [{ text: 'OK' }],
    ),
  },
];

export default function HelpCenterScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HELP CENTER</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>FAQS</Text>
        <View style={styles.card}>
          {FAQS.map((f, i) => (
            <View key={i} style={[styles.faqItem, i < FAQS.length - 1 && styles.faqBorder]}>
              <Text style={styles.question}>{f.q}</Text>
              <Text style={styles.answer}>{f.a}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>SUPPORT</Text>
        <View style={styles.card}>
          {LINKS.map((l, i) => (
            <TouchableOpacity key={l.label} style={[styles.linkRow, i < LINKS.length - 1 && styles.faqBorder]} onPress={l.onPress}>
              <View style={styles.linkIcon}>
                <Ionicons name={l.icon} size={18} color={colors.primary} />
              </View>
              <Text style={styles.linkText}>{l.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
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
  faqItem: { padding: 16 },
  faqBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  question: { color: colors.text, fontFamily: 'Barlow_700Bold', fontSize: 14, marginBottom: 6 },
  answer: { color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow_400Regular', fontSize: 13, lineHeight: 19 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 14,
  },
  linkIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: { flex: 1, color: colors.text, fontFamily: 'Barlow_500Medium', fontSize: 15 },
});
