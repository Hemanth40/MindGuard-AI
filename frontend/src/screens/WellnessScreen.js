import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { wellnessAPI, historyAPI } from '../services/api';

function GlassCard({ children, style }) {
  return (
    <View style={[styles.glassCard, style]}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.glassCardBorder} />
      {children}
    </View>
  );
}

const TIP_ACTIONS = {
  'Breathing': { action: 'Start Exercise', icon: 'leaf', screen: 'Meditate' },
  'Movement': { action: 'Go Outside', icon: 'walk', screen: null },
  'Sleep': { action: 'Set Reminder', icon: 'moon', screen: null },
  'Connection': { action: 'Reach Out', icon: 'people', screen: null },
  'Mindfulness': { action: 'Try Now', icon: 'body', screen: 'Meditate' },
  'Hydration': { action: 'Drink Water', icon: 'water', screen: null },
  'Productivity': { action: 'Break Task', icon: 'checkmark-circle', screen: null },
  'Nutrition': { action: 'Eat Mindfully', icon: 'nutrition', screen: null },
  'Gratitude': { action: 'Write Now', icon: 'star', screen: null },
  'Growth': { action: 'Start Learning', icon: 'school', screen: null },
  'Exercise': { action: 'Work Out', icon: 'fitness', screen: null },
  'Creativity': { action: 'Create', icon: 'color-palette', screen: null },
};

