import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  increment, serverTimestamp, setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Exercise, Post } from '../types';

function calcLbs(exercises: Exercise[] = []): number {
  return exercises.reduce((sum, ex) => {
    if (ex.isBodyweight || !ex.weight) return sum;
    return sum + ex.sets * ex.reps * ex.weight;
  }, 0);
}

function localDateStr(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function mondayOfWeek(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return localDateStr(d);
}

export { calcLbs };

export async function createPost(data: Omit<Post, 'id' | 'likeCount' | 'repostCount' | 'saveCount' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'posts'), {
    ...data,
    likeCount: 0,
    repostCount: 0,
    saveCount: 0,
    createdAt: serverTimestamp(),
  });

  const lbs = calcLbs(data.exercises);
  const thisWeek = mondayOfWeek();
  const prevWeek = mondayOfWeek(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  const userRef = doc(db, 'users', data.authorId);
  const userSnap = await getDoc(userRef);
  const ud = userSnap.data() ?? {};

  const lastStreakWeek: string | undefined = ud.lastStreakWeek;
  const alreadyLoggedThisWeek = lastStreakWeek === thisWeek;

  let newStreak: number;
  if (alreadyLoggedThisWeek) {
    newStreak = ud.currentStreak ?? 1;
  } else if (lastStreakWeek === prevWeek) {
    newStreak = (ud.currentStreak ?? 0) + 1;
  } else {
    newStreak = 1;
  }
  const newLongest = Math.max(ud.longestStreak ?? 0, newStreak);

  const userUpdate: Record<string, unknown> = {
    postCount: increment(1),
    totalSessns: increment(1),
    totalTimeMinutes: increment(data.durationMinutes),
    totalLbsLifted: increment(lbs),
  };

  if (!alreadyLoggedThisWeek) {
    userUpdate.currentStreak = newStreak;
    userUpdate.longestStreak = newLongest;
    userUpdate.lastStreakWeek = thisWeek;
  }

  await updateDoc(userRef, userUpdate);

  // Sync GroupMember stats for every group this user belongs to
  const groupIds: string[] = ud.groupIds ?? [];
  await Promise.all(
    groupIds.map((gid) =>
      updateDoc(doc(db, 'groups', gid, 'members', data.authorId), {
        totalSessns: increment(1),
        totalTimeMinutes: increment(data.durationMinutes),
        totalLbsLifted: increment(lbs),
        currentStreak: newStreak,
      }).catch(() => null),
    ),
  );

  return ref.id;
}

export async function deletePost(
  postId: string,
  authorId: string,
  durationMinutes: number,
  exercises?: Exercise[],
  isRepost?: boolean,
  originalPostId?: string,
) {
  const lbs = calcLbs(exercises);
  await deleteDoc(doc(db, 'posts', postId));

  if (isRepost && originalPostId) {
    await updateDoc(doc(db, 'posts', originalPostId), { repostCount: increment(-1) }).catch(() => null);
  }

  const userRef = doc(db, 'users', authorId);
  if (isRepost) {
    await updateDoc(userRef, { postCount: increment(-1) });
  } else {
    await updateDoc(userRef, {
      postCount: increment(-1),
      totalSessns: increment(-1),
      totalTimeMinutes: increment(-durationMinutes),
      totalLbsLifted: increment(-lbs),
    });

    const userSnap = await getDoc(userRef);
    const groupIds: string[] = userSnap.data()?.groupIds ?? [];
    await Promise.all(
      groupIds.map((gid) =>
        updateDoc(doc(db, 'groups', gid, 'members', authorId), {
          totalSessns: increment(-1),
          totalTimeMinutes: increment(-durationMinutes),
          totalLbsLifted: increment(-lbs),
        }).catch(() => null),
      ),
    );
  }
}

