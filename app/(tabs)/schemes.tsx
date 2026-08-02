import { useState, useMemo, useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useUserData } from '@/hooks/useUserData';
import { theme } from '@/lib/theme';
import { rankSchemes } from '@/lib/eligibility';
import { categoryConfig, getCategoryLabel } from '@/lib/categories';
import { Scheme, SchemeCategory, Language } from '@/types';

export default function SchemesScreen() {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const { schemes, documents, loading, reload } = useUserData();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SchemeCategory | 'all'>('all');
  const [sortByScore, setSortByScore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const ranked = useMemo(() => rankSchemes(schemes, profile, documents), [schemes, profile, documents]);

  const filtered = useMemo(() => {
    let list = ranked;
    if (category !== 'all') list = list.filter(r => r.scheme.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(r =>
        r.scheme.name.toLowerCase().includes(q) ||
        r.scheme.description.toLowerCase().includes(q) ||
        (r.scheme.tags || []).some(tag => tag.includes(q))
      );
    }
    if (!sortByScore) {
      list = [...list].sort((a, b) => {
        const na = lang === 'hi' ? b.scheme.name_hi || b.scheme.name : lang === 'ta' ? b.scheme.name_ta || b.scheme.name : b.scheme.name;
        const nb = lang === 'hi' ? a.scheme.name_hi || a.scheme.name : lang === 'ta' ? a.scheme.name_ta || a.scheme.name : a.scheme.name;
        return na.localeCompare(nb);
      });
    }
    return list;
  }, [ranked, category, query, sortByScore, lang]);

  const categories: (SchemeCategory | 'all')[] = ['all', ...Object.keys(categoryConfig) as SchemeCategory[]];

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('governmentSchemes')}</Text>
        <Text style={styles.subtitle}>{t('matchingSchemes')}</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search color={theme.colors.neutral[400]} size={18} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={t('searchSchemes')}
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>
        <TouchableOpacity style={[styles.sortBtn, sortByScore && styles.sortBtnActive]} onPress={() => setSortByScore(!sortByScore)}>
          <Sparkles color={sortByScore ? '#fff' : theme.colors.neutral[500]} size={16} />
          <Text style={[styles.sortBtnText, sortByScore && styles.sortBtnTextActive]}>{t('eligibilityScore')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {categories.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, category === c && styles.chipActive]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
              {c === 'all' ? t('allCategories') : getCategoryLabel(c, lang)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary[600]} />}
      >
        {filtered.length > 0 ? (
          filtered.map(r => <SchemeCard key={r.scheme.id} scheme={r.scheme} score={r.score} lang={lang} t={t} />)
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('noSchemesFound')}</Text>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SchemeCard({ scheme, score, lang, t }: { scheme: Scheme; score: number; lang: Language; t: (k: string) => string }) {
  const cfg = categoryConfig[scheme.category];
  const Icon = cfg?.icon;
  const name = lang === 'hi' ? scheme.name_hi || scheme.name : lang === 'ta' ? scheme.name_ta || scheme.name : scheme.name;
  const desc = lang === 'hi' ? scheme.description_hi || scheme.description : lang === 'ta' ? scheme.description_ta || scheme.description : scheme.description;
  const scoreColor = score >= 75 ? theme.colors.secondary[600] : score >= 50 ? theme.colors.primary[600] : theme.colors.neutral[400];
  const scoreBg = score >= 75 ? theme.colors.secondary[50] : score >= 50 ? theme.colors.primary[50] : theme.colors.neutral[100];
  const label = score >= 75 ? 'highly eligible' : score >= 50 ? 'likely eligible' : 'may qualify';

  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/scheme/${scheme.id}`)}>
      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, { backgroundColor: cfg?.bgColor }]}>
          {Icon ? <Icon color={cfg?.color} size={22} /> : null}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.cardCategory}>{getCategoryLabel(scheme.category, lang)}</Text>
          <Text style={styles.cardName} numberOfLines={2}>{name}</Text>
        </View>
        <View style={[styles.scoreBox, { backgroundColor: scoreBg }]}>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>{score}%</Text>
          <Text style={[styles.scoreLabel, { color: scoreColor }]}>{label}</Text>
        </View>
      </View>
      <Text style={styles.cardDesc} numberOfLines={2}>{desc}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.benefitBox}>
          <Text style={styles.benefitLabel}>{t('benefits').toUpperCase()}</Text>
          <Text style={styles.benefitText} numberOfLines={1}>{scheme.benefits}</Text>
        </View>
        <View style={[styles.levelBadge, scheme.level === 'central' ? styles.centralBadge : styles.stateBadge]}>
          <Text style={styles.levelText}>{scheme.level}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: 12 },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, fontFamily: 'Inter-Bold' },
  subtitle: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, marginTop: 4, fontFamily: 'Inter-Regular' },

  searchRow: { flexDirection: 'row', paddingHorizontal: theme.spacing.lg, gap: 10, marginBottom: 12 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...theme.shadows.sm,
  },
  searchInput: { flex: 1, fontSize: theme.fontSize.md, color: theme.colors.text, fontFamily: 'Inter-Regular' },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    ...theme.shadows.sm,
  },
  sortBtnActive: { backgroundColor: theme.colors.primary[600] },
  sortBtnText: { fontSize: theme.fontSize.xs, color: theme.colors.neutral[500], fontWeight: theme.fontWeight.semibold, fontFamily: 'Inter-SemiBold' },
  sortBtnTextActive: { color: '#fff' },

  chipsRow: { paddingHorizontal: theme.spacing.lg, paddingBottom: 8, gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.radius.full, backgroundColor: theme.colors.surface, ...theme.shadows.sm },
  chipActive: { backgroundColor: theme.colors.primary[600] },
  chipText: { fontSize: theme.fontSize.sm, color: theme.colors.neutral[600], fontWeight: theme.fontWeight.medium, fontFamily: 'Inter-Medium' },
  chipTextActive: { color: '#fff', fontWeight: theme.fontWeight.semibold },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    ...theme.shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { width: 48, height: 48, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  cardCategory: { fontSize: 10, color: theme.colors.neutral[500], fontWeight: theme.fontWeight.semibold, textTransform: 'uppercase', fontFamily: 'Inter-SemiBold' },
  cardName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, marginTop: 2, fontFamily: 'Inter-SemiBold' },
  scoreBox: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.md, alignItems: 'center', minWidth: 64 },
  scoreValue: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, fontFamily: 'Inter-Bold' },
  scoreLabel: { fontSize: 9, marginTop: 1, textTransform: 'capitalize', fontFamily: 'Inter-Regular' },

  cardDesc: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 10, lineHeight: 20, fontFamily: 'Inter-Regular' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12, gap: 10 },
  benefitBox: { flex: 1 },
  benefitLabel: { fontSize: 10, color: theme.colors.neutral[400], fontWeight: theme.fontWeight.semibold, textTransform: 'uppercase', fontFamily: 'Inter-SemiBold' },
  benefitText: { fontSize: theme.fontSize.sm, color: theme.colors.text, fontWeight: theme.fontWeight.medium, marginTop: 2, fontFamily: 'Inter-Medium' },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.sm },
  centralBadge: { backgroundColor: theme.colors.primary[50] },
  stateBadge: { backgroundColor: theme.colors.secondary[50] },
  levelText: { fontSize: 10, fontWeight: theme.fontWeight.semibold, textTransform: 'capitalize', color: theme.colors.neutral[600], fontFamily: 'Inter-SemiBold' },

  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { color: theme.colors.textMuted, fontSize: theme.fontSize.md, fontFamily: 'Inter-Regular' },
});
