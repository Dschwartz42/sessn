import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, where, serverTimestamp, increment, setDoc,
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
  await setDoc(doc(db, 'groups', ref.id, 'members', ownerId), {
    uid: ownerId,
    username: ownerUsername,
    joinedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function joinGroup(groupId: string, uid: string, username: string, profilePicUrl?: string) {
  await setDoc(doc(db, 'groups', groupId, 'members', uid), {
    uid,
    username,
    profilePicUrl: profilePicUrl ?? null,
    joinedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'groups', groupId), { memberCount: increment(1) });
}

export async function leaveGroup(groupId: string, uid: string) {
  await deleteDoc(doc(db, 'groups', groupId, 'members', uid));
  await updateDoc(doc(db, 'groups', groupId), { memberCount: increment(-1) });
}

export async function getUserGroups(uid: string): Promise<Group[]> {
  // Find all groups where uid is a member by checking sub-collections
  // (In production use a top-level membership index for efficiency)
  const allGroupsSnap = await getDocs(collection(db, 'groups'));
  const groups: Group[] = [];
  for (const g of allGroupsSnap.docs) {
    const memberSnap = await getDoc(doc(db, 'groups', g.id, 'members', uid));
    if (memberSnap.exists()) {
      groups.push({ id: g.id, ...g.data() } as Group);
    }
  }
  return groups;
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const snap = await getDocs(collection(db, 'groups', groupId, 'members'));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as GroupMember));
}

export async function isMember(groupId: string, uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'groups', groupId, 'members', uid));
  return snap.exists();
}
