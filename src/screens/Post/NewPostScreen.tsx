import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, ScrollView, Image, Alert, ActivityIndicator,
  Modal, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, radius, typography } from '../../utils/theme';
import { createPost } from '../../services/postService';
import { Post, WorkoutType, ClassType, Exercise, CardioDetails } from '../../types';

type PostType = 'independent' | 'class';

const INDEPENDENT_TYPES: WorkoutType[] = ['Lifting', 'Cardio', 'Sports', 'CrossFit', 'Yoga', 'Recovery'];
const CLASS_TYPES: ClassType[] = ['CrossFit', 'Lifting', 'Cardio', 'Sports', 'Yoga', 'Pilates'];
const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Core', 'Full Body'];
const CARDIO_TYPES = ['Running', 'Cycling', 'Rowing', 'Swimming', 'Elliptical', 'Jump Rope', 'HIIT', 'Other'];
const SPORTS = ['Basketball', 'Soccer', 'Tennis', 'Baseball', 'Football', 'Golf', 'Volleyball', 'Hockey', 'Other'];

type Props = { navigation: any };

export default function NewPostScreen({ navigation }: Props) {
  const { user, userDoc } = useAuth();
  const [postType, setPostType] = useState<PostType>('independent');
  const [step, setStep] = useState<'basic' | 'details'>('basic');
  const [selectedTypes, setSelectedTypes] = useState<WorkoutType[]>([]);
  const [selectedClassType, setSelectedClassType] = useState<ClassType | null>(null);
  const [saving, setSaving] = useState(false);
  const [showWorkoutChoice, setShowWorkoutChoice] = useState(false);

  // Basic info
  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('');
  const [caption, setCaption] = useState('');
  const [duration, setDuration] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Independent details
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [includeWarmup, setIncludeWarmup] = useState(false);
  const [warmup, setWarmup] = useState('');
  const [includeCardio, setIncludeCardio] = useState(false);
  const [cardioType, setCardioType] = useState('Running');
  const [cardioDuration, setCardioDuration] = useState('');
  const [cardioDistance, setCardioDistance] = useState('');
  const [cardioTiming, setCardioTiming] = useState<'before' | 'after'>('after');
  const [includeInstructions, setIncludeInstructions] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [saveWorkout, setSaveWorkout] = useState(false);
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [sport, setSport] = useState('');

  // Class details
  const [className, setClassName] = useState('');
  const [classDescription, setClassDescription] = useState('');
  const [starRating, setStarRating] = useState(0);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const fetchLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow location access to geotag your Sessn.'); return; }
    const loc = await Location.getCurrentPositionAsync({});
    setGeoLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    const [address] = await Location.reverseGeocodeAsync(loc.coords);
    if (address) setLocationName(`${address.city ?? ''}, ${address.region ?? ''}`.trim().replace(/^,\s*/, ''));
  };

  const toggleType = (t: WorkoutType) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const addExercise = () => {
    setExercises((prev) => [...prev, { name: '', sets: 3, reps: 10, weight: 0, isBodyweight: false }]);
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)));
  };

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!user || !userDoc) return;
    if (!title.trim()) { Alert.alert('Error', 'Please add a title.'); return; }
    if (postType === 'independent' && selectedTypes.length === 0) {
      Alert.alert('Error', 'Please select at least one workout type.');
      return;
    }
    if (postType === 'class' && !selectedClassType) {
      Alert.alert('Error', 'Please select a class type.');
      return;
    }

    setSaving(true);
    try {
      let uploadedUrl: string | undefined;
      if (imageUri) {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}`);
        await uploadBytes(storageRef, blob);
        uploadedUrl = await getDownloadURL(storageRef);
      }

      const cardioData: CardioDetails | undefined = includeCardio
        ? {
            type: cardioType,
            durationMinutes: parseInt(cardioDuration) || 0,
            distance: cardioDistance ? parseFloat(cardioDistance) : undefined,
            distanceUnit: 'miles',
            timing: cardioTiming,
            instructions: undefined,
          }
        : undefined;

      const postData: Omit<Post, 'id' | 'likeCount' | 'repostCount' | 'saveCount' | 'createdAt'> = {
        authorId: user.uid,
        authorUsername: userDoc.username,
        authorPicUrl: userDoc.profilePicUrl,
        type: postType,
        workoutTypes: postType === 'independent' ? selectedTypes : [selectedClassType as WorkoutType],
        title: title.trim(),
        caption: caption.trim() || undefined,
        imageUrl: uploadedUrl,
        location: locationName && geoLocation ? { name: locationName, ...geoLocation } : undefined,
        durationMinutes: parseInt(duration) || 0,
        exercises: postType === 'independent' && selectedTypes.includes('Lifting') ? exercises : undefined,
        cardio: cardioData,
        classDetails: postType === 'class'
          ? { name: className.trim(), rating: starRating, description: classDescription.trim() }
          : undefined,
        muscleGroups: muscleGroups.length > 0 ? muscleGroups : undefined,
        warmupDescription: includeWarmup ? warmup.trim() : undefined,
        workoutInstructions: includeInstructions ? instructions.trim() : undefined,
      };

      await createPost(postData);
      Alert.alert('Posted!', 'Your Sessn has been shared.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const needsLifting = selectedTypes.includes('Lifting');
  const needsCardioSection = selectedTypes.includes('Cardio') && postType === 'independent';
  const needsSports = selectedTypes.includes('Sports');
  const needsYogaEtc = selectedTypes.some((t) => ['Yoga', 'CrossFit', 'Recovery'].includes(t));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Sessn</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Post type toggle */}
      <View style={styles.typeToggle}>
        {(['independent', 'class'] as PostType[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeBtn, postType === t && styles.typeBtnActive]}
            onPress={() => { setPostType(t); setStep('basic'); setSelectedTypes([]); setSelectedClassType(null); }}
          >
            <Text style={[styles.typeBtnText, postType === t && styles.typeBtnTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {step === 'basic' ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Workout type selection */}
          {postType === 'independent' && (
            <>
              <Text style={styles.sectionLabel}>Workout Type (select all that apply)</Text>
              <View style={styles.chipRow}>
                {INDEPENDENT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, selectedTypes.includes(t) && styles.chipActive]}
                    onPress={() => toggleType(t)}
                  >
                    <Text style={[styles.chipText, selectedTypes.includes(t) && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {postType === 'class' && (
            <>
              <Text style={styles.sectionLabel}>Class Type</Text>
              <View style={styles.chipRow}>
                {CLASS_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, selectedClassType === t && styles.chipActive]}
                    onPress={() => setSelectedClassType(t)}
                  >
                    <Text style={[styles.chipText, selectedClassType === t && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Class-only fields */}
          {postType === 'class' && (
            <>
              <FieldInput label="Class Name" value={className} onChange={setClassName} />
              <Text style={styles.sectionLabel}>Star Rating</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setStarRating(s)}>
                    <Ionicons
                      name={s <= starRating ? 'star' : 'star-outline'}
                      size={28}
                      color={s <= starRating ? colors.orange : colors.textDim}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <FieldInput label="Description" value={classDescription} onChange={setClassDescription} multiline />
            </>
          )}

          <FieldInput label="Post Title" value={title} onChange={setTitle} />
          <FieldInput label="Caption (optional)" value={caption} onChange={setCaption} multiline />
          <FieldInput label="Duration (minutes)" value={duration} onChange={setDuration} keyboardType="numeric" />

          {/* Location */}
          <TouchableOpacity style={styles.locationBtn} onPress={fetchLocation}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={styles.locationBtnText}>
              {locationName || 'Add Location'}
            </Text>
          </TouchableOpacity>

          {/* Photo */}
          <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={32} color={colors.textDim} />
                <Text style={styles.photoText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Tag users (optional field) */}
          <FieldInput label="Tag users (optional)" value={''} onChange={() => {}} placeholder="@username" />

          {postType === 'independent' && (
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => {
                if (selectedTypes.length === 0) { Alert.alert('Error', 'Select at least one workout type.'); return; }
                setShowWorkoutChoice(true);
              }}
            >
              <Text style={styles.nextBtnText}>Next — Workout Details</Text>
            </TouchableOpacity>
          )}

          {postType === 'class' && (
            <TouchableOpacity style={styles.nextBtn} onPress={handlePost} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.text} /> : <Text style={styles.nextBtnText}>Post Sessn</Text>}
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        /* Workout Details step */
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Lifting section */}
          {needsLifting && (
            <>
              <Text style={styles.sectionLabel}>Muscle Groups</Text>
              <View style={styles.chipRow}>
                {MUSCLE_GROUPS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.chip, muscleGroups.includes(m) && styles.chipActive]}
                    onPress={() => setMuscleGroups((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m])}
                  >
                    <Text style={[styles.chipText, muscleGroups.includes(m) && styles.chipTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Toggle label="Include Warmup" value={includeWarmup} onToggle={setIncludeWarmup} />
              {includeWarmup && (
                <FieldInput label="Warmup Description" value={warmup} onChange={setWarmup} multiline />
              )}

              <Text style={styles.sectionLabel}>Exercises</Text>
              {exercises.map((ex, i) => (
                <View key={i} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Exercise name"
                      placeholderTextColor={colors.textDim}
                      value={ex.name}
                      onChangeText={(v) => updateExercise(i, 'name', v)}
                    />
                    <TouchableOpacity onPress={() => removeExercise(i)}>
                      <Ionicons name="close-circle" size={22} color={colors.red} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.exerciseRow}>
                    <SmallInput
                      label="Sets"
                      value={String(ex.sets)}
                      onChange={(v) => updateExercise(i, 'sets', parseInt(v) || 0)}
                    />
                    <SmallInput
                      label="Reps"
                      value={String(ex.reps)}
                      onChange={(v) => updateExercise(i, 'reps', parseInt(v) || 0)}
                    />
                    <SmallInput
                      label="Weight (lbs)"
                      value={String(ex.weight ?? 0)}
                      onChange={(v) => updateExercise(i, 'weight', parseFloat(v) || 0)}
                    />
                  </View>
                  <Toggle
                    label="Bodyweight"
                    value={ex.isBodyweight}
                    onToggle={(v) => updateExercise(i, 'isBodyweight', v)}
                  />
                </View>
              ))}
              <TouchableOpacity style={styles.addExerciseBtn} onPress={addExercise}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.addExerciseText}>Add Exercise</Text>
              </TouchableOpacity>

              <Toggle label="Include Cardio" value={includeCardio} onToggle={setIncludeCardio} />
            </>
          )}

          {/* Cardio section */}
          {(needsCardioSection || (needsLifting && includeCardio)) && (
            <>
              <Text style={styles.sectionLabel}>Cardio Type</Text>
              <View style={styles.chipRow}>
                {CARDIO_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, cardioType === t && styles.chipActive]}
                    onPress={() => setCardioType(t)}
                  >
                    <Text style={[styles.chipText, cardioType === t && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.rowInputs}>
                <FieldInput label="Duration (min)" value={cardioDuration} onChange={setCardioDuration} keyboardType="numeric" />
                <FieldInput label="Distance (optional)" value={cardioDistance} onChange={setCardioDistance} keyboardType="numeric" />
              </View>
              {needsLifting && (
                <>
                  <Text style={styles.sectionLabel}>Timing</Text>
                  <View style={styles.chipRow}>
                    {(['before', 'after'] as const).map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.chip, cardioTiming === t && styles.chipActive]}
                        onPress={() => setCardioTiming(t)}
                      >
                        <Text style={[styles.chipText, cardioTiming === t && styles.chipTextActive]}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </>
          )}

          {/* Sports section */}
          {needsSports && (
            <>
              <Text style={styles.sectionLabel}>Sport</Text>
              <View style={styles.chipRow}>
                {SPORTS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, sport === s && styles.chipActive]}
                    onPress={() => setSport(s)}
                  >
                    <Text style={[styles.chipText, sport === s && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Yoga/CrossFit/Recovery description */}
          {needsYogaEtc && (
            <FieldInput label="Workout Description" value={workoutDescription} onChange={setWorkoutDescription} multiline />
          )}

          {/* Shared toggles (show once even if multiple types selected) */}
          {!needsLifting && (
            <>
              <Toggle label="Include Warmup" value={includeWarmup} onToggle={setIncludeWarmup} />
              {includeWarmup && (
                <FieldInput label="Warmup Description" value={warmup} onChange={setWarmup} multiline />
              )}
            </>
          )}

          <Toggle label="Include Workout Instructions" value={includeInstructions} onToggle={setIncludeInstructions} />
          {includeInstructions && (
            <FieldInput label="Instructions" value={instructions} onChange={setInstructions} multiline />
          )}

          <Toggle label="Save as Workout Template" value={saveWorkout} onToggle={setSaveWorkout} />

          <TouchableOpacity style={styles.nextBtn} onPress={handlePost} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.text} /> : <Text style={styles.nextBtnText}>Post Sessn</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* New vs Saved workout choice modal */}
      {showWorkoutChoice && (
        <Modal transparent animationType="slide" visible onRequestClose={() => setShowWorkoutChoice(false)}>
          <TouchableWithoutFeedback onPress={() => setShowWorkoutChoice(false)}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.choicePanel}>
            <View style={styles.choiceHandle} />
            <TouchableOpacity
              style={styles.choiceBtn}
              onPress={() => { setShowWorkoutChoice(false); setStep('details'); }}
            >
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              <Text style={styles.choiceBtnText}>New Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.choiceBtn}
              onPress={() => { setShowWorkoutChoice(false); Alert.alert('Coming soon', 'Saved workout templates coming soon.'); }}
            >
              <Ionicons name="bookmark-outline" size={24} color={colors.primary} />
              <Text style={styles.choiceBtnText}>Use Saved Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.choiceCancel}
              onPress={() => setShowWorkoutChoice(false)}
            >
              <Text style={styles.choiceCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function FieldInput({ label, value, onChange, multiline, keyboardType, placeholder }: any) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
      />
    </View>
  );
}

function SmallInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholderTextColor={colors.textDim}
      />
    </View>
  );
}

function Toggle({ label, value, onToggle }: { label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <TouchableOpacity style={styles.toggle} onPress={() => onToggle(!value)}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggleTrack, value && styles.toggleTrackActive]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
      </View>
    </TouchableOpacity>
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
  typeToggle: {
    flexDirection: 'row',
    margin: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: 4,
  },
  typeBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, alignItems: 'center' },
  typeBtnActive: { backgroundColor: colors.primary },
  typeBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  typeBtnTextActive: { color: colors.text },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 120 },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  starRow: { flexDirection: 'row', gap: spacing.sm },
  fieldGroup: { gap: 4 },
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
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationBtnText: { color: colors.text, fontSize: 15 },
  photoBtn: { borderRadius: radius.md, overflow: 'hidden' },
  photoPreview: { width: '100%', height: 200, resizeMode: 'cover' },
  photoPlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  photoText: { color: colors.textDim, fontSize: 15 },
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  nextBtnText: { color: colors.text, fontWeight: '700', fontSize: 16 },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  exerciseRow: { flexDirection: 'row', gap: spacing.sm },
  addExerciseBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  addExerciseText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  rowInputs: { flexDirection: 'row', gap: spacing.sm },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  toggleLabel: { color: colors.text, fontSize: 15 },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: 'center',
    padding: 2,
  },
  toggleTrackActive: { backgroundColor: colors.primary },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.textSecondary,
  },
  toggleThumbActive: { backgroundColor: colors.text, alignSelf: 'flex-end' },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay },
  choicePanel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: 48,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  choiceHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md,
  },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  choiceBtnText: { color: colors.text, fontSize: 16 },
  choiceCancel: { paddingHorizontal: spacing.md, paddingVertical: 18, alignItems: 'center' },
  choiceCancelText: { color: colors.textSecondary, fontSize: 15 },
});
