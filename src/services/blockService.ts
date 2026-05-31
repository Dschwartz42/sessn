import {
  doc, setDoc, deleteDoc, getDoc, getDocs,
  collection, query, where, serverTimestamp, documentId,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserDoc } from '../types';

export async function blockUser(blockerId: string, blockedId: string) {
  await setDoc(doc(db, 'users', blockerId, 'blockedUsers', blockedId), {
    blockedId,
    createdAt: serverTimestamp(),
  });
}

export async function unblockUser(blockerId: string, blockedId: string) {
  await deleteDoc(doc(db, 'users', blockerId, 'blockedUsers', blockedId));
}

export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', blockerId, 'blockedUsers', blockedId));
  return snap.exists();
}

export async function getBlockedUserIds(uid: string): Promise<string[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'blockedUsers'));
  return snap.docs.map((d) => d.id);
}

export async function getBlockedUsers(uid: string): Promise<UserDoc[]> {
  const ids = await getBlockedUserIds(uid);
  if (ids.length === 0) return [];
  const fetched: UserDoc[] = [];
  for (let i = 0; i < ids.length; i += 30) {
    const chunk = ids.slice(i, i + 30);
    const snap = await getDocs(
      query(collection(db, 'users'), where(documentId(), 'in', chunk))
    );
    snap.docs.forEach((d) => fetched.push({ uid: d.id, ...d.data() } as UserDoc));
  }
  return fetched;
}
