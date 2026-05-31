"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onRepostCreated = exports.onLikeCreated = exports.onFollowCreated = exports.onFollowRequestCreated = exports.onNotificationCreated = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const https = require("https");
admin.initializeApp();
const db = admin.firestore();
async function sendExpoPush(messages) {
    const body = JSON.stringify(messages);
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'exp.host',
            path: '/--/api/v2/push/send',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
        }, (res) => {
            res.resume();
            res.on('end', resolve);
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}
function buildPushTitle(type, fromUsername) {
    switch (type) {
        case 'follow_request': return `${fromUsername} started following you`;
        case 'follow_accepted': return `${fromUsername} accepted your follow request`;
        case 'like': return `${fromUsername} liked your Sessn`;
        case 'repost': return `${fromUsername} reposted your Sessn`;
        default: return 'New notification from Sessn';
    }
}
// Triggers when a new notification document is created for a user.
exports.onNotificationCreated = functions.firestore
    .document('notifications/{uid}/items/{notifId}')
    .onCreate(async (snap, context) => {
    var _a, _b;
    const { uid } = context.params;
    const notif = snap.data();
    // Look up the recipient's push token and their notification preferences.
    const recipientSnap = await db.doc(`users/${uid}`).get();
    if (!recipientSnap.exists)
        return;
    const recipient = recipientSnap.data();
    // Respect per-type notification opt-outs.
    if (!recipient.pushEnabled)
        return;
    if (notif.type === 'like' && !recipient.likesEnabled)
        return;
    if (notif.type === 'repost' && !recipient.repostsEnabled)
        return;
    if ((notif.type === 'follow_request' || notif.type === 'follow_accepted') && !recipient.followersNotifEnabled)
        return;
    const token = recipient.expoPushToken;
    if (!token || !token.startsWith('ExponentPushToken['))
        return;
    await sendExpoPush([
        {
            to: token,
            sound: 'default',
            title: buildPushTitle(notif.type, (_a = notif.fromUsername) !== null && _a !== void 0 ? _a : 'Someone'),
            body: buildPushTitle(notif.type, (_b = notif.fromUsername) !== null && _b !== void 0 ? _b : 'Someone'),
            data: { type: notif.type, uid, notifId: snap.id },
        },
    ]);
});
// Writes a follow_request notification when a private-account follow request is created.
exports.onFollowRequestCreated = functions.firestore
    .document('followRequests/{requestId}')
    .onCreate(async (snap) => {
    var _a, _b;
    const { followerId, followeeId } = snap.data();
    if (!followerId || !followeeId)
        return;
    const followerSnap = await db.doc(`users/${followerId}`).get();
    if (!followerSnap.exists)
        return;
    const follower = followerSnap.data();
    await db
        .collection('notifications')
        .doc(followeeId)
        .collection('items')
        .add({
        type: 'follow_request',
        fromUserId: followerId,
        fromUsername: (_a = follower.username) !== null && _a !== void 0 ? _a : '',
        fromUserPic: (_b = follower.profilePicUrl) !== null && _b !== void 0 ? _b : null,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
});
// Writes a notification doc when a public-account follow happens.
exports.onFollowCreated = functions.firestore
    .document('follows/{followId}')
    .onCreate(async (snap) => {
    var _a, _b;
    const { followerId, followeeId } = snap.data();
    if (!followerId || !followeeId)
        return;
    const followerSnap = await db.doc(`users/${followerId}`).get();
    if (!followerSnap.exists)
        return;
    const follower = followerSnap.data();
    await db
        .collection('notifications')
        .doc(followeeId)
        .collection('items')
        .add({
        type: 'follow_request',
        fromUserId: followerId,
        fromUsername: (_a = follower.username) !== null && _a !== void 0 ? _a : '',
        fromUserPic: (_b = follower.profilePicUrl) !== null && _b !== void 0 ? _b : null,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
});
// Writes a notification doc when a post is liked.
exports.onLikeCreated = functions.firestore
    .document('posts/{postId}/likes/{likerId}')
    .onCreate(async (snap, context) => {
    var _a, _b, _c;
    const { postId, likerId } = context.params;
    const [likerSnap, postSnap] = await Promise.all([
        db.doc(`users/${likerId}`).get(),
        db.doc(`posts/${postId}`).get(),
    ]);
    if (!likerSnap.exists || !postSnap.exists)
        return;
    const liker = likerSnap.data();
    const post = postSnap.data();
    if (post.authorId === likerId)
        return; // don't notify self-likes
    await db
        .collection('notifications')
        .doc(post.authorId)
        .collection('items')
        .add({
        type: 'like',
        fromUserId: likerId,
        fromUsername: (_a = liker.username) !== null && _a !== void 0 ? _a : '',
        fromUserPic: (_b = liker.profilePicUrl) !== null && _b !== void 0 ? _b : null,
        postId,
        postImageUrl: (_c = post.imageUrl) !== null && _c !== void 0 ? _c : null,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
});
// Writes a notification when a post is reposted.
exports.onRepostCreated = functions.firestore
    .document('posts/{postId}')
    .onWrite(async (change) => {
    var _a, _b;
    const after = change.after.data();
    const before = change.before.data();
    if (!after || !after.isRepost)
        return;
    // Only fire on creation (before doesn't exist) to avoid re-triggering on updates.
    if (before)
        return;
    const { authorId, originalAuthorId, originalPostId, imageUrl } = after;
    if (!originalAuthorId || originalAuthorId === authorId)
        return;
    const reposterSnap = await db.doc(`users/${authorId}`).get();
    if (!reposterSnap.exists)
        return;
    const reposter = reposterSnap.data();
    await db
        .collection('notifications')
        .doc(originalAuthorId)
        .collection('items')
        .add({
        type: 'repost',
        fromUserId: authorId,
        fromUsername: (_a = reposter.username) !== null && _a !== void 0 ? _a : '',
        fromUserPic: (_b = reposter.profilePicUrl) !== null && _b !== void 0 ? _b : null,
        postId: originalPostId !== null && originalPostId !== void 0 ? originalPostId : null,
        postImageUrl: imageUrl !== null && imageUrl !== void 0 ? imageUrl : null,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
});
//# sourceMappingURL=index.js.map