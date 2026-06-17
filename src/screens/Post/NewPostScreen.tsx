import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  Image, Alert, ActivityIndicator, Modal, TouchableWithoutFeedback,
  Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../utils/theme';
import { createPost, saveWorkoutTemplate, getSavedWorkouts } from '../../services/postService';
import { Post, WorkoutType, ClassType, Exercise, CardioDetails, SavedWorkout } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

type PostType = 'independent' | 'class';

const INDEPENDENT_TYPES: WorkoutType[] = ['Lifting', 'Cardio', 'Sports', 'CrossFit', 'Yoga', 'Recovery'];
const CLASS_TYPES: ClassType[] = ['CrossFit', 'Lifting', 'Cardio', 'Sports', 'Yoga', 'Pilates'];
const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Core', 'Calves'];
const CARDIO_TYPES_LIST = ['Running', 'Cycling', 'Swimming', 'Rowing', 'Stairmaster', 'Elliptical', 'Jump Rope', 'Walking'];

const TYPE_ACCENT: Record<string, string> = {
  Lifting: '#5B8CFF', Cardio: '#5BDB6D', Sports: '#FFB85B',
  CrossFit: '#FF8BA7', Yoga: '#E85BFF', Recovery: '#5BE8D5', Pilates: '#5BE8D5',
};
const TYPE_BG: Record<string, string> = {
  Lifting: 'rgba(91,140,255,0.1)', Cardio: 'rgba(91,219,109,0.1)',
  Sports: 'rgba(255,184,91,0.1)', CrossFit: 'rgba(255,139,167,0.1)',
  Yoga: 'rgba(232,91,255,0.1)', Recovery: 'rgba(91,232,213,0.1)', Pilates: 'rgba(91,232,213,0.1)',
};
const TYPE_BORDER: Record<string, string> = {
  Lifting: 'rgba(91,140,255,0.3)', Cardio: 'rgba(91,219,109,0.3)',
  Sports: 'rgba(255,184,91,0.3)', CrossFit: 'rgba(255,139,167,0.3)',
  Yoga: 'rgba(232,91,255,0.3)', Recovery: 'rgba(91,232,213,0.3)', Pilates: 'rgba(91,232,213,0.3)',
};
const TYPE_ICON: Record<string, any> = {
  Lifting: 'barbell-outline', Cardio: 'flash-outline', Sports: 'basketball-outline',
  CrossFit: 'flame-outline', Yoga: 'body-outline', Recovery: 'leaf-outline', Pilates: 'body-outline',
};

// ─── Local exercise type (for editing UI) ─────────────────────────────────────

interface ExerciseEntry {
  name: string; sets: string; reps: string; weight: string;
  isBodyweight: boolean;
  hasDropset: boolean; dropsetStartSet: string; dropsetReps: string; dropsetLbs: string;
  hasSuperset: boolean; supersetName: string;
}
const emptyExercise = (): ExerciseEntry => ({
  name: '', sets: '3', reps: '10', weight: '', isBodyweight: false,
  hasDropset: false, dropsetStartSet: '', dropsetReps: '', dropsetLbs: '',
  hasSuperset: false, supersetName: '',
});

// ─── Main component ───────────────────────────────────────────────────────────

type Props = { navigation: any };

