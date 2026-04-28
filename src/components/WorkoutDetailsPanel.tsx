import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../types';
import { colors, spacing, radius, typography } from '../utils/theme';

interface Props {
  post: Post;
  saved: boolean;
  onSave: () => void;
  onClose: () => void;
}

export default function WorkoutDetailsPanel({ post, saved, onSave, onClose }: Props) {
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View style={styles.panel}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>{post.title}</Text>
          <TouchableOpacity onPress={onSave}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={saved ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {post.type === 'class' && post.classDetails ? (
            <ClassDetails post={post} />
          ) : (
            <IndependentDetails post={post} />
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function IndependentDetails({ post }: { post: Post }) {
  return (
    <View style={styles.content}>
      <InfoRow label="Duration" value={`${post.durationMinutes} min`} />
      {post.muscleGroups && post.muscleGroups.length > 0 && (
        <InfoRow label="Muscles" value={post.muscleGroups.join(', ')} />
      )}
      {post.warmupDescription && (
        <Section title="Warm-up" content={post.warmupDescription} />
      )}
      {post.exercises && post.exercises.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          {post.exercises.map((ex, i) => (
            <View key={i} style={styles.exerciseRow}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <Text style={styles.exerciseStats}>
                {ex.isBodyweight ? 'Bodyweight' : `${ex.weight ?? 0} lbs`} · {ex.sets}×{ex.reps}
              </Text>
              {ex.superset && <Text style={styles.exerciseNote}>Superset: {ex.superset}</Text>}
              {ex.dropset && <Text style={styles.exerciseNote}>Dropset: {ex.dropset}</Text>}
            </View>
          ))}
        </View>
      )}
      {post.cardio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cardio ({post.cardio.timing})</Text>
          <InfoRow label="Type" value={post.cardio.type} />
          <InfoRow label="Duration" value={`${post.cardio.durationMinutes} min`} />
          {post.cardio.distance != null && (
            <InfoRow label="Distance" value={`${post.cardio.distance} ${post.cardio.distanceUnit ?? ''}`} />
          )}
        </View>
      )}
      {post.workoutInstructions && (
        <Section title="Instructions" content={post.workoutInstructions} />
      )}
    </View>
  );
}

function ClassDetails({ post }: { post: Post }) {
  const cls = post.classDetails!;
  return (
    <View style={styles.content}>
      <InfoRow label="Class" value={cls.name} />
      <InfoRow label="Duration" value={`${post.durationMinutes} min`} />
      <View style={styles.starRow}>
        {Array.from({ length: 5 }, (_, i) => (
          <Ionicons
            key={i}
            name={i < cls.rating ? 'star' : 'star-outline'}
            size={18}
            color={i < cls.rating ? colors.orange : colors.textDim}
          />
        ))}
      </View>
      <Text style={styles.classDesc}>{cls.description}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay },
  panel: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '75%',
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderMedium,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  title: { fontFamily: 'Barlow_600SemiBold', fontSize: 18, color: colors.text, flex: 1, marginRight: spacing.md },
  content: { paddingHorizontal: spacing.md, gap: spacing.md },
  section: { gap: spacing.xs },
  sectionTitle: {
    color: colors.textDim,
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  sectionContent: { color: colors.text, fontFamily: 'Barlow_400Regular', fontSize: 14, lineHeight: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { color: colors.textSecondary, fontFamily: 'Barlow_400Regular', fontSize: 14 },
  infoValue: { color: colors.text, fontFamily: 'Barlow_600SemiBold', fontSize: 14 },
  exerciseRow: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xs,
    padding: spacing.sm,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseName: { color: colors.text, fontFamily: 'Barlow_600SemiBold', fontSize: 15 },
  exerciseStats: { color: colors.textSecondary, fontFamily: 'Barlow_400Regular', fontSize: 13 },
  exerciseNote: { color: colors.textDim, fontFamily: 'Barlow_400Regular', fontSize: 12 },
  starRow: { flexDirection: 'row', gap: 4 },
  classDesc: { color: colors.text, fontFamily: 'Barlow_400Regular', fontSize: 14, lineHeight: 20 },
});
