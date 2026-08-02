import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, X, Megaphone, CheckCircle2, Clock, AlertCircle, FileText } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useUserData } from '@/hooks/useUserData';
import { theme } from '@/lib/theme';
import { Button, Input, EmptyState, Badge, Spinner } from '@/components/ui';
import { routeComplaint } from '@/lib/eligibility';
import { Complaint } from '@/types';

const CATEGORIES = [
  { key: 'road', label: { en: 'Road Damage', hi: 'सड़क क्षति', ta: 'சாலை சேதம்' }, icon: '🛣️' },
  { key: 'streetlight', label: { en: 'Streetlight Issue', hi: 'स्ट्रीटलाइट', ta: 'வீதி விளக்கு' }, icon: '💡' },
  { key: 'water', label: { en: 'Water Supply', hi: 'पानी आपूर्ति', ta: 'தண்ணீர் வழங்கல்' }, icon: '💧' },
  { key: 'sanitation', label: { en: 'Sanitation', hi: 'सफाई', ta: 'சுகாதாரம்' }, icon: '🧹' },
  { key: 'electricity', label: { en: 'Electricity Fault', hi: 'बिजली दोष', ta: 'மின்சாரம்' }, icon: '⚡' },
  { key: 'corruption', label: { en: 'Corruption', hi: 'भ्रष्टाचार', ta: 'ஊழல்' }, icon: '⚖️' },
  { key: 'other', label: { en: 'Other', hi: 'अन्य', ta: 'மற்றவை' }, icon: '📋' },
];

export default function ComplaintsScreen() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { complaints, loading, reload } = useUserData();
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({ category: '', title: '', description: '', location: '' });

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const submit = async () => {
    if (!user || !form.category || !form.title) return;
    setSaving(true);
    const department = routeComplaint(form.category);
    await supabase.from('complaints').insert({
      user_id: user.id,
      category: form.category,
      title: form.title,
      description: form.description,
      location: form.location,
      department,
      status: 'submitted',
      priority: form.category === 'corruption' ? 'high' : 'normal',
    });
    setSaving(false);
    setModal(false);
    setForm({ category: '', title: '', description: '', location: '' });
    await reload();
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, 'neutral' | 'warning' | 'success' | 'error'> = {
      submitted: 'neutral', routed: 'warning', 'in-progress': 'warning', resolved: 'success', rejected: 'error',
    };
    return <Badge label={status.replace('-', ' ')} color={map[status] || 'neutral'} />;
  };

  const catLabel = (key: string) => {
    const c = CATEGORIES.find(c => c.key === key);
    return c ? c.label[lang] : key;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => (window as any).history?.back?.() || undefined}>
          <ArrowLeft color={theme.colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('complaints')}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
          <Plus color={theme.colors.primary[600]} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary[600]} />}
      >
        {loading ? (
          <Spinner label={t('loading')} />
        ) : complaints.length > 0 ? (
          complaints.map(c => (
            <View key={c.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardIcon}>
                  <Megaphone color={theme.colors.primary[600]} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{c.title}</Text>
                  <Text style={styles.cardCat}>{catLabel(c.category)}</Text>
                </View>
                {getStatusBadge(c.status)}
              </View>
              {c.description ? <Text style={styles.cardDesc} numberOfLines={2}>{c.description}</Text> : null}
              <View style={styles.cardFooter}>
                <View style={styles.trackingBox}>
                  <Text style={styles.trackingLabel}>{t('trackingId')}</Text>
                  <Text style={styles.trackingValue}>{c.tracking_id}</Text>
                </View>
                <View style={styles.trackingBox}>
                  <Text style={styles.trackingLabel}>{t('routedTo')}</Text>
                  <Text style={styles.trackingValue} numberOfLines={1}>{c.department}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            icon={<View style={styles.emptyIcon}><Megaphone color={theme.colors.neutral[300]} size={40} /></View>}
            title={t('noComplaints')}
            action={<Button title={t('fileNewComplaint')} onPress={() => setModal(true)} size="md" style={{ marginTop: 16 }} />}
          />
        )}
      </ScrollView>

      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('fileNewComplaint')}</Text>
              <TouchableOpacity onPress={() => setModal(false)}><X color={theme.colors.neutral[500]} size={22} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.fieldLabel}>{t('complaintCategory')}</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.catChip, form.category === c.key && styles.catChipActive]}
                    onPress={() => setForm(f => ({ ...f, category: c.key }))}
                  >
                    <Text style={styles.catEmoji}>{c.icon}</Text>
                    <Text style={[styles.catChipText, form.category === c.key && styles.catChipTextActive]}>{c.label[lang]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input label={t('complaintTitle')} value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} placeholder="Brief title" />
              <Input label={t('complaintDescription')} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Describe the issue" multiline numberOfLines={4} />
              <Input label={t('complaintLocation')} value={form.location} onChangeText={v => setForm(f => ({ ...f, location: v }))} placeholder="Address or landmark" />

              <Button title={saving ? '...' : t('submitComplaint')} onPress={submit} loading={saving} disabled={!form.category || !form.title} size="lg" fullWidth style={{ marginTop: 8 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, fontFamily: 'Inter-Bold' },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary[50], alignItems: 'center', justifyContent: 'center' },

  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, ...theme.shadows.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: theme.radius.md, backgroundColor: theme.colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, flex: 1, fontFamily: 'Inter-SemiBold' },
  cardCat: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2, fontFamily: 'Inter-Regular' },
  cardDesc: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 10, lineHeight: 20, fontFamily: 'Inter-Regular' },
  cardFooter: { flexDirection: 'row', gap: 10, marginTop: 12 },
  trackingBox: { flex: 1, backgroundColor: theme.colors.neutral[50], borderRadius: theme.radius.md, padding: 8 },
  trackingLabel: { fontSize: 9, color: theme.colors.textMuted, textTransform: 'uppercase', fontWeight: theme.fontWeight.semibold, fontFamily: 'Inter-SemiBold' },
  trackingValue: { fontSize: theme.fontSize.sm, color: theme.colors.text, fontWeight: theme.fontWeight.semibold, marginTop: 2, fontFamily: 'Inter-SemiBold' },

  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.neutral[100], alignItems: 'center', justifyContent: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.surface, borderTopLeftRadius: theme.radius.xxl, borderTopRightRadius: theme.radius.xxl, maxHeight: '92%', padding: theme.spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg },
  modalTitle: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, fontFamily: 'Inter-Bold' },

  fieldLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.neutral[700], marginBottom: 8, fontFamily: 'Inter-Medium' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing.md },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: theme.radius.md, backgroundColor: theme.colors.neutral[100], borderWidth: 1, borderColor: 'transparent' },
  catChipActive: { backgroundColor: theme.colors.primary[50], borderColor: theme.colors.primary[600] },
  catEmoji: { fontSize: 16 },
  catChipText: { fontSize: theme.fontSize.sm, color: theme.colors.neutral[600], fontFamily: 'Inter-Regular' },
  catChipTextActive: { color: theme.colors.primary[700], fontWeight: theme.fontWeight.semibold, fontFamily: 'Inter-SemiBold' },
});
