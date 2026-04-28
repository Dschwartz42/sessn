import { Timestamp } from 'firebase/firestore';

export interface UserDoc {
  uid: string;
  displayName: string;
  username: string;
  email: string;
  phone?: string;
  bio?: string;
  profilePicUrl?: string;
  isPublic: boolean;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  instagramLink?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  createdAt: Timestamp;
  followersCount: number;
  followingCount: number;
  postCount: number;
  currentStreak: number;
  longestStreak: number;
  totalSessns: number;
  totalTimeMinutes: number;
  totalLbsLifted: number;
  allowReposts: boolean;
  showActivityStatus: boolean;
  locationSharing: boolean;
  showStreakToOthers: boolean;
  pushEnabled: boolean;
  likesEnabled: boolean;
  repostsEnabled: boolean;
  followersNotifEnabled: boolean;
  streakNotifEnabled: boolean;
  groupsNotifEnabled: boolean;
  expoPushToken?: string;
}

export type WorkoutType = 'Lifting' | 'Cardio' | 'Sports' | 'CrossFit' | 'Yoga' | 'Recovery' | 'Pilates';

export type ClassType = 'CrossFit' | 'Lifting' | 'Cardio' | 'Sports' | 'Yoga' | 'Pilates';

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  isBodyweight: boolean;
  superset?: string;
  dropset?: string;
}

export interface CardioDetails {
  type: string;
  durationMinutes: number;
  distance?: number;
  distanceUnit?: 'miles' | 'km';
  timing: 'before' | 'after';
  instructions?: string;
}

export interface ClassDetails {
  name: string;
  rating: number;
  description: string;
}

export interface PostLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorUsername: string;
  authorPicUrl?: string;
  type: 'independent' | 'class';
  workoutTypes: WorkoutType[];
  split?: string;
  classType?: ClassType;
  title: string;
  caption?: string;
  imageUrl?: string;
  location?: PostLocation;
  durationMinutes: number;
  exercises?: Exercise[];
  cardio?: CardioDetails;
  classDetails?: ClassDetails;
  muscleGroups?: string[];
  taggedUsers?: string[];
  warmupDescription?: string;
  workoutInstructions?: string;
  likeCount: number;
  repostCount: number;
  saveCount: number;
  createdAt: Timestamp;
  isRepost?: boolean;
  originalPostId?: string;
  originalAuthorId?: string;
  originalAuthorUsername?: string;
}

export interface SavedWorkout {
  id: string;
  name: string;
  workoutTypes: WorkoutType[];
  split?: string;
  durationMinutes: number;
  exercises?: Exercise[];
  cardio?: CardioDetails;
  muscleGroups?: string[];
  warmupDescription?: string;
  workoutInstructions?: string;
  createdAt: Timestamp;
  originalAuthorId?: string;
  originalAuthorUsername?: string;
}

export interface Group {
  id: string;
  name: string;
  pictureUrl?: string;
  isPrivate: boolean;
  ownerId: string;
  ownerUsername: string;
  memberCount: number;
  createdAt: Timestamp;
}

export interface GroupMember {
  uid: string;
  username: string;
  profilePicUrl?: string;
  joinedAt: Timestamp;
  totalSessns: number;
  totalLbsLifted: number;
  totalTimeMinutes: number;
  currentStreak: number;
}

export type NotificationType = 'follow_request' | 'follow_accepted' | 'like' | 'repost';

export interface Notification {
  id: string;
  type: NotificationType;
  fromUserId: string;
  fromUsername: string;
  fromUserPic?: string;
  postId?: string;
  postImageUrl?: string;
  read: boolean;
  createdAt: Timestamp;
}

export interface Milestone {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  completedAt?: Timestamp;
}
