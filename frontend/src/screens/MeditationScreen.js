import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Animated, StatusBar, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { meditationAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

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

// Confetti emoji burst for session completion
function CompletionBurst() {
  const emojis = ['🎉', '✨', '💜', '🌟', '🌈', '💫', '🎊', '💙', '🌸', '⭐'];
  const anims = useRef(emojis.map(() => ({
    translateY: new Animated.Value(0),
    translateX: new Animated.Value(0),
    opacity: new Animated.Value(1),
    scale: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    anims.forEach((anim, i) => {
      const angle = (i / emojis.length) * Math.PI * 2;
      const distance = 80 + Math.random() * 60;
      Animated.parallel([
        Animated.timing(anim.scale, { toValue: 1.5, duration: 400, delay: i * 50, useNativeDriver: true }),
        Animated.timing(anim.translateX, { toValue: Math.cos(angle) * distance, duration: 800, delay: i * 50, useNativeDriver: true }),
        Animated.timing(anim.translateY, { toValue: Math.sin(angle) * distance, duration: 800, delay: i * 50, useNativeDriver: true }),
        Animated.timing(anim.opacity, { toValue: 0, duration: 800, delay: 600 + i * 50, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  return (
    <View style={styles.burstContainer}>
      {emojis.map((emoji, i) => (
        <Animated.Text
          key={i}
          style={[styles.burstEmoji, {
            transform: [
              { translateX: anims[i].translateX },
              { translateY: anims[i].translateY },
              { scale: anims[i].scale },
            ],
            opacity: anims[i].opacity,
          }]}
        >
          {emoji}
        </Animated.Text>
      ))}
    </View>
  );
}

// Breathing player
function BreathingPlayer({ exercise, onBack }) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState('Get Ready');
  const [timeLeft, setTimeLeft] = useState(exercise.duration);
  const [cycleTime, setCycleTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const timerRef = useRef(null);
  const cycleRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          clearInterval(cycleRef.current);
          setIsRunning(false);
          setPhase('Complete!');
          setIsComplete(true);
          setShowBurst(true);
          setTimeout(() => setShowBurst(false), 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    runBreathingCycle();

    return () => {
      clearInterval(timerRef.current);
      clearInterval(cycleRef.current);
    };
  }, []);

  const runBreathingCycle = () => {
    const { inhale, hold, exhale, hold2 } = exercise;
    let currentPhase = 'Inhale';
    let phaseTime = inhale;

    setPhase('Inhale');
    setCycleTime(inhale);
    animateInhale(inhale);

    cycleRef.current = setInterval(() => {
      phaseTime -= 1;
      setCycleTime(prev => Math.max(0, prev - 1));

      if (phaseTime <= 0) {
        if (currentPhase === 'Inhale') {
          if (hold > 0) { currentPhase = 'Hold'; phaseTime = hold; setPhase('Hold'); animateHold(); }
          else { currentPhase = 'Exhale'; phaseTime = exhale; setPhase('Exhale'); animateExhale(exhale); }
        } else if (currentPhase === 'Hold') {
          currentPhase = 'Exhale'; phaseTime = exhale; setPhase('Exhale'); animateExhale(exhale);
        } else if (currentPhase === 'Exhale') {
          if (hold2 > 0) { currentPhase = 'Hold Empty'; phaseTime = hold2; setPhase('Hold Empty'); }
          else { currentPhase = 'Inhale'; phaseTime = inhale; setPhase('Inhale'); animateInhale(inhale); }
        } else {
          currentPhase = 'Inhale'; phaseTime = inhale; setPhase('Inhale'); animateInhale(inhale);
        }
        setCycleTime(phaseTime);
      }
    }, 1000);
  };

  const animateInhale = (duration) => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1.8, duration: duration * 1000, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 1, duration: duration * 1000, useNativeDriver: true }),
    ]).start();
  };
  const animateHold = () => {
    Animated.timing(scaleAnim, { toValue: 1.85, duration: 600, useNativeDriver: true }).start();
  };
  const animateExhale = (duration) => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1.0, duration: duration * 1000, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.15, duration: duration * 1000, useNativeDriver: true }),
    ]).start();
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = 1 - (timeLeft / exercise.duration);
  const phaseColors = {
    'Inhale': exercise.color,
    'Hold': '#F59E0B',
    'Exhale': colors.secondary,
    'Hold Empty': '#6366F1',
    'Get Ready': colors.primary,
    'Complete!': colors.success,
  };
  const currentPhaseColor = phaseColors[phase] || exercise.color;

  return (
    <View style={[styles.playerContainer, { paddingTop: insets.top }]}>
      <LinearGradient colors={colors.gradientBackground} style={StyleSheet.absoluteFill} />

      {showBurst && <CompletionBurst />}

      <View style={styles.playerHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.playerTitle}>{exercise.name}</Text>
        <View style={[styles.typeBadge, { backgroundColor: `${exercise.color}22`, borderColor: `${exercise.color}44` }]}>
          <Text style={[styles.typeBadgeText, { color: exercise.color }]}>{exercise.type}</Text>
        </View>
      </View>

      <View style={styles.playerContent}>

        {/* Progress ring + breathing circle */}
        <View style={styles.circleOuter}>
          {/* Glow */}
          <Animated.View style={[
            styles.breathingCircleGlow,
            {
              backgroundColor: exercise.color,
              opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.35] }),
              transform: [{ scale: scaleAnim }]
            }
          ]} />

          {/* Main circle */}
          <Animated.View style={[
            styles.breathingCircle,
            { backgroundColor: currentPhaseColor, transform: [{ scale: scaleAnim }] }
          ]}>
            <LinearGradient
              colors={[currentPhaseColor, 'rgba(255,255,255,0.3)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
          </Animated.View>

          {/* Center text */}
          <View style={styles.circleTextContainer}>
            {isComplete ? (
              <Text style={styles.completeEmoji}>🎉</Text>
            ) : (
              <>
                <Text style={[styles.phaseLabel, { color: currentPhaseColor }]}>{phase}</Text>
                {isRunning && <Text style={styles.cycleTimer}>{cycleTime}s</Text>}
              </>
            )}
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBg}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.progressLabel}>{Math.round(progress * 100)}% Complete</Text>
        </View>

        {/* Guide card */}
        <GlassCard style={styles.guideCard}>
          <Text style={styles.guideText}>
            {phase === 'Inhale' && '🌬️ Breathe in slowly through your nose, expanding your lungs fully.'}
            {phase === 'Hold' && '⏸️ Hold the breath gently. Relax your shoulders and jaw.'}
            {phase === 'Exhale' && '💨 Release the breath slowly and completely through your mouth.'}
            {phase === 'Hold Empty' && '⭕ Rest in the empty space. Wait calmly for the next breath.'}
            {phase === 'Get Ready' && '🧘 Find a comfortable position and prepare to breathe mindfully.'}
            {phase === 'Complete!' && '✅ Session complete! Your nervous system is now calmer. Well done! 🌟'}
          </Text>
        </GlassCard>

        {/* Session timer */}
        <View style={styles.sessionTimerContainer}>
          <Text style={styles.sessionTimeTitle}>⏱ SESSION TIMER</Text>
          <Text style={styles.sessionTime}>{formatTime(timeLeft)}</Text>
        </View>

        {isComplete && (
          <TouchableOpacity onPress={onBack} style={styles.doneBtn}>
            <LinearGradient colors={colors.gradientSuccess} style={styles.doneBtnGradient}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.doneBtnText}>Return to Sanctuary</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function MeditationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEx, setSelectedEx] = useState(null);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const res = await meditationAPI.getExercises();
      setExercises(res.data);
    } catch (err) {
      setExercises([
        { id: "box", name: "Box Breathing", duration: 240, type: "Breathing", description: "Used by Navy SEALs to stay calm under pressure. Perfect for acute stress.", icon: "square-outline", color: "#7C3AED", inhale: 4, hold: 4, exhale: 4, hold2: 4, steps: [] },
        { id: "478", name: "4-7-8 Breathing", duration: 300, type: "Relaxation", description: "Dr. Weil's natural tranquilizer for the nervous system. Reduces anxiety fast.", icon: "leaf-outline", color: "#06B6D4", inhale: 4, hold: 7, exhale: 8, hold2: 0, steps: [] },
        { id: "calm", name: "Calm Breathing", duration: 180, type: "Beginner", description: "Simple, gentle breathing for beginners. Great for daily practice.", icon: "flower-outline", color: "#EC4899", inhale: 5, hold: 2, exhale: 5, hold2: 2, steps: [] },
        { id: "energy", name: "Energizing Breath", duration: 120, type: "Energy", description: "Increase alertness and energy with this invigorating breathing pattern.", icon: "flash-outline", color: "#F59E0B", inhale: 3, hold: 1, exhale: 3, hold2: 1, steps: [] },
        { id: "sleep", name: "Sleep Preparation", duration: 600, type: "Sleep", description: "Wind down your nervous system before sleep. Reduces insomnia and racing thoughts.", icon: "moon-outline", color: "#6366F1", inhale: 6, hold: 3, exhale: 9, hold2: 3, steps: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (selectedEx) {
    return <BreathingPlayer exercise={selectedEx} onBack={() => setSelectedEx(null)} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={colors.gradientBackground} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: 120 }]}
      >
        <Text style={styles.title}>Breathing Sanctuary</Text>
        <Text style={styles.subtitle}>Choose a breathing exercise to lower stress and calm your mind instantly.</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primaryLight} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.listContainer}>
            {exercises.map((item, index) => (
              <GlassCard
                key={item.id}
                style={styles.exerciseCard}
                onPress={() => setSelectedEx(item)}
              >
                <LinearGradient
                  colors={[`${item.color}12`, 'transparent']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />

                <View style={styles.exerciseHeader}>
                  <View style={[styles.iconBg, { backgroundColor: `${item.color}22`, borderColor: `${item.color}33`, borderWidth: 1 }]}>
                    <Ionicons name={item.icon} size={24} color={item.color} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    <View style={styles.metaRow}>
                      <View style={[styles.typePill, { backgroundColor: `${item.color}20` }]}>
                        <Text style={[styles.typeText, { color: item.color }]}>{item.type}</Text>
                      </View>
                      <Text style={styles.durationText}>
                        <Ionicons name="time-outline" size={11} color={colors.textMuted} /> {Math.floor(item.duration / 60)} min
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.playBtn} onPress={() => setSelectedEx(item)} activeOpacity={0.8}>
                    <LinearGradient colors={colors.gradientPrimary} style={styles.playBtnGradient}>
                      <Ionicons name="play" size={16} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <Text style={styles.exerciseDesc}>{item.description}</Text>

                <View style={styles.breathingPatt}>
                  <Text style={styles.patternLabel}>BREATHING PATTERN</Text>
                  <Text style={styles.patternValue}>
                    {item.inhale}s Inhale
                    {item.hold > 0 ? ` → ${item.hold}s Hold` : ''}
                    {` → ${item.exhale}s Exhale`}
                    {item.hold2 > 0 ? ` → ${item.hold2}s Pause` : ''}
                  </Text>
                </View>
              </GlassCard>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 24 },

  glassCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glass },
  glassCardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 24, borderWidth: 1, borderColor: colors.glassBorder },

  listContainer: { gap: 16 },
  exerciseCard: { padding: 20 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  iconBg: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  exerciseName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  typeText: { fontSize: 11, fontWeight: '700' },
  durationText: { fontSize: 12, color: colors.textMuted },
  playBtn: { borderRadius: 14, overflow: 'hidden' },
  playBtnGradient: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  exerciseDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 },
  breathingPatt: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 14 },
  patternLabel: { fontSize: 9, fontWeight: '700', color: colors.secondaryLight, letterSpacing: 1.5, marginBottom: 4 },
  patternValue: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },

  // Player
  playerContainer: { flex: 1, backgroundColor: colors.background },
  playerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  playerTitle: { fontSize: 18, fontWeight: '800', color: colors.text, flex: 1, textAlign: 'center' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  playerContent: { flex: 1, alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 24, paddingVertical: 20 },

  circleOuter: { width: 260, height: 260, alignItems: 'center', justifyContent: 'center' },
  breathingCircle: { position: 'absolute', width: 120, height: 120, borderRadius: 60, overflow: 'hidden' },
  breathingCircleGlow: { position: 'absolute', width: 120, height: 120, borderRadius: 60 },
  circleTextContainer: { alignItems: 'center', zIndex: 10 },
  completeEmoji: { fontSize: 48 },
  phaseLabel: { fontSize: 24, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  cycleTimer: { fontSize: 18, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: '600' },

  // Progress
  progressContainer: { width: '100%', alignItems: 'center', gap: 8 },
  progressBg: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },

  guideCard: { padding: 20, width: '100%', maxWidth: 360 },
  guideText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, fontWeight: '500' },

  sessionTimerContainer: { alignItems: 'center' },
  sessionTimeTitle: { fontSize: 10, fontWeight: '700', color: colors.primaryLight, letterSpacing: 2, marginBottom: 6 },
  sessionTime: { fontSize: 32, fontWeight: '800', color: colors.text },

  doneBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  doneBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Burst
  burstContainer: { position: 'absolute', top: height / 2, left: width / 2, zIndex: 999 },
  burstEmoji: { position: 'absolute', fontSize: 24 },
});
