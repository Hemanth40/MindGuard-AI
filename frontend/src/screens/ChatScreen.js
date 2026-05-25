import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, Animated, Alert, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { chatAPI, historyAPI } from '../services/api';

// ─────────────────────────────────────────────
// Markdown → React Native renderer (no packages needed)
// Handles: **bold**, *italic*, ### headings, - bullets, numbered lists, line breaks
// ─────────────────────────────────────────────
function MarkdownText({ text, isUser }) {
  const baseColor   = isUser ? '#fff' : 'rgba(255,255,255,0.92)';
  const mutedColor  = isUser ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.65)';
  const accentColor = isUser ? '#fff' : colors.primaryLight;

  // Parse a single inline text segment for **bold** and *italic*
  function renderInline(raw, keyPrefix) {
    const parts = [];
    // Regex: **bold**, *italic*
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
    let last = 0;
    let m;
    let idx = 0;
    while ((m = regex.exec(raw)) !== null) {
      if (m.index > last) {
        parts.push(
          <Text key={`${keyPrefix}-t${idx}`} style={{ color: baseColor }}>
            {raw.slice(last, m.index)}
          </Text>
        );
        idx++;
      }
      if (m[0].startsWith('**')) {
        parts.push(
          <Text key={`${keyPrefix}-b${idx}`} style={{ fontWeight: '800', color: baseColor }}>
            {m[2]}
          </Text>
        );
      } else {
        parts.push(
          <Text key={`${keyPrefix}-i${idx}`} style={{ fontStyle: 'italic', color: mutedColor }}>
            {m[3]}
          </Text>
        );
      }
      last = m.index + m[0].length;
      idx++;
    }
    if (last < raw.length) {
      parts.push(
        <Text key={`${keyPrefix}-e${idx}`} style={{ color: baseColor }}>
          {raw.slice(last)}
        </Text>
      );
    }
    return parts.length > 0 ? parts : [<Text key={`${keyPrefix}-only`} style={{ color: baseColor }}>{raw}</Text>];
  }

  // Split by lines and render each appropriately
  const lines = text.split('\n');
  const elements = [];
  let listBuffer = [];

  function flushList(key) {
    if (listBuffer.length === 0) return;
    elements.push(
      <View key={`list-${key}`} style={mdStyles.listBlock}>
        {listBuffer.map((item, i) => (
          <View key={i} style={mdStyles.listItem}>
            <View style={[mdStyles.bullet, { backgroundColor: accentColor }]} />
            <Text style={[mdStyles.listText, { color: baseColor }]}>{item}</Text>
          </View>
        ))}
      </View>
    );
    listBuffer = [];
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Skip pure empty lines but flush list
    if (trimmed === '') {
      flushList(i);
      elements.push(<View key={`gap-${i}`} style={{ height: 6 }} />);
      return;
    }

    // ### Heading (strip #'s)
    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      flushList(i);
      elements.push(
        <Text key={`h-${i}`} style={[mdStyles.heading, { color: accentColor }]}>
          {headingMatch[1].replace(/\*\*/g, '')}
        </Text>
      );
      return;
    }

    // Bullet: lines starting with - or * or •
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      const content = bulletMatch[1];
      // Inline parse for bold in bullets
      listBuffer.push(content);
      return;
    }

    // Numbered list: 1. 2. etc.
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      flushList(i);
      elements.push(
        <View key={`nl-${i}`} style={mdStyles.listItem}>
          <Text style={[mdStyles.numberLabel, { color: accentColor }]}>
            {numberedMatch[1]}.
          </Text>
          <Text style={[mdStyles.listText, { color: baseColor, flex: 1 }]}>
            {numberedMatch[2]}
          </Text>
        </View>
      );
      return;
    }

    // Emoji-prefixed action lines (🌿 WHAT TO DO / ⚠️ WHAT TO AVOID)
    const actionMatch = trimmed.match(/^([🌿⚠️✅❌💜🧠🌱✨💡🎯🔥💪🏃‍♂️😴🌙]+)\s+\*?\*?([A-Z][A-Z\s]+)\*?\*?[:\s]*(.*)/);
    if (actionMatch) {
      flushList(i);
      elements.push(
        <View key={`act-${i}`} style={mdStyles.actionLine}>
          <Text style={mdStyles.actionEmoji}>{actionMatch[1]}</Text>
          <Text style={[mdStyles.actionLabel, { color: accentColor }]}>
            {actionMatch[2].trim()}{actionMatch[3] ? ':' : ''}
          </Text>
          {actionMatch[3] ? (
            <Text style={[mdStyles.actionText, { color: baseColor }]}> {actionMatch[3]}</Text>
          ) : null}
        </View>
      );
      return;
    }

    // Normal paragraph line — flush list first
    flushList(i);
    elements.push(
      <Text key={`p-${i}`} style={[mdStyles.paragraph, { color: baseColor }]}>
        {renderInline(trimmed, `p-${i}`)}
      </Text>
    );
  });

  // Flush any remaining list
  flushList('end');

  return <View style={mdStyles.container}>{elements}</View>;
}

