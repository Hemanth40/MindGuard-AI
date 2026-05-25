import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

import HomeScreen from '../screens/HomeScreen';
import MoodTrackerScreen from '../screens/MoodTrackerScreen';
import ChatScreen from '../screens/ChatScreen';
import MeditationScreen from '../screens/MeditationScreen';
import WellnessScreen from '../screens/WellnessScreen';
import HistoryScreen from '../screens/HistoryScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const { width } = Dimensions.get('window');

const TAB_CONFIG = [
  { name: 'Home',     icon: 'home-outline',         iconActive: 'home',         label: 'Home',    gradient: colors.gradientPrimary },
  { name: 'Mood',     icon: 'happy-outline',        iconActive: 'happy',        label: 'Mood',    gradient: colors.gradientSecondary },
  { name: 'Chat',     icon: 'chatbubbles-outline',  iconActive: 'chatbubbles',  label: 'Chat',    gradient: colors.gradientPink },
  { name: 'Meditate', icon: 'leaf-outline',         iconActive: 'leaf',         label: 'Breathe', gradient: colors.gradientSuccess },
  { name: 'History',  icon: 'bar-chart-outline',    iconActive: 'bar-chart',    label: 'Stats',   gradient: colors.gradientCool },
];

// ── Single tab item component — hooks are ONLY called inside a component, never in a loop ──
function TabItem({ route, index, isFocused, navigation }) {
  const tabConfig = TAB_CONFIG[index];

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1.12 : 1, { damping: 14, stiffness: 180 }) }],
  }));

  const onPress = () => {
    const event = navigation.emit({ type: 'tabPress', target: route.key });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <Pressable
      key={route.key}
      onPress={onPress}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.tabItemInner, animStyle]}>
        {isFocused ? (
          <LinearGradient
            colors={tabConfig.gradient}
            style={styles.activeIconBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={tabConfig.iconActive} size={22} color="#FFFFFF" />
          </LinearGradient>
        ) : (
          <View style={styles.inactiveIconBg}>
            <Ionicons name={tabConfig.icon} size={22} color="rgba(255,255,255,0.45)" />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ── Animated tab bar — renders TabItem components (hooks-safe) ──
function AnimatedTabBar({ state, descriptors, navigation }) {
  // Hide tab bar on Chat screen so input is not covered
  const activeRouteName = state.routes[state.index].name;
  if (activeRouteName === 'Chat') {
    return null;
  }

  return (
    <View style={styles.tabBarContainer}>
      <BlurView intensity={80} tint="dark" style={styles.blurView}>
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => (
            <TabItem
              key={route.key}
              route={route}
              index={index}
              isFocused={state.index === index}
              navigation={navigation}
            />
          ))}
        </View>
      </BlurView>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"     component={HomeScreen} />
      <Tab.Screen name="Mood"     component={MoodTrackerScreen} />
      <Tab.Screen name="Chat"     component={ChatScreen} />
      <Tab.Screen name="Meditate" component={MeditationScreen} />
      <Tab.Screen name="History"  component={HistoryScreen} />
    </Tab.Navigator>
  );
}

const AppStack = createStackNavigator();

function MainStack() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="MainTabs" component={MainTabs} />
      <AppStack.Screen name="Wellness" component={WellnessScreen} />
    </AppStack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ── Loading screen shown while auth state is being restored from AsyncStorage ──
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <LinearGradient colors={colors.gradientBackground} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={colors.gradientPrimary} style={styles.loadingLogo}>
        <Ionicons name="shield-checkmark" size={36} color="#fff" />
      </LinearGradient>
      <ActivityIndicator color={colors.primaryLight} size="large" style={{ marginTop: 24 }} />
    </View>
  );
}



export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  // ── Tab bar ──
  tabBarContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  blurView: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(8, 11, 24, 0.6)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  inactiveIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Loading screen ──
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
});
