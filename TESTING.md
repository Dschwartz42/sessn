# Sessn — Test Plan

This document contains the full test plan for the Sessn app. Each table covers a specific feature area. Complete all tests before each release.

---

## 1. Authentication

| # | Test Name | Description | Expected Outcome | Tester | Date | Results |
|---|---|---|---|---|---|---|
| 1.1 | Email Signup | Open app → Create Account → fill in name, username, email, password, confirm password → tap Create Account | Account is created, user is redirected to Home screen, Firestore `/users/{uid}` document is created with correct fields | | | |
| 1.2 | Email Login | Open app → Log In → enter email and password → tap Log In | User is authenticated and redirected to Home screen | | | |
| 1.3 | Invalid Login | Log In with wrong password | Alert shown with "Login Failed" error, user stays on Login screen | | | |
| 1.4 | Phone Signup | Continue with Phone → enter valid phone number → tap Send Code → enter OTP | Account created via phone, user redirected to Home screen | | | |
| 1.5 | Invalid OTP | Enter incorrect OTP code | Alert shown with verification error, user stays on verification screen | | | |
| 1.6 | Log Out | Profile tab → Settings → Log Out → confirm | User is signed out and redirected to Welcome screen | | | |
| 1.7 | Session Persistence | Log in, close app, reopen | User remains logged in without re-entering credentials | | | |
| 1.8 | Duplicate Username | Signup with an already-taken username | Alert shown: "That username is already taken" | | | |
| 1.9 | Password Too Short | Signup with a 5-character password | Alert shown: "Password must be at least 6 characters" | | | |
| 1.10 | Change Password | Settings → Password & Security → enter current + new password → Update | Password updated, user can log in with new password | | | |

---

## 2. Home Feed

| # | Test Name | Description | Expected Outcome | Tester | Date | Results |
|---|---|---|---|---|---|---|
| 2.1 | Empty Feed | Log in with a new account that follows no one | "Follow athletes to see their Sessns here" message displayed | | | |
| 2.2 | Feed Loads Posts | Follow a user who has posts | Posts from followed users appear in the feed | | | |
| 2.3 | Infinite Scroll | Scroll to bottom of feed with more than 10 posts | Next page of posts loads automatically | | | |
| 2.4 | Pull to Refresh | Pull down on the feed | Feed reloads and shows latest posts | | | |
| 2.5 | Profile Pic → Own Profile | Tap profile picture in top-left header | Navigates to own profile screen | | | |
| 2.6 | Streak Strip → Streak Screen | Tap the streak strip (🔥 counter + bubbles) | Streak screen opens | | | |
| 2.7 | Notification Bell | Tap notification bell | Navigates to Notifications screen | | | |
| 2.8 | Unread Notification Dot | Receive a new notification | Red dot appears on notification bell | | | |
| 2.9 | Post Card Tap | Tap anywhere on a post card image | Expanded post screen opens | | | |
| 2.10 | Username Tap on Post | Tap username on a post card | Navigates to that user's profile | | | |

---

## 3. Post Interactions

| # | Test Name | Description | Expected Outcome | Tester | Date | Results |
|---|---|---|---|---|---|---|
| 3.1 | Like Post | Tap heart icon on a post card | Heart turns red, like count increments by 1 | | | |
| 3.2 | Unlike Post | Tap heart again on a liked post | Heart returns to outline, like count decrements by 1 | | | |
| 3.3 | Save Post | Tap bookmark icon | Bookmark fills, post appears in Saved tab on profile | | | |
| 3.4 | Unsave Post | Tap filled bookmark | Bookmark empties, post removed from Saved tab | | | |
| 3.5 | Repost | Tap repeat icon → confirm | Post appears on own profile feed as a repost | | | |
| 3.6 | Repost Toggle | If allowReposts is off for author | Repost still allowed (feature-level toggle to be enforced in future) | | | |
| 3.7 | Workout Details Panel | Tap "Workout Details" button | Slide-up panel shows exercise list, muscle groups, duration, etc. | | | |
| 3.8 | Save from Details Panel | Tap save inside workout details panel | Save state matches — post is saved/unsaved | | | |
| 3.9 | Dismiss Details Panel | Tap outside the panel or swipe down | Panel dismisses, returns to home/expanded post | | | |
| 3.10 | Share Button | Tap share icon on a post card | Share sheet slides up with copy link, Instagram, message, camera roll options | | | |

---

## 4. Share Sheet

