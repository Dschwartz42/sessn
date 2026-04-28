import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  PhoneAuth: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  ExpandedPost: { postId: string };
  UserProfile: { uid: string };
  Streak: undefined;
  Notifications: undefined;
};

export type SearchStackParamList = {
  Search: undefined;
  UserProfile: { uid: string };
};

export type CommunityStackParamList = {
  Community: undefined;
  FullLeaderboard: { groupId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  PersonalDetails: undefined;
  PasswordSecurity: undefined;
  NotificationsSettings: undefined;
  AccountPrivacy: undefined;
  BlockedUsers: undefined;
  YourActivity: undefined;
  RepostsSettings: undefined;
  HelpCenter: undefined;
  AboutSessn: undefined;
  EditProfile: undefined;
  UserProfile: { uid: string };
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  SearchTab: NavigatorScreenParams<SearchStackParamList>;
  PostTab: undefined;
  CommunityTab: NavigatorScreenParams<CommunityStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  NewPost: undefined;
};
