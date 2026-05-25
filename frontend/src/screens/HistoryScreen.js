import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, StatusBar, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { colors } from '../theme/colors';
import { historyAPI, moodAPI } from '../services/api';

const { width } = Dimensions.get('window');

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

// Web-safe chart: renders a simple bar chart using Views (no SVG/DOM warnings)
function WebBarChart({ data, labels, color = '#7c3aed', height = 180 }) {
  const max = Math.max(...data, 1);
  return (
    <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingHorizontal: 8, paddingBottom: 24 }}>
      {data.map((val, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
          <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>
            {val > 0 ? val.toFixed(1) : ''}
          </Text>
          <LinearGradient
            colors={[color, color + '88']}
            style={{ width: '75%', height: `${Math.max((val / max) * 85, val > 0 ? 4 : 0)}%`, borderRadius: 4, minHeight: val > 0 ? 4 : 0 }}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          />
          <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 5 }}>{labels[i]}</Text>
        </View>
      ))}
    </View>
  );
}

const chartConfig = {
  backgroundColor: 'transparent',
  backgroundGradientFrom: 'rgba(0,0,0,0)',
  backgroundGradientTo: 'rgba(0,0,0,0)',
  backgroundGradientFromOpacity: 0,
  backgroundGradientToOpacity: 0,
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.55})`,
  style: { borderRadius: 16 },
  propsForDots: {
    r: '5',
    strokeWidth: '2',
    stroke: colors.secondaryLight,
    fill: colors.primary,
  },
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: 'rgba(255,255,255,0.05)',
    strokeWidth: 1,
  },
};

const barChartConfig = {
  ...chartConfig,
  color: (opacity = 1) => `rgba(6, 182, 212, ${opacity})`,
  barPercentage: 0.65,
};

export default function HistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState(null);
  const [historyLog, setHistoryLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState(7);
  const [activeChart, setActiveChart] = useState('line'); // 'line' | 'bar'

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [selectedRange, navigation]);

  const loadData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        historyAPI.getStats(),
        moodAPI.getRecent(selectedRange),
      ]);
      setStats(statsRes.data);
      setHistoryLog(historyRes.data);
    } catch (err) {
      console.log('Error loading history data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLineChartData = () => {
    if (!historyLog || historyLog.length === 0) {
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{ data: [5, 5, 5, 5, 5, 5, 5] }]
      };
    }
    const sorted = [...historyLog].reverse().slice(-7);
    return {
      labels: sorted.map(item =>
        new Date(item.created_at).toLocaleDateString('en-US', { weekday: 'short' })
      ),
      datasets: [{ data: sorted.map(item => item.mood_score || 5) }]
    };
  };

  const getBarChartData = () => {
    if (!stats || !stats.weekly_mood || stats.weekly_mood.length === 0) {
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }]
      };
    }
    return {
      labels: stats.weekly_mood.map(d => d.day),
      datasets: [{ data: stats.weekly_mood.map(d => d.mood || 0) }]
    };
  };

  const getStressPercent = (level) => {
    if (!stats || stats.total_entries === 0) return 0;
    const count = stats.stress_distribution?.[level.toUpperCase()] || 0;
    return count / stats.total_entries;
  };

  const stressColors = {
    HIGH: { color: colors.stressHigh, gradient: colors.gradientDanger, icon: 'alert-circle' },
    MODERATE: { color: colors.stressModerate, gradient: colors.gradientWarning, icon: 'alert-circle-outline' },
    LOW: { color: colors.stressLow, gradient: colors.gradientSuccess, icon: 'checkmark-circle' },
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={colors.gradientBackground} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: 120 }]}
      >
        {/* Header */}
        <Text style={styles.title}>History & Analytics</Text>
        <Text style={styles.subtitle}>Track your mental wellness patterns and mood over time.</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primaryLight} style={{ marginTop: 60 }} />
        ) : (
          <View style={styles.content}>

            {/* Quick Stats */}
            <View style={styles.statsGrid}>
              {[
                { label: 'Day Streak', value: stats?.streak || 0, emoji: '🔥', color: colors.warning },
                { label: 'Avg Mood', value: stats?.avg_mood || '—', emoji: '😊', color: colors.secondary },
                { label: 'Check-ins', value: stats?.total_entries || 0, emoji: '📊', color: colors.primary },
              ].map((stat, i) => (
                <GlassCard key={i} style={styles.statCard}>
                  <Text style={styles.statEmoji}>{stat.emoji}</Text>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </GlassCard>
              ))}
            </View>

            {/* Chart toggle */}
            <View style={styles.chartToggleRow}>
              <Text style={styles.sectionTitle}>Mood Trend</Text>
              <View style={styles.chartToggle}>
                {['line', 'bar'].map(type => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setActiveChart(type)}
                    style={[styles.toggleBtn, activeChart === type && styles.toggleBtnActive]}
                  >
                    <Ionicons
                      name={type === 'line' ? 'trending-up-outline' : 'bar-chart-outline'}
                      size={15}
                      color={activeChart === type ? '#fff' : colors.textMuted}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Chart Card */}
            <GlassCard style={styles.chartCard}>
              {historyLog.length > 0 || stats?.weekly_mood?.length > 0 ? (
                Platform.OS === 'web' ? (
                  // Web-safe chart — no SVG DOM warnings
                  <WebBarChart
                    data={activeChart === 'line'
                      ? getLineChartData().datasets[0].data
                      : getBarChartData().datasets[0].data}
                    labels={activeChart === 'line'
                      ? getLineChartData().labels
                      : getBarChartData().labels}
                    color={activeChart === 'line' ? '#7c3aed' : '#06b6d4'}
                    height={180}
                  />
                ) : activeChart === 'line' ? (
                  <LineChart
                    data={getLineChartData()}
                    width={width - 60}
                    height={180}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                    withShadow={false}
                  />
                ) : (
                  <BarChart
                    data={getBarChartData()}
                    width={width - 60}
                    height={180}
                    chartConfig={barChartConfig}
                    style={styles.chart}
                    showValuesOnTopOfBars={false}
                    fromZero
                    withInnerLines={true}
                  />
                )
              ) : (
                <View style={styles.noDataContainer}>
                  <Ionicons name="bar-chart-outline" size={40} color={colors.textMuted} />
                  <Text style={styles.noDataText}>No mood history yet.{'\n'}Complete your first check-in!</Text>
                </View>
              )}
            </GlassCard>

            {/* Stress Distribution */}
            <GlassCard style={styles.distCard}>
              <Text style={styles.distTitle}>Stress Distribution</Text>
              <Text style={styles.distSubtitle}>Breakdown of your {stats?.total_entries || 0} check-ins</Text>

              {['HIGH', 'MODERATE', 'LOW'].map(level => {
                const cfg = stressColors[level];
                const pct = getStressPercent(level);
                const count = stats?.stress_distribution?.[level] || 0;
                return (
                  <View key={level} style={styles.progressBarContainer}>
                    <View style={styles.barLabelRow}>
                      <View style={styles.barLabelLeft}>
                        <Ionicons name={cfg.icon} size={14} color={cfg.color} />
                        <Text style={[styles.barLabel, { color: cfg.color }]}>{level}</Text>
                      </View>
                      <Text style={styles.barValue}>{count} entries • {Math.round(pct * 100)}%</Text>
                    </View>
                    <View style={styles.barBg}>
                      <LinearGradient
                        colors={cfg.gradient}
                        style={[styles.barFill, { width: `${Math.max(pct * 100, pct > 0 ? 4 : 0)}%` }]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      />
                    </View>
                  </View>
                );
              })}
            </GlassCard>

            {/* Activity Log */}
            <View style={styles.logHeader}>
              <Text style={styles.logTitle}>Activity Log</Text>
              <View style={styles.rangeRow}>
                {[7, 30].map(days => (
                  <TouchableOpacity
                    key={days}
                    onPress={() => setSelectedRange(days)}
                    style={[styles.rangeBtn, selectedRange === days && styles.rangeBtnActive]}
                  >
                    <Text style={[styles.rangeText, selectedRange === days && styles.rangeTextActive]}>
                      {days}d
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.logList}>
              {historyLog.length > 0 ? (
                historyLog.map((item) => {
                  const date = new Date(item.created_at);
                  const formattedDate = date.toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  });
                  const sc = stressColors[item.stress_level] || stressColors.MODERATE;
                  const moodPct = (item.mood_score / 10) * 100;

                  return (
                    <GlassCard key={item.id} style={styles.logItem}>
                      <View style={styles.logItemHeader}>
                        <View style={styles.logItemMeta}>
                          <Text style={styles.logDate}>{formattedDate}</Text>
                          <View style={[styles.logStressBadge, { backgroundColor: `${sc.color}18`, borderColor: `${sc.color}40` }]}>
                            <Ionicons name={sc.icon} size={11} color={sc.color} />
                            <Text style={[styles.logStressText, { color: sc.color }]}>{item.stress_level}</Text>
                          </View>
                        </View>
                        <View style={styles.logMoodBadge}>
                          <Text style={styles.logMoodEmoji}>😊</Text>
                          <Text style={styles.logMoodScore}>{item.mood_score}/10</Text>
                        </View>
                      </View>

                      {/* Mood bar */}
                      <View style={styles.moodBarBg}>
                        <LinearGradient
                          colors={colors.gradientCool}
                          style={[styles.moodBarFill, { width: `${moodPct}%` }]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        />
                      </View>

                      {item.journal_text ? (
                        <Text style={styles.logJournal} numberOfLines={2}>"{item.journal_text}"</Text>
                      ) : null}

                      <View style={styles.logDetailsRow}>
                        {[
                          { icon: 'moon-outline', text: `${item.sleep_hours}h sleep` },
                          { icon: 'fitness-outline', text: item.activity_level },
                          { icon: 'alert-circle-outline', text: `${item.anxiety_level} anxiety` },
                        ].map((d, i) => (
                          <View key={i} style={styles.logDetail}>
                            <Ionicons name={d.icon} size={12} color="rgba(255,255,255,0.35)" />
                            <Text style={styles.logDetailText}>{d.text}</Text>
                          </View>
                        ))}
                      </View>
                    </GlassCard>
                  );
                })
              ) : (
                <View style={styles.noDataContainer}>
                  <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
                  <Text style={styles.noDataText}>No check-ins logged{'\n'}for this period.</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 24 },

  glassCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glass },
  glassCardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 24, borderWidth: 1, borderColor: colors.glassBorder },

  content: { gap: 18 },

  // Stats
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16, backgroundColor: colors.glass },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 2 },
  statLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '600', textAlign: 'center' },

  // Chart toggle
  chartToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  chartToggle: { flexDirection: 'row', gap: 4, backgroundColor: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 10 },
  toggleBtn: { width: 36, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  toggleBtnActive: { backgroundColor: 'rgba(124,58,237,0.6)' },

  chartCard: { padding: 8, paddingBottom: 4 },
  chart: { marginLeft: -10, borderRadius: 16 },
  noDataContainer: { padding: 30, alignItems: 'center', gap: 12 },
  noDataText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  // Stress distribution
  distCard: { padding: 20, gap: 14 },
  distTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  distSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: -8 },
  progressBarContainer: { gap: 8 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barLabelLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  barValue: { fontSize: 11, color: colors.textSecondary },
  barBg: { height: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5, minWidth: 4 },

  // Log
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  logTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  rangeRow: { flexDirection: 'row', gap: 8 },
  rangeBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: colors.glassBorder },
  rangeBtnActive: { borderColor: colors.primary, backgroundColor: 'rgba(124,58,237,0.15)' },
  rangeText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  rangeTextActive: { color: colors.text, fontWeight: '700' },

  logList: { gap: 12, paddingBottom: 8 },
  logItem: { padding: 16, backgroundColor: colors.glass },
  logItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  logItemMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  logDate: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  logStressBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  logStressText: { fontSize: 10, fontWeight: '700' },
  logMoodBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logMoodEmoji: { fontSize: 14 },
  logMoodScore: { fontSize: 14, fontWeight: '800', color: colors.text },
  moodBarBg: { height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  moodBarFill: { height: '100%', borderRadius: 3 },
  logJournal: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', marginBottom: 10 },
  logDetailsRow: { flexDirection: 'row', gap: 14, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)', paddingTop: 10 },
  logDetail: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  logDetailText: { fontSize: 11, color: colors.textMuted },
});