| # | Test Name | Description | Expected Outcome | Tester | Date | Results |
|---|---|---|---|---|---|---|
| 4.1 | Copy Link (Post) | Share sheet → Copy Link | Alert confirms "Copied"; link is in clipboard | | | |
| 4.2 | Send as Message (Post) | Share sheet → Send as Message | System share dialog opens with pre-filled link | | | |
| 4.3 | Save to Camera Roll | Share sheet → Save to Camera Roll | Image saved to Photos; alert confirms | | | |
| 4.4 | Instagram Story | Share sheet → Share to Instagram Story | iOS share dialog opens targeting Instagram | | | |
| 4.5 | Cancel Share | Share sheet → Cancel or tap backdrop | Sheet dismisses, returns to previous screen | | | |
| 4.6 | Copy Link (Profile) | Profile → Share Profile → Copy Link | Alert confirms "Copied"; profile link is in clipboard | | | |
| 4.7 | Send as Message (Profile) | Profile share sheet → Send as Message | System share dialog opens with profile link | | | |
| 4.8 | No Instagram on Profile Share | Open share sheet from profile | "Share to Instagram Story" option is NOT shown | | | |
| 4.9 | No Camera Roll on Profile Share | Open share sheet from profile | "Save to Camera Roll" option is NOT shown | | | |

---

## 5. Expanded Post

| # | Test Name | Description | Expected Outcome | Tester | Date | Results |
|---|---|---|---|---|---|---|
| 5.1 | Image Fills Screen | Open an expanded post with an image | Image fills full screen with info overlaid | | | |
| 5.2 | Back Arrow | Tap back arrow in top-left | Returns to previous screen (home, profile, etc.) | | | |
| 5.3 | Username Tap | Tap username in top bar | Navigates to that user's profile | | | |
| 5.4 | Location Tap | Tap geotagged location | Alert prompts: "Apple Maps" / "Google Maps" / "Cancel" | | | |
| 5.5 | Open Apple Maps | Location alert → Apple Maps | Apple Maps opens with correct coordinates | | | |
| 5.6 | Open Google Maps | Location alert → Google Maps | Google Maps opens with correct coordinates | | | |
| 5.7 | Like/Save/Repost/Share | All action buttons on expanded post | Same behavior as home feed (see section 3) | | | |
| 5.8 | Workout Details in Expanded Post | Tap Workout Details | Same slide-up panel as home feed | | | |
| 5.9 | Class Post Star Rating | View expanded class post | Star rating displayed below class type badge | | | |
| 5.10 | No Image Post | Open expanded post with no image | Dark background placeholder shown | | | |

---

## 6. New Post — Independent

| # | Test Name | Description | Expected Outcome | Tester | Date | Results |
|---|---|---|---|---|---|---|
| 6.1 | Plus Button Opens Modal | Tap + in bottom tab bar | New Sessn screen slides up | | | |
| 6.2 | X Closes Modal | Tap X in top-left | Returns to previous screen | | | |
| 6.3 | Type Selection | Tap workout types (e.g. Lifting + Cardio) | Both chips highlight; multiple selection allowed | | | |
| 6.4 | Next Button Without Type | Tap "Next — Workout Details" with no type selected | Alert: "Select at least one workout type" | | | |
| 6.5 | Next → New Workout | Tap Next → New Workout | Workout details form appears for selected types | | | |
| 6.6 | Add Photo | Tap photo area → pick from library | Image previews in post | | | |
| 6.7 | Add Location | Tap Add Location | Requests permission, fetches GPS, fills location name | | | |
| 6.8 | Lifting: Add Exercise | Workout details → Add Exercise | New exercise row appears with name/sets/reps/weight fields | | | |
| 6.9 | Lifting: Remove Exercise | Tap X on an exercise row | Row is removed | | | |
| 6.10 | Lifting: Bodyweight Toggle | Toggle "Bodyweight" on an exercise | Weight field is no longer required | | | |
| 6.11 | Lifting: Warmup Toggle | Enable warmup toggle | Warmup description text area appears | | | |
| 6.12 | Lifting: Include Cardio | Enable cardio toggle | Cardio type/duration/distance fields appear | | | |
| 6.13 | Cardio Post | Select Cardio type → fill details → post | Post created with cardio details | | | |
| 6.14 | Sports Post | Select Sports → pick sport → post | Post created with sport displayed | | | |
| 6.15 | Yoga/CrossFit/Recovery | Select one of these types → fill description → post | Post created with workout description | | | |
| 6.16 | Multi-type Post | Select Lifting + Yoga | Merged form shown — warmup appears once, not twice | | | |
| 6.17 | Post Without Title | Attempt to post with no title | Alert: "Please add a title" | | | |
| 6.18 | Post Sessn (publish) | Fill all required fields → Post Sessn | Post appears in own feed; Firestore doc created; postCount incremented | | | |
| 6.19 | Save Workout Template | Check "Save as Workout Template" | Template saved to `/users/{uid}/workouts` in Firestore | | | |

