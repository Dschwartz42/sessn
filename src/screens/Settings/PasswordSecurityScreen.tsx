import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, Switch, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, typography, radius } from '../../utils/theme';

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Password & Security</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
        <Text style={typography.h3}>Change Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Current password"
          placeholderTextColor={colors.textDim}
          value={currentPw}
          onChangeText={setCurrentPw}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="New password"
          placeholderTextColor={colors.textDim}
          value={newPw}
          onChangeText={setNewPw}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm new password"
          placeholderTextColor={colors.textDim}
          value={confirmPw}
          onChangeText={setConfirmPw}
          secureTextEntry
        />
        <TouchableOpacity style={styles.btn} onPress={handleChangePassword} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.btnText}>Update Password</Text>}
        </TouchableOpacity>

        <Text style={[typography.h3, { marginTop: spacing.lg }]}>Two-Factor Authentication</Text>
        <Text style={typography.bodySecondary}>
          Enable 2FA for additional account security. When logging in, you'll also need to verify via SMS.
        </Text>
        <View style={styles.row}>
          <Text style={styles.label}>Enable 2FA</Text>
          <Switch trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.text} value={false} />
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
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  label: { color: colors.text, fontSize: 15 },
});
