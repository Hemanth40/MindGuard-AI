import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Dimensions, Animated, StatusBar, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

function FloatingOrb({ style, color, size }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 4000 + Math.random() * 2000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 4000 + Math.random() * 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.15, 1] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.25, 0.45, 0.25] });
  return (
    <Animated.View style={[styles.orb, style, { width: size, height: size, borderRadius: size / 2, backgroundColor: color, transform: [{ translateY }, { scale }], opacity }]} />
  );
}

export default function WelcomeScreen() {
  const { enterSanctuary } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleStart = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name to continue');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await enterSanctuary(trimmed);
    } catch (err) {
      console.log('Error entering sanctuary:', err);
      setError(err?.response?.data?.detail || err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={colors.gradientBackground} style={StyleSheet.absoluteFill} />

      {/* Floating ambient orbs */}
      <FloatingOrb style={{ top: -80, right: -80 }} color={colors.primaryGlow} size={260} />
      <FloatingOrb style={{ bottom: -60, left: -60 }} color={colors.secondaryGlow} size={240} />
      <FloatingOrb style={{ top: height * 0.4, left: -90 }} color={colors.accentGlow} size={180} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.cardContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.glassCard}>
              <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.glassCardBorder} />

              {/* Logo Section */}
              <View style={styles.logoSection}>
                <LinearGradient colors={colors.gradientCool} style={styles.logoBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="shield-checkmark" size={36} color="#fff" />
                </LinearGradient>
                <Text style={styles.welcomeText}>MindGuard AI</Text>
                <Text style={styles.subText}>Your Personal Mental Wellness Sanctuary</Text>
              </View>

              <Text style={styles.tagline}>
                No passwords or accounts needed.{'\n'}Tell us what to call you to get started.
              </Text>

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color={colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Name Input */}
              <Text style={styles.label}>WHAT IS YOUR NAME?</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.45)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name (e.g., Alex)"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (error) setError('');
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={30}
                  returnKeyType="done"
                  onSubmitEditing={handleStart}
                />
              </View>

              {/* Enter Button */}
              <TouchableOpacity
                onPress={handleStart}
                activeOpacity={0.8}
                style={styles.btnContainer}
                disabled={loading}
              >
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.btnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <View style={styles.btnRow}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.btnText}>Opening Sanctuary...</Text>
                    </View>
                  ) : (
                    <View style={styles.btnRow}>
                      <Text style={styles.btnText}>Enter Sanctuary</Text>
                      <Ionicons name="sparkles" size={18} color="#fff" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Secure note */}
              <View style={styles.privacyNote}>
                <Ionicons name="lock-closed-outline" size={14} color="rgba(255,255,255,0.35)" />
                <Text style={styles.privacyText}>Your private emotional data stays safe & secure</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  orb: { position: 'absolute', opacity: 0.3 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    overflow: 'hidden',
  },
  glassCard: {
    padding: 32,
    borderRadius: 28,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  glassCardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 28, borderWidth: 1, borderColor: colors.glassBorder },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBg: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.danger}15`,
    borderColor: `${colors.danger}33`,
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', flex: 1 },
  label: {
    fontSize: 11,
    color: colors.primaryLight,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: 20,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    height: 52,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  btnContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  btnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 22,
  },
  privacyText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
});
