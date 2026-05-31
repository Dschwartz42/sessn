import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc,
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

export async function createPost(data: Omit<Post, 'id' | 'likeCount' | 'repostCount' | 'saveCount' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'posts'), {
    ...data,
    likeCount: 0,
    repostCount: 0,
    saveCount: 0,
    createdAt: serverTimestamp(),
  });

  const lbs = calcLbs(data.exercises);
  const today = localDateStr();
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return localDateStr(d); })();

  const userRef = doc(db, 'users', data.authorId);
  const userSnap = await getDoc(userRef);
  const ud = userSnap.data() ?? {};

  const lastDate: string | undefined = ud.lastStreakDate;
  const alreadyLoggedToday = lastDate === today;

  let newStreak: number;
  if (alreadyLoggedToday) {
    newStreak = ud.currentStreak ?? 1;
  } else if (lastDate === yesterday) {
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

  if (!alreadyLoggedToday) {
    userUpdate.currentStreak = newStreak;
    userUpdate.longestStreak = newLongest;
    userUpdate.lastStreakDate = today;
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

export async function deletePost(postId: string, authorId: string, durationMinutes: number, exercises?: Exercise[]) {
  const lbs = calcLbs(exercises);
  await deleteDoc(doc(db, 'posts', postId));

  const userRef = doc(db, 'users', authorId);
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
