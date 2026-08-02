import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Phone, Clock, Navigation, Building2, Search } from 'lucide-react-native';
import { TextInput } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/contexts/I18nContext';
import { theme } from '@/lib/theme';
import { Spinner, EmptyState } from '@/components/ui';
import { Office } from '@/types';

const OFFICE_TYPES = [
  { key: 'all', label: { en: 'All', hi: 'सभी', ta: 'அனைத்தும்' } },
  { key: 'aadhaar', label: { en: 'Aadhaar', hi: 'आधार', ta: 'ஆதார்' } },
  { key: 'passport', label: { en: 'Passport', hi: 'पासपोर्ट', ta: 'பாஸ்போர்ட்' } },
  { key: 'rto', label: { en: 'RTO', hi: 'आरटीओ', ta: 'RTO' } },
  { key: 'taluk', label: { en: 'Taluk Office', hi: 'तालुक', ta: 'தாலுகா' } },
  { key: 'csc', label: { en: 'CSC', hi: 'सीएससी', ta: 'CSC' } },
  { key: 'collectorate', label: { en: 'Collectorate', hi: 'कलेक्टरेट', ta: 'கலெக்டர் அலுவலகம்' } },
  { key: 'hospital', label: { en: 'Hospital', hi: 'अस्पताल', ta: 'மருத்துவமனை' } },
  { key: 'police', label: { en: 'Police', hi: 'पुलिस', ta: 'காவல்' } },
  { key: 'agriculture', label: { en: 'Agriculture', hi: 'कृषि', ta: 'வேளாண்மை' } },
];

export default function OfficesScreen() {
  const { t, lang } = useI18n();
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('offices').select('*').order('name');
    setOffices((data as Office[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = offices.filter(o => {
    if (filter !== 'all' && o.type !== filter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return o.name.toLowerCase().includes(q) || o.district.toLowerCase().includes(q) || o.address.toLowerCase().includes(q);
    }
    return true;
  });

  const openDirections = (o: Office) => {
    if (o.latitude && o.longitude) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${o.latitude},${o.longitude}`);
    } else {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.name + ' ' + o.address)}`);
    }
  };

  const callOffice = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => (window as any).history?.back?.() || undefined}>
          <ArrowLeft color={theme.colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('findOffice2')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchBox}>
        <Search color={theme.colors.neutral[400]} size={18} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or district..."
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {OFFICE_TYPES.map(o => (
          <TouchableOpacity
            key={o.key}
            style={[styles.chip, filter === o.key && styles.chipActive]}
            onPress={() => setFilter(o.key)}
          >
            <Text style={[styles.chipText, filter === o.key && styles.chipTextActive]}>{o.label[lang]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary[600]} />}
      >
        {loading ? (
          <Spinner label={t('loading')} />
        ) : filtered.length > 0 ? (
          filtered.map(o => (
            <View key={o.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardIcon}>
                  <Building2 color={theme.colors.primary[600]} size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{o.name}</Text>
                  <Text style={styles.cardType}>{o.type.toUpperCase()}</Text>
                </View>
                <View style={styles.waitBox}>
                  <Text style={styles.waitValue}>{o.estimated_wait_mins}</Text>
                  <Text style={styles.waitLabel}>{t('minutes')}</Text>
                </View>
              </View>

              <View style={styles.infoLine}>
                <MapPin color={theme.colors.neutral[400]} size={15} />
                <Text style={styles.infoText}>{o.address}, {o.district}</Text>
              </View>
              <View style={styles.infoLine}>
                <Clock color={theme.colors.neutral[400]} size={15} />
                <Text style={styles.infoText}>{o.timings}</Text>
              </View>

              <View style={styles.servicesRow}>
                {o.services.slice(0, 4).map((s, i) => (
                  <View key={i} style={styles.serviceChip}>
                    <Text style={styles.serviceText}>{s}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={() => callOffice(o.phone)}>
                  <Phone color={theme.colors.primary[600]} size={16} />
                  <Text style={styles.callText}>{t('callOffice')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.dirBtn]} onPress={() => openDirections(o)}>
                  <Navigation color="#fff" size={16} />
                  <Text style={styles.dirText}>{t('getDirections')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            icon={<View style={styles.emptyIcon}><MapPin color={theme.colors.neutral[300]} size={40} /></View>}
            title="No offices found"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, fontFamily: 'Inter-Bold' },

  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, paddingHorizontal: 14, paddingVertical: 12, marginHorizontal: theme.spacing.lg, marginBottom: 10, ...theme.shadows.sm },
  searchInput: { flex: 1, fontSize: theme.fontSize.md, color: theme.colors.text, fontFamily: 'Inter-Regular' },

  chipsRow: { paddingHorizontal: theme.spacing.lg, paddingBottom: 10, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: theme.radius.full, backgroundColor: theme.colors.surface, ...theme.shadows.sm },
  chipActive: { backgroundColor: theme.colors.primary[600] },
  chipText: { fontSize: theme.fontSize.sm, color: theme.colors.neutral[600], fontWeight: theme.fontWeight.medium, fontFamily: 'Inter-Medium' },
  chipTextActive: { color: '#fff', fontWeight: theme.fontWeight.semibold },

  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, ...theme.shadows.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: theme.radius.md, backgroundColor: theme.colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, fontFamily: 'Inter-SemiBold' },
  cardType: { fontSize: 10, color: theme.colors.textMuted, marginTop: 2, fontWeight: theme.fontWeight.semibold, fontFamily: 'Inter-SemiBold' },
  waitBox: { alignItems: 'center', backgroundColor: theme.colors.neutral[50], borderRadius: theme.radius.md, paddingHorizontal: 10, paddingVertical: 6 },
  waitValue: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text, fontFamily: 'Inter-Bold' },
  waitLabel: { fontSize: 9, color: theme.colors.textMuted, fontFamily: 'Inter-Regular' },

  infoLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  infoText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, flex: 1, fontFamily: 'Inter-Regular' },

  servicesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  serviceChip: { backgroundColor: theme.colors.neutral[100], borderRadius: theme.radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  serviceText: { fontSize: 10, color: theme.colors.neutral[600], fontFamily: 'Inter-Regular' },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: theme.radius.md, paddingVertical: 12 },
  callBtn: { backgroundColor: theme.colors.primary[50] },
  callText: { color: theme.colors.primary[700], fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.sm, fontFamily: 'Inter-SemiBold' },
  dirBtn: { backgroundColor: theme.colors.primary[600] },
  dirText: { color: '#fff', fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.sm, fontFamily: 'Inter-SemiBold' },

  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.neutral[100], alignItems: 'center', justifyContent: 'center' },
});
