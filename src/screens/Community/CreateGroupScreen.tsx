import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Image, Alert, ActivityIndicator, Switch} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, radius } from '../../utils/theme';
import { createGroup } from '../../services/groupService';

type Props = { navigation: any };

export default function CreateGroupScreen({ navigation }: Props) {
  const { user, userDoc } = useAuth();
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [imageUri, setImageUri] = useState('');
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleCreate = async () => {
    if (!user || !userDoc) return;
    const trimmed = name.trim();
    if (!trimmed) { Alert.alert('Error', 'Please enter a group name.'); return; }
    if (trimmed.length < 3) { Alert.alert('Error', 'Group name must be at least 3 characters.'); return; }

    setSaving(true);
    try {
      let pictureUrl: string | undefined;
      if (imageUri) {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        const storageRef = ref(storage, `groups/${user.uid}/${Date.now()}`);
        await uploadBytes(storageRef, blob);
        pictureUrl = await getDownloadURL(storageRef);
      }

      await createGroup(trimmed, isPrivate, user.uid, userDoc.username, pictureUrl);
      Alert.alert('Group created!', `"${trimmed}" is ready.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not create group. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Group</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group photo */}
        <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="people-outline" size={36} color={colors.textDim} />
              <Text style={styles.photoText}>Add Group Photo</Text>
            </View>
          )}
          <View style={styles.photoBadge}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Group name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>GROUP NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Morning Lifters"
            placeholderTextColor={colors.textDim}
            maxLength={40}
          />
          <Text style={styles.charCount}>{name.length}/40</Text>
        </View>

        {/* Privacy toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Private Group</Text>
            <Text style={styles.toggleDesc}>
              {isPrivate
                ? 'Only invited members can join.'
                : 'Anyone can find and join this group.'}
            </Text>
          </View>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primaryLight} />
          <Text style={styles.infoText}>
            You'll be the group owner and first member. Invite friends by sharing the group link after creating.
          </Text>
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createBtnText}>Create Group</Text>
          )}
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
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: { fontFamily: 'Barlow_600SemiBold', fontSize: 17, color: colors.text },
  content: { padding: spacing.md, gap: spacing.lg, paddingBottom: 120 },

  photoBtn: {
    alignSelf: 'center',
    position: 'relative',
    marginTop: spacing.sm,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoText: { color: colors.textDim, fontFamily: 'Barlow_500Medium', fontSize: 11 },
  photoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },

  fieldGroup: { gap: 6 },
  fieldLabel: {
    color: colors.textDim,
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    color: colors.text,
    fontFamily: 'Barlow_400Regular',
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  charCount: {
    color: colors.textDim,
    fontFamily: 'Barlow_400Regular',
    fontSize: 11,
    alignSelf: 'flex-end',
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  toggleInfo: { flex: 1 },
  toggleLabel: { color: colors.text, fontFamily: 'Barlow_600SemiBold', fontSize: 15 },
  toggleDesc: {
    color: colors.textDim,
    fontFamily: 'Barlow_400Regular',
    fontSize: 12,
    marginTop: 3,
  },

  infoBox: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  infoText: {
    flex: 1,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Barlow_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },

  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  createBtnText: { color: '#fff', fontFamily: 'Barlow_700Bold', fontSize: 16 },
});
