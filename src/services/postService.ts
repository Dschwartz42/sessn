import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc,
  increment, serverTimestamp, setDoc, deleteField,
} from 'firebase/firestore';
import { db } from './firebase';
import { Post } from '../types';

export async function createPost(data: Omit<Post, 'id' | 'likeCount' | 'repostCount' | 'saveCount' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'posts'), {
    ...data,
    likeCount: 0,
    repostCount: 0,
    saveCount: 0,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'users', data.authorId), { postCount: increment(1), totalSessns: increment(1) });
  return ref.id;
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
