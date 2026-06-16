import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post, Exercise, CardioDetails } from '../types';
import { colors } from '../utils/theme';

interface Props {
  post: Post;
  saved: boolean;
  onSave: () => void;
  onClose: () => void;
}

export default function WorkoutDetailsPanel({ post, saved, onSave, onClose }: Props) {
  const split = post.type === 'class'
    ? post.classType
    : post.split ?? post.workoutTypes?.[0] ?? '';
  const exCount = post.exercises?.length ?? 0;
  const subtitleParts = [
    split,
    `${post.durationMinutes} min`,
    exCount > 0 ? `${exCount} exercise${exCount !== 1 ? 's' : ''}` : null,
    post.cardio ? '+ cardio' : null,
  ].filter(Boolean);
  const subtitle = subtitleParts.join(' • ');

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      {/* 3a — Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* 3b — Drop-up panel */}
      <View style={styles.panel}>
        {/* Drag handle */}
        <View style={styles.handleWrapper}>
          <View style={styles.handle} />
        </View>

        {/* 3c — Panel header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{post.title?.toUpperCase()}</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, saved && styles.saveBtnSaved]}
            onPress={onSave}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={16}
              color={saved ? colors.primaryLight : '#fff'}
            />
            <Text style={[styles.saveBtnText, saved && styles.saveBtnTextSaved]}>
              {saved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Class details */}
          {post.type === 'class' && post.classDetails ? (
            <View style={styles.classSection}>
              <View style={styles.starRow}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Ionicons
                    key={i}
                    name={i < post.classDetails!.rating ? 'star' : 'star-outline'}
                    size={16}
                    color={i < post.classDetails!.rating ? colors.orange : colors.textDim}
                  />
                ))}
              </View>
              {post.classDetails.description ? (
                <Text style={styles.classDesc}>{post.classDetails.description}</Text>
              ) : null}
            </View>
          ) : null}

          {/* 3d — Warmup */}
          {post.warmupDescription ? (
            <View style={styles.warmupSection}>
              <Text style={styles.sectionLabel}>WARMUP</Text>
              <Text style={styles.warmupText}>{post.warmupDescription}</Text>
            </View>
          ) : null}

          {/* 3e — Exercise list */}
          {post.exercises && post.exercises.length > 0 ? (
            <View style={styles.exerciseList}>
              {post.exercises.map((ex, i) => (
                <ExerciseItem
                  key={i}
                  exercise={ex}
                  index={i}
                  isLast={i === post.exercises!.length - 1}
                />
              ))}
            </View>
          ) : null}

          {/* 3f — Cardio */}
          {post.cardio ? <CardioSection cardio={post.cardio} /> : null}

          {/* 3g — Instructions */}
          {post.workoutInstructions ? (
            <View style={styles.instructionsSection}>
              <Text style={styles.sectionLabel}>INSTRUCTIONS</Text>
              <Text style={styles.instructionsText}>{post.workoutInstructions}</Text>
            </View>
          ) : null}

          <View style={{ height: 8 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function ExerciseItem({
  exercise,
  index,
  isLast,
}: {
  exercise: Exercise;
  index: number;
  isLast: boolean;
}) {
  return (
    <View style={[styles.exerciseItem, isLast && styles.exerciseItemLast]}>
      <View style={styles.exerciseRow}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberBadgeText}>{index + 1}</Text>
        </View>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseDetail}>
            {exercise.sets} sets × {exercise.reps} reps
          </Text>
        </View>
        {exercise.isBodyweight ? (
          <Text style={styles.exerciseWeight}>BW</Text>
        ) : exercise.weight ? (
          <Text style={styles.exerciseWeight}>{exercise.weight} LB</Text>
        ) : null}
      </View>

      {/* Dropset annotation */}
      {exercise.dropset ? (
        <View style={styles.dropsetBox}>
          <View style={styles.dropsetRow}>
            <Text style={styles.dropsetTag}>DROPSET</Text>
            <Text style={styles.dropsetDetail}>{exercise.dropset}</Text>
          </View>
        </View>
      ) : null}

      {/* Superset annotation */}
      {exercise.superset ? (
        <View style={styles.supersetBox}>
          <Text style={styles.supersetTag}>SUPERSET WITH</Text>
          <View style={styles.supersetPairedRow}>
            <Text style={styles.supersetExName}>{exercise.superset}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function CardioSection({ cardio }: { cardio: CardioDetails }) {
  const timingLabel = cardio.timing === 'after' ? 'After Workout' : 'Before Workout';
  return (
    <View style={styles.cardioSection}>
      <View style={styles.cardioBadge}>
        <Text style={styles.cardioBadgeText}>🏃 Cardio — {timingLabel}</Text>
      </View>
      <View style={styles.cardioStats}>
        <View style={styles.cardioStatCard}>
          <Text style={styles.cardioStatLabel}>TYPE</Text>
          <Text style={styles.cardioStatType}>{cardio.type}</Text>
        </View>
        <View style={styles.cardioStatCard}>
          <Text style={styles.cardioStatLabel}>DURATION</Text>
          <Text style={styles.cardioStatDuration}>
            {cardio.durationMinutes}
            <Text style={styles.cardioStatUnit}> MIN</Text>
          </Text>
        </View>
      </View>
      {cardio.distance != null ? (
        <View style={styles.cardioStats}>
          <View style={styles.cardioStatCard}>
            <Text style={styles.cardioStatLabel}>DISTANCE</Text>
            <Text style={styles.cardioStatType}>
              {cardio.distance} {cardio.distanceUnit ?? ''}
            </Text>
          </View>
        </View>
      ) : null}
      {cardio.instructions ? (
        <>
          <Text style={[styles.cardioStatLabel, { marginTop: 4 }]}>INSTRUCTIONS</Text>
          <Text style={styles.cardioInstructions}>{cardio.instructions}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // 3a Backdrop
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  // 3b Panel
  panel: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
  },
  handleWrapper: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // 3c Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    letterSpacing: 1.5,
    color: '#fff',
  },
  headerSubtitle: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#635BFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#635BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  saveBtnSaved: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(99,91,255,0.25)',
  },
  saveBtnText: {
    fontFamily: 'Barlow_700Bold',
    fontSize: 13,
    color: '#fff',
  },
  saveBtnTextSaved: {
    color: '#8B85FF',
  },

  // Class section
  classSection: {
    marginHorizontal: 20,
    marginTop: 16,
    gap: 8,
  },
  starRow: {
    flexDirection: 'row',
    gap: 4,
  },
  classDesc: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },

  // 3d Warmup
  warmupSection: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
  },
  sectionLabel: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 6,
  },
  warmupText: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },

  // 3e Exercise list
  exerciseList: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  exerciseItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  exerciseItemLast: {
    borderBottomWidth: 0,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(99,91,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 15,
    color: '#8B85FF',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  exerciseDetail: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  exerciseWeight: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 18,
    color: 'rgba(255,255,255,0.6)',
  },

  // Dropset
  dropsetBox: {
    marginTop: 8,
    marginLeft: 42,
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,165,0,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,165,0,0.25)',
    borderRadius: 10,
  },
  dropsetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dropsetTag: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#FFA500',
    backgroundColor: 'rgba(255,165,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,165,0,0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dropsetDetail: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 12,
    color: 'rgba(255,165,0,0.85)',
    flex: 1,
  },

  // Superset
  supersetBox: {
    marginTop: 8,
    marginLeft: 42,
    padding: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,200,150,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.25)',
    borderRadius: 10,
  },
  supersetTag: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#00C896',
    backgroundColor: 'rgba(0,200,150,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  supersetPairedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supersetExName: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 13,
    color: '#fff',
    flex: 1,
  },

  // 3f Cardio
  cardioSection: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(91,219,109,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(91,219,109,0.2)',
    borderRadius: 14,
  },
  cardioBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(91,219,109,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(91,219,109,0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 10,
  },
  cardioBadgeText: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#5BDB6D',
  },
  cardioStats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  cardioStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 10,
    paddingHorizontal: 12,
  },
  cardioStatLabel: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 4,
  },
  cardioStatType: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 14,
    color: '#5BDB6D',
  },
  cardioStatDuration: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    color: '#fff',
  },
  cardioStatUnit: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  cardioInstructions: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 13,
    color: 'rgba(91,219,109,0.8)',
    lineHeight: 20,
    marginTop: 4,
  },

  // 3g Instructions
  instructionsSection: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
  },
  instructionsText: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },
});