---

## 7. New Post — Class

| # | Test Name | Description | Expected Outcome | Tester | Date | Results |
|---|---|---|---|---|---|---|
| 7.1 | Switch to Class Tab | Tap "Class" toggle at top | Class-specific fields appear (class name, rating, description) | | | |
| 7.2 | Star Rating | Tap 4th star | 4 stars filled | | | |
| 7.3 | Post Class Sessn | Fill all class fields → Post Sessn | Post created with class type; expanded view shows class name, duration, rating, description | | | |
| 7.4 | Save Class Post | Tap save on a class post | Saved to profile Saved section; NOT available as workout template | | | |

---

## 8. Streak & Milestones

| # | Test Name | Description | Expected Outcome | Tester | Date | Results |
|---|---|---|---|---|---|---|
| 8.1 | Streak Screen Opens | Tap streak strip on home | Streak screen appears | | | |
| 8.2 | Fire Ring | Streak screen fire ring | Ring displays current week progress | | | |
| 8.3 | Week Bubbles | Streak screen day bubbles | Dots filled for days this week that had a Sessn | | | |
| 8.4 | Monthly Calendar | Streak screen calendar | Current month displayed; days with Sessns highlighted | | | |
| 8.5 | Milestones — Incomplete | New account, no Sessns | All milestones show lock icon and grey state | | | |
| 8.6 | Milestone: First Sessn | Log first workout | "First Sessn" milestone shows checkmark | | | |
| 8.7 | Milestone: 1-Week Streak | Maintain streak for 1 week | "1-Week Streak" milestone unlocks | | | |
| 8.8 | Milestone: 50 Sessns | Log 50 workouts | "50 Sessns" milestone unlocks | | | |
| 8.9 | Stats Row | Streak screen stats | Shows correct time (hrs), rest days, and total Sessns | | | |

---

## 9. Notifications

| # | Test Name | Description | Expected Outcome | Tester | Date | Results |
|---|---|---|---|---|---|---|
| 9.1 | Follow Notification | User A follows User B | User B sees follow notification in Notifications screen | | | |
| 9.2 | Like Notification | User A likes User B's post | User B sees like notification | | | |
| 9.3 | Repost Notification | User A reposts User B's post | User B sees repost notification | | | |
| 9.4 | Notification Bell Dot | Unread notification exists | Red dot appears on bell icon | | | |
| 9.5 | Dot Clears on Open | Open notifications screen | All notifications marked read; red dot disappears | | | |
| 9.6 | Tap Profile Pic in Notif | Tap avatar in notification row | Navigates to that user's profile | | | |
| 9.7 | Tap Username in Notif | Tap username text in notification | Navigates to that user's profile | | | |
| 9.8 | Tap Post Thumb in Notif | Tap post thumbnail in like/repost notification | Navigates to expanded post | | | |
| 9.9 | Follow Back Button | Follow notification → tap Follow Back | User B now follows User A; button changes to "Following" | | | |
| 9.10 | Following → Unfollow | Tap "Following" on a notification row | Unfollow prompt or immediate unfollow | | | |

---

## 10. Search

| # | Test Name | Description | Expected Outcome | Tester | Date | Results |
|---|---|---|---|---|---|---|
| 10.1 | Search Bar Visible | Open Search tab | Search bar visible at top | | | |
| 10.2 | Search by Username | Type 2+ characters | Auto-suggestions appear in dropdown matching prefix | | | |
| 10.3 | Tap Suggestion | Tap a suggested user | Navigates to that user's profile | | | |
| 10.4 | Filter: People | Tap "People" filter chip | Filter active (chip highlighted) | | | |
| 10.5 | Clear Search | Tap X in search bar | Search text cleared, results hidden | | | |
| 10.6 | Popular Sessns | Open Search with no search text | Popular posts section shown | | | |
| 10.7 | Popular Athletes | Open Search with no search text | Popular athletes section shown | | | |
| 10.8 | Tap Popular Post | Tap a popular post | Expanded post screen opens | | | |
| 10.9 | Tap Popular Athlete | Tap an athlete row | Navigates to their profile | | | |
| 10.10 | Follow from Search | Tap Follow button on search result | User followed; button changes to "Following" | | | |