export default function NewPostScreen({ navigation }: Props) {
  const { user, userDoc } = useAuth();
  const [postType, setPostType] = useState<PostType>('independent');
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);

  // workout type selection
  const [selectedTypes, setSelectedTypes] = useState<WorkoutType[]>([]);
  const [selectedClassType, setSelectedClassType] = useState<ClassType | null>(null);

  // step 1 fields
  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('');
  const [caption, setCaption] = useState('');
  const [duration, setDuration] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [taggedUsers, setTaggedUsers] = useState('');

  // class-specific
  const [className, setClassName] = useState('');
  const [classDescription, setClassDescription] = useState('');
  const [starRating, setStarRating] = useState(0);

  // step 2 fields
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [exerciseEntries, setExerciseEntries] = useState<ExerciseEntry[]>([emptyExercise()]);
  const [includeWarmup, setIncludeWarmup] = useState(true);
  const [warmup, setWarmup] = useState('');
  const [includeCardio, setIncludeCardio] = useState(false);
  const [cardioType, setCardioType] = useState('Running');
  const [cardioDuration, setCardioDuration] = useState('');
  const [cardioDistance, setCardioDistance] = useState('');
  const [cardioTiming, setCardioTiming] = useState<'before' | 'after'>('before');
  const [cardioInstructions, setCardioInstructions] = useState('');
  const [includeInstructions, setIncludeInstructions] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [saveWorkout, setSaveWorkout] = useState(false);
  const [workoutDescription, setWorkoutDescription] = useState('');

  // modals
  const [showWorkoutChoice, setShowWorkoutChoice] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savedSearch, setSavedSearch] = useState('');
  const [previewWorkout, setPreviewWorkout] = useState<SavedWorkout | null>(null);

  // template tracking
  const [selectedTemplateName, setSelectedTemplateName] = useState<string | null>(null);
  const [isUsingTemplate, setIsUsingTemplate] = useState(false);

  const needsLifting = selectedTypes.includes('Lifting');
  const needsCardioOnly = selectedTypes.includes('Cardio') && !selectedTypes.includes('Lifting') && postType === 'independent';
  const needsSports = selectedTypes.includes('Sports');
  const needsYogaEtc = selectedTypes.some((t) => ['Yoga', 'CrossFit', 'Recovery'].includes(t));

  // ── Handlers ────────────────────────────────────────────────────────────────

  const toggleType = (t: WorkoutType) => setSelectedTypes((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);

  const showPhotoOptions = () => {
    const buttons: any[] = [
      { text: 'Take Photo', onPress: async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission needed'); return; }
        const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
        if (!r.canceled) setImageUri(r.assets[0].uri);
      }},
      { text: 'Choose from Library', onPress: async () => {
        const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, quality: 0.8 });
        if (!r.canceled) setImageUri(r.assets[0].uri);
      }},
    ];
    if (imageUri) buttons.push({ text: 'Remove Photo', style: 'destructive', onPress: () => setImageUri('') });
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Photo', undefined, buttons);
  };

  const fetchLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow location access to geotag your Sessn.'); return; }
    const loc = await Location.getCurrentPositionAsync({});
    setGeoLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    const [address] = await Location.reverseGeocodeAsync(loc.coords);
    if (address) setLocationName(`${address.city ?? ''}, ${address.region ?? ''}`.trim().replace(/^,\s*/, ''));
  };

  const updateExercise = (i: number, patch: Partial<ExerciseEntry>) =>
    setExerciseEntries((p) => p.map((e, idx) => idx === i ? { ...e, ...patch } : e));

  const loadSavedWorkouts = async () => {
    if (!user) return;
    setLoadingSaved(true);
    try {
      const saved = await getSavedWorkouts(user.uid);
      setSavedWorkouts(saved);
      setShowWorkoutChoice(false);
      setShowSavedList(true);
    } finally { setLoadingSaved(false); }
  };

  const applyTemplate = (t: SavedWorkout) => {
    setShowSavedList(false);
    if (t.workoutTypes?.length) setSelectedTypes(t.workoutTypes as any);
    if (t.durationMinutes) setDuration(String(t.durationMinutes));
    if (t.exercises) {
      setExerciseEntries(t.exercises.map((ex) => ({
        name: ex.name, sets: String(ex.sets), reps: String(ex.reps),
        weight: '',
        isBodyweight: ex.isBodyweight,
        hasDropset: !!ex.dropset, dropsetStartSet: '', dropsetReps: '', dropsetLbs: '',
        hasSuperset: !!ex.superset, supersetName: ex.superset ?? '',
      })));
    }
    if (t.muscleGroups) setMuscleGroups(t.muscleGroups);
    if (t.warmupDescription) { setIncludeWarmup(true); setWarmup(t.warmupDescription); }
    if (t.workoutInstructions) { setIncludeInstructions(true); setInstructions(t.workoutInstructions); }
    setSelectedTemplateName(t.name ?? t.workoutTypes?.[0] ?? 'Saved Workout');
    setIsUsingTemplate(true);
    setStep(2);
  };

  const buildExercises = (): Exercise[] =>
    exerciseEntries
      .filter((e) => e.name.trim())
      .map((e) => {
        const ex: Record<string, unknown> = {
          name: e.name.trim(),
          sets: parseInt(e.sets) || 0,
          reps: parseInt(e.reps) || 0,
          isBodyweight: e.isBodyweight,
        };
        const w = e.isBodyweight ? undefined : (parseFloat(e.weight) || undefined);
        if (w !== undefined) ex.weight = w;
        if (e.hasDropset) ex.dropset = `Starting on set ${e.dropsetStartSet} • ${e.dropsetReps} reps • ${e.dropsetLbs} lb`;
        if (e.hasSuperset) ex.superset = e.supersetName;
        return ex as unknown as Exercise;
      });

  const handlePost = async () => {
    if (!user || !userDoc) return;
    if (!title.trim()) { Alert.alert('Error', 'Please add a title.'); return; }
    if (!duration.trim() || parseInt(duration) <= 0) { Alert.alert('Error', 'Please enter the workout duration.'); return; }
    if (postType === 'independent' && selectedTypes.length === 0) { Alert.alert('Error', 'Select at least one workout type.'); return; }
    if (postType === 'class') {
      if (!selectedClassType) { Alert.alert('Error', 'Select a class type.'); return; }
      if (!className.trim()) { Alert.alert('Error', 'Enter the class name.'); return; }
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
      const shouldSaveCardio = needsCardioOnly || (needsLifting && includeCardio);
      const cardioData: CardioDetails | undefined = shouldSaveCardio
        ? { type: cardioType, durationMinutes: parseInt(cardioDuration) || 0, timing: cardioTiming,
            ...(cardioDistance ? { distance: parseFloat(cardioDistance), distanceUnit: 'miles' as const } : {}),
            ...(cardioInstructions.trim() ? { instructions: cardioInstructions.trim() } : {}) }
        : undefined;
      const exercises = needsLifting ? buildExercises() : undefined;
      const postData: Omit<Post, 'id' | 'likeCount' | 'repostCount' | 'saveCount' | 'createdAt'> = {
        authorId: user.uid, authorUsername: userDoc.username, authorPicUrl: userDoc.profilePicUrl ?? null,
        type: postType,
        workoutTypes: postType === 'independent' ? selectedTypes : [selectedClassType as WorkoutType],
        split: postType === 'independent' ? (selectedTypes[0] ?? null) : null,
        classType: postType === 'class' ? selectedClassType ?? null : null,
        title: title.trim(), caption: caption.trim() || null,
        imageUrl: uploadedUrl ?? null,
        location: locationName && geoLocation ? { name: locationName, ...geoLocation } : null,
        durationMinutes: parseInt(duration) || 0,
        exercises: exercises ?? null,
        cardio: cardioData ?? null,
        classDetails: postType === 'class'
          ? { name: className.trim(), rating: starRating, description: classDescription.trim() }
          : null,
        muscleGroups: muscleGroups.length > 0 ? muscleGroups : null,
        warmupDescription: includeWarmup && warmup.trim() ? warmup.trim() : null,
        workoutInstructions: includeInstructions && instructions.trim() ? instructions.trim()
          : (needsYogaEtc && workoutDescription.trim() ? workoutDescription.trim() : null),
        taggedUsers: taggedUsers.trim() ? taggedUsers.split(',').map((u) => u.trim()).filter(Boolean) : null,
      } as any;
      await createPost(postData);
      if (saveWorkout && postType === 'independent' && exercises) {
        await saveWorkoutTemplate(user.uid, {
          name: title.trim(),
          workoutTypes: selectedTypes, split: selectedTypes[0], durationMinutes: parseInt(duration) || 0,
          exercises, cardio: cardioData, muscleGroups: muscleGroups.length > 0 ? muscleGroups : undefined,
          warmupDescription: includeWarmup ? warmup.trim() : undefined,
          workoutInstructions: includeInstructions ? instructions.trim() : undefined,
        });
      }
      Alert.alert('Posted!', 'Your Sessn has been shared.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const currentTypes = postType === 'independent' ? INDEPENDENT_TYPES : CLASS_TYPES;
  const isSelected = (t: string) => postType === 'independent' ? selectedTypes.includes(t as WorkoutType) : selectedClassType === t;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerIconBtn} onPress={() => step === 2 ? setStep(1) : navigation.goBack()}>
          <Ionicons name={step === 2 ? 'arrow-back' : 'close'} size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{step === 1 ? 'NEW POST' : 'WORKOUT DETAILS'}</Text>
        <View style={s.headerIconBtn} />
      </View>

      {/* Step indicator */}
      <View style={s.stepBar}>
        <View style={[s.stepSeg, step >= 1 && (step > 1 ? s.stepDone : s.stepActive)]} />
        <View style={[s.stepSeg, step === 2 ? s.stepActive : s.stepInactive]} />
      </View>

      {step === 1 ? (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Workout type grid */}
          <Text style={s.sectionHeading}>Select Workout Type</Text>
          <Text style={s.sectionSub}>Choose one or more that apply to your sessn.</Text>
          <View style={s.typeGrid}>
            {currentTypes.map((t) => {
              const sel = isSelected(t);
              return (
                <TouchableOpacity
                  key={t}
                  style={[s.typeCard, sel && { backgroundColor: TYPE_BG[t], borderColor: TYPE_ACCENT[t] }]}
                  onPress={() => postType === 'independent' ? toggleType(t as WorkoutType) : setSelectedClassType(t as ClassType)}
                  activeOpacity={0.85}
                >
                  <Ionicons name={TYPE_ICON[t]} size={22} color={TYPE_ACCENT[t]} />
                  <Text style={[s.typeCardText, { color: TYPE_ACCENT[t] }]}>{t.toUpperCase()}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Format toggle */}
          <Text style={s.fieldLabel}>FORMAT</Text>
          <View style={s.formatToggle}>
            <TouchableOpacity
              style={[s.formatOption, postType === 'independent' && s.formatOptionActive]}
              onPress={() => { setPostType('independent'); setSelectedTypes([]); setSelectedClassType(null); }}
            >
              <Text style={[s.formatOptionText, postType === 'independent' && s.formatOptionTextActive]}>Independent</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.formatOption, postType === 'class' && s.formatOptionActive]}
              onPress={() => { setPostType('class'); setSelectedTypes([]); setSelectedClassType(null); }}
            >
              <Text style={[s.formatOptionText, postType === 'class' && s.formatOptionTextActive]}>Class</Text>
            </TouchableOpacity>
          </View>

          {/* Class hint card */}
          {postType === 'class' && (
            <View style={s.classHint}>
              <View style={s.classHintIcon}>
                <Ionicons name="people" size={20} color="#fff" />
              </View>
              <Text style={s.classHintText}>
                <Text style={s.classHintBold}>Class mode</Text>
                {'  — just name the class and describe it. No need to log individual exercises.'}
              </Text>
            </View>
          )}

          {/* Form fields */}
          <Text style={s.fieldLabel}>DETAILS</Text>
          <View style={s.fieldsContainer}>
            {postType === 'class' && (
              <>
                <FieldGroup label="CLASS NAME" placeholder="e.g. WOD Throwdown, Spin 45, Hot Yoga..." value={className} onChange={setClassName} />
                <FieldGroup label="TITLE OF POST" placeholder="Name your post..." value={title} onChange={setTitle} />
              </>
            )}
            {postType === 'independent' && (
              <FieldGroup label="TITLE" placeholder="Name your workout..." value={title} onChange={setTitle} />
            )}
            <FieldGroup label="LOCATION" placeholder="Where did you work out?" value={locationName} onChange={setLocationName}
              onIconPress={fetchLocation} icon="location-outline" />
            <FieldGroup label="CAPTION" placeholder={`Say something about this ${postType === 'class' ? 'class' : 'sessn'}...`}
              value={caption} onChange={setCaption} multiline />
            <FieldGroup label={postType === 'class' ? 'CLASS LENGTH' : 'WORKOUT LENGTH'}
              placeholder="e.g. 45 min" value={duration} onChange={setDuration} keyboardType="numeric" />
            {postType === 'class' && (
              <FieldGroup label="DESCRIPTION" placeholder="What did the class involve? Describe the workout, movements, format..."
                value={classDescription} onChange={setClassDescription} multiline large />
            )}
          </View>

          {/* Star rating (class) */}
          {postType === 'class' && (
            <>
              <Text style={[s.fieldLabel, { marginTop: 20 }]}>RATE THE CLASS</Text>
              <View style={s.starRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => setStarRating(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Text style={[s.star, n <= starRating ? s.starFilled : s.starEmpty]}>{n <= starRating ? '★' : '☆'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Photo */}
          <Text style={[s.fieldLabel, { marginTop: 20 }]}>PHOTO</Text>
          <TouchableOpacity style={s.photoUpload} onPress={showPhotoOptions} activeOpacity={0.8}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={s.photoPreview} />
            ) : (
              <>
                <Ionicons name="image-outline" size={36} color="rgba(255,255,255,0.2)" />
                <Text style={s.photoUploadText}>Add a photo</Text>
                <Text style={s.photoUploadHint}>Tap to upload from camera roll</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Tag users */}
          <Text style={[s.fieldLabel, { marginTop: 20 }]}>OPTIONAL</Text>
          <View style={s.fieldsContainer}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldGroupLabel}>TAG USERS</Text>
              <TextInput style={s.fieldInput} value={taggedUsers} onChangeText={setTaggedUsers}
                placeholder="@username" placeholderTextColor="rgba(255,255,255,0.2)"
                autoCapitalize="none" />
              <Text style={s.fieldHelper}>
                {postType === 'class' ? 'Tag friends who were in the class' : 'Tag friends who were part of this sessn'}
              </Text>
            </View>
          </View>

          {/* Next / Post button */}
          <View style={s.btnContainer}>
            {postType === 'independent' ? (
              <TouchableOpacity style={s.mainBtn} activeOpacity={0.85}
                onPress={() => {
                  if (selectedTypes.length === 0) { Alert.alert('Error', 'Select at least one workout type.'); return; }
                  setShowWorkoutChoice(true);
                }}>
                <Text style={s.mainBtnText}>Next — Workout Details</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.mainBtn} activeOpacity={0.85} onPress={handlePost} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.mainBtnText}>Post Sessn</Text>}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      ) : (
        /* ─── Step 2 ─── */
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Using saved workout badge */}
          {isUsingTemplate && selectedTemplateName && (
            <View style={s.templateBadge}>
              <Ionicons name="bookmark" size={16} color="#FFD93D" />
              <Text style={s.templateBadgeText}>
                Using saved workout:{' '}
                <Text style={s.templateBadgeName}>{selectedTemplateName}</Text>
              </Text>
            </View>
          )}

          {/* Lifting section */}
          {needsLifting && (
            <View style={s.sectionCard}>
              <View style={[s.sectionCardHeader, isUsingTemplate && s.sectionCardHeaderBordered]}>
                <View style={s.typeBadge}>
                  <Text style={[s.typeBadgeText, { color: '#5B8CFF' }]}>🏋️ Lifting</Text>
                </View>
                {isUsingTemplate && (
                  <Text style={s.sectionCardSummary}>
                    {[
                      muscleGroups.slice(0, 2).join(' & '),
                      `${exerciseEntries.filter((e) => e.name).length} exercises`,
                    ].filter(Boolean).join(' • ')}
                  </Text>
                )}
              </View>

              {/* Muscle groups */}
              <Text style={s.subLabel}>MUSCLE GROUPS</Text>
              <View style={s.chipGrid}>
                {MUSCLE_GROUPS.map((m) => {
                  const sel = muscleGroups.includes(m);
                  return (
                    <TouchableOpacity key={m}
                      style={[s.chip, sel && { backgroundColor: 'rgba(91,140,255,0.1)', borderColor: 'rgba(91,140,255,0.3)' }]}
                      onPress={() => setMuscleGroups((p) => p.includes(m) ? p.filter((x) => x !== m) : [...p, m])}
                    >
                      <Text style={[s.chipText, sel && { color: '#5B8CFF' }]}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Warmup toggle */}
              <View style={s.toggleRow}>
                <Text style={s.toggleLabel}>Include Warmup</Text>
                <AnimatedToggle value={includeWarmup} onToggle={setIncludeWarmup} activeColor="#5B8CFF" />
              </View>
              {includeWarmup && (
                <View style={s.expandedTextBox}>
                  <Text style={s.expandedBoxLabel}>DESCRIBE YOUR WARMUP</Text>
                  <TextInput style={s.expandedTextInput} value={warmup} onChangeText={setWarmup} multiline
                    placeholder="e.g. 5 min treadmill, arm circles, light bench press..."
                    placeholderTextColor="rgba(255,255,255,0.15)" />
                </View>
              )}

              {/* Exercises */}
              {isUsingTemplate ? (
                <Text style={s.fillWeightsLabel}>Fill in your weights</Text>
              ) : (
                <Text style={[s.subLabel, { marginTop: 4 }]}>EXERCISES</Text>
              )}
              <View style={s.exerciseList}>
                {exerciseEntries.map((ex, i) => (
                  <ExerciseEntryRow key={i} entry={ex} index={i}
                    isLast={i === exerciseEntries.length - 1}
                    isFromTemplate={isUsingTemplate}
                    onChange={(patch) => updateExercise(i, patch)}
                    onRemove={() => setExerciseEntries((p) => p.filter((_, idx) => idx !== i))}
                  />
                ))}
              </View>
              <TouchableOpacity style={s.addExerciseBtn}
                onPress={() => setExerciseEntries((p) => [...p, emptyExercise()])}>
                <Ionicons name="add" size={16} color="#5B8CFF" />
                <Text style={s.addExerciseText}>Add Exercise</Text>
              </TouchableOpacity>

              {/* Cardio toggle */}
              <View style={[s.toggleRow, { paddingTop: 12 }]}>
                <Text style={s.toggleLabel}>Include Cardio</Text>
                <AnimatedToggle value={includeCardio} onToggle={setIncludeCardio} activeColor="#5BDB6D" />
              </View>
              {includeCardio && <CardioBox
                cardioType={cardioType} setCardioType={setCardioType}
                cardioDuration={cardioDuration} setCardioDuration={setCardioDuration}
                cardioDistance={cardioDistance} setCardioDistance={setCardioDistance}
                cardioTiming={cardioTiming} setCardioTiming={setCardioTiming}
                cardioInstructions={cardioInstructions} setCardioInstructions={setCardioInstructions}
                showTiming />}
            </View>
          )}

          {/* Cardio-only section */}
          {needsCardioOnly && (
            <CardioBox
              cardioType={cardioType} setCardioType={setCardioType}
              cardioDuration={cardioDuration} setCardioDuration={setCardioDuration}
              cardioDistance={cardioDistance} setCardioDistance={setCardioDistance}
              cardioTiming={cardioTiming} setCardioTiming={setCardioTiming}
              cardioInstructions={cardioInstructions} setCardioInstructions={setCardioInstructions}
              showTiming={false} standalone />
          )}

          {/* Sports / Yoga / CrossFit description */}
          {(needsSports || needsYogaEtc) && !needsLifting && (
            <View style={s.fieldsContainer}>
              <FieldGroup label="WORKOUT DESCRIPTION" placeholder="Describe what you did..."
                value={workoutDescription} onChange={setWorkoutDescription} multiline large />
            </View>
          )}

          {/* Warmup for non-lifting */}
          {!needsLifting && (
            <View style={s.sectionCard}>
              <View style={s.toggleRow}>
                <Text style={s.toggleLabel}>Include Warmup</Text>
                <AnimatedToggle value={includeWarmup} onToggle={setIncludeWarmup} activeColor="#5B8CFF" />
              </View>
              {includeWarmup && (
                <View style={s.expandedTextBox}>
                  <Text style={s.expandedBoxLabel}>DESCRIBE YOUR WARMUP</Text>
                  <TextInput style={s.expandedTextInput} value={warmup} onChangeText={setWarmup} multiline
                    placeholder="e.g. 5 min treadmill, arm circles..."
                    placeholderTextColor="rgba(255,255,255,0.15)" />
                </View>
              )}
              <View style={[s.toggleRow, { marginTop: needsLifting ? 0 : 0 }]}>
                <Text style={s.toggleLabel}>Include Instructions</Text>
                <AnimatedToggle value={includeInstructions} onToggle={setIncludeInstructions} activeColor="#5B8CFF" />
              </View>
              {includeInstructions && (
                <View style={s.expandedTextBox}>
                  <Text style={s.expandedBoxLabel}>ADD INSTRUCTIONS OR NOTES</Text>
                  <TextInput style={s.expandedTextInput} value={instructions} onChangeText={setInstructions} multiline
                    placeholder="e.g. Rest 60-90 seconds between sets. Focus on form over weight."
                    placeholderTextColor="rgba(255,255,255,0.15)" />
                </View>
              )}
            </View>
          )}

          {/* Instructions for lifting */}
          {needsLifting && (
            <View style={s.sectionCard}>
              <View style={s.toggleRow}>
                <Text style={s.toggleLabel}>Include Instructions</Text>
                <AnimatedToggle value={includeInstructions} onToggle={setIncludeInstructions} activeColor="#5B8CFF" />
              </View>
              {includeInstructions && (
                <View style={s.expandedTextBox}>
                  <Text style={s.expandedBoxLabel}>ADD INSTRUCTIONS OR NOTES</Text>
                  <TextInput style={s.expandedTextInput} value={instructions} onChangeText={setInstructions} multiline
                    placeholder="e.g. Rest 60-90 seconds between sets. Focus on form over weight."
                    placeholderTextColor="rgba(255,255,255,0.15)" />
                </View>
              )}
            </View>
          )}

          {/* Tag users */}
          <Text style={[s.fieldLabel, { marginTop: 4 }]}>OPTIONAL</Text>
          <View style={s.fieldsContainer}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldGroupLabel}>TAG USERS</Text>
              <TextInput style={s.fieldInput} value={taggedUsers} onChangeText={setTaggedUsers}
                placeholder="@username" placeholderTextColor="rgba(255,255,255,0.2)" autoCapitalize="none" />
              <Text style={s.fieldHelper}>Tag friends who were part of this sessn</Text>
            </View>
          </View>

          {/* Save workout checkbox */}
          <TouchableOpacity style={s.saveCheckbox} onPress={() => setSaveWorkout((v) => !v)} activeOpacity={0.8}>
            <View style={[s.checkbox, saveWorkout && s.checkboxChecked]}>
              {saveWorkout && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.checkboxTitle}>Save this workout</Text>
              <Text style={s.checkboxSub}>Add to your saved workouts to use again later</Text>
            </View>
          </TouchableOpacity>

          {/* Post button */}
          <View style={s.btnContainer}>
            <TouchableOpacity style={s.mainBtn} activeOpacity={0.85} onPress={handlePost} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.mainBtnText}>Post Sessn</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ─── Workout Choice Modal ─────────────────────────────────────────── */}
      {showWorkoutChoice && (
        <BottomSheetModal onClose={() => setShowWorkoutChoice(false)}>
          <View style={s.choiceDragHandle} />
          <Text style={s.choiceTitle}>WORKOUT TYPE</Text>
          <Text style={s.choiceSub}>Is this a new workout or one you've saved?</Text>

          <TouchableOpacity style={s.choiceOption}
            onPress={() => { setShowWorkoutChoice(false); setStep(2); }} activeOpacity={0.85}>
            <View style={[s.choiceIconBox, { backgroundColor: 'rgba(99,91,255,0.15)' }]}>
              <Ionicons name="add" size={22} color="#8B85FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.choiceOptionTitle}>New Workout</Text>
              <Text style={s.choiceOptionSub}>Build it from scratch</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>

          <TouchableOpacity style={s.choiceOption} onPress={loadSavedWorkouts}
            disabled={loadingSaved} activeOpacity={0.85}>
            <View style={[s.choiceIconBox, { backgroundColor: 'rgba(255,217,61,0.15)' }]}>
              {loadingSaved
                ? <ActivityIndicator size="small" color="#FFD93D" />
                : <Ionicons name="bookmark-outline" size={22} color="#FFD93D" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.choiceOptionTitle}>Saved Workout</Text>
              <Text style={s.choiceOptionSub}>Use one you've saved before</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        </BottomSheetModal>
      )}

      {/* ─── Saved Workout List Modal ─────────────────────────────────────── */}
      {showSavedList && (
        <Modal transparent animationType="slide" visible onRequestClose={() => setShowSavedList(false)}>
          <View style={s.savedModalContainer}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
              <View style={s.savedModalHeader}>
                <TouchableOpacity style={s.headerIconBtn} onPress={() => setShowSavedList(false)}>
                  <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>SAVED WORKOUTS</Text>
                <View style={s.headerIconBtn} />
              </View>
              <Text style={s.savedSubtitle}>Pick a workout you've saved before</Text>

              <View style={s.savedSearch}>
                <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.35)" />
                <TextInput style={s.savedSearchInput} value={savedSearch} onChangeText={setSavedSearch}
                  placeholder="Search saved workouts..." placeholderTextColor="rgba(255,255,255,0.3)" />
              </View>

              <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }} showsVerticalScrollIndicator={false}>
                {savedWorkouts
                  .filter((w) => !savedSearch || w.workoutTypes?.join(' ').toLowerCase().includes(savedSearch.toLowerCase()))
                  .map((w) => (
                    <SavedWorkoutCard key={w.id} workout={w}
                      onUse={() => applyTemplate(w)}
                      onPreview={() => setPreviewWorkout(w)} />
                  ))}
                {savedWorkouts.length === 0 && (
                  <View style={{ alignItems: 'center', paddingTop: 48 }}>
                    <Ionicons name="bookmark-outline" size={40} color={colors.textDim} />
                    <Text style={{ color: colors.textDim, fontFamily: 'Barlow_400Regular', fontSize: 14, marginTop: 12 }}>
                      No saved workouts yet.{'\n'}Save a workout after posting to use it again.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>
      )}

      {/* ─── Saved Workout Preview Popup ─────────────────────────────────── */}
      {previewWorkout && (
        <BottomSheetModal onClose={() => setPreviewWorkout(null)}>
          <View style={s.choiceDragHandle} />
          <View style={s.previewHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.previewTitle}>{(previewWorkout.name ?? previewWorkout.workoutTypes?.[0] ?? 'Workout').toUpperCase()}</Text>
              <Text style={s.previewSub}>{previewWorkout.durationMinutes} min · {previewWorkout.exercises?.length ?? 0} exercises</Text>
            </View>
            <TouchableOpacity style={s.useThisBtn} onPress={() => { setPreviewWorkout(null); applyTemplate(previewWorkout); }}>
              <Text style={s.useThisBtnText}>Use This</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
            <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
              {(previewWorkout.exercises ?? []).map((ex, i) => (
                <View key={i} style={[s.previewExRow, i === (previewWorkout.exercises?.length ?? 0) - 1 && { borderBottomWidth: 0 }]}>
                  <View style={s.previewNumBadge}>
                    <Text style={s.previewNumText}>{i + 1}</Text>
                  </View>
                  <Text style={s.previewExName}>{ex.name}</Text>
                  <Text style={s.previewExDetail}>
                    {ex.sets}×{ex.reps}{ex.weight ? ` · ${ex.weight}lb` : ex.isBodyweight ? ' · BW' : ''}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </BottomSheetModal>
      )}
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldGroup({ label, placeholder, value, onChange, multiline, large, keyboardType, icon, onIconPress }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[s.fieldGroup, focused && s.fieldGroupFocused]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={s.fieldGroupLabel}>{label}</Text>
        {icon && onIconPress && (
          <TouchableOpacity onPress={onIconPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={icon} size={14} color="rgba(99,91,255,0.6)" />
          </TouchableOpacity>
        )}
      </View>
      <TextInput
        style={[s.fieldInput, multiline && { height: large ? 80 : 52, textAlignVertical: 'top' }]}
        value={value} onChangeText={onChange}
        placeholder={placeholder} placeholderTextColor="rgba(255,255,255,0.2)"
        multiline={multiline} keyboardType={keyboardType ?? 'default'}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
    </View>
  );
}

function AnimatedToggle({ value, onToggle, activeColor }: { value: boolean; onToggle: (v: boolean) => void; activeColor: string }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [value]);
  const knobLeft = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  const trackBg = anim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.12)', activeColor] });
  return (
    <TouchableOpacity onPress={() => onToggle(!value)} activeOpacity={0.8}>
      <Animated.View style={[s.toggleTrack, { backgroundColor: trackBg }]}>
        <Animated.View style={[s.toggleKnob, { left: knobLeft }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

function ExerciseEntryRow({ entry, index, isLast, isFromTemplate, onChange, onRemove }: {
  entry: ExerciseEntry; index: number; isLast: boolean; isFromTemplate: boolean;
  onChange: (p: Partial<ExerciseEntry>) => void; onRemove: () => void;
}) {
  return (
    <View style={[s.exerciseEntry, isLast && { borderBottomWidth: 0 }]}>
      <View style={s.exerciseEntryRow}>
        <View style={s.exNumBadge}><Text style={s.exNumText}>{index + 1}</Text></View>
        <View style={{ flex: 1 }}>
          <TextInput style={s.exNameInput} value={entry.name} onChangeText={(v) => onChange({ name: v })}
            placeholder="Exercise name..." placeholderTextColor="rgba(255,255,255,0.2)" />
          <View style={s.exSRLRow}>
            <MiniField label="SETS" value={entry.sets} onChange={(v) => onChange({ sets: v })} />
            <MiniField label="REPS" value={entry.reps} onChange={(v) => onChange({ reps: v })} />
            <MiniField label="LBS" value={entry.isBodyweight ? 'BW' : entry.weight}
              onChange={(v) => onChange({ weight: v })}
              editable={!entry.isBodyweight}
              accent={entry.isBodyweight ? '#8B85FF' : undefined}
              emptyTemplate={isFromTemplate && !entry.isBodyweight && !entry.weight} />
          </View>
          <View style={s.exChipRow}>
            <ChipBtn label="Bodyweight" active={entry.isBodyweight}
              activeStyle={{ backgroundColor: 'rgba(99,91,255,0.12)', borderColor: 'rgba(99,91,255,0.25)' }}
              activeTextColor="#8B85FF"
              onPress={() => onChange({ isBodyweight: !entry.isBodyweight, weight: !entry.isBodyweight ? 'BW' : '' })} />
            <ChipBtn label="Dropset" active={entry.hasDropset}
              activeStyle={{ backgroundColor: 'rgba(255,165,0,0.12)', borderColor: 'rgba(255,165,0,0.35)' }}
              activeTextColor="#FFA500"
              onPress={() => onChange({ hasDropset: !entry.hasDropset })} />
            <ChipBtn label="Superset" active={entry.hasSuperset}
              activeStyle={{ backgroundColor: 'rgba(0,200,150,0.12)', borderColor: 'rgba(0,200,150,0.35)' }}
              activeTextColor="#00C896"
              onPress={() => onChange({ hasSuperset: !entry.hasSuperset })} />
          </View>
        </View>
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color="rgba(255,255,255,0.15)" />
        </TouchableOpacity>
      </View>

      {entry.hasDropset && (
        <View style={s.dropsetPanel}>
          <Text style={s.dropsetLabel}>DROPSET</Text>
          <View style={s.dropsetFields}>
            <MiniFieldColored label="STARTING ON SET" value={entry.dropsetStartSet}
              onChange={(v) => onChange({ dropsetStartSet: v })} color="#FFA500" />
            <MiniFieldColored label="REPS" value={entry.dropsetReps}
              onChange={(v) => onChange({ dropsetReps: v })} color="#FFA500" />
            <MiniFieldColored label="LBS" value={entry.dropsetLbs}
              onChange={(v) => onChange({ dropsetLbs: v })} color="#FFA500" />
          </View>
        </View>
      )}

      {entry.hasSuperset && (
        <View style={s.supersetPanel}>
          <Text style={s.supersetTag}>SUPERSET WITH</Text>
          <TextInput style={s.supersetNameInput} value={entry.supersetName}
            onChangeText={(v) => onChange({ supersetName: v })}
            placeholder="Exercise name..." placeholderTextColor="rgba(255,255,255,0.15)" />
        </View>
      )}
    </View>
  );
}

function MiniField({ label, value, onChange, editable = true, accent, emptyTemplate }: any) {
  return (
    <View style={[s.miniField, emptyTemplate && s.miniFieldEmptyTemplate]}>
      <Text style={[s.miniFieldLabel, emptyTemplate && s.miniFieldLabelTemplate]}>{label}</Text>
      <TextInput style={[s.miniFieldInput, accent && { color: accent }]}
        value={value} onChangeText={onChange} keyboardType="numeric"
        placeholder={emptyTemplate ? '?' : '—'}
        placeholderTextColor={emptyTemplate ? '#8B85FF' : 'rgba(255,255,255,0.15)'}
        editable={editable} textAlign="center" />
    </View>
  );
}

function MiniFieldColored({ label, value, onChange, color }: any) {
  return (
    <View style={[s.miniField, { flex: 1, borderColor: `${color}26` }]}>
      <Text style={[s.miniFieldLabel, { color: `${color}80` }]}>{label}</Text>
      <TextInput style={[s.miniFieldInput, { color, width: 40 }]}
        value={value} onChangeText={onChange} keyboardType="numeric"
        placeholder="—" placeholderTextColor={`${color}40`} textAlign="center" />
    </View>
  );
}

function ChipBtn({ label, active, activeStyle, activeTextColor, onPress }: any) {
  return (
    <TouchableOpacity style={[s.exChip, active && activeStyle]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[s.exChipText, active && { color: activeTextColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function CardioBox({ cardioType, setCardioType, cardioDuration, setCardioDuration,
  cardioDistance, setCardioDistance, cardioTiming, setCardioTiming,
  cardioInstructions, setCardioInstructions, showTiming, standalone }: any) {
  const Wrapper = standalone ? ({ children }: any) => <View style={s.sectionCard}>{children}</View> : ({ children }: any) => <>{children}</>;
  return (
    <Wrapper>
      <View style={s.cardioBox}>
        <View style={s.cardioBadge}><Text style={s.cardioBadgeText}>CARDIO</Text></View>
        <Text style={s.subLabel}>CARDIO TYPE</Text>
        <View style={s.chipGrid}>
          {CARDIO_TYPES_LIST.map((t) => {
            const sel = cardioType === t;
            return (
              <TouchableOpacity key={t}
                style={[s.chip, sel && { backgroundColor: 'rgba(91,219,109,0.1)', borderColor: 'rgba(91,219,109,0.3)' }]}
                onPress={() => setCardioType(t)}>
                <Text style={[s.chipText, sel && { color: '#5BDB6D' }]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={s.subLabel}>DURATION</Text>
        <View style={s.cardioDurationBox}>
          <TextInput style={s.cardioDurationInput} value={cardioDuration} onChangeText={setCardioDuration}
            keyboardType="numeric" placeholder="e.g. 15 min" placeholderTextColor="rgba(255,255,255,0.2)" />
        </View>
        {showTiming && (
          <>
            <Text style={s.subLabel}>BEFORE OR AFTER WORKOUT</Text>
            <View style={s.timingToggle}>
              {(['before', 'after'] as const).map((t) => (
                <TouchableOpacity key={t} style={[s.timingOption, cardioTiming === t && s.timingOptionActive]}
                  onPress={() => setCardioTiming(t)}>
                  <Text style={[s.timingOptionText, cardioTiming === t && s.timingOptionTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        <Text style={s.subLabel}>OPTIONAL CARDIO INSTRUCTIONS</Text>
        <TextInput style={s.cardioInstrInput} value={cardioInstructions} onChangeText={setCardioInstructions}
          multiline placeholder="e.g. HIIT intervals, steady state, incline walk..."
          placeholderTextColor="rgba(255,255,255,0.2)" />
      </View>
    </Wrapper>
  );
}

function BottomSheetModal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 24, mass: 0.85, stiffness: 230 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 500, duration: 250, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => onClose());
  };
  return (
    <Modal transparent animationType="none" visible onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[s.sheetBackdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>
      <Animated.View style={[s.sheetPanel, { transform: [{ translateY: slideAnim }] }]}>
        {children}
      </Animated.View>
    </Modal>
  );
}

function SavedWorkoutCard({ workout, onUse, onPreview }: { workout: SavedWorkout; onUse: () => void; onPreview: () => void }) {
  const preview = (workout.exercises ?? []).slice(0, 3);
  const extra = (workout.exercises?.length ?? 0) - 3;
  return (
    <View style={s.savedCard}>
      <View style={s.savedCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.savedCardTitle}>{workout.name ?? workout.workoutTypes?.[0] ?? 'Workout'}</Text>
          <Text style={s.savedCardMeta}>
            {[workout.split, `${workout.durationMinutes} min`, `${workout.exercises?.length ?? 0} exercises`]
              .filter(Boolean).join(' · ')}
          </Text>
          {workout.originalAuthorUsername && (
            <Text style={s.savedCardAuthor}>@{workout.originalAuthorUsername}</Text>
          )}
        </View>
      </View>
      {preview.map((ex, i) => (
        <View key={i} style={s.savedExRow}>
          <View style={s.savedExBadge}><Text style={s.savedExBadgeText}>{i + 1}</Text></View>
          <Text style={s.savedExName}>{ex.name}</Text>
          <Text style={s.savedExDetail}>
            {ex.sets}×{ex.reps}{ex.weight ? ` · ${ex.weight}lb` : ex.isBodyweight ? ' · BW' : ''}
          </Text>
        </View>
      ))}
      {extra > 0 && <Text style={s.savedExMore}>+{extra} more exercises</Text>}
      <View style={s.savedCardActions}>
        <TouchableOpacity style={s.viewFullBtn} onPress={onPreview} activeOpacity={0.8}>
          <Text style={s.viewFullBtnText}>View Full Workout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.useThisCardBtn} onPress={onUse} activeOpacity={0.85}>
          <Text style={s.useThisCardBtnText}>Use This</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 26, letterSpacing: 2, color: '#fff' },

  // Step indicator
  stepBar: { flexDirection: 'row', gap: 4, paddingHorizontal: 20, paddingBottom: 16 },
  stepSeg: { flex: 1, height: 3, borderRadius: 3 },
  stepInactive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  stepActive: { backgroundColor: '#8B85FF' },
  stepDone: { backgroundColor: '#635BFF' },

  // Scroll content
  scroll: { paddingBottom: 120 },

  // Section headings
  sectionHeading: { fontFamily: 'Barlow_700Bold', fontSize: 22, color: '#fff', paddingHorizontal: 20, paddingBottom: 4 },
  sectionSub: { fontFamily: 'Barlow_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.45)', paddingHorizontal: 20, paddingBottom: 20 },
  fieldLabel: {
    fontFamily: 'Barlow_700Bold', fontSize: 12, color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase', letterSpacing: 1.5, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },

  // Type grid
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, paddingBottom: 24 },
  typeCard: {
    width: '30.5%', backgroundColor: '#151515', borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.06)', borderRadius: 16,
    paddingVertical: 18, paddingHorizontal: 12,
    alignItems: 'center', gap: 8,
  },
  typeCardText: { fontFamily: 'Barlow_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'center' },

  // Format toggle
  formatToggle: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 24,
    backgroundColor: '#151515', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, overflow: 'hidden',
  },
  formatOption: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  formatOptionActive: {
    backgroundColor: '#635BFF', borderRadius: 12,
    shadowColor: '#635BFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 12,
  },
  formatOptionText: { fontFamily: 'Barlow_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  formatOptionTextActive: { color: '#fff' },

  // Class hint
  classHint: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 0,
    backgroundColor: 'rgba(99,91,255,0.12)', borderWidth: 1, borderColor: 'rgba(99,91,255,0.25)',
    borderRadius: 14, padding: 14,
  },
  classHintIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#635BFF', alignItems: 'center', justifyContent: 'center' },
  classHintText: { flex: 1, fontFamily: 'Barlow_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 18 },
  classHintBold: { fontFamily: 'Barlow_700Bold', color: '#8B85FF' },

  // Fields
  fieldsContainer: { paddingHorizontal: 16, gap: 12 },
  fieldGroup: {
    backgroundColor: '#151515', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, padding: 14,
  },
  fieldGroupFocused: { borderColor: 'rgba(99,91,255,0.25)' },
  fieldGroupLabel: {
    fontFamily: 'Barlow_700Bold', fontSize: 10, textTransform: 'uppercase',
    letterSpacing: 1.5, color: 'rgba(255,255,255,0.3)', marginBottom: 6,
  },
  fieldInput: { fontFamily: 'Barlow_500Medium', fontSize: 15, color: '#fff', padding: 0 },
  fieldHelper: { fontFamily: 'Barlow_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 6 },

  // Star rating
  starRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 16 },
  star: { fontSize: 28 },
  starFilled: { opacity: 1, color: '#FF8C42' },
  starEmpty: { opacity: 0.2, color: '#fff' },

  // Photo upload
  photoUpload: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#151515', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed', borderRadius: 16, padding: 32,
    alignItems: 'center', gap: 10,
  },
  photoPreview: { width: '100%', height: 200, borderRadius: 14, resizeMode: 'cover' },
  photoUploadText: { fontFamily: 'Barlow_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  photoUploadHint: { fontFamily: 'Barlow_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.2)' },

  // Main button
  btnContainer: { padding: 24, paddingBottom: 0 },
  mainBtn: {
    backgroundColor: '#635BFF', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#635BFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 20,
  },
  mainBtnText: { fontFamily: 'Barlow_700Bold', fontSize: 15, color: '#fff', letterSpacing: 0.5 },

  // Template badge (using saved workout)
  templateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 16, marginTop: 4,
    padding: 10, paddingHorizontal: 14,
    backgroundColor: 'rgba(255,217,61,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,217,61,0.3)', borderRadius: 12,
  },
  templateBadgeText: {
    fontFamily: 'Barlow_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.6)', flex: 1,
  },
  templateBadgeName: { fontFamily: 'Barlow_700Bold', color: '#FFD93D' },

  // Fill in weights label
  fillWeightsLabel: {
    fontFamily: 'Barlow_700Bold', fontSize: 12, textTransform: 'uppercase',
    letterSpacing: 1.5, color: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },

  // Section card (Step 2)
  sectionCard: {
    backgroundColor: '#151515', borderRadius: 16, overflow: 'hidden',
    marginHorizontal: 16, marginBottom: 20,
  },
  sectionCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  sectionCardHeaderBordered: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  sectionCardSummary: {
    fontFamily: 'Barlow_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.35)',
    flex: 1, textAlign: 'right',
  },
  typeBadge: {
    backgroundColor: 'rgba(91,140,255,0.1)', borderWidth: 1, borderColor: 'rgba(91,140,255,0.3)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
  },
  typeBadgeText: { fontFamily: 'Barlow_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },

  subLabel: {
    fontFamily: 'Barlow_700Bold', fontSize: 11, textTransform: 'uppercase',
    letterSpacing: 1.2, color: 'rgba(255,255,255,0.3)', paddingHorizontal: 16, paddingBottom: 8,
  },

  // Chips
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  chipText: { fontFamily: 'Barlow_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.5)' },

  // Toggle
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  toggleLabel: { fontFamily: 'Barlow_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, overflow: 'hidden' },
  toggleKnob: { position: 'absolute', top: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },

  // Expanded text box (warmup / instructions)
  expandedTextBox: {
    marginHorizontal: 16, marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 10,
  },
  expandedBoxLabel: {
    fontFamily: 'Barlow_600SemiBold', fontSize: 10, textTransform: 'uppercase',
    letterSpacing: 1.2, color: 'rgba(255,255,255,0.3)', marginBottom: 6,
  },
  expandedTextInput: {
    fontFamily: 'Barlow_500Medium', fontSize: 13, color: '#fff',
    minHeight: 48, padding: 0,
  },

  // Exercise list
  exerciseList: { paddingHorizontal: 16 },
  exerciseEntry: {
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  exerciseEntryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  exNumBadge: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: 'rgba(91,140,255,0.1)', alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  exNumText: { fontFamily: 'BebasNeue_400Regular', fontSize: 14, color: '#5B8CFF' },
  exNameInput: {
    fontFamily: 'Barlow_600SemiBold', fontSize: 14, color: '#fff', padding: 0, marginBottom: 8,
  },
  exSRLRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  miniField: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  miniFieldLabel: { fontFamily: 'Barlow_600SemiBold', fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 },
  miniFieldLabelTemplate: { color: '#8B85FF' },
  miniFieldInput: { fontFamily: 'Barlow_600SemiBold', fontSize: 13, color: '#fff', width: 36, padding: 0 },
  miniFieldEmptyTemplate: { borderColor: 'rgba(99,91,255,0.25)', backgroundColor: 'rgba(99,91,255,0.12)' },
  exChipRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  exChip: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  exChipText: { fontFamily: 'Barlow_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(255,255,255,0.3)' },

  // Dropset panel
  dropsetPanel: {
    marginTop: 6, marginLeft: 36, padding: 8, paddingHorizontal: 10,
    backgroundColor: 'rgba(255,165,0,0.06)', borderWidth: 1,
    borderColor: 'rgba(255,165,0,0.2)', borderRadius: 8,
  },
  dropsetLabel: {
    fontFamily: 'Barlow_600SemiBold', fontSize: 9, textTransform: 'uppercase',
    letterSpacing: 1, color: '#FFA500', marginBottom: 6,
  },
  dropsetFields: { flexDirection: 'row', gap: 6 },

  // Superset panel
  supersetPanel: {
    marginTop: 6, marginLeft: 36, padding: 8, paddingHorizontal: 10,
    backgroundColor: 'rgba(0,200,150,0.06)', borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.2)', borderRadius: 8,
  },
  supersetTag: {
    fontFamily: 'Barlow_600SemiBold', fontSize: 9, textTransform: 'uppercase',
    letterSpacing: 0.8, color: '#00C896',
    backgroundColor: 'rgba(0,200,150,0.12)', borderWidth: 1, borderColor: 'rgba(0,200,150,0.3)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start', marginBottom: 6,
  },
  supersetNameInput: {
    fontFamily: 'Barlow_600SemiBold', fontSize: 13, color: '#fff', padding: 0,
  },

  // Add exercise button
  addExerciseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    margin: 16, padding: 10, borderRadius: 12,
    backgroundColor: 'rgba(91,140,255,0.1)', borderWidth: 1,
    borderColor: 'rgba(91,140,255,0.3)', borderStyle: 'dashed',
  },
  addExerciseText: { fontFamily: 'Barlow_600SemiBold', fontSize: 13, color: '#5B8CFF' },

  // Cardio box
  cardioBox: {
    margin: 0, padding: 14, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 14,
    marginHorizontal: 16, marginBottom: 14,
  },
  cardioBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(91,219,109,0.1)',
    borderWidth: 1, borderColor: 'rgba(91,219,109,0.3)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 3, marginBottom: 12,
  },
  cardioBadgeText: { fontFamily: 'Barlow_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: '#5BDB6D' },
  cardioDurationBox: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 12,
  },
  cardioDurationInput: { fontFamily: 'Barlow_600SemiBold', fontSize: 14, color: '#fff', padding: 0 },
  timingToggle: {
    flexDirection: 'row', backgroundColor: '#151515', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', marginBottom: 12,
  },
  timingOption: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  timingOptionActive: {
    backgroundColor: '#5BDB6D', borderRadius: 10,
    shadowColor: '#5BDB6D', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 12,
  },
  timingOptionText: { fontFamily: 'Barlow_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  timingOptionTextActive: { color: '#fff' },
  cardioInstrInput: {
    fontFamily: 'Barlow_500Medium', fontSize: 13, color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 10,
    minHeight: 48, textAlignVertical: 'top',
  },

  // Save workout checkbox
  saveCheckbox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginTop: 16, padding: 14,
    backgroundColor: '#151515', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 14,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#635BFF', borderColor: '#635BFF' },
  checkboxTitle: { fontFamily: 'Barlow_700Bold', fontSize: 14, color: '#fff' },
  checkboxSub: { fontFamily: 'Barlow_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  // Bottom sheet modal
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheetPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 36, paddingHorizontal: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.6, shadowRadius: 40,
  },
  choiceDragHandle: {
    width: 40, height: 4, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginTop: 12, marginBottom: 8,
  },
  choiceTitle: {
    fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 1.5,
    color: '#fff', textAlign: 'center', marginBottom: 4,
  },
  choiceSub: {
    fontFamily: 'Barlow_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.45)',
    textAlign: 'center', marginBottom: 18,
  },
  choiceOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
    backgroundColor: '#151515', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, marginBottom: 10,
  },
  choiceIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  choiceOptionTitle: { fontFamily: 'Barlow_700Bold', fontSize: 15, color: '#fff' },
  choiceOptionSub: { fontFamily: 'Barlow_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  // Saved workouts modal
  savedModalContainer: { flex: 1, backgroundColor: '#0a0a0a' },
  savedModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  savedSubtitle: {
    fontFamily: 'Barlow_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.45)',
    textAlign: 'center', marginBottom: 12,
  },
  savedSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#151515', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
  },
  savedSearchInput: { flex: 1, fontFamily: 'Barlow_400Regular', fontSize: 14, color: '#fff', padding: 0 },

  // Saved workout card
  savedCard: {
    backgroundColor: '#151515', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, overflow: 'hidden',
  },
  savedCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, paddingBottom: 10 },
  savedCardTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 18, letterSpacing: 0.8, color: '#fff' },
  savedCardMeta: { fontFamily: 'Barlow_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  savedCardAuthor: { fontFamily: 'Barlow_600SemiBold', fontSize: 10, color: '#8B85FF', marginTop: 2 },
  savedExRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  savedExBadge: {
    width: 20, height: 20, borderRadius: 6,
    backgroundColor: 'rgba(99,91,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  savedExBadgeText: { fontFamily: 'BebasNeue_400Regular', fontSize: 11, color: '#8B85FF' },
  savedExName: { flex: 1, fontFamily: 'Barlow_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  savedExDetail: { fontFamily: 'Barlow_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.35)' },
  savedExMore: { fontFamily: 'Barlow_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.3)', paddingHorizontal: 14, paddingVertical: 4 },
  savedCardActions: {
    flexDirection: 'row', gap: 8, padding: 8, paddingHorizontal: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  viewFullBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', borderRadius: 10, paddingVertical: 9, alignItems: 'center',
  },
  viewFullBtnText: { fontFamily: 'Barlow_700Bold', fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  useThisCardBtn: {
    flex: 1, backgroundColor: '#635BFF', borderRadius: 10, paddingVertical: 9, alignItems: 'center',
    shadowColor: '#635BFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 10,
  },
  useThisCardBtnText: { fontFamily: 'Barlow_700Bold', fontSize: 12, color: '#fff' },

  // Preview popup
  previewHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  previewTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 1.2, color: '#fff' },
  previewSub: { fontFamily: 'Barlow_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  useThisBtn: {
    backgroundColor: '#635BFF', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9,
    shadowColor: '#635BFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 10,
  },
  useThisBtnText: { fontFamily: 'Barlow_700Bold', fontSize: 12, color: '#fff' },
  previewExRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  previewNumBadge: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: 'rgba(99,91,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  previewNumText: { fontFamily: 'BebasNeue_400Regular', fontSize: 14, color: '#8B85FF' },
  previewExName: { flex: 1, fontFamily: 'Barlow_600SemiBold', fontSize: 13, color: '#fff' },
  previewExDetail: { fontFamily: 'Barlow_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.4)' },
});