const mdStyles = StyleSheet.create({
  container:    { flexShrink: 1 },
  heading:      { fontSize: 14, fontWeight: '800', marginBottom: 6, marginTop: 4, letterSpacing: 0.2 },
  paragraph:    { fontSize: 14, lineHeight: 22, marginBottom: 2 },
  listBlock:    { marginVertical: 4, gap: 5 },
  listItem:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bullet:       { width: 6, height: 6, borderRadius: 3, marginTop: 8, flexShrink: 0 },
  listText:     { fontSize: 14, lineHeight: 22, flexShrink: 1 },
  numberLabel:  { fontSize: 14, fontWeight: '700', minWidth: 20, lineHeight: 22 },
  actionLine:   { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginVertical: 4, gap: 4 },
  actionEmoji:  { fontSize: 16 },
  actionLabel:  { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  actionText:   { fontSize: 13, lineHeight: 20, flexShrink: 1 },
});

// ─────────────────────────────────────────────
// Quick suggestion chips
// ─────────────────────────────────────────────
const QUICK_CHIPS = [
  { id: 1, text: "I'm feeling stressed 😟",   icon: "alert-circle-outline" },
  { id: 2, text: "I can't sleep 😴",           icon: "moon-outline" },
  { id: 3, text: "I need motivation 💪",       icon: "flash-outline" },
  { id: 4, text: "I'm feeling anxious 😰",     icon: "heart-outline" },
  { id: 5, text: "I'm grateful today ☀️",      icon: "sunny-outline" },
  { id: 6, text: "Talk me through breathing",  icon: "leaf-outline" },
];

// ─────────────────────────────────────────────
// Animated typing dots
// ─────────────────────────────────────────────
function TypingDots() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    dots.forEach((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: -5, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0,  duration: 280, useNativeDriver: true }),
          Animated.delay(500),
        ])
      ).start()
    );
  }, []);

  return (
    <View style={styles.typingDotsRow}>
      {dots.map((dot, i) => (
        <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: dot }] }]} />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────
