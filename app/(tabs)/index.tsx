import { useEffect, useState, useMemo } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Compass, FileText, Megaphone, MapPin, MessageCircle, ChevronRight,
  GraduationCap, PiggyBank, HeartPulse, Home as HomeIcon, Wheat, Briefcase,
  Bell, AlertTriangle, Clock, TrendingUp, Users, CheckCircle2,
  type LucideIcon,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useUserData } from '@/hooks/useUserData';
import { theme } from '@/lib/theme';
import { rankSchemes } from '@/lib/eligibility';
import { getCategoryLabel } from '@/lib/categories';
import { Scheme } from '@/types';

export default function HomeScreen() {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const { documents, applications, notifications, schemes, loading, reload } = useUserData();
  const [refreshing, setRefreshing] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening');

  const ranked = useMemo(() => rankSchemes(schemes, profile, documents), [schemes, profile, documents]);
  const topSchemes = ranked.filter(r => r.score >= 50).slice(0, 3);
  const upcomingDeadlines = schemes.filter(s => s.deadline && new Date(s.deadline) > new Date()).slice(0, 3);
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const activeApps = applications.filter(a => ['submitted', 'under-review', 'pending-docs'].includes(a.status)).length;

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const quickActions: { icon: LucideIcon; label: string; color: string; bg: string; route: string }[] = [
    { icon: Compass, label: t('findSchemes'), color: theme.colors.primary[700], bg: theme.colors.primary[50], route: '/(tabs)/schemes' },
    { icon: FileText, label: t('trackApplications'), color: theme.colors.secondary[700], bg: theme.colors.secondary[50], route: '/(tabs)/documents' },
    { icon: Megaphone, label: t('fileComplaint'), color: '#db2777', bg: '#fdf2f8', route: '/complaints' },
    { icon: MapPin, label: t('findOffice'), color: theme.colors.accent[700], bg: theme.colors.accent[50], route: '/offices' },
    { icon: MessageCircle, label: t('askAI'), color: '#0891b2', bg: '#ecfeff', route: '/(tabs)/assistant' },
    { icon: Bell, label: t('notifications'), color: theme.colors.neutral[700], bg: theme.colors.neutral[100], route: '/notifications' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary[600]} />}
      >
        <LinearGradient
          colors={[theme.colors.primary[700], theme.colors.primary[500]]}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.userName}>{profile?.full_name || 'Citizen'}</Text>
            </View>
            <TouchableOpacity style={styles.bellBtn} onPress={() => router.push('/notifications')}>
              <Bell color="#fff" size={22} />
              {unreadCount > 0 ? <View style={styles.bellDot} /> : null}
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{topSchemes.length}</Text>
              <Text style={styles.statLabel}>{t('eligibleSchemes')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{activeApps}</Text>
              <Text style={styles.statLabel}>{t('activeApplications')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{documents.length}</Text>
              <Text style={styles.statLabel}>{t('myDocuments')}</Text>
            </View>
          </View>
        </LinearGradient>

        {!profile?.onboarded ? (
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(tabs)/profile')} style={styles.banner}>
            <LinearGradient colors={[theme.colors.accent[100], theme.colors.accent[50]]} style={styles.bannerInner}>
              <View style={styles.bannerIcon}>
                <TrendingUp color={theme.colors.accent[700]} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>{t('completeProfile')}</Text>
                <Text style={styles.bannerDesc}>{t('completeProfileDesc')}</Text>
              </View>
              <ChevronRight color={theme.colors.accent[700]} size={20} />
            </LinearGradient>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((a, i) => (
            <TouchableOpacity key={i} style={styles.actionItem} onPress={() => router.push(a.route as any)}>
              <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
                <a.icon color={a.color} size={22} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('matchingSchemes')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/schemes')}>
            <Text style={styles.viewAll}>{t('viewAll')}</Text>
          </TouchableOpacity>
        </View>

        {topSchemes.length > 0 ? (
          <View style={styles.schemesList}>
            {topSchemes.map(r => <SchemeMiniCard key={r.scheme.id} scheme={r.scheme} score={r.score} lang={lang} />)}
          </View>
        ) : (
          <View style={styles.emptyInline}>
            <Text style={styles.emptyInlineText}>{t('noSchemesFound')}</Text>
          </View>
        )}

        {upcomingDeadlines.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>{t('upcomingDeadlines')}</Text>
            <View style={styles.deadlinesList}>
              {upcomingDeadlines.map(s => (
                <View key={s.id} style={styles.deadlineItem}>
                  <View style={styles.deadlineIcon}>
                    <Clock color={theme.colors.accent[700]} size={16} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deadlineTitle} numberOfLines={1}>{lang === 'hi' ? s.name_hi || s.name : lang === 'ta' ? s.name_ta || s.name : s.name}</Text>
                    <Text style={styles.deadlineDate}>{new Date(s.deadline).toLocaleDateString()}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('recentNotifications')}</Text>
          {notifications.length > 0 ? (
            <TouchableOpacity onPress={() => router.push('/notifications')}>
              <Text style={styles.viewAll}>{t('viewAll')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {notifications.length > 0 ? (
          <View style={styles.notifList}>
            {notifications.slice(0, 3).map(n => (
              <View key={n.id} style={styles.notifItem}>
                <View style={[styles.notifDot, { backgroundColor: n.priority === 'high' ? theme.colors.error : theme.colors.primary[500] }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle} numberOfLines={1}>{n.title}</Text>
                  <Text style={styles.notifBody} numberOfLines={2}>{n.body}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyInline}>
            <Text style={styles.emptyInlineText}>{t('noNotifications')}</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SchemeMiniCard({ scheme, score, lang }: { scheme: Scheme; score: number; lang: 'en' | 'hi' | 'ta' }) {
  const name = lang === 'hi' ? scheme.name_hi || scheme.name : lang === 'ta' ? scheme.name_ta || scheme.name : scheme.name;
  const scoreColor = score >= 75 ? theme.colors.secondary[600] : score >= 50 ? theme.colors.primary[600] : theme.colors.neutral[400];
  return (
    <TouchableOpacity style={styles.miniCard} onPress={() => router.push(`/scheme/${scheme.id}`)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.miniCategory}>{getCategoryLabel(scheme.category, lang)}</Text>
        <Text style={styles.miniName} numberOfLines={2}>{name}</Text>
        <Text style={styles.miniBenefits} numberOfLines={1}>{scheme.benefits}</Text>
      </View>
      <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
        <Text style={[styles.scoreText, { color: scoreColor }]}>{score}%</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.primary[700] },
  scroll: { flex: 1 },
  content: { paddingBottom: 20 },

  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl + 8,
    borderBottomLeftRadius: theme.radius.xxl,
    borderBottomRightRadius: theme.radius.xxl,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: 'rgba(255,255,255,0.85)', fontSize: theme.fontSize.md, fontFamily: 'Inter-Regular' },
  userName: { color: '#fff', fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, fontFamily: 'Inter-Bold' },
  bellBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 8, right: 9, width: 9, height: 9, borderRadius: 4.5, backgroundColor: theme.colors.error, borderWidth: 2, borderColor: theme.colors.primary[600] },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: theme.spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: theme.radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: { color: '#fff', fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, fontFamily: 'Inter-Bold' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 2, textAlign: 'center', fontFamily: 'Inter-Regular' },

  banner: { marginTop: theme.spacing.lg, marginHorizontal: theme.spacing.lg },
  bannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: theme.radius.lg,
    padding: 14,
  },
  bannerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.accent[700], fontFamily: 'Inter-SemiBold' },
  bannerDesc: { fontSize: theme.fontSize.sm, color: theme.colors.accent[600], marginTop: 2, fontFamily: 'Inter-Regular' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg, marginBottom: 10 },
  sectionTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text, paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg, marginBottom: 10, fontFamily: 'Inter-Bold' },
  viewAll: { color: theme.colors.primary[600], fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, fontFamily: 'Inter-SemiBold' },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: theme.spacing.md, gap: 8 },
  actionItem: { width: '31.5%', alignItems: 'center', paddingVertical: 14, gap: 8 },
  actionIcon: { width: 52, height: 52, borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, textAlign: 'center', color: theme.colors.neutral[700], fontFamily: 'Inter-Medium', fontWeight: '500' },

  schemesList: { paddingHorizontal: theme.spacing.lg, gap: 10 },
  miniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 14,
    gap: 12,
    ...theme.shadows.sm,
  },
  miniCategory: { fontSize: 10, color: theme.colors.primary[600], fontWeight: theme.fontWeight.semibold, textTransform: 'uppercase', fontFamily: 'Inter-SemiBold' },
  miniName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, marginTop: 3, fontFamily: 'Inter-SemiBold' },
  miniBenefits: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 3, fontFamily: 'Inter-Regular' },
  scoreBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, fontFamily: 'Inter-Bold' },

  deadlinesList: { paddingHorizontal: theme.spacing.lg, gap: 8 },
  deadlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 12,
  },
  deadlineIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.accent[50], alignItems: 'center', justifyContent: 'center' },
  deadlineTitle: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, fontFamily: 'Inter-SemiBold' },
  deadlineDate: { fontSize: theme.fontSize.xs, color: theme.colors.accent[700], marginTop: 2, fontFamily: 'Inter-Regular' },

  notifList: { paddingHorizontal: theme.spacing.lg, gap: 8 },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 12,
  },
  notifDot: { width: 8, height: 8, borderRadius: 4 },
  notifTitle: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, fontFamily: 'Inter-SemiBold' },
  notifBody: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 2, fontFamily: 'Inter-Regular' },

  emptyInline: { paddingHorizontal: theme.spacing.lg, paddingVertical: 16, alignItems: 'center' },
  emptyInlineText: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, fontFamily: 'Inter-Regular' },
});
