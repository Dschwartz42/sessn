import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { colors } from '../utils/theme';

// Auth screens
import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import PhoneAuthScreen from '../screens/Auth/PhoneAuthScreen';

// Home screens
import HomeScreen from '../screens/Home/HomeScreen';
import StreakScreen from '../screens/Home/StreakScreen';
import NotificationsScreen from '../screens/Home/NotificationsScreen';

// Post screens
import ExpandedPostScreen from '../screens/Post/ExpandedPostScreen';
import NewPostScreen from '../screens/Post/NewPostScreen';

// Search screens
import SearchScreen from '../screens/Search/SearchScreen';

// Community screens
import CommunityScreen from '../screens/Community/CommunityScreen';
import FullLeaderboardScreen from '../screens/Community/FullLeaderboardScreen';

// Profile screens
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import SettingsScreen from '../screens/Profile/SettingsScreen';

// Settings sub-screens
import PersonalDetailsScreen from '../screens/Settings/PersonalDetailsScreen';
import PasswordSecurityScreen from '../screens/Settings/PasswordSecurityScreen';
import NotificationsSettingsScreen from '../screens/Settings/NotificationsSettingsScreen';
import AccountPrivacyScreen from '../screens/Settings/AccountPrivacyScreen';
import BlockedUsersScreen from '../screens/Settings/BlockedUsersScreen';
import YourActivityScreen from '../screens/Settings/YourActivityScreen';
import RepostsSettingsScreen from '../screens/Settings/RepostsSettingsScreen';
import HelpCenterScreen from '../screens/Settings/HelpCenterScreen';
import AboutSessnScreen from '../screens/Settings/AboutSessnScreen';

import {
  AuthStackParamList, HomeStackParamList, SearchStackParamList,
  CommunityStackParamList, ProfileStackParamList, MainTabParamList, RootStackParamList,
} from './types';

const AuthStack = createStackNavigator<AuthStackParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const SearchStack = createStackNavigator<SearchStackParamList>();
const CommunityStack = createStackNavigator<CommunityStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const Root = createStackNavigator<RootStackParamList>();

const screenOptions = { headerShown: false };

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={screenOptions}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
    </AuthStack.Navigator>
  );
}

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={screenOptions}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="ExpandedPost" component={ExpandedPostScreen} />
      <HomeStack.Screen name="UserProfile" component={ProfileScreen} />
      <HomeStack.Screen name="Streak" component={StreakScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    </HomeStack.Navigator>
  );
}

function SearchNavigator() {
  return (
    <SearchStack.Navigator screenOptions={screenOptions}>
      <SearchStack.Screen name="Search" component={SearchScreen} />
      <SearchStack.Screen name="UserProfile" component={ProfileScreen} />
      <SearchStack.Screen name="ExpandedPost" component={ExpandedPostScreen} />
    </SearchStack.Navigator>
  );
}

function CommunityNavigator() {
  return (
    <CommunityStack.Navigator screenOptions={screenOptions}>
      <CommunityStack.Screen name="Community" component={CommunityScreen} />
      <CommunityStack.Screen name="FullLeaderboard" component={FullLeaderboardScreen} />
    </CommunityStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={screenOptions}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
      <ProfileStack.Screen name="PasswordSecurity" component={PasswordSecurityScreen} />
      <ProfileStack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
      <ProfileStack.Screen name="AccountPrivacy" component={AccountPrivacyScreen} />
      <ProfileStack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
      <ProfileStack.Screen name="YourActivity" component={YourActivityScreen} />
      <ProfileStack.Screen name="RepostsSettings" component={RepostsSettingsScreen} />
      <ProfileStack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <ProfileStack.Screen name="AboutSessn" component={AboutSessnScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="UserProfile" component={ProfileScreen} />
      <ProfileStack.Screen name="ExpandedPost" component={ExpandedPostScreen} />
    </ProfileStack.Navigator>
  );
}

function PlaceholderTab() {
  return null;
}

function MainTabs({ navigation }: any) {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="HomeTab" component={HomeNavigator} />
      <Tab.Screen name="SearchTab" component={SearchNavigator} />
      <Tab.Screen name="PostTab" component={PlaceholderTab} listeners={{ tabPress: (e) => { e.preventDefault(); navigation.navigate('NewPost'); } }} />
      <Tab.Screen name="CommunityTab" component={CommunityNavigator} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const tabConfig: Record<string, { active: any; inactive: any; label: string }> = {
    HomeTab: { active: 'home', inactive: 'home-outline', label: 'Home' },
    SearchTab: { active: 'search', inactive: 'search-outline', label: 'Search' },
    PostTab: { active: 'add', inactive: 'add', label: '' },
    CommunityTab: { active: 'people', inactive: 'people-outline', label: 'Community' },
    ProfileTab: { active: 'person', inactive: 'person-outline', label: 'Profile' },
  };

  return (
    <View style={tabStyles.container}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        const isPost = route.name === 'PostTab';
        const cfg = tabConfig[route.name];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isPost) {
          return (
            <TouchableOpacity key={route.key} style={tabStyles.tab} onPress={onPress} activeOpacity={0.8}>
              <View style={tabStyles.postButton}>
                <Ionicons name="add" size={28} color="#fff" />
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity key={route.key} style={tabStyles.tab} onPress={onPress} activeOpacity={0.8}>
            <Ionicons
              name={focused ? cfg?.active : cfg?.inactive}
              size={24}
              color={focused ? colors.primaryLight : 'rgba(255,255,255,0.35)'}
            />
            <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>
              {cfg?.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10,10,10,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 28,
    paddingTop: 8,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 4,
  },
  postButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  label: {
    fontFamily: 'Barlow_500Medium',
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
  },
  labelActive: {
    color: colors.primaryLight,
  },
});

function MainNavigator() {
  return (
    <Root.Navigator screenOptions={{ headerShown: false, presentation: 'modal' }}>
      <Root.Screen name="Main" component={MainTabs} options={{ presentation: 'card' }} />
      <Root.Screen name="NewPost" component={NewPostScreen} />
    </Root.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.text, fontFamily: 'BebasNeue_400Regular', fontSize: 48, letterSpacing: 10 }}>SESSN</Text>
      </View>
    );
  }

  return user ? <MainNavigator /> : <AuthNavigator />;
}
