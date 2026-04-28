import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../utils/theme';

type Props = { navigation: any };

const FAQS = [
  { q: 'How does the streak work?', a: 'Log at least one Sessn per week to maintain your streak. Streaks are counted in weeks.' },
  { q: 'Can I make my account private?', a: 'Yes — go to Account Privacy in settings and toggle Private Account.' },
  { q: 'How do I join a group?', a: 'Search for a group on the Community page. Public groups can be joined instantly, private groups require approval.' },
  { q: 'Can I delete a post?', a: 'Tap the three dots on any of your posts to access the delete option.' },
];

export default function HelpCenterScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
        <Text style={typography.h3}>FAQs</Text>
        {FAQS.map((f, i) => (
          <View key={i} style={styles.faq}>
            <Text style={styles.question}>{f.q}</Text>
            <Text style={styles.answer}>{f.a}</Text>
          </View>
        ))}
        <View style={styles.links}>
          <TouchableOpacity style={styles.linkRow}>
            <Ionicons name="flag-outline" size={20} color={colors.primary} />
            <Text style={styles.linkText}>Report a Problem</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <Text style={styles.linkText}>Contact Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow}>
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={styles.linkText}>Community Guidelines</Text>
          </TouchableOpacity>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.h3 },
  faq: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  question: { color: colors.text, fontWeight: '700', fontSize: 14 },
  answer: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  links: { gap: spacing.sm },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  linkText: { color: colors.primary, fontSize: 15 },
});
