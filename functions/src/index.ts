import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as https from 'https';

admin.initializeApp();
const db = admin.firestore();

interface ExpoPushMessage {
  to: string;
  sound: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

async function sendExpoPush(messages: ExpoPushMessage[]): Promise<void> {
  const body = JSON.stringify(messages);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'exp.host',
        path: '/--/api/v2/push/send',
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        res.resume();
        res.on('end', resolve);
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function buildPushTitle(type: string, fromUsername: string): string {
  switch (type) {
    case 'follow_request': return `${fromUsername} started following you`;
    case 'follow_accepted': return `${fromUsername} accepted your follow request`;
    case 'like': return `${fromUsername} liked your Sessn`;
    case 'repost': return `${fromUsername} reposted your Sessn`;
    default: return 'New notification from Sessn';
  }
}

// Triggers when a new notification document is created for a user.
export const onNotificationCreated = functions.firestore
  .document('notifications/{uid}/items/{notifId}')
  .onCreate(async (snap, context) => {
    const { uid } = context.params;
    const notif = snap.data();

    // Look up the recipient's push token and their notification preferences.
    const recipientSnap = await db.doc(`users/${uid}`).get();
    if (!recipientSnap.exists) return;

    const recipient = recipientSnap.data()!;

    // Respect per-type notification opt-outs.
    if (!recipient.pushEnabled) return;
    if (notif.type === 'like' && !recipient.likesEnabled) return;
    if (notif.type === 'repost' && !recipient.repostsEnabled) return;
    if ((notif.type === 'follow_request' || notif.type === 'follow_accepted') && !recipient.followersNotifEnabled) return;

    const token: string | undefined = recipient.expoPushToken;
    if (!token || !token.startsWith('ExponentPushToken[')) return;

    await sendExpoPush([
      {
        to: token,
        sound: 'default',
        title: buildPushTitle(notif.type, notif.fromUsername ?? 'Someone'),
        body: buildPushTitle(notif.type, notif.fromUsername ?? 'Someone'),
        data: { type: notif.type, uid, notifId: snap.id },
      },
    ]);
  });

// Writes a notification doc when a follow happens.
// Call this from the app after followUser() succeeds.
// Alternatively, trigger off the follows collection:
export const onFollowCreated = functions.firestore
  .document('follows/{followId}')
  .onCreate(async (snap) => {
    const { followerId, followeeId } = snap.data();
    if (!followerId || !followeeId) return;

    const followerSnap = await db.doc(`users/${followerId}`).get();
    if (!followerSnap.exists) return;
    const follower = followerSnap.data()!;

    await db
      .collection('notifications')
      .doc(followeeId)
      .collection('items')
      .add({
        type: 'follow_request',
        fromUserId: followerId,
        fromUsername: follower.username ?? '',
        fromUserPic: follower.profilePicUrl ?? null,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  });

// Writes a notification doc when a post is liked.
export const onLikeCreated = functions.firestore
  .document('posts/{postId}/likes/{likerId}')
  .onCreate(async (snap, context) => {
    const { postId, likerId } = context.params;

    const [likerSnap, postSnap] = await Promise.all([
      db.doc(`users/${likerId}`).get(),
      db.doc(`posts/${postId}`).get(),
    ]);
    if (!likerSnap.exists || !postSnap.exists) return;

    const liker = likerSnap.data()!;
    const post = postSnap.data()!;
    if (post.authorId === likerId) return; // don't notify self-likes

    await db
      .collection('notifications')
      .doc(post.authorId)
      .collection('items')
      .add({
        type: 'like',
        fromUserId: likerId,
        fromUsername: liker.username ?? '',
        fromUserPic: liker.profilePicUrl ?? null,
        postId,
        postImageUrl: post.imageUrl ?? null,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  });

// Writes a notification when a post is reposted.
export const onRepostCreated = functions.firestore
  .document('posts/{postId}')
  .onWrite(async (change) => {
    const after = change.after.data();
    const before = change.before.data();
    if (!after || !after.isRepost) return;
    // Only fire on creation (before doesn't exist) to avoid re-triggering on updates.
    if (before) return;

    const { authorId, originalAuthorId, originalPostId, imageUrl } = after;
    if (!originalAuthorId || originalAuthorId === authorId) return;

    const reposterSnap = await db.doc(`users/${authorId}`).get();
    if (!reposterSnap.exists) return;
    const reposter = reposterSnap.data()!;

    await db
      .collection('notifications')
      .doc(originalAuthorId)
      .collection('items')
      .add({
        type: 'repost',
        fromUserId: authorId,
        fromUsername: reposter.username ?? '',
        fromUserPic: reposter.profilePicUrl ?? null,
        postId: originalPostId ?? null,
        postImageUrl: imageUrl ?? null,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  });