function TipCard({ tip, index, levelColor, navigation, delay }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [tapped, setTapped] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const tipAction = TIP_ACTIONS[tip.category] || { action: 'Try Now', icon: 'sparkles', screen: null };
  const iconMap = {
    'leaf': 'leaf-outline', 'walk': 'walk-outline', 'moon': 'moon-outline',
    'people': 'people-outline', 'heart': 'heart-outline', 'water': 'water-outline',
    'star': 'star-outline', 'school': 'school-outline', 'fitness': 'fitness-outline',
    'color-palette': 'color-palette-outline', 'body': 'body-outline',
    'checkmark-circle': 'checkmark-circle-outline', 'nutrition': 'nutrition-outline',
  };

  const handleAction = () => {
    setTapped(true);
    if (tipAction.screen && navigation) {
      navigation.navigate(tipAction.screen);
    }
    setTimeout(() => setTapped(false), 2000);
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <GlassCard style={styles.tipCard}>
        <LinearGradient
          colors={[`${levelColor}08`, 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.tipHeader}>
          <View style={[styles.iconBg, { backgroundColor: `${levelColor}18`, borderColor: `${levelColor}30`, borderWidth: 1 }]}>
            <Ionicons name={iconMap[tip.icon] || 'sparkles-outline'} size={22} color={levelColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipCategory}>{tip.category.toUpperCase()}</Text>
            <Text style={styles.tipTitle}>{tip.title}</Text>
          </View>
          <View style={[styles.indexBadge, { backgroundColor: `${levelColor}20` }]}>
            <Text style={[styles.indexText, { color: levelColor }]}>0{index + 1}</Text>
          </View>
        </View>

        <Text style={styles.tipDesc}>{tip.description}</Text>

        <TouchableOpacity
          onPress={handleAction}
          style={[styles.actionBtn, tapped && { backgroundColor: `${levelColor}30` }]}
          activeOpacity={0.7}
        >
          <Ionicons name={tapped ? 'checkmark-circle' : tipAction.icon + '-outline'} size={14} color={tapped ? colors.success : levelColor} />
          <Text style={[styles.actionBtnText, { color: tapped ? colors.success : levelColor }]}>
            {tapped ? '✓ Done!' : tipAction.action}
          </Text>
        </TouchableOpacity>
      </GlassCard>
    </Animated.View>
  );
}

export default function WellnessScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const stressLevelParam = route?.params?.stressLevel;
  const [stressLevel, setStressLevel] = useState(stressLevelParam || 'MODERATE');
  const [tips, setTips] = useState([]);
  const [affirmation, setAffirmation] = useState('');
  const [loading, setLoading] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadWellnessTips();
    // Pulse the affirmation card
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [stressLevel]);

  const loadWellnessTips = async () => {
    setLoading(true);
    try {
      let level = stressLevel;
      if (!stressLevelParam) {
        const statsRes = await historyAPI.getMoodHistory(1);
        if (statsRes.data?.length > 0) {
          level = statsRes.data[statsRes.data.length - 1].stress_level || 'MODERATE';
          setStressLevel(level);
        }
      }
      const res = await wellnessAPI.getTips(level);
      setTips(res.data.tips);
      setAffirmation(res.data.affirmation);
    } catch (err) {
      const fallbacks = {
        HIGH: { affirmation: "You are stronger than your stress. Every storm runs out of rain. 💜", tips: [{ category: "Breathing", title: "4-7-8 Breathing", description: "Inhale 4 counts, hold 7, exhale 8. Repeat 4 times.", icon: "leaf" }, { category: "Movement", title: "5-Minute Walk", description: "Step outside for fresh air.", icon: "walk" }, { category: "Connection", title: "Reach Out", description: "Text someone you trust today.", icon: "people" }] },
        MODERATE: { affirmation: "You are making progress every single day. Keep going! 🌟", tips: [{ category: "Hydration", title: "Drink Water", description: "Stay hydrated — drink a glass right now.", icon: "water" }, { category: "Breathing", title: "Box Breathing", description: "4-4-4-4 breathing pattern for calm.", icon: "leaf" }, { category: "Gratitude", title: "3 Good Things", description: "Write 3 things you're grateful for.", icon: "star" }] },
        LOW: { affirmation: "You're thriving! Your mental wellness is your superpower. ✨", tips: [{ category: "Growth", title: "Learn Something New", description: "Your mind is open and ready.", icon: "school" }, { category: "Connection", title: "Spread Positivity", description: "Your good energy is contagious.", icon: "heart" }, { category: "Sleep", title: "Maintain Routine", description: "Keep the same bedtime to preserve your energy.", icon: "moon" }] },
      };
      const data = fallbacks[stressLevel] || fallbacks.MODERATE;
      setTips(data.tips);
      setAffirmation(data.affirmation);
    } finally {
      setLoading(false);
    }
  };

  const levelConfig = {
    HIGH: { color: colors.stressHigh, gradient: colors.gradientDanger, emoji: '⚠️', label: 'High Stress Plan' },
    MODERATE: { color: colors.stressModerate, gradient: colors.gradientWarning, emoji: '🌤️', label: 'Moderate Stress Plan' },
    LOW: { color: colors.stressLow, gradient: colors.gradientSuccess, emoji: '✨', label: 'Wellness Growth Plan' },
  };
  const cfg = levelConfig[stressLevel] || levelConfig.MODERATE;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={colors.gradientBackground} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: 120 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Wellness Plan</Text>
            <Text style={styles.headerSub}>{cfg.emoji} {cfg.label}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Level selector */}
        <View style={styles.levelRow}>
          {['LOW', 'MODERATE', 'HIGH'].map((level) => {
            const active = stressLevel === level;
            const lc = levelConfig[level];
            return (
              <TouchableOpacity
                key={level}
                onPress={() => setStressLevel(level)}
                style={[styles.levelBtn, active && { backgroundColor: `${lc.color}20`, borderColor: `${lc.color}50` }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.levelBtnText, active && { color: lc.color, fontWeight: '700' }]}>
                  {level}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primaryLight} style={{ marginTop: 60 }} />
        ) : (
          <View style={styles.content}>
            {/* Affirmation Card */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <GlassCard style={styles.affirmationCard}>
                <LinearGradient
                  colors={[`${cfg.color}15`, `${cfg.color}05`, 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.affirmationInner}>
                  <LinearGradient colors={cfg.gradient} style={styles.affirmationIcon}>
                    <Ionicons name="heart" size={20} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.affirmationText}>{affirmation}</Text>
                </View>
              </GlassCard>
            </Animated.View>

            {/* Section header */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: cfg.color }]} />
              <Text style={styles.sectionTitle}>TAILORED WELLNESS STEPS</Text>
            </View>

            {/* Tips */}
            <View style={styles.tipsList}>
              {tips.map((tip, index) => (
                <TipCard
                  key={index}
                  tip={tip}
                  index={index}
                  levelColor={cfg.color}
                  navigation={navigation}
                  delay={index * 100}
                />
              ))}
            </View>

            {/* Action footer */}
            <GlassCard style={styles.footerCard}>
              <LinearGradient colors={['rgba(124,58,237,0.1)', 'transparent']} style={StyleSheet.absoluteFill} />
              <Ionicons name="information-circle-outline" size={18} color={colors.primaryLight} />
              <Text style={styles.footerText}>
                These suggestions are based on evidence-based wellness practices and your current stress level. For persistent mental health concerns, please consult a professional.
              </Text>
            </GlassCard>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5, textAlign: 'center' },
  headerSub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },

  levelRow: { flexDirection: 'row', gap: 8, marginBottom: 20, backgroundColor: 'rgba(0,0,0,0.25)', padding: 5, borderRadius: 16 },
  levelBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  levelBtnText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },

  glassCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glass },
  glassCardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 24, borderWidth: 1, borderColor: colors.glassBorder },

  content: { gap: 18 },

  affirmationCard: { padding: 20 },
  affirmationInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  affirmationIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  affirmationText: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '600', lineHeight: 22 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot: { width: 6, height: 6, borderRadius: 3 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.primaryLight, letterSpacing: 1.5 },

  tipsList: { gap: 14 },
  tipCard: { padding: 18 },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  iconBg: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tipCategory: { fontSize: 10, fontWeight: '700', color: colors.secondaryLight, letterSpacing: 1, marginBottom: 2 },
  tipTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  indexBadge: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  indexText: { fontSize: 11, fontWeight: '800' },
  tipDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 12, borderWidth: 1, borderColor: colors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignSelf: 'flex-start',
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  footerCard: { padding: 16, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  footerText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
});
