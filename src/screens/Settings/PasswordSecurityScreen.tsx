import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing } from '../../utils/theme';

type Props = { navigation: any };

export default function PasswordSecurityScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!user || !user.email) return;
    if (newPw !== confirmPw) { Alert.alert('Error', 'Passwords do not match.'); return; }
    if (newPw.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      Alert.alert('Success', 'Password updated.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PASSWORD & SECURITY</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>CHANGE PASSWORD</Text>
        <View style={styles.card}>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textDim}
              value={currentPw}
              onChangeText={setCurrentPw}
              secureTextEntry
            />
          </View>
          <View style={[styles.inputWrap, styles.inputWrapBorder]}>
            <Text style={styles.inputLabel}>NEW PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textDim}
              value={newPw}
              onChangeText={setNewPw}
              secureTextEntry
            />
          </View>
          <View style={[styles.inputWrap, styles.inputWrapBorder]}>
            <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textDim}
              value={confirmPw}
              onChangeText={setConfirmPw}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleChangePassword} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>UPDATE PASSWORD</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>TWO-FACTOR AUTHENTICATION</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => Alert.alert('Coming Soon', 'Two-factor authentication will be available in a future update.')}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Enable 2FA</Text>
              <Text style={styles.toggleDesc}>Verify via SMS when logging in</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>SOON</Text>
            </View>
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
    fontSize: 22,
    letterSpacing: 2,
    color: colors.text,
  },
  content: { padding: 16, gap: 12, paddingBottom: 120 },
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
  inputWrap: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputWrapBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  inputLabel: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 8,
  },
  input: {
    color: colors.text,
    fontFamily: 'Barlow_400Regular',
    fontSize: 15,
    paddingVertical: 0,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    letterSpacing: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  toggleLabel: {
    color: colors.text,
    fontFamily: 'Barlow_500Medium',
    fontSize: 15,
  },
  toggleDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Barlow_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(99,91,255,0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(99,91,255,0.3)',
  },
  comingSoonText: {
    color: 'rgba(99,91,255,0.8)',
    fontFamily: 'Barlow_700Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
});
