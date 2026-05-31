import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  serverTimestamp, increment, setDoc, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase';
import { Group, GroupMember } from '../types';

export async function createGroup(
  name: string,
  isPrivate: boolean,
  ownerId: string,
  ownerUsername: string,
  pictureUrl?: string,
): Promise<string> {
  const ref = await addDoc(collection(db, 'groups'), {
    name,
    isPrivate,
    ownerId,
    ownerUsername,
    pictureUrl: pictureUrl ?? null,
    memberCount: 1,
    createdAt: serverTimestamp(),
  });

  const ownerSnap = await getDoc(doc(db, 'users', ownerId));
  const ud = ownerSnap.data() ?? {};

  await Promise.all([
    setDoc(doc(db, 'groups', ref.id, 'members', ownerId), {
      uid: ownerId,
      username: ownerUsername,
      profilePicUrl: ud.profilePicUrl ?? null,
      joinedAt: serverTimestamp(),
      totalSessns: ud.totalSessns ?? 0,
      totalLbsLifted: ud.totalLbsLifted ?? 0,
      totalTimeMinutes: ud.totalTimeMinutes ?? 0,
      currentStreak: ud.currentStreak ?? 0,
    }),
    updateDoc(doc(db, 'users', ownerId), { groupIds: arrayUnion(ref.id) }),
  ]);

  return ref.id;
}

export async function joinGroup(groupId: string, uid: string, username: string, profilePicUrl?: string) {
  const userSnap = await getDoc(doc(db, 'users', uid));
  const ud = userSnap.data() ?? {};

  await Promise.all([
    setDoc(doc(db, 'groups', groupId, 'members', uid), {
      uid,
      username,
      profilePicUrl: profilePicUrl ?? ud.profilePicUrl ?? null,
      joinedAt: serverTimestamp(),
      totalSessns: ud.totalSessns ?? 0,
      totalLbsLifted: ud.totalLbsLifted ?? 0,
      totalTimeMinutes: ud.totalTimeMinutes ?? 0,
      currentStreak: ud.currentStreak ?? 0,
    }),
    updateDoc(doc(db, 'groups', groupId), { memberCount: increment(1) }),
    updateDoc(doc(db, 'users', uid), { groupIds: arrayUnion(groupId) }),
  ]);
}

export async function leaveGroup(groupId: string, uid: string) {
  await Promise.all([
    deleteDoc(doc(db, 'groups', groupId, 'members', uid)),
    updateDoc(doc(db, 'groups', groupId), { memberCount: increment(-1) }),
    updateDoc(doc(db, 'users', uid), { groupIds: arrayRemove(groupId) }),
  ]);
}

export async function getUserGroups(uid: string): Promise<Group[]> {
  const userSnap = await getDoc(doc(db, 'users', uid));
  const groupIds: string[] = userSnap.data()?.groupIds ?? [];

  if (groupIds.length === 0) return [];

  const groups = await Promise.all(
    groupIds.map(async (gid) => {
      const snap = await getDoc(doc(db, 'groups', gid));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Group;
    }),
  );

  return groups.filter(Boolean) as Group[];
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const snap = await getDocs(collection(db, 'groups', groupId, 'members'));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as GroupMember));
}

export async function isMember(groupId: string, uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'groups', groupId, 'members', uid));
  return snap.exists();
}
