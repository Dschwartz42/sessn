import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, ScrollView, Image, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, radius, typography } from '../../utils/theme';

type Props = { navigation: any };

const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const GENDERS = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'other', label: 'Other' },
  { key: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;

export default function EditProfileScreen({ navigation }: Props) {
  const { user, userDoc } = useAuth();
  const [displayName, setDisplayName] = useState(userDoc?.displayName ?? '');
  const [username, setUsername] = useState(userDoc?.username ?? '');
  const [bio, setBio] = useState(userDoc?.bio ?? '');
  const [email, setEmail] = useState(userDoc?.email ?? '');
  const [phone, setPhone] = useState(userDoc?.phone ?? '');
  const [fitnessLevel, setFitnessLevel] = useState(userDoc?.fitnessLevel ?? 'beginner');
  const [instagramLink, setInstagramLink] = useState(userDoc?.instagramLink ?? '');
  const [gender, setGender] = useState(userDoc?.gender ?? 'prefer_not_to_say');
  const [profilePicUrl, setProfilePicUrl] = useState(userDoc?.profilePicUrl ?? '');
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;

    setSaving(true);
    try {
      const res = await fetch(uri);
      const blob = await res.blob();
      const storageRef = ref(storage, `profilePics/${user?.uid}`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      setProfilePicUrl(url);
    } catch {
      Alert.alert('Error', 'Could not upload image.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        fitnessLevel,
        instagramLink: instagramLink.trim(),
        gender,
        profilePicUrl: profilePicUrl || null,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile picture */}
        <TouchableOpacity style={styles.picSection} onPress={pickImage}>
          {profilePicUrl ? (
            <Image source={{ uri: profilePicUrl }} style={styles.profilePic} />
          ) : (
            <View style={[styles.profilePic, styles.picPlaceholder]}>
              <Ionicons name="person" size={36} color={colors.textSecondary} />
            </View>
          )}
          <Text style={styles.changePicText}>Change Profile Picture</Text>
        </TouchableOpacity>

        <SectionHeader title="Basic Info" />
        <Field label="Name" value={displayName} onChangeText={setDisplayName} />
        <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <Field label="Bio" value={bio} onChangeText={setBio} multiline />

        <SectionHeader title="Contact Info" />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <SectionHeader title="Fitness Level" />
        <View style={styles.chipRow}>
          {FITNESS_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.chip, fitnessLevel === level && styles.chipActive]}
              onPress={() => setFitnessLevel(level)}
            >
              <Text style={[styles.chipText, fitnessLevel === level && styles.chipTextActive]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionHeader title="Social Links" />
        <Field label="Instagram" value={instagramLink} onChangeText={setInstagramLink} autoCapitalize="none" />

        <SectionHeader title="Gender" />
        <View style={styles.chipRow}>
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g.key}
              style={[styles.chip, gender === g.key && styles.chipActive]}
              onPress={() => setGender(g.key)}
            >
              <Text style={[styles.chipText, gender === g.key && styles.chipTextActive]}>{g.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function Field({ label, value, onChangeText, multiline, ...rest }: any) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textDim}
        multiline={multiline}
        {...rest}
      />
    </View>
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
  saveText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: 80 },
  picSection: { alignItems: 'center', paddingVertical: spacing.md, gap: spacing.sm },
  profilePic: { width: 90, height: 90, borderRadius: 45 },
  picPlaceholder: { backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  changePicText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  sectionHeader: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
  },
  field: { gap: 4 },
  fieldLabel: { color: colors.textSecondary, fontSize: 13 },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: 13 },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  saveBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.text, fontWeight: '700', fontSize: 15 },
});