// Glass card wrapper
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Main ChatScreen
// ─────────────────────────────────────────────
export default function ChatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [messages,     setMessages]     = useState([]);
  const [inputText,    setInputText]    = useState('');
  const [loading,      setLoading]      = useState(false);
  const [stressContext,setStressContext] = useState('UNKNOWN');
  const [showChips,    setShowChips]    = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => { loadHistory(); }, []);

  const welcomeMessage = () => ({
    id:     'welcome',
    text:   "Hello! I'm **MindGuard**, your compassionate AI wellness companion. 💜\n\nI'm here 24/7 to listen, support you, and guide you through stress and anxiety. How is your heart feeling today?",
    sender: 'ai',
    time:   new Date().toISOString(),
  });

  const loadHistory = async () => {
    try {
      const moodRes = await historyAPI.getMoodHistory(1);
      if (moodRes.data?.length > 0) {
        setStressContext(moodRes.data[moodRes.data.length - 1].stress_level || 'UNKNOWN');
      }
      const chatRes = await chatAPI.getHistory(30);
      const formatted = chatRes.data.flatMap(item => [
        { id: `${item.id}_u`, text: item.user_message, sender: 'user', time: item.created_at },
        { id: `${item.id}_ai`, text: item.ai_response, sender: 'ai',  time: item.created_at },
      ]).reverse();

      if (formatted.length === 0) {
        setMessages([welcomeMessage()]);
        setShowChips(true);
      } else {
        setMessages(formatted);
        setShowChips(false);
      }
    } catch {
      setMessages([welcomeMessage()]);
      setShowChips(true);
    }
  };

  const sendMessage = async (text) => {
    if (!text?.trim()) return;
    const userMsg = { id: Date.now().toString(), text: text.trim(), sender: 'user', time: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    setShowChips(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const res   = await chatAPI.send({ message: userMsg.text, stress_context: stressContext });
      const aiMsg = { id: (Date.now()+1).toString(), text: res.data.response, sender: 'ai', time: res.data.timestamp || new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id:     (Date.now()+1).toString(),
        text:   "I'm having trouble connecting right now. 💙 Please try again in a moment.",
        sender: 'ai',
        time:   new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  const handleClearHistory = () => {
    const doClear = async () => {
      try {
        await chatAPI.clearHistory();
        setMessages([welcomeMessage()]);
        setShowChips(true);
        setInputText('');
      } catch {
        if (Platform.OS === 'web') window.alert('Could not clear history.');
        else Alert.alert('Error', 'Could not clear history. Please try again.');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Clear chat history and start a new conversation?')) doClear();
    } else {
      Alert.alert('New Conversation', 'Clear chat history and start fresh?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear & Start Fresh', onPress: doClear, style: 'destructive' },
      ]);
    }
  };

  const stressColor = stressContext === 'HIGH'
    ? colors.stressHigh
    : stressContext === 'MODERATE'
    ? colors.stressModerate
    : colors.stressLow;

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && (
          <LinearGradient colors={colors.gradientSunset} style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={11} color="#fff" />
          </LinearGradient>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          {!isUser && Platform.OS !== 'web' && (
            <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
          )}
          {!isUser && <View style={styles.bubbleBorder} pointerEvents="none" />}
          {isUser && (
            <LinearGradient colors={colors.gradientPrimary} style={StyleSheet.absoluteFill} pointerEvents="none" />
          )}
          <MarkdownText text={item.text} isUser={isUser} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={colors.gradientBackground} style={StyleSheet.absoluteFill} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={colors.gradientSunset} style={styles.avatarIcon}>
            <Ionicons name="sparkles" size={18} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>MindGuard AI</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Gemini 2.5 Flash</Text>
              {stressContext !== 'UNKNOWN' && (
                <View style={[styles.badge, { backgroundColor: `${stressColor}22`, borderColor: `${stressColor}55` }]}>
                  <Text style={[styles.badgeText, { color: stressColor }]}>{stressContext}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleClearHistory} style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={17} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Chat body ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Typing indicator */}
        {loading && (
          <View style={styles.typingContainer}>
            {Platform.OS !== 'web' && (
              <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
            )}
            <View style={styles.bubbleBorder} pointerEvents="none" />
            <LinearGradient colors={colors.gradientSunset} style={styles.typingAvatar}>
              <Ionicons name="sparkles" size={9} color="#fff" />
            </LinearGradient>
            <TypingDots />
            <Text style={styles.typingText}>MindGuard is thinking...</Text>
          </View>
        )}

        {/* Quick chips */}
        {showChips && !loading && (
          <View style={styles.chipsSection}>
            <Text style={styles.chipsLabel}>✦ QUICK START</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {QUICK_CHIPS.map(chip => (
                <TouchableOpacity
                  key={chip.id}
                  onPress={() => sendMessage(chip.text)}
                  style={styles.chip}
                  activeOpacity={0.75}
                >
                  {Platform.OS !== 'web' && (
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
                  )}
                  <View style={styles.chipBorder} pointerEvents="none" />
                  <Ionicons name={chip.icon} size={13} color={colors.secondaryLight} />
                  <Text style={styles.chipText}>{chip.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <GlassCard style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Share what's on your mind..."
              placeholderTextColor="rgba(255,255,255,0.28)"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={() => { if (inputText.trim()) sendMessage(inputText); }}
            />
            <TouchableOpacity
              onPress={() => sendMessage(inputText)}
              style={[styles.sendBtn, { opacity: inputText.trim() && !loading ? 1 : 0.4 }]}
              activeOpacity={0.8}
              disabled={!inputText.trim() || loading}
            >
              <LinearGradient colors={colors.gradientPrimary} style={styles.sendBtnGrad}>
                <Ionicons name="send" size={15} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderColor: colors.glassBorder,
    backgroundColor: 'rgba(8,11,24,0.6)',
  },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 },
  headerRight:  { flexDirection: 'row', gap: 8 },
  avatarIcon:   { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 16, fontWeight: '800', color: colors.text },
  statusRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2, flexWrap: 'wrap' },
  statusDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  statusText:   { fontSize: 11, color: colors.textSecondary },
  badge:        { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 8, borderWidth: 1 },
  badgeText:    { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  iconBtn:      {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: colors.glassBorder,
  },

  // Messages
  listContent: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 8, gap: 12 },
  messageRow:  { flexDirection: 'row', gap: 9 },
  userRow:     { alignSelf: 'flex-end', justifyContent: 'flex-end', maxWidth: '88%' },
  aiRow:       { alignSelf: 'flex-start', maxWidth: '92%' },
  aiAvatar:    { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 4, flexShrink: 0 },
  bubble:      { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 20, overflow: 'hidden', flexShrink: 1 },
  userBubble:  { borderBottomRightRadius: 5 },
  aiBubble:    { borderBottomLeftRadius: 5, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: 'rgba(255,255,255,0.05)' },
  bubbleBorder:{ ...StyleSheet.absoluteFillObject, borderRadius: 20, borderWidth: 1, borderColor: colors.glassBorder },

  // Glass
  glassCard:     { borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glass },
  glassCardBorder:{ ...StyleSheet.absoluteFillObject, borderRadius: 22, borderWidth: 1, borderColor: colors.glassBorder },

  // Typing indicator
  typingContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start', marginLeft: 50, marginBottom: 6,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  typingAvatar:  { width: 18, height: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  typingDotsRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  typingDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primaryLight },
  typingText:    { fontSize: 12, color: colors.textSecondary },

  // Quick chips
  chipsSection: { paddingLeft: 16, marginBottom: 6 },
  chipsLabel:   { fontSize: 9, fontWeight: '700', color: colors.primaryLight, letterSpacing: 1.8, marginBottom: 8 },
  chipsRow:     { gap: 8, paddingRight: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 13, paddingVertical: 8,
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 20, borderWidth: 1, borderColor: colors.glassBorder },
  chipText:   { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' },

  // Input
  inputBar:      { paddingHorizontal: 14, paddingTop: 8, backgroundColor: 'rgba(8,11,24,0.4)' },
  inputContainer:{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 4 },
  textInput:     { flex: 1, color: '#fff', fontSize: 14, lineHeight: 20, minHeight: 40, maxHeight: 110, paddingTop: 10, paddingBottom: 10 },
  sendBtn:       { marginLeft: 8 },
  sendBtnGrad:   { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
