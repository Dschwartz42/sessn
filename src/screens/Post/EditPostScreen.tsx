import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Image, Alert, ActivityIndicator, Switch} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, radius } from '../../utils/theme';
import { getPost, updatePost } from '../../services/postService';
import { Post, Exercise, CardioDetails } from '../../types';

type Props = { navigation: any; route: any };

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Core', 'Full Body'];
const CARDIO_TYPES = ['Running', 'Cycling', 'Rowing', 'Swimming', 'Elliptical', 'Jump Rope', 'HIIT', 'Other'];

export default function EditPostScreen({ navigation, route }: Props) {
  const { postId } = route.params as { postId: string };
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [duration, setDuration] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [locationName, setLocationName] = useState('');
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [warmup, setWarmup] = useState('');
  const [includeWarmup, setIncludeWarmup] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [includeInstructions, setIncludeInstructions] = useState(false);
  // Cardio
  const [cardioType, setCardioType] = useState('Running');
  const [cardioDuration, setCardioDuration] = useState('');
  const [cardioDistance, setCardioDistance] = useState('');
  // Class
  const [className, setClassName] = useState('');
  const [classDescription, setClassDescription] = useState('');
  const [starRating, setStarRating] = useState(0);

  useEffect(() => {
    getPost(postId).then((p) => {
      if (!p) { Alert.alert('Error', 'Post not found.'); navigation.goBack(); return; }
      if (p.authorId !== user?.uid) { Alert.alert('Error', 'You can only edit your own posts.'); navigation.goBack(); return; }
      setPost(p);
      setTitle(p.title ?? '');
      setCaption(p.caption ?? '');
      setDuration(String(p.durationMinutes ?? ''));
      setExistingImageUrl(p.imageUrl ?? '');
      setLocationName(p.location?.name ?? '');
      setGeoLocation(p.location ? { lat: p.location.lat, lng: p.location.lng } : null);
      setMuscleGroups(p.muscleGroups ?? []);
      setExercises(p.exercises ?? []);
      setWarmup(p.warmupDescription ?? '');
      setIncludeWarmup(!!p.warmupDescription);
      setInstructions(p.workoutInstructions ?? '');
      setIncludeInstructions(!!p.workoutInstructions);
      if (p.cardio) {
        setCardioType(p.cardio.type ?? 'Running');
        setCardioDuration(String(p.cardio.durationMinutes ?? ''));
        setCardioDistance(p.cardio.distance != null ? String(p.cardio.distance) : '');
      }
      if (p.classDetails) {
        setClassName(p.classDetails.name ?? '');
        setClassDescription(p.classDetails.description ?? '');
        setStarRating(p.classDetails.rating ?? 0);
      }
      setLoading(false);
    });
  }, [postId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const fetchLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow location access to tag your Sessn.'); return; }
    const loc = await Location.getCurrentPositionAsync({});
    setGeoLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    const [address] = await Location.reverseGeocodeAsync(loc.coords);
    if (address) setLocationName(`${address.city ?? ''}, ${address.region ?? ''}`.trim().replace(/^,\s*/, ''));
  };

  const addExercise = () => setExercises((prev) => [...prev, { name: '', sets: 3, reps: 10, weight: 0, isBodyweight: false }]);
  const updateExercise = (i: number, field: keyof Exercise, value: any) =>
    setExercises((prev) => prev.map((ex, idx) => (idx === i ? { ...ex, [field]: value } : ex)));
  const removeExercise = (i: number) => setExercises((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!post || !user) return;
    if (!title.trim()) { Alert.alert('Error', 'Title cannot be empty.'); return; }
    if (!duration.trim() || parseInt(duration) <= 0) { Alert.alert('Error', 'Please enter a valid duration.'); return; }
    if (post.type === 'class' && !className.trim()) { Alert.alert('Error', 'Class name cannot be empty.'); return; }

    setSaving(true);
    try {
      let imageUrl = existingImageUrl || null;
      if (imageUri) {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        const storageRef = ref(storage, `posts/${user.uid}/${post.id}_edited`);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }

      const hasLifting = post.workoutTypes?.includes('Lifting');
      const hasCardio = post.workoutTypes?.includes('Cardio') || !!post.cardio;

      const cardioData: CardioDetails | null = hasCardio && cardioDuration
        ? {
            type: cardioType,
            durationMinutes: parseInt(cardioDuration) || 0,
            ...(cardioDistance ? { distance: parseFloat(cardioDistance) } : {}),
            distanceUnit: 'miles',
            timing: post.cardio?.timing ?? 'after',
          }
        : (post.cardio ?? null);

      await updatePost(
        post.id,
        user.uid,
        {
          title: title.trim(),
          caption: caption.trim() || null,
          imageUrl,
          location: locationName && geoLocation ? { name: locationName, ...geoLocation } : null,
          durationMinutes: parseInt(duration),
          exercises: hasLifting ? exercises : (post.exercises ?? null),
          cardio: cardioData,
          muscleGroups: muscleGroups.length > 0 ? muscleGroups : null,
          warmupDescription: includeWarmup ? warmup.trim() : null,
          workoutInstructions: includeInstructions ? instructions.trim() : null,
          classDetails: post.type === 'class'
            ? { name: className.trim(), rating: starRating, description: classDescription.trim() }
            : (post.classDetails ?? null),
        } as any,
        post.durationMinutes,
        post.exercises,
      );

      Alert.alert('Saved!', 'Your Sessn has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!post) return null;

  const hasLifting = post.workoutTypes?.includes('Lifting');
  const hasCardio = post.workoutTypes?.includes('Cardio') || !!post.cardio;
  const displayImage = imageUri || existingImageUrl;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Sessn</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Workout type chips — read-only */}
        <View style={styles.typeRow}>
          {(post.workoutTypes ?? []).map((t) => (
            <View key={t} style={styles.typeChip}>
              <Text style={styles.typeChipText}>{t}</Text>
            </View>
          ))}
          <Text style={styles.typeNote}>Type cannot be changed after posting</Text>
        </View>

        {/* Class-specific fields */}
        {post.type === 'class' && (
          <>
            <Field label="Class Name" value={className} onChange={setClassName} />
            <Text style={styles.sectionLabel}>STAR RATING</Text>
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
            <Field label="Description" value={classDescription} onChange={setClassDescription} multiline />
          </>
        )}

        <Field label="Title" value={title} onChange={setTitle} />
        <Field label="Caption (optional)" value={caption} onChange={setCaption} multiline />
        <Field label="Duration (minutes)" value={duration} onChange={setDuration} keyboardType="numeric" />

        {/* Photo */}
        <Text style={styles.sectionLabel}>PHOTO</Text>
        <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
          {displayImage ? (
            <Image source={{ uri: displayImage }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={32} color={colors.textDim} />
              <Text style={styles.photoText}>Change Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Location */}
        <TouchableOpacity style={styles.locationBtn} onPress={fetchLocation}>
          <Ionicons name="location-outline" size={18} color={colors.primary} />
          <Text style={styles.locationBtnText}>{locationName || 'Update Location'}</Text>
          {locationName ? (
            <TouchableOpacity onPress={() => { setLocationName(''); setGeoLocation(null); }}>
              <Ionicons name="close-circle" size={16} color={colors.textDim} />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>

        {/* Muscle Groups */}
        {hasLifting && (
          <>
            <Text style={styles.sectionLabel}>MUSCLE GROUPS</Text>
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
          </>
        )}

        {/* Exercises */}
        {hasLifting && (
          <>
            <Text style={styles.sectionLabel}>EXERCISES</Text>
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
                  <SmallInput label="Sets" value={String(ex.sets)} onChange={(v) => updateExercise(i, 'sets', parseInt(v) || 0)} />
                  <SmallInput label="Reps" value={String(ex.reps)} onChange={(v) => updateExercise(i, 'reps', parseInt(v) || 0)} />
                  <SmallInput label="Weight (lbs)" value={String(ex.weight ?? 0)} onChange={(v) => updateExercise(i, 'weight', parseFloat(v) || 0)} />
                </View>
                <Toggle label="Bodyweight" value={ex.isBodyweight} onToggle={(v) => updateExercise(i, 'isBodyweight', v)} />
              </View>
            ))}
            <TouchableOpacity style={styles.addExerciseBtn} onPress={addExercise}>
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.addExerciseText}>Add Exercise</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Cardio */}
        {hasCardio && (
          <>
            <Text style={styles.sectionLabel}>CARDIO TYPE</Text>
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
              <Field label="Duration (min)" value={cardioDuration} onChange={setCardioDuration} keyboardType="numeric" />
              <Field label="Distance (optional)" value={cardioDistance} onChange={setCardioDistance} keyboardType="numeric" />
            </View>
          </>
        )}

        {/* Warmup */}
        <Toggle label="Include Warmup" value={includeWarmup} onToggle={setIncludeWarmup} />
        {includeWarmup && <Field label="Warmup Description" value={warmup} onChange={setWarmup} multiline />}

        {/* Instructions */}
        <Toggle label="Include Workout Instructions" value={includeInstructions} onToggle={setIncludeInstructions} />
        {includeInstructions && <Field label="Instructions" value={instructions} onChange={setInstructions} multiline />}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, multiline, keyboardType }: any) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        placeholderTextColor={colors.textDim}
      />
    </View>
  );
}

function SmallInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text>
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
  headerTitle: { fontFamily: 'Barlow_600SemiBold', fontSize: 17, color: colors.text },
  saveText: { color: colors.primaryLight, fontFamily: 'Barlow_700Bold', fontSize: 15 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 120 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  typeChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  typeChipText: { color: colors.primaryLight, fontFamily: 'Barlow_600SemiBold', fontSize: 12 },
  typeNote: { color: colors.textDim, fontFamily: 'Barlow_400Regular', fontSize: 11 },
  sectionLabel: {
    color: colors.textDim,
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  starRow: { flexDirection: 'row', gap: spacing.sm },
  fieldGroup: { gap: 6 },
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
  photoBtn: { borderRadius: radius.md, overflow: 'hidden' },
  photoPreview: { width: '100%', height: 200, resizeMode: 'cover', borderRadius: radius.md },
  photoPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  photoText: { color: colors.textDim, fontFamily: 'Barlow_400Regular', fontSize: 14 },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationBtnText: { flex: 1, color: colors.text, fontFamily: 'Barlow_400Regular', fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
  chipText: { color: colors.textSecondary, fontFamily: 'Barlow_500Medium', fontSize: 13 },
  chipTextActive: { color: colors.primaryLight, fontFamily: 'Barlow_600SemiBold' },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  exerciseRow: { flexDirection: 'row', gap: spacing.sm },
  addExerciseBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  addExerciseText: { color: colors.primaryLight, fontFamily: 'Barlow_600SemiBold', fontSize: 15 },
  rowInputs: { flexDirection: 'row', gap: spacing.sm },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  toggleLabel: { color: colors.text, fontFamily: 'Barlow_500Medium', fontSize: 15 },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleTrackActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.textDim },
  toggleThumbActive: { backgroundColor: '#fff', alignSelf: 'flex-end' },
});
