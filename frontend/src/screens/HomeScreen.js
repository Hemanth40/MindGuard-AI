import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Animated, StatusBar, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { moodAPI, historyAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

function FloatingOrb({ style, color, size }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 3000 + Math.random() * 2000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 3000 + Math.random() * 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.6, 0.3] });
  return (
    <Animated.View style={[styles.orb, style, { width: size, height: size, borderRadius: size / 2, backgroundColor: color, transform: [{ translateY }], opacity }]} />
  );
}

function GlassCard({ children, style, onPress }) {
  const Component = onPress ? TouchableOpacity : View;
  return (
    <Component onPress={onPress} activeOpacity={0.85} style={[styles.glassCard, style]}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.glassCardBorder} />
      {children}
    </Component>
  );
}

function StressBadge({ level }) {
  const config = {
    HIGH: { color: colors.stressHigh, icon: 'warning', label: 'High Stress' },
    MODERATE: { color: colors.stressModerate, icon: 'alert-circle', label: 'Moderate' },
    LOW: { color: colors.stressLow, icon: 'checkmark-circle', label: 'Low Stress' },
  };
  const c = config[level] || config.MODERATE;
  return (
    <View style={[styles.stressBadge, { backgroundColor: `${c.color}22`, borderColor: `${c.color}44` }]}>
      <Ionicons name={c.icon} size={14} color={c.color} />
      <Text style={[styles.stressBadgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, gradient, onPress, delay }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.quickAction}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.glassCardBorder} />
        <LinearGradient colors={gradient} style={styles.quickActionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name={icon} size={26} color="#fff" />
        </LinearGradient>
        <Text style={styles.quickActionLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Logout confirmation modal ──
function LogoutModal({ visible, onCancel, onConfirm, username }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, damping: 14, stiffness: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onCancel}>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        <Animated.View style={[styles.modalCard, { transform: [{ scale: scaleAnim }] }]}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.glassCardBorder} />

          <LinearGradient colors={colors.gradientDanger} style={styles.modalIcon}>
            <Ionicons name="log-out-outline" size={28} color="#fff" />
          </LinearGradient>

          <Text style={styles.modalTitle}>Sign Out?</Text>
          <Text style={styles.modalSub}>
            You're signed in as <Text style={{ color: colors.primaryLight, fontWeight: '700' }}>{username}</Text>.{'\n'}
            Your data is safely saved in the cloud.
          </Text>

          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onCancel} style={styles.modalCancelBtn} activeOpacity={0.7}>
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.glassCardBorder} />
              <Text style={styles.modalCancelText}>Stay</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={styles.modalConfirmBtn} activeOpacity={0.7}>
              <LinearGradient colors={colors.gradientDanger} style={styles.modalConfirmGradient}>
                <Ionicons name="log-out-outline" size={18} color="#fff" />
                <Text style={styles.modalConfirmText}>Sign Out</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const WELLNESS_TIPS = [
  { title: '4-7-8 Breathing', description: 'Inhale 4 counts, hold 7, exhale 8. Activates your calm response instantly.', icon: 'leaf', screen: 'Meditate', gradient: colors.gradientSuccess },
  { title: 'Gratitude Journal', description: 'Write 3 things you\'re grateful for today. Rewires your brain toward positivity.', icon: 'star', screen: 'Wellness', gradient: colors.gradientGold },
  { title: 'Mindful Check-in', description: 'Track your mood now to understand your emotional patterns over time.', icon: 'happy', screen: 'Mood', gradient: colors.gradientPrimary },
  { title: 'Chat with AI', description: 'Share how you feel. MindGuard AI is always here to listen and support you.', icon: 'sparkles', screen: 'Chat', gradient: colors.gradientSunset },
];

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  const [todayCheckIn, setTodayCheckIn] = useState(null);
  const [stats, setStats] = useState({ streak: 0, avg_mood: 0, total_entries: 0 });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';
  const greetingIcon = currentHour < 12 ? '🌅' : currentHour < 18 ? '☀️' : '🌙';

  // Cycle through wellness tips
  const tipIndex = new Date().getDate() % WELLNESS_TIPS.length;
  const wellnessTip = WELLNESS_TIPS[tipIndex];

  useEffect(() => {
    Animated.stagger(150, [
      Animated.timing(headerAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(cardAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();

    loadHomeData();
    const unsubscribe = navigation.addListener('focus', loadHomeData);
    return unsubscribe;
  }, [navigation]);

  const loadHomeData = async () => {
    try {
      const [todayRes, statsRes] = await Promise.all([
        moodAPI.getToday(),
        historyAPI.getStats(),
      ]);
      setTodayCheckIn(todayRes.data);
      setStats(statsRes.data);
    } catch (e) {
      console.log('Home load error:', e?.response?.status, e?.message);
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  const quickActions = [
    { icon: 'happy', label: 'Track Mood', gradient: colors.gradientPrimary, screen: 'Mood' },
    { icon: 'chatbubbles', label: 'Talk to AI', gradient: colors.gradientPink, screen: 'Chat' },
    { icon: 'leaf', label: 'Breathe', gradient: colors.gradientSuccess, screen: 'Meditate' },
    { icon: 'bar-chart', label: 'My Stats', gradient: colors.gradientCool, screen: 'History' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={colors.gradientBackground} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />

      <FloatingOrb style={{ top: -60, left: -60 }} color={colors.primaryGlow} size={200} />
      <FloatingOrb style={{ top: height * 0.3, right: -80 }} color={colors.secondaryGlow} size={160} />
      <FloatingOrb style={{ bottom: 200, left: -40 }} color={colors.accentGlow} size={140} />

      {/* Logout Modal */}
      <LogoutModal
        visible={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        username={user?.username || 'Friend'}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: 120 }]}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <View>
            <Text style={styles.appName}>✦ MindGuard AI</Text>
            <Text style={styles.greeting}>{greetingIcon} {greeting}, {user?.username || 'Friend'}!</Text>
          </View>
          {/* Avatar → opens logout modal */}
          <TouchableOpacity onPress={() => setShowLogoutModal(true)} style={styles.avatarBtn} activeOpacity={0.8}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.avatarBorder} />
            <LinearGradient colors={colors.gradientPrimary} style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.username || 'U')[0].toUpperCase()}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Today's Status Card */}
        <Animated.View style={{ opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
          <GlassCard style={styles.heroCard}>
            <LinearGradient colors={['rgba(124,58,237,0.2)', 'rgba(6,182,212,0.1)', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={styles.heroCardContent}>
              <View style={styles.heroLeft}>
                <Text style={styles.heroLabel}>✦ TODAY'S MENTAL STATE</Text>
                {todayCheckIn ? (
                  <>
                    <Text style={styles.heroMood}>Check-in Complete!</Text>
                    <StressBadge level={todayCheckIn.stress_level} />
                    <Text style={styles.heroSub} numberOfLines={3}>{todayCheckIn.stress_explanation}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.heroMood}>How are you feeling?</Text>
                    <StressBadge level="LOW" />
                    <Text style={styles.heroSub}>Track your mood to get a personalized AI analysis</Text>
                  </>
                )}
              </View>
              <View style={styles.heroRight}>
                <View style={styles.moodRingOuter}>
                  <LinearGradient colors={colors.gradientPrimary} style={styles.moodRing} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <View style={styles.moodRingInner}>
                      <Text style={styles.moodEmoji}>{todayCheckIn ? '🌱' : '🧠'}</Text>
                    </View>
                  </LinearGradient>
                </View>
                {stats?.streak > 0 && (
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakText}>🔥 {stats.streak}d</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.checkInBtn}
              onPress={() => todayCheckIn ? navigation.navigate('Wellness', { stressLevel: todayCheckIn.stress_level }) : navigation.navigate('Mood')}
              activeOpacity={0.8}
            >
              <LinearGradient colors={colors.gradientPrimary} style={styles.checkInBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.checkInBtnText}>
                  {todayCheckIn ? 'View Wellness Plan' : 'Start Daily Check-in'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Day Streak', value: `🔥 ${stats?.streak || 0}`, color: colors.warning },
            { label: 'Avg Mood', value: `😊 ${typeof stats?.avg_mood === 'number' ? stats.avg_mood.toFixed(1) : '—'}`, color: colors.secondary },
            { label: 'Check-ins', value: `📊 ${stats?.total_entries || 0}`, color: colors.primary },
          ].map((stat, i) => (
            <GlassCard key={i} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.sectionDot} />
        </View>
        <View style={styles.quickActionsGrid}>
          <View style={styles.quickActionsRow}>
            {quickActions.slice(0, 2).map((action, i) => (
              <QuickAction key={i} {...action} delay={i * 100} onPress={() => navigation.navigate(action.screen)} />
            ))}
          </View>
          <View style={styles.quickActionsRow}>
            {quickActions.slice(2, 4).map((action, i) => (
              <QuickAction key={i} {...action} delay={(i + 2) * 100} onPress={() => navigation.navigate(action.screen)} />
            ))}
          </View>
        </View>

        {/* Daily Wellness Tip */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Wellness Tip of the Day</Text>
          <View style={[styles.sectionDot, { backgroundColor: colors.secondary }]} />
        </View>
        <GlassCard style={styles.tipCard} onPress={() => navigation.navigate(wellnessTip.screen)}>
          <LinearGradient colors={['rgba(6,182,212,0.12)', 'transparent']} style={StyleSheet.absoluteFill} />
          <View style={styles.tipContent}>
            <LinearGradient colors={wellnessTip.gradient} style={styles.tipIcon}>
              <Ionicons name={wellnessTip.icon} size={24} color="#fff" />
            </LinearGradient>
            <View style={styles.tipTextArea}>
              <Text style={styles.tipTitle}>{wellnessTip.title}</Text>
              <Text style={styles.tipDescription}>{wellnessTip.description}</Text>
            </View>
          </View>
          <View style={styles.tipArrow}>
            <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
          </View>
        </GlassCard>

        {/* AI Chatbot Promo */}
        <GlassCard style={styles.chatPromoCard} onPress={() => navigation.navigate('Chat')}>
          <LinearGradient colors={['rgba(236,72,153,0.18)', 'rgba(124,58,237,0.12)', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={styles.chatPromoContent}>
            <LinearGradient colors={colors.gradientSunset} style={styles.chatPromoIcon}>
              <Ionicons name="sparkles" size={28} color="#fff" />
            </LinearGradient>
            <View style={styles.chatPromoText}>
              <Text style={styles.chatPromoTitle}>Talk to MindGuard AI</Text>
              <Text style={styles.chatPromoSub}>Powered by Gemini 2.0 Flash · Always here for you 💜</Text>
            </View>
          </View>
          <View style={styles.chatPromoArrow}>
            <Ionicons name="chatbubbles" size={20} color={colors.accent} />
          </View>
        </GlassCard>

        {/* Model status indicator */}
        <View style={styles.modelStatus}>
          <View style={styles.modelStatusDot} />
          <Text style={styles.modelStatusText}>4 AI Models · Gemini 2.0 Flash · Always Learning</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 20 },
  orb: { position: 'absolute', opacity: 0.4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  appName: { fontSize: 12, fontWeight: '700', color: colors.primaryLight, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  avatarBtn: { width: 46, height: 46, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorder },
  avatarBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 16, borderWidth: 1, borderColor: colors.glassBorder },
  avatar: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },

  glassCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorder },
  glassCardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 24, borderWidth: 1, borderColor: colors.glassBorder },

  heroCard: { marginBottom: 16, backgroundColor: colors.glass },
  heroCardContent: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 12 },
  heroLeft: { flex: 1, marginRight: 16 },
  heroLabel: { fontSize: 10, fontWeight: '700', color: colors.primaryLight, letterSpacing: 2, marginBottom: 6 },
  heroMood: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 10, letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginTop: 8 },
  heroRight: { alignItems: 'center', gap: 10 },
  moodRingOuter: { padding: 3, borderRadius: 50, backgroundColor: 'rgba(124,58,237,0.2)' },
  moodRing: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  moodRingInner: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  moodEmoji: { fontSize: 34 },
  streakBadge: { backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)' },
  streakText: { fontSize: 12, color: colors.warning, fontWeight: '700' },
  checkInBtn: { margin: 16, marginTop: 4, borderRadius: 16, overflow: 'hidden' },
  checkInBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  checkInBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  stressBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start' },
  stressBadgeText: { fontSize: 12, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, backgroundColor: colors.glass },
  statValue: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600', letterSpacing: 0.5, textAlign: 'center' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },

  quickActionsGrid: { gap: 10, marginBottom: 28 },
  quickActionsRow: { flexDirection: 'row', gap: 10 },
  quickAction: { flex: 1, alignItems: 'center', paddingVertical: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glass, gap: 10 },
  quickActionIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },

  tipCard: { marginBottom: 14, backgroundColor: colors.glass, padding: 16 },
  tipContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tipIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tipTextArea: { flex: 1 },
  tipTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  tipDescription: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  tipArrow: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(6,182,212,0.15)', alignItems: 'center', justifyContent: 'center', marginTop: 10, alignSelf: 'flex-end' },

  chatPromoCard: { marginBottom: 14, backgroundColor: colors.glass, padding: 16 },
  chatPromoContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  chatPromoIcon: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chatPromoText: { flex: 1 },
  chatPromoTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  chatPromoSub: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  chatPromoArrow: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(236,72,153,0.15)', alignItems: 'center', justifyContent: 'center', marginTop: 10, alignSelf: 'flex-end' },

  modelStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20, opacity: 0.5 },
  modelStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  modelStatusText: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },

  // Logout modal
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: {
    width: '80%', maxWidth: 340, borderRadius: 28, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.glassBorder, padding: 28, alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(13, 18, 38, 0.95)',
  },
  modalIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  modalSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  modalCancelBtn: { flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorder, paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { color: colors.textSecondary, fontSize: 15, fontWeight: '700' },
  modalConfirmBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  modalConfirmGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  modalConfirmText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