---

## 11. Community & Leaderboards

| # | Test Name | Description | Expected Outcome | Tester | Date | Results |
|---|---|---|---|---|---|---|
| 11.1 | Community Screen | Tap Community tab | Community screen opens on Groups view | | | |
| 11.2 | No Groups | User in no groups | Empty state with message shown | | | |
| 11.3 | Time Frame Toggle | Tap Weekly / Monthly / All Time | Leaderboard values update for selected time frame | | | |
| 11.4 | Metric Toggle | Tap SESSNS / LBS / HRS on a group card | Leaderboard ranks change based on metric | | | |
| 11.5 | View Full Leaderboard | Tap "View Full Leaderboard →" | Full leaderboard screen opens for that group | | | |
| 11.6 | Own Row Highlighted | View any leaderboard | Current user's row is highlighted in orange tint | | | |
| 11.7 | Streak Leaderboard | Scroll down on Community screen | Friends streak leaderboard appears | | | |
| 11.8 | Tap User in Leaderboard | Tap any user row in any leaderboard | Navigates to that user's profile | | | |
| 11.9 | Full Leaderboard: In-Group Streak | Scroll full leaderboard screen | In-group streak sub-leaderboard shown below main leaderboard | | | |
| 11.10 | Dots Menu: Invite | Full leaderboard → … → Invite | System share dialog opens with group invite link | | | |
| 11.11 | Dots Menu: Leave Group | Full leaderboard → … → Leave Group → confirm | User removed from group; navigates back to Community | | | |
| 11.12 | Dots Menu: Cancel | Full leaderboard → … → Cancel | Menu closes, no action taken | | | |

---

## 12. Profile — Own

| # | Test Name | Description | Expected Outcome | Tester | Date | Results |
|---|---|---|---|---|---|---|
| 12.1 | Profile Tab | Tap Profile tab | Own profile screen opens | | | |
| 12.2 | Profile Info | Profile screen | Shows profile pic, @username, display name, bio, post/follower/following counts | | | |
| 12.3 | Posts Tab (default) | Open profile | Posts tab selected by default | | | |
| 12.4 | Posts Grid | Posts tab | Grid shows own posts in reverse chronological order | | | |
| 12.5 | Tap Post in Grid | Tap post thumbnail | Expanded post screen opens | | | |
| 12.6 | Reposts Tab | Tap Reposts | Shows reposted content with original author attribution | | | |
| 12.7 | Saved Tab | Tap Saved | Shows saved posts with title, muscles, time, exercise count, author, unsave button | | | |
| 12.8 | Settings Button | Tap gear icon in top-right | Settings screen opens | | | |
| 12.9 | Edit Profile Button | Tap Edit Profile | Edit profile screen opens | | | |
| 12.10 | Share Profile Button | Tap share icon | Share sheet opens for profile sharing | | | |
| 12.11 | Follower Count Tap | Tap followers count | (Shows followers list — basic routing) | | | |

---

## 13. Profile — Other Users

| # | Test Name | Description | Expected Outcome | Tester | Date | Results |
|---|---|---|---|---|---|---|
| 13.1 | View Other Profile | Tap any username in feed | That user's profile opens | | | |
| 13.2 | No Settings on Other Profile | View another user's profile | Settings gear NOT shown | | | |
| 13.3 | Streak Displayed | View profile where showStreakToOthers is true | Streak badge shown under bio | | | |
| 13.4 | Follow Button | Tap Follow on another user | Button changes to "Following"; follower/following counts update | | | |
| 13.5 | Unfollow | Tap Following → confirm | User unfollowed; counts update | | | |
| 13.6 | Other Profile: Groups Tab | Tap Groups tab | Shows groups the user belongs to | | | |
| 13.7 | Back Arrow | Tap back arrow | Returns to previous screen | | | |

---

## 14. Edit Profile

