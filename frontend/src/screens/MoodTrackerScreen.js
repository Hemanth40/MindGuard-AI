import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions, Animated, StatusBar, Modal, ActivityIndicator,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { moodAPI } from '../services/api';

// Cross-platform slider: native slider on mobile, HTML range on web
let NativeSlider;
if (Platform.OS !== 'web') {
  NativeSlider = require('@react-native-community/slider').default;
}

function CrossSlider({ value, onValueChange, minimumValue, maximumValue, step, minimumTrackTintColor, thumbTintColor, style }) {
  if (Platform.OS === 'web') {
    return (
      <View style={[style, { paddingVertical: 10 }]}>
        <input
          type="range"
          min={minimumValue}
          max={maximumValue}
          step={step || 1}
          value={value}
          onChange={(e) => onValueChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            accentColor: minimumTrackTintColor || '#7C3AED',
            height: 4,
            cursor: 'pointer',
            background: `linear-gradient(to right, ${minimumTrackTintColor || '#7C3AED'} 0%, ${minimumTrackTintColor || '#7C3AED'} ${((value - minimumValue) / (maximumValue - minimumValue)) * 100}%, rgba(255,255,255,0.1) ${((value - minimumValue) / (maximumValue - minimumValue)) * 100}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
      </View>
    );
  }
  return (
    <NativeSlider
      style={style}
      value={value}
      onValueChange={onValueChange}
      minimumValue={minimumValue}
      maximumValue={maximumValue}
      step={step}
      minimumTrackTintColor={minimumTrackTintColor}
      maximumTrackTintColor="rgba(255,255,255,0.1)"
      thumbTintColor={thumbTintColor}
    />
  );
}

const { width, height } = Dimensions.get('window');

function GlassCard({ children, style }) {
  return (
    <View style={[styles.glassCard, style]}>
      {Platform.OS !== 'web' && (
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
      )}
      <View style={styles.glassCardBorder} pointerEvents="none" />
      {children}
    </View>
  );
}

export default function MoodTrackerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [mood, setMood] = useState(6);
  const [sleep, setSleep] = useState(7);
  const [anxiety, setAnxiety] = useState('medium');
  const [activity, setActivity] = useState('moderate');
  const [journal, setJournal] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Prediction result modal
  const [modalVisible, setModalVisible] = useState(false);
  const [result, setResult] = useState(null);

  const getMoodEmoji = (val) => {
    if (val <= 2) return { emoji: '😭', text: 'Awful', color: colors.danger };
    if (val <= 4) return { emoji: '😢', text: 'Bad', color: colors.dangerLight };
    if (val <= 6) return { emoji: '😐', text: 'Okay', color: colors.warning };
    if (val <= 8) return { emoji: '😊', text: 'Good', color: colors.successLight };
    return { emoji: '🤩', text: 'Excellent!', color: colors.success };
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await moodAPI.create({
        mood_score: mood,
        sleep_hours: sleep,
        anxiety_level: anxiety,
        activity_level: activity,
        journal_text: journal
      });
      setResult(res.data);
      setModalVisible(true);
    } catch (err) {
      console.log('Mood checkin error:', err);
      alert('Error submitting daily check-in. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const currentMood = getMoodEmoji(mood);

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
          <Text style={styles.headerTitle}>Daily Sanctuary</Text>
          <View style={{ width: 44 }} />
        </View>

        <Text style={styles.subtitle}>Check in with your mind. Your responses are analyzed securely by local AI models.</Text>

        {/* Step 1: Mood Slider */}
        <GlassCard style={styles.stepCard}>
          <Text style={styles.stepLabel}>✦ STEP 1</Text>
          <Text style={styles.stepTitle}>How is your mood today?</Text>
          
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{currentMood.emoji}</Text>
            <Text style={[styles.emojiText, { color: currentMood.color }]}>{currentMood.text} ({mood}/10)</Text>
          </View>

          <CrossSlider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={mood}
            onValueChange={setMood}
            minimumTrackTintColor={colors.primary}
            thumbTintColor={colors.secondaryLight}
          />
        </GlassCard>

        {/* Step 2: Sleep hours */}
        <GlassCard style={styles.stepCard}>
          <Text style={styles.stepLabel}>✦ STEP 2</Text>
          <Text style={styles.stepTitle}>How many hours did you sleep?</Text>
          
          <View style={styles.sleepValueContainer}>
            <Ionicons name="moon-outline" size={26} color={colors.secondaryLight} />
            <Text style={styles.sleepValue}>{sleep} Hours</Text>
          </View>

          <CrossSlider
            style={styles.slider}
            minimumValue={1}
            maximumValue={12}
            step={0.5}
            value={sleep}
            onValueChange={setSleep}
            minimumTrackTintColor={colors.secondary}
            thumbTintColor={colors.primaryLight}
          />
        </GlassCard>

        {/* Step 3: Anxiety level */}
        <GlassCard style={styles.stepCard}>
          <Text style={styles.stepLabel}>✦ STEP 3</Text>
          <Text style={styles.stepTitle}>What is your anxiety level?</Text>
          
          <View style={styles.chipRow}>
            {['low', 'medium', 'high'].map((level) => {
              const active = anxiety === level;
              return (
                <TouchableOpacity
                  key={level}
                  onPress={() => setAnxiety(level)}
                  style={[styles.chip, active && styles.chipActive]}
                  activeOpacity={0.8}
                >
                  {active && <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />}
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {level.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Step 4: Activity Level */}
        <GlassCard style={styles.stepCard}>
          <Text style={styles.stepLabel}>✦ STEP 4</Text>
          <Text style={styles.stepTitle}>What was your physical activity today?</Text>
          
          <View style={styles.chipRow}>
            {['none', 'light', 'moderate', 'high'].map((level) => {
              const active = activity === level;
              return (
                <TouchableOpacity
                  key={level}
                  onPress={() => setActivity(level)}
                  style={[styles.chip, active && styles.chipActive]}
                  activeOpacity={0.8}
                >
                  {active && <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />}
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {level.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Step 5: Journal entry */}
        <GlassCard style={styles.stepCard}>
          <Text style={styles.stepLabel}>✦ STEP 5</Text>
          <Text style={styles.stepTitle}>Mind Dump / Journal (Optional)</Text>
          <Text style={styles.stepSub}>Your text will be analyzed by NLP sentiment & emotion detection models to predict stress levels.</Text>
          
          <TextInput
            multiline
            value={journal}
            onChangeText={setJournal}
            placeholder="Type your worries, thoughts, or things you are grateful for today..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            style={styles.journalInput}
            textAlignVertical="top"
            autoCorrect={false}
            spellCheck={false}
          />
        </GlassCard>

        {/* Submit */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleCheckIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient colors={colors.gradientAurora} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitText}>Submit Check-In</Text>
                <Ionicons name="sparkles" size={18} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* AI Stress Prediction Overlay Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          
          <View style={styles.modalContainer}>
            <GlassCard style={styles.modalCard}>
              <LinearGradient colors={['rgba(124,58,237,0.15)', 'rgba(6,182,212,0.15)']} style={StyleSheet.absoluteFill} />
              
              <View style={styles.modalHeader}>
                <Text style={styles.modalSub}>AI PREDICTION RESULT</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              </View>

              {result && (
                <View style={styles.modalContent}>
                  <Text style={styles.modalHeading}>Stress Analysis</Text>
                  
                  {/* Status Indicator */}
                  <View style={[styles.stressContainer, {
                    borderColor: result.stress_level === 'HIGH' ? colors.stressHigh : result.stress_level === 'MODERATE' ? colors.stressModerate : colors.stressLow,
                    backgroundColor: `${result.stress_level === 'HIGH' ? colors.stressHigh : result.stress_level === 'MODERATE' ? colors.stressModerate : colors.stressLow}15`
                  }]}>
                    <Text style={[styles.stressLevelText, {
                      color: result.stress_level === 'HIGH' ? colors.stressHigh : result.stress_level === 'MODERATE' ? colors.stressModerate : colors.stressLow
                    }]}>
                      {result.stress_level} STRESS
                    </Text>
                    <Text style={styles.confidenceText}>Confidence: {Math.round(result.stress_confidence * 100)}%</Text>
                  </View>

                  <Text style={styles.explanationText}>{result.stress_explanation}</Text>

                  {/* Recommendations */}
                  <Text style={styles.sectionHeading}>✦ PERSONALIZED RECOMMENDATIONS</Text>
                  <View style={styles.recsList}>
                    {result.stress_level === 'HIGH' && (
                      <TouchableOpacity
                        style={styles.recItemAction}
                        onPress={() => {
                          setModalVisible(false);
                          navigation.navigate('Meditate');
                        }}
                      >
                        <LinearGradient colors={colors.gradientPrimary} style={styles.recItemActionIcon}>
                          <Ionicons name="leaf" size={20} color="#fff" />
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.recActionTitle}>Recommended Exercise</Text>
                          <Text style={styles.recActionSub}>Try Navy SEAL Box Breathing (4 mins)</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                    )}

                    {result.stress_level === 'MODERATE' && (
                      <TouchableOpacity
                        style={styles.recItemAction}
                        onPress={() => {
                          setModalVisible(false);
                          navigation.navigate('Chat');
                        }}
                      >
                        <LinearGradient colors={colors.gradientPink} style={styles.recItemActionIcon}>
                          <Ionicons name="chatbubbles" size={20} color="#fff" />
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.recActionTitle}>Talk to MindGuard AI</Text>
                          <Text style={styles.recActionSub}>Chat with your empathetic wellness companion</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                    )}

                    {/* Standard items */}
                    <View style={styles.recsBulletPoints}>
                      <Text style={styles.bulletTitle}>Quick Wellness Steps:</Text>
                      {result.stress_explanation && result.stress_level && (
                        (result.stress_level === 'HIGH' ? [
                          "Try the 4-7-8 breathing technique right now",
                          "Take a 10-minute mindfulness walk",
                          "Talk to someone you trust today"
                        ] : result.stress_level === 'MODERATE' ? [
                          "Do a 5-minute box breathing session",
                          "Take short breaks every hour",
                          "Stay hydrated — drink water now"
                        ] : [
                          "Great job! Keep your positive momentum",
                          "Continue your sleep routine — it's working!",
                          "Share your good energy with others today"
                        ]).map((rec, i) => (
                          <View key={i} style={styles.bulletItem}>
                            <Ionicons name="checkmark-circle-outline" size={16} color={colors.secondaryLight} />
                            <Text style={styles.bulletText}>{rec}</Text>
                          </View>
                        ))
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={() => {
                      setModalVisible(false);
                      navigation.navigate('Home');
                    }}
                  >
                    <Text style={styles.doneBtnText}>Return to Sanctuary</Text>
                  </TouchableOpacity>
                </View>
              )}
            </GlassCard>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 20 },
  
  // Glass cards
  glassCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glass },
  glassCardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 24, borderWidth: 1, borderColor: colors.glassBorder },

  stepCard: { padding: 20, marginBottom: 16 },
  stepLabel: { fontSize: 9, fontWeight: '700', color: colors.primaryLight, letterSpacing: 2, marginBottom: 8 },
  stepTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  stepSub: { fontSize: 12, color: colors.textMuted, lineHeight: 16, marginBottom: 12 },

  // Mood step
  emojiContainer: { alignItems: 'center', marginVertical: 14 },
  emoji: { fontSize: 56, marginBottom: 8 },
  emojiText: { fontSize: 16, fontWeight: '700' },
  slider: { width: '100%', height: 40 },

  // Sleep step
  sleepValueContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 14, alignSelf: 'center' },
  sleepValue: { fontSize: 20, fontWeight: '800', color: colors.text },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  chip: { flex: 1, minWidth: 80, height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  chipActive: { borderColor: colors.secondary, backgroundColor: 'rgba(6,182,212,0.15)' },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.text, fontWeight: '700' },

  // Journal step
  journalInput: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    color: '#fff',
    padding: 14,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 110,
    maxHeight: 200,
    textAlignVertical: 'top',
    zIndex: 10,
  },

  // Submit button
  submitBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 10, marginBottom: 30 },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Modal
  modalBg: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', maxWidth: 420, borderRadius: 28, overflow: 'hidden' },
  modalCard: { padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalSub: { fontSize: 10, fontWeight: '700', color: colors.primaryLight, letterSpacing: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modalContent: { alignItems: 'stretch' },
  modalHeading: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 14, letterSpacing: -0.5 },
  
  stressContainer: {
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  stressLevelText: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  confidenceText: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  explanationText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 20 },

  sectionHeading: { fontSize: 11, fontWeight: '700', color: colors.secondaryLight, letterSpacing: 1.5, marginBottom: 10 },
  recsList: { gap: 10, marginBottom: 24 },
  recItemAction: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: 'rgba(255,255,255,0.03)' },
  recItemActionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recActionTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  recActionSub: { color: colors.textSecondary, fontSize: 12 },

  recsBulletPoints: { backgroundColor: 'rgba(0,0,0,0.15)', padding: 14, borderRadius: 16, gap: 10 },
  bulletTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 2 },
  bulletItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulletText: { color: colors.textSecondary, fontSize: 13, flex: 1 },

  doneBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' }
});
