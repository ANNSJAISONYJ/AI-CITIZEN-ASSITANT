import { useState, useMemo, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, CheckCircle2, XCircle, FileText, Clock, ExternalLink,
  TrendingUp, Award, Building2, MapPin, AlertCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { theme } from '@/lib/theme';
import { categoryConfig, getCategoryLabel } from '@/lib/categories';
import { calculateEligibility, predictApproval } from '@/lib/eligibility';
import { Button, Spinner } from '@/components/ui';
import { Scheme } from '@/types';

export default function SchemeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n();
  const { profile, user } = useAuth();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from('schemes').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      setScheme(data as Scheme);
      setLoading(false);
    });
  }, [id]);

  const match = useMemo(() => scheme ? calculateEligibility(scheme, profile, []) : null, [scheme, profile]);
  const prediction = useMemo(() => scheme ? predictApproval(scheme, profile, []) : null, [scheme, profile]);

  const handleApply = async () => {
    if (!scheme || !user) return;
    setApplying(true);
    const { probability, missingDocs } = prediction || { probability: 0, missingDocs: [] };
    const { error } = await supabase.from('applications').insert({
      user_id: user.id,
      scheme_id: scheme.id,
      scheme_name: scheme.name,
      status: 'submitted',
      predicted_approval: probability,
      missing_documents: missingDocs,
      submitted_at: new Date().toISOString(),
    });
    setApplying(false);
    if (!error) setApplied(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Spinner label={t('loading')} />
        </View>
      </SafeAreaView>
    );
  }

  if (!scheme) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>{t('noSchemesFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cfg = categoryConfig[scheme.category];
  const Icon = cfg?.icon;
  const name = lang === 'hi' ? scheme.name_hi || scheme.name : lang === 'ta' ? scheme.name_ta || scheme.name : scheme.name;
  const desc = lang === 'hi' ? scheme.description_hi || scheme.description : lang === 'ta' ? scheme.description_ta || scheme.description : scheme.description;
  const score = match?.score ?? 0;
  const scoreColor = score >= 75 ? theme.colors.secondary[600] : score >= 50 ? theme.colors.primary[600] : theme.colors.neutral[400];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        <LinearGradient
          colors={[cfg?.color || theme.colors.primary[600], theme.colors.primary[500]]}
          style={styles.header}
        >
          <View style={styles.headerNav}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft color="#fff" size={22} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              {Icon ? <Icon color="#fff" size={30} /> : null}
            </View>
            <Text style={styles.headerCategory}>{getCategoryLabel(scheme.category, lang)}</Text>
            <Text style={styles.headerTitle}>{name}</Text>
            <View style={styles.headerMeta}>
              <View style={styles.metaChip}>
                <Building2 color="#fff" size={12} />
                <Text style={styles.metaText}>{scheme.ministry}</Text>
              </View>
              <View style={[styles.metaChip, scheme.level === 'central' ? styles.centralChip : styles.stateChip]}>
                <Text style={styles.metaText}>{scheme.level}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scorePct, { color: scoreColor }]}>{score}%</Text>
            <Text style={styles.scorePctLabel}>{t('eligibilityScore')}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.scoreTitle}>{score >= 75 ? t('highlyEligible') : score >= 50 ? t('likelyEligible') : t('mayQualify')}</Text>
            {match?.reasons.slice(0, 2).map((r, i) => (
              <View key={i} style={styles.reasonRow}>
                <CheckCircle2 color={theme.colors.secondary[600]} size={13} />
                <Text style={styles.reasonText}>{r}</Text>
              </View>
            ))}
            {match?.gaps.slice(0, 1).map((g, i) => (
              <View key={i} style={styles.reasonRow}>
                <XCircle color={theme.colors.error} size={13} />
                <Text style={styles.reasonText}>{g}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('schemeDetails')}</Text>
          <Text style={styles.descText}>{desc}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('benefits')}</Text>
          <View style={styles.benefitCard}>
            <Award color={theme.colors.accent[600]} size={20} />
            <Text style={styles.benefitCardText}>{scheme.benefits}</Text>
          </View>
        </View>

        {prediction ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('approvalPrediction')}</Text>
            <View style={styles.predictionBar}>
              <View style={[styles.predictionFill, { width: `${prediction.probability}%`, backgroundColor: scoreColor }]} />
            </View>
            <Text style={styles.predictionText}>{prediction.probability}% {t('approvalPrediction')}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('documentsRequired')}</Text>
          <View style={styles.docsList}>
            {scheme.documents_required.map((doc, i) => {
              const has = match?.missingDocs.includes(doc) === false;
              return (
                <View key={i} style={styles.docRow}>
                  <View style={[styles.docCheck, has ? styles.docHave : styles.docMissing]}>
                    {has ? <CheckCircle2 color={theme.colors.secondary[600]} size={16} /> : <AlertCircle color={theme.colors.warning} size={16} />}
                  </View>
                  <Text style={styles.docText}>{doc}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Clock color={theme.colors.neutral[400]} size={18} />
            <Text style={styles.infoLabel}>{t('estimatedTime')}</Text>
            <Text style={styles.infoValue}>{scheme.estimated_days} {t('days')}</Text>
          </View>
          {scheme.deadline ? (
            <View style={styles.infoRow}>
              <AlertCircle color={theme.colors.neutral[400]} size={18} />
              <Text style={styles.infoLabel}>{t('upcomingDeadlines')}</Text>
              <Text style={styles.infoValue}>{new Date(scheme.deadline).toLocaleDateString()}</Text>
            </View>
          ) : null}
        </View>

        {applied ? (
          <View style={styles.appliedBox}>
            <CheckCircle2 color={theme.colors.secondary[600]} size={24} />
            <Text style={styles.appliedText}>{t('applicationSubmitted')}</Text>
          </View>
        ) : (
          <View style={styles.actionsRow}>
            {scheme.application_url ? (
              <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL(scheme.application_url)}>
                <ExternalLink color={theme.colors.primary[600]} size={18} />
                <Text style={styles.linkText}>{t('applicationUrl')}</Text>
              </TouchableOpacity>
            ) : null}
            <Button title={applying ? '...' : t('submitApplication')} onPress={handleApply} loading={applying} size="lg" style={{ flex: 1 }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },

  header: { paddingBottom: theme.spacing.xl, borderBottomLeftRadius: theme.radius.xxl, borderBottomRightRadius: theme.radius.xxl },
  headerNav: { flexDirection: 'row', paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerContent: { paddingHorizontal: theme.spacing.lg, alignItems: 'center', marginTop: theme.spacing.sm },
  headerIcon: { width: 64, height: 64, borderRadius: theme.radius.xl, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerCategory: { color: 'rgba(255,255,255,0.8)', fontSize: theme.fontSize.sm, marginTop: 10, textTransform: 'uppercase', fontWeight: theme.fontWeight.semibold, fontFamily: 'Inter-SemiBold' },
  headerTitle: { color: '#fff', fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, textAlign: 'center', marginTop: 6, fontFamily: 'Inter-Bold' },
  headerMeta: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radius.full },
  centralChip: { backgroundColor: 'rgba(255,255,255,0.25)' },
  stateChip: { backgroundColor: 'rgba(255,255,255,0.15)' },
  metaText: { color: '#fff', fontSize: 11, fontWeight: theme.fontWeight.medium, fontFamily: 'Inter-Medium' },

  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    margin: theme.spacing.lg,
    ...theme.shadows.md,
  },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.neutral[50], alignItems: 'center', justifyContent: 'center' },
  scorePct: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, fontFamily: 'Inter-Bold' },
  scorePctLabel: { fontSize: 9, color: theme.colors.textMuted, marginTop: 2, fontFamily: 'Inter-Regular' },
  scoreTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text, fontFamily: 'Inter-Bold' },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  reasonText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, flex: 1, fontFamily: 'Inter-Regular' },

  section: { paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg },
  sectionTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text, marginBottom: 10, fontFamily: 'Inter-Bold' },
  descText: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, lineHeight: 22, fontFamily: 'Inter-Regular' },

  benefitCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.colors.accent[50], borderRadius: theme.radius.lg, padding: 16 },
  benefitCardText: { flex: 1, fontSize: theme.fontSize.md, color: theme.colors.accent[700], fontWeight: theme.fontWeight.medium, fontFamily: 'Inter-Medium' },

  predictionBar: { height: 10, borderRadius: 5, backgroundColor: theme.colors.neutral[100], overflow: 'hidden' },
  predictionFill: { height: '100%', borderRadius: 5 },
  predictionText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 6, fontFamily: 'Inter-Regular' },

  docsList: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 14, gap: 12, ...theme.shadows.sm },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docCheck: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  docHave: { backgroundColor: theme.colors.secondary[50] },
  docMissing: { backgroundColor: theme.colors.accent[50] },
  docText: { fontSize: theme.fontSize.md, color: theme.colors.text, fontFamily: 'Inter-Regular' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  infoLabel: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, fontFamily: 'Inter-Regular' },
  infoValue: { fontSize: theme.fontSize.md, color: theme.colors.text, fontWeight: theme.fontWeight.semibold, marginLeft: 'auto', fontFamily: 'Inter-SemiBold' },

  appliedBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, margin: theme.spacing.lg, backgroundColor: theme.colors.secondary[50], borderRadius: theme.radius.lg, padding: 16 },
  appliedText: { fontSize: theme.fontSize.md, color: theme.colors.secondary[700], fontWeight: theme.fontWeight.semibold, fontFamily: 'Inter-SemiBold' },

  actionsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: theme.colors.primary[600], borderRadius: theme.radius.md, paddingHorizontal: 16, paddingVertical: 14 },
  linkText: { color: theme.colors.primary[600], fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.md, fontFamily: 'Inter-SemiBold' },
});