| # | Test Name | Description | Expected Outcome | Tester | Date | Results |
|---|---|---|---|---|---|---|
| 14.1 | Open Edit Profile | Profile → Edit Profile | Edit profile screen opens | | | |
| 14.2 | Change Profile Picture | Tap profile image → pick photo | Image uploads to Firebase Storage; profile pic updates | | | |
| 14.3 | Edit Name | Change display name → Save | Name updates in Firestore and reflects on profile | | | |
| 14.4 | Edit Username | Change username → Save | Username updates in Firestore | | | |
| 14.5 | Edit Bio | Change bio → Save | Bio updates on profile | | | |
| 14.6 | Edit Email | Change email → Save | Email field updated in Firestore | | | |
| 14.7 | Change Fitness Level | Select Intermediate | Selection highlights; updates on save | | | |
| 14.8 | Add Instagram Link | Enter Instagram handle → Save | Link saved to Firestore | | | |
| 14.9 | Select Gender | Choose Prefer not to say | Selection highlights; updates on save | | | |
| 14.10 | Save Button (header) | Tap Save in top-right | Same as "Save Changes" at bottom | | | |
| 14.11 | Back Arrow | Tap back without saving | Returns to profile without saving | | | |

---

## 15. Settings

| # | Test Name | Description | Expected Outcome | Tester | Date | Results |
|---|---|---|---|---|---|---|
| 15.1 | Settings Opens | Profile → Settings gear | Settings screen shows all 9 items + Logout | | | |
| 15.2 | Personal Details | Settings → Personal Details | Shows name, username, email, phone; Edit Details button | | | |
| 15.3 | Password & Security | Settings → Password & Security | Change password form shown; 2FA toggle shown | | | |
| 15.4 | Notifications | Settings → Notifications | Toggles for Push, Likes, Reposts, Followers, Streak, Groups | | | |
| 15.5 | Notification Toggle | Toggle Likes off | Firestore updated; likes notifications suppressed | | | |
| 15.6 | Account Privacy | Settings → Account Privacy | Toggles for public account, activity status, location, streak, reposts | | | |
| 15.7 | Private Account Toggle | Enable Private Account | isPublic set to false in Firestore | | | |
| 15.8 | Blocked Users | Settings → Blocked Users | Empty state shown (or list of blocked users) | | | |
| 15.9 | Your Activity | Settings → Your Activity | Shows all-time Sessns, time, streak, member since date | | | |
| 15.10 | Reposts Toggle | Settings → Reposts → toggle off | allowReposts set to false in Firestore | | | |
| 15.11 | Help Center | Settings → Help Center | FAQs, Report a Problem, Contact Support, Community Guidelines | | | |
| 15.12 | About Sessn | Settings → About Sessn | Version number, Terms of Service, Privacy Policy links | | | |
| 15.13 | Log Out | Settings → Log Out → confirm | User signed out; Welcome screen shown | | | |
| 15.14 | Back Arrow | Tap back in any settings screen | Returns to Settings (or Profile for main Settings) | | | |

---

## 16. Push Notifications (requires backend setup)

| # | Test Name | Description | Expected Outcome | Tester | Date | Results |
|---|---|---|---|---|---|---|
| 16.1 | Token Registration | Log in on iOS device | Expo push token registered in Firestore `/users/{uid}/expoPushToken` | | | |
| 16.2 | Follow Push Notif | User A follows User B (different device) | User B receives push notification | | | |
| 16.3 | Like Push Notif | User A likes User B's post | User B receives push notification | | | |
| 16.4 | Repost Push Notif | User A reposts User B's post | User B receives push notification | | | |
| 16.5 | Notification Disabled | Turn off Push Notifications in settings | No push notifications received | | | |

---

## 17. Maps Integration (requires MapKit token)

| # | Test Name | Description | Expected Outcome | Tester | Date | Results |
|---|---|---|---|---|---|---|
| 17.1 | Post with Location | Create post with location enabled | Post shows location name in expanded view | | | |
| 17.2 | Apple Maps Opens | Tap location → Apple Maps | Apple Maps opens at correct coordinates | | | |
| 17.3 | Google Maps Opens | Tap location → Google Maps | Google Maps opens at correct coordinates | | | |
| 17.4 | Cancel Location Alert | Tap location → Cancel | Alert dismisses, returns to expanded post | | | |

---

## 18. Backend Configuration Verification

| # | Test Name | Description | Expected Outcome | Tester | Date | Results |
|---|---|---|---|---|---|---|
| 18.1 | Firebase Auth Configured | Attempt login with email | Firebase Auth responds (no "invalid API key" error) | | | |
| 18.2 | Firestore Write | Create account | User document appears in Firestore console | | | |
| 18.3 | Firebase Storage | Upload profile picture | Image URL stored; image visible in Firebase Storage | | | |
| 18.4 | Env Vars Present | All `.env` values filled | App boots without "undefined" config warnings | | | |
