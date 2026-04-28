import {
  doc, setDoc, deleteDoc, getDoc, serverTimestamp,
  increment, updateDoc, collection, getDocs, query, where,
} from 'firebase/firestore';
import { db } from './firebase';

const followDocId = (followerId: string, followeeId: string) => `${followerId}_${followeeId}`;

export async function followUser(followerId: string, followeeId: string) {
  const id = followDocId(followerId, followeeId);
  await setDoc(doc(db, 'follows', id), {
    followerId,
    followeeId,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'users', followerId), { followingCount: increment(1) });
  await updateDoc(doc(db, 'users', followeeId), { followersCount: increment(1) });
}

export async function unfollowUser(followerId: string, followeeId: string) {
  const id = followDocId(followerId, followeeId);
  await deleteDoc(doc(db, 'follows', id));
  await updateDoc(doc(db, 'users', followerId), { followingCount: increment(-1) });
  await updateDoc(doc(db, 'users', followeeId), { followersCount: increment(-1) });
}

export async function isFollowing(followerId: string, followeeId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'follows', followDocId(followerId, followeeId)));
  return snap.exists();
}

export async function getFollowerIds(uid: string): Promise<string[]> {
  const snap = await getDocs(query(collection(db, 'follows'), where('followeeId', '==', uid)));
  return snap.docs.map((d) => d.data().followerId as string);
}

export async function getFollowingIds(uid: string): Promise<string[]> {
  const snap = await getDocs(query(collection(db, 'follows'), where('followerId', '==', uid)));
  return snap.docs.map((d) => d.data().followeeId as string);
}
