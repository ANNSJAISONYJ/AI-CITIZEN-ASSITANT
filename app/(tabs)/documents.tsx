import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, FileText, ShieldCheck, AlertTriangle, Clock, X, Lock, Edit2, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useUserData } from '@/hooks/useUserData';
import { theme } from '@/lib/theme';
import { Button, Input, EmptyState, Badge, Spinner } from '@/components/ui';
import { Document } from '@/types';

const DOC_TYPES = [
  'Aadhaar Card', 'PAN Card', 'Voter ID', 'Passport', 'Driving Licence',
  'Birth Certificate', 'Death Certificate', 'Marriage Certificate',
  'Community Certificate', 'Income Certificate', 'Residence Certificate',
  'Disability Certificate', 'Ration Card', 'Senior Citizen Card',
  'Health Card', 'Educational Certificate', 'Property Document', 'Land Record',
  'Vehicle RC', 'GST Registration', 'MSME/Udyam', 'Trade Licence', 'FSSAI',
];

export default function DocumentsScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { documents, loading, reload } = useUserData();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Document | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [form, setForm] = useState({ type: '', title: '', number: '', issue_date: '', expiry_date: '', status: 'verified', notes: '' });
  const [saving, setSaving] = useState(false);

  const summary = useMemo(() => {
    const verified = documents.filter(d => d.status === 'verified').length;
    const pending = documents.filter(d => d.status === 'pending').length;
    const missing = documents.filter(d => d.status === 'missing').length;
    const expired = documents.filter(d => d.status === 'expired' || (d.expiry_date && new Date(d.expiry_date) < new Date())).length;
    return { verified, pending, missing, expired, total: documents.length };
  }, [documents]);

  const openAdd = () => {
    setEditing(null);
    setForm({ type: '', title: '', number: '', issue_date: '', expiry_date: '', status: 'verified', notes: '' });
    setModal(true);
  };

  const openEdit = (doc: Document) => {
    setEditing(doc);
    setForm({
      type: doc.type,
      title: doc.title,
      number: doc.number,
      issue_date: doc.issue_date || '',
      expiry_date: doc.expiry_date || '',
      status: doc.status,
      notes: doc.notes,
    });
    setModal(true);
  };

  const save = async () => {
    if (!user || !form.title || !form.type) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      type: form.type,
      title: form.title,
      number: form.number,
      issue_date: form.issue_date || null,
      expiry_date: form.expiry_date || null,
      status: form.status,
      notes: form.notes,
    };
    if (editing) {
      await supabase.from('documents').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('documents').insert(payload);
    }
    setSaving(false);
    setModal(false);
    await reload();
  };

  const remove = async (doc: Document) => {
    await supabase.from('documents').delete().eq('id', doc.id);
    await reload();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const getStatusBadge = (doc: Document) => {
    const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
    if (isExpired || doc.status === 'expired') return <Badge label={t('expired')} color="error" />;
    if (doc.status === 'verified') return <Badge label={t('verified')} color="success" />;
    if (doc.status === 'pending') return <Badge label={t('pending')} color="warning" />;
    if (doc.status === 'missing') return <Badge label={t('missing')} color="neutral" />;
    return <Badge label={doc.status} color="neutral" />;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('documentVault')}</Text>
          <Text style={styles.subtitle}>{t('secureVault')}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Plus color={theme.colors.primary[600]} size={22} />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <ShieldCheck color={theme.colors.secondary[600]} size={18} />
          <Text style={styles.summaryValue}>{summary.verified}</Text>
          <Text style={styles.summaryLabel}>{t('verified')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Clock color={theme.colors.accent[600]} size={18} />
          <Text style={styles.summaryValue}>{summary.pending}</Text>
          <Text style={styles.summaryLabel}>{t('pending')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <AlertTriangle color={theme.colors.error} size={18} />
          <Text style={styles.summaryValue}>{summary.expired}</Text>
          <Text style={styles.summaryLabel}>{t('expired')}</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary[600]} />}
      >
        {loading ? (
          <Spinner label={t('loading')} />
        ) : documents.length > 0 ? (
          documents.map(doc => (
            <View key={doc.id} style={styles.docCard}>
              <View style={styles.docIcon}>
                <FileText color={theme.colors.primary[600]} size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.docTopRow}>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  {getStatusBadge(doc)}
                </View>
                <Text style={styles.docType}>{doc.type}</Text>
                {doc.number ? <Text style={styles.docNumber}>{doc.number}</Text> : null}
                <View style={styles.docDates}>
                  {doc.issue_date ? <Text style={styles.docDate}>Issued: {new Date(doc.issue_date).toLocaleDateString()}</Text> : null}
                  {doc.expiry_date ? <Text style={styles.docDate}>Expires: {new Date(doc.expiry_date).toLocaleDateString()}</Text> : null}
                </View>
              </View>
              <View style={styles.docActions}>
                <TouchableOpacity style={styles.docActionBtn} onPress={() => openEdit(doc)}>
                  <Edit2 color={theme.colors.neutral[500]} size={16} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.docActionBtn} onPress={() => remove(doc)}>
                  <Trash2 color={theme.colors.error} size={16} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            icon={<View style={styles.emptyIcon}><FileText color={theme.colors.neutral[300]} size={40} /></View>}
            title={t('noDocuments')}
            action={<Button title={t('addDocument')} onPress={openAdd} size="md" style={{ marginTop: 16 }} />}
          />
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editing ? t('editDocument') : t('addDocument')}</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <X color={theme.colors.neutral[500]} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.fieldLabel}>{t('documentType')}</Text>
              <View style={styles.typeGrid}>
                {DOC_TYPES.map(dt => (
                  <TouchableOpacity
                    key={dt}
                    style={[styles.typeChip, form.type === dt && styles.typeChipActive]}
                    onPress={() => setForm(f => ({ ...f, type: dt, title: f.title || dt }))}
                  >
                    <Text style={[styles.typeChipText, form.type === dt && styles.typeChipTextActive]}>{dt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input label={t('documentTitle')} value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} placeholder="Document name" />
              <Input label={t('documentNumber')} value={form.number} onChangeText={v => setForm(f => ({ ...f, number: v }))} placeholder="XXXX-XXXX-1234" />
              <Input label={t('issueDate')} value={form.issue_date} onChangeText={v => setForm(f => ({ ...f, issue_date: v }))} placeholder="YYYY-MM-DD" />
              <Input label={t('expiryDate')} value={form.expiry_date} onChangeText={v => setForm(f => ({ ...f, expiry_date: v }))} placeholder="YYYY-MM-DD" />

              <Text style={styles.fieldLabel}>{t('status')}</Text>
              <View style={styles.statusRow}>
                {(['verified', 'pending', 'missing', 'expired'] as const).map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusChip, form.status === s && styles.statusChipActive]}
                    onPress={() => setForm(f => ({ ...f, status: s }))}
                  >
                    <Text style={[styles.statusChipText, form.status === s && styles.statusChipTextActive]}>{t(s)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input label={t('notes')} value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Additional notes" multiline numberOfLines={3} />

              <View style={styles.modalActions}>
                <Button title={t('cancel')} variant="ghost" onPress={() => setModal(false)} style={{ flex: 1 }} />
                <Button title={saving ? '...' : t('save')} onPress={save} loading={saving} disabled={!form.title || !form.type} style={{ flex: 1, marginLeft: 10 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: 12 },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, fontFamily: 'Inter-Bold' },
  subtitle: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 4, fontFamily: 'Inter-Regular' },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary[50], alignItems: 'center', justifyContent: 'center' },

  summaryRow: { flexDirection: 'row', paddingHorizontal: theme.spacing.lg, gap: 10, marginBottom: 8 },
  summaryCard: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 12, alignItems: 'center', gap: 4, ...theme.shadows.sm },
  summaryValue: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, fontFamily: 'Inter-Bold' },
  summaryLabel: { fontSize: 10, color: theme.colors.textSecondary, fontFamily: 'Inter-Regular' },

  docCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 14, gap: 12, ...theme.shadows.sm },
  docIcon: { width: 44, height: 44, borderRadius: theme.radius.md, backgroundColor: theme.colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  docTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  docTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, flex: 1, fontFamily: 'Inter-SemiBold' },
  docType: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2, fontFamily: 'Inter-Regular' },
  docNumber: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 4, fontFamily: 'Inter-Regular' },
  docDates: { flexDirection: 'row', gap: 12, marginTop: 6 },
  docDate: { fontSize: 10, color: theme.colors.textMuted, fontFamily: 'Inter-Regular' },
  docActions: { flexDirection: 'row', gap: 6 },
  docActionBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.neutral[50], alignItems: 'center', justifyContent: 'center' },

  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.neutral[100], alignItems: 'center', justifyContent: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.surface, borderTopLeftRadius: theme.radius.xxl, borderTopRightRadius: theme.radius.xxl, maxHeight: '92%', padding: theme.spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg },
  modalTitle: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, fontFamily: 'Inter-Bold' },

  fieldLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.neutral[700], marginBottom: 8, marginTop: 4, fontFamily: 'Inter-Medium' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing.md },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.md, backgroundColor: theme.colors.neutral[100], borderWidth: 1, borderColor: 'transparent' },
  typeChipActive: { backgroundColor: theme.colors.primary[50], borderColor: theme.colors.primary[600] },
  typeChipText: { fontSize: theme.fontSize.sm, color: theme.colors.neutral[600], fontFamily: 'Inter-Regular' },
  typeChipTextActive: { color: theme.colors.primary[700], fontWeight: theme.fontWeight.semibold, fontFamily: 'Inter-SemiBold' },

  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing.md },
  statusChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radius.md, backgroundColor: theme.colors.neutral[100] },
  statusChipActive: { backgroundColor: theme.colors.primary[600] },
  statusChipText: { fontSize: theme.fontSize.sm, color: theme.colors.neutral[600], fontFamily: 'Inter-Regular' },
  statusChipTextActive: { color: '#fff', fontWeight: theme.fontWeight.semibold, fontFamily: 'Inter-SemiBold' },

  modalActions: { flexDirection: 'row', marginTop: theme.spacing.lg },
});