export async function updatePost(
  postId: string,
  authorId: string,
  updates: Partial<Pick<Post,
    'title' | 'caption' | 'imageUrl' | 'location' |
    'durationMinutes' | 'exercises' | 'cardio' |
    'muscleGroups' | 'warmupDescription' | 'workoutInstructions' | 'classDetails'
  >>,
  oldDurationMinutes: number,
  oldExercises?: Exercise[],
): Promise<void> {
  // Firestore rejects undefined values — strip them out, keep null (which clears fields)
  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined),
  );
  await updateDoc(doc(db, 'posts', postId), safeUpdates);

  const newDuration = updates.durationMinutes ?? oldDurationMinutes;
  const durationDelta = newDuration - oldDurationMinutes;
  const lbsDelta = calcLbs(updates.exercises ?? oldExercises) - calcLbs(oldExercises);

  if (durationDelta !== 0 || lbsDelta !== 0) {
    const statUpdates: Record<string, unknown> = {};
    if (durationDelta !== 0) statUpdates.totalTimeMinutes = increment(durationDelta);
    if (lbsDelta !== 0) statUpdates.totalLbsLifted = increment(lbsDelta);

    const userRef = doc(db, 'users', authorId);
    await updateDoc(userRef, statUpdates);

    const userSnap = await getDoc(userRef);
    const groupIds: string[] = userSnap.data()?.groupIds ?? [];
    await Promise.all(
      groupIds.map((gid) =>
        updateDoc(doc(db, 'groups', gid, 'members', authorId), statUpdates).catch(() => null),
      ),
    );
  }
}

export async function getSavedWorkouts(uid: string) {
  const snap = await getDocs(collection(db, 'users', uid, 'workouts'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
    id: string;
    workoutTypes: Post['workoutTypes'];
    split?: string;
    durationMinutes: number;
    exercises?: import('../types').Exercise[];
    cardio?: Post['cardio'];
    muscleGroups?: string[];
    warmupDescription?: string;
    workoutInstructions?: string;
  }>;
}

export async function saveWorkoutTemplate(uid: string, data: {
  workoutTypes: Post['workoutTypes'];
  split?: string;
  durationMinutes: number;
  exercises?: Exercise[];
  cardio?: Post['cardio'];
  muscleGroups?: string[];
  warmupDescription?: string;
  workoutInstructions?: string;
}): Promise<void> {
  await addDoc(collection(db, 'users', uid, 'workouts'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function getPost(postId: string): Promise<Post | null> {
  const snap = await getDoc(doc(db, 'posts', postId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Post;
}

export async function likePost(postId: string, uid: string) {
  await setDoc(doc(db, 'posts', postId, 'likes', uid), { uid, createdAt: serverTimestamp() });
  await updateDoc(doc(db, 'posts', postId), { likeCount: increment(1) });
  await setDoc(doc(db, 'users', uid, 'likedPosts', postId), { postId, createdAt: serverTimestamp() });
}

export async function unlikePost(postId: string, uid: string) {
  await deleteDoc(doc(db, 'posts', postId, 'likes', uid));
  await updateDoc(doc(db, 'posts', postId), { likeCount: increment(-1) });
  await deleteDoc(doc(db, 'users', uid, 'likedPosts', postId));
}

export async function isLiked(postId: string, uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'posts', postId, 'likes', uid));
  return snap.exists();
}

export async function savePost(postId: string, uid: string) {
  await setDoc(doc(db, 'users', uid, 'savedPosts', postId), { postId, createdAt: serverTimestamp() });
  await updateDoc(doc(db, 'posts', postId), { saveCount: increment(1) });
}

export async function unsavePost(postId: string, uid: string) {
  await deleteDoc(doc(db, 'users', uid, 'savedPosts', postId));
  await updateDoc(doc(db, 'posts', postId), { saveCount: increment(-1) });
}

export async function isSaved(postId: string, uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', uid, 'savedPosts', postId));
  return snap.exists();
}

export async function repostPost(post: Post, uid: string, username: string, profilePicUrl?: string) {
  await addDoc(collection(db, 'posts'), {
    ...post,
    id: undefined,
    authorId: uid,
    authorUsername: username,
    authorPicUrl: profilePicUrl ?? null,
    isRepost: true,
    originalPostId: post.id,
    originalAuthorId: post.authorId,
    originalAuthorUsername: post.authorUsername,
    likeCount: 0,
    repostCount: 0,
    saveCount: 0,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'posts', post.id), { repostCount: increment(1) });
  await updateDoc(doc(db, 'users', uid), { postCount: increment(1) });
}
