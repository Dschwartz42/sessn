import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TouchableWithoutFeedback, Share, Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../utils/theme';

interface Props {
  type: 'post' | 'profile';
  postId?: string;
  profileUid?: string;
  imageUrl?: string;
  onClose: () => void;
}

export default function ShareSheet({ type, postId, profileUid, imageUrl, onClose }: Props) {
  const link =
    type === 'post'
      ? `https://sessn.app/post/${postId}`
      : `https://sessn.app/profile/${profileUid}`;

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(link);
    Alert.alert('Copied', 'Link copied to clipboard.');
    onClose();
  };

  const handleSendMessage = async () => {
    await Share.share({ message: link });
    onClose();
  };

  const handleSaveToCamera = async () => {
    if (!imageUrl) return;
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow Sessn to access your photos to save images.');
      return;
    }
    try {
      await MediaLibrary.saveToLibraryAsync(imageUrl);
      Alert.alert('Saved', 'Image saved to your camera roll.');
    } catch {
      Alert.alert('Error', 'Could not save image.');
    }
    onClose();
  };

  const handleInstagram = async () => {
    if (!imageUrl) return;
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(imageUrl, { mimeType: 'image/jpeg', dialogTitle: 'Share to Instagram' });
    }
    onClose();
  };

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View style={styles.panel}>
        <View style={styles.handle} />
        <Text style={styles.panelTitle}>{type === 'post' ? 'Share Sessn' : 'Share Profile'}</Text>

        <ShareOption icon="link" label="Copy Link" onPress={handleCopyLink} />
        <ShareOption icon="chatbubble-outline" label="Send as Message" onPress={handleSendMessage} />
        {type === 'post' && imageUrl && (
          <>
            <ShareOption icon="logo-instagram" label="Share to Instagram Story" onPress={handleInstagram} />
            <ShareOption icon="download-outline" label="Save to Camera Roll" onPress={handleSaveToCamera} />
          </>
        )}

        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function ShareOption({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.option} onPress={onPress}>
      <View style={styles.optionIcon}>
        <Ionicons name={icon} size={20} color={colors.text} />
      </View>
      <Text style={styles.optionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay },
  panel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: 48,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  panelTitle: { ...typography.h3, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: { color: colors.text, fontSize: 15 },
  cancelBtn: {
    margin: spacing.md,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
  },
  cancelText: { color: colors.text, fontWeight: '600', fontSize: 15 },
});
