import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User as UserIcon, Users, Globe, Shield, HelpCircle, LogOut, ChevronRight,
  Pencil, Plus, Trash2, X, Bell, MapPin, Languages,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useUserData } from '@/hooks/useUserData';
import { theme } from '@/lib/theme';
import { Button, Input, Spinner, EmptyState } from '@/components/ui';
import { Profile, FamilyMember, Language } from '@/types';

const OCCUPATIONS = ['student', 'farmer', 'employed', 'entrepreneur', 'homemaker', 'senior', 'unemployed'];
const EDUCATIONS = ['below-10th', '10th', '12th', 'graduate', 'postgraduate', 'research'];
const CATEGORIES = ['General', 'OBC', 'SC', 'ST'];
const GENDERS = ['male', 'female', 'other'];
const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
];

export default function ProfileScreen() {
  const { t, lang } = useI18n();
  const { profile, user, signOut, setLanguage, refreshProfile } = useAuth();
  const { familyMembers, loading, reload } = useUserData();
  const [editModal, setEditModal] = useState(false);
  const [familyModal, setFamilyModal] = useState(false);
  const [editingFamily, setEditingFamily] = useState<FamilyMember | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Partial<Profile>>({});
  const [familyForm, setFamilyForm] = useState({ full_name: '', relationship: '', date_of_birth: '', gender: '', community_category: '', occupation: '', education: '', disability_status: false });

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([reload(), refreshProfile()]);
    setRefreshing(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { full_name, phone, date_of_birth, gender, community_category, annual_income, occupation, education, disability_status, state, district, pincode, address } = form;
    await supabase.from('profiles').update({
      full_name, phone, date_of_birth, gender, community_category,
      annual_income: Number(annual_income) || 0, occupation, education,
      disability_status: Boolean(disability_status), state, district, pincode, address,
      onboarded: true,
    }).eq('user_id', user.id);
    setSaving(false);
    setEditModal(false);
    await refreshProfile();
  };

  const openAddFamily = () => {
    setEditingFamily(null);
    setFamilyForm({ full_name: '', relationship: '', date_of_birth: '', gender: '', community_category: '', occupation: '', education: '', disability_status: false });
    setFamilyModal(true);
  };

  const openEditFamily = (m: FamilyMember) => {
    setEditingFamily(m);
    setFamilyForm({
      full_name: m.full_name,
      relationship: m.relationship,
      date_of_birth: m.date_of_birth || '',
      gender: m.gender,
      community_category: m.community_category,
      occupation: m.occupation,
      education: m.education,
      disability_status: m.disability_status,
    });
    setFamilyModal(true);
  };

  const saveFamily = async () => {
    if (!user || !familyForm.full_name || !familyForm.relationship) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      full_name: familyForm.full_name,
      relationship: familyForm.relationship,
      date_of_birth: familyForm.date_of_birth || null,
      gender: familyForm.gender,
      community_category: familyForm.community_category,
      occupation: familyForm.occupation,
      education: familyForm.education,
      disability_status: familyForm.disability_status,
    };
    if (editingFamily) {
      await supabase.from('family_members').update(payload).eq('id', editingFamily.id);
    } else {
      await supabase.from('family_members').insert(payload);
    }
    setSaving(false);
    setFamilyModal(false);
    await reload();
  };

  const removeFamily = async (m: FamilyMember) => {
    await supabase.from('family_members').delete().eq('id', m.id);
    await reload();
  };

  const handleLogout = () => {
    Alert.alert(t('logout'), t('confirmLogout'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: () => signOut() },
    ]);
  };

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center' }}><Spinner label={t('loading')} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary[600]} />}
      >
        <LinearGradient colors={[theme.colors.primary[700], theme.colors.primary[500]]} style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.avatar}>
              <UserIcon color="#fff" size={36} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{profile?.full_name || 'Citizen'}</Text>
              <Text style={styles.heroEmail}>{user?.email}</Text>
              {profile?.onboarded ? (
                <View style={styles.verifiedChip}>
                  <Shield color="#fff" size={11} />
                  <Text style={styles.verifiedText}>Profile Complete</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditModal(true)}>
              <Pencil color="#fff" size={16} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {!profile?.onboarded ? (
          <View style={styles.onboardBanner}>
            <Text style={styles.onboardText}>{t('completeProfile')}</Text>
            <Button title={t('completeNow')} size="sm" onPress={() => setEditModal(true)} style={{ marginTop: 10 }} />
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>{t('personalInfo')}</Text>
        <View style={styles.infoCard}>
          <InfoRow label={t('phone')} value={profile?.phone || '-'} />
          <InfoRow label={t('dateOfBirth')} value={profile?.date_of_birth || '-'} />
          <InfoRow label={t('gender')} value={profile?.gender ? t(profile.gender) : '-'} />
          <InfoRow label={t('community')} value={profile?.community_category || '-'} />
          <InfoRow label={t('occupation')} value={profile?.occupation ? t(profile.occupation) : '-'} />
          <InfoRow label={t('education')} value={profile?.education || '-'} />
          <InfoRow label={t('annualIncome')} value={profile ? `₹${profile.annual_income.toLocaleString()}` : '-'} />
          <InfoRow label={t('state')} value={profile?.state || '-'} />
          <InfoRow label={t('district')} value={profile?.district || '-'} />
          <InfoRow label={t('disability')} value={profile?.disability_status ? t('yes') : t('no')} last />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{t('familyDashboard')}</Text>
          <TouchableOpacity onPress={openAddFamily}>
            <View style={styles.addSmallBtn}><Plus color={theme.colors.primary[600]} size={16} /></View>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionDesc}>{t('manageFamily')}</Text>

        {familyMembers.length > 0 ? (
          <View style={styles.familyList}>
            {familyMembers.map(m => (
              <View key={m.id} style={styles.familyCard}>
                <View style={styles.familyAvatar}>
                  <Users color="#fff" size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.familyName}>{m.full_name}</Text>
                  <Text style={styles.familyRel}>{m.relationship}</Text>
                </View>
                <TouchableOpacity style={styles.familyAction} onPress={() => openEditFamily(m)}>
                  <Pencil color={theme.colors.neutral[500]} size={15} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.familyAction} onPress={() => removeFamily(m)}>
                  <Trash2 color={theme.colors.error} size={15} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyFamily}>
            <Users color={theme.colors.neutral[300]} size={32} />
            <Text style={styles.emptyFamilyText}>{t('noFamilyMembers')}</Text>
            <Button title={t('addFamilyMember')} size="sm" variant="ghost" onPress={openAddFamily} style={{ marginTop: 12 }} />
          </View>
        )}

        <Text style={styles.sectionLabel}>{t('settings')}</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/complaints')}>
            <Globe color={theme.colors.primary[600]} size={20} />
            <Text style={styles.menuText}>{t('complaints')}</Text>
            <ChevronRight color={theme.colors.neutral[300]} size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/offices')}>
            <MapPin color={theme.colors.primary[600]} size={20} />
            <Text style={styles.menuText}>{t('findOffice')}</Text>
            <ChevronRight color={theme.colors.neutral[300]} size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notifications')}>
            <Bell color={theme.colors.primary[600]} size={20} />
            <Text style={styles.menuText}>{t('notifications')}</Text>
            <ChevronRight color={theme.colors.neutral[300]} size={18} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>{t('language')}</Text>
        <View style={styles.langRow}>
          {LANGUAGES.map(l => (
            <TouchableOpacity
              key={l.code}
              style={[styles.langCard, lang === l.code && styles.langCardActive]}
              onPress={() => setLanguage(l.code)}
            >
              <Languages color={lang === l.code ? '#fff' : theme.colors.neutral[500]} size={20} />
              <Text style={[styles.langLabel, lang === l.code && styles.langLabelActive]}>{l.native}</Text>
              <Text style={[styles.langSub, lang === l.code && styles.langSubActive]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{t('account')}</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <LogOut color={theme.colors.error} size={20} />
            <Text style={[styles.menuText, { color: theme.colors.error }]}>{t('logout')}</Text>
            <ChevronRight color={theme.colors.neutral[300]} size={18} />
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>AI Citizen OS v1.0</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModal} animationType="slide" transparent onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('personalInfo')}</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}><X color={theme.colors.neutral[500]} size={22} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
              <Input label={t('fullName')} value={form.full_name || ''} onChangeText={v => setForm(f => ({ ...f, full_name: v }))} placeholder="Full name" />
              <Input label={t('phone')} value={form.phone || ''} onChangeText={v => setForm(f => ({ ...f, phone: v }))} placeholder="9876543210" keyboardType="phone-pad" />
              <Input label={t('dateOfBirth')} value={form.date_of_birth || ''} onChangeText={v => setForm(f => ({ ...f, date_of_birth: v }))} placeholder="YYYY-MM-DD" />
              <ChipPicker label={t('gender')} value={form.gender || ''} options={GENDERS} onSelect={v => setForm(f => ({ ...f, gender: v }))} t={t} />
              <ChipPicker label={t('community')} value={form.community_category || ''} options={CATEGORIES} onSelect={v => setForm(f => ({ ...f, community_category: v }))} t={t} />
              <ChipPicker label={t('occupation')} value={form.occupation || ''} options={OCCUPATIONS} onSelect={v => setForm(f => ({ ...f, occupation: v }))} t={t} />
              <ChipPicker label={t('education')} value={form.education || ''} options={EDUCATIONS} onSelect={v => setForm(f => ({ ...f, education: v }))} t={t} />
              <Input label={t('annualIncome')} value={String(form.annual_income ?? 0)} onChangeText={v => setForm(f => ({ ...f, annual_income: Number(v) || 0 }))} placeholder="0" keyboardType="numeric" />
              <Input label={t('state')} value={form.state || ''} onChangeText={v => setForm(f => ({ ...f, state: v }))} placeholder="Tamil Nadu" />
              <Input label={t('district')} value={form.district || ''} onChangeText={v => setForm(f => ({ ...f, district: v }))} placeholder="Chennai" />
              <Input label={t('pincode')} value={form.pincode || ''} onChangeText={v => setForm(f => ({ ...f, pincode: v }))} placeholder="600001" keyboardType="numeric" />
              <Input label={t('address')} value={form.address || ''} onChangeText={v => setForm(f => ({ ...f, address: v }))} placeholder="Address" multiline numberOfLines={2} />

              <TouchableOpacity style={styles.disabilityToggle} onPress={() => setForm(f => ({ ...f, disability_status: !f.disability_status }))}>
                <Text style={styles.disabilityLabel}>{t('disability')}</Text>
                <View style={[styles.toggle, form.disability_status && styles.toggleActive]}>
                  <View style={[styles.toggleKnob, form.disability_status && styles.toggleKnobActive]} />
                </View>
              </TouchableOpacity>

              <Button title={saving ? '...' : t('saveChanges')} onPress={saveProfile} loading={saving} size="lg" fullWidth style={{ marginTop: 16 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Family Member Modal */}
      <Modal visible={familyModal} animationType="slide" transparent onRequestClose={() => setFamilyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingFamily ? t('editFamilyMember') : t('addFamilyMember')}</Text>
              <TouchableOpacity onPress={() => setFamilyModal(false)}><X color={theme.colors.neutral[500]} size={22} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
              <Input label={t('fullName')} value={familyForm.full_name} onChangeText={v => setFamilyForm(f => ({ ...f, full_name: v }))} placeholder="Full name" />
              <ChipPicker label={t('relationship')} value={familyForm.relationship} options={['spouse', 'child', 'parent', 'sibling', 'dependent']} onSelect={v => setFamilyForm(f => ({ ...f, relationship: v }))} t={t} />
              <Input label={t('dateOfBirth')} value={familyForm.date_of_birth} onChangeText={v => setFamilyForm(f => ({ ...f, date_of_birth: v }))} placeholder="YYYY-MM-DD" />
              <ChipPicker label={t('gender')} value={familyForm.gender} options={GENDERS} onSelect={v => setFamilyForm(f => ({ ...f, gender: v }))} t={t} />
              <ChipPicker label={t('community')} value={familyForm.community_category} options={CATEGORIES} onSelect={v => setFamilyForm(f => ({ ...f, community_category: v }))} t={t} />
              <ChipPicker label={t('occupation')} value={familyForm.occupation} options={OCCUPATIONS} onSelect={v => setFamilyForm(f => ({ ...f, occupation: v }))} t={t} />
              <ChipPicker label={t('education')} value={familyForm.education} options={EDUCATIONS} onSelect={v => setFamilyForm(f => ({ ...f, education: v }))} t={t} />
              <TouchableOpacity style={styles.disabilityToggle} onPress={() => setFamilyForm(f => ({ ...f, disability_status: !f.disability_status }))}>
                <Text style={styles.disabilityLabel}>{t('disability')}</Text>
                <View style={[styles.toggle, familyForm.disability_status && styles.toggleActive]}>
                  <View style={[styles.toggleKnob, familyForm.disability_status && styles.toggleKnobActive]} />
                </View>
              </TouchableOpacity>
              <Button title={saving ? '...' : t('save')} onPress={saveFamily} loading={saving} disabled={!familyForm.full_name || !familyForm.relationship} size="lg" fullWidth style={{ marginTop: 16 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ChipPicker({ label, value, options, onSelect, t }: { label: string; value: string; options: string[]; onSelect: (v: string) => void; t: (k: string) => string }) {
  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map(o => (
          <TouchableOpacity
            key={o}
            style={[styles.chip, value === o && styles.chipActive]}
            onPress={() => onSelect(o)}
          >
            <Text style={[styles.chipText, value === o && styles.chipTextActive]}>{t(o) === o ? o.charAt(0).toUpperCase() + o.slice(1) : t(o)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },

  hero: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.xl, borderBottomLeftRadius: theme.radius.xxl, borderBottomRightRadius: theme.radius.xxl },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroName: { color: '#fff', fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, fontFamily: 'Inter-Bold' },
  heroEmail: { color: 'rgba(255,255,255,0.8)', fontSize: theme.fontSize.sm, marginTop: 2, fontFamily: 'Inter-Regular' },
  verifiedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radius.full, alignSelf: 'flex-start', marginTop: 8 },
  verifiedText: { color: '#fff', fontSize: 10, fontWeight: theme.fontWeight.semibold, fontFamily: 'Inter-SemiBold' },
  editBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },

  onboardBanner: { margin: theme.spacing.lg, backgroundColor: theme.colors.accent[50], borderRadius: theme.radius.lg, padding: 16, borderWidth: 1, borderColor: theme.colors.accent[100] },
  onboardText: { fontSize: theme.fontSize.md, color: theme.colors.accent[700], fontWeight: theme.fontWeight.semibold, fontFamily: 'Inter-SemiBold' },

  sectionLabel: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text, paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg, marginBottom: 8, fontFamily: 'Inter-Bold' },
  sectionDesc: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, paddingHorizontal: theme.spacing.lg, marginBottom: 10, fontFamily: 'Inter-Regular' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg, marginBottom: 4 },

  infoCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, marginHorizontal: theme.spacing.lg, ...theme.shadows.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  infoLabel: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, fontFamily: 'Inter-Regular' },
  infoValue: { fontSize: theme.fontSize.md, color: theme.colors.text, fontWeight: theme.fontWeight.semibold, fontFamily: 'Inter-SemiBold' },

  addSmallBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.primary[50], alignItems: 'center', justifyContent: 'center' },

  familyList: { paddingHorizontal: theme.spacing.lg, gap: 10 },
  familyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 14, gap: 12, ...theme.shadows.sm },
  familyAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary[600], alignItems: 'center', justifyContent: 'center' },
  familyName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, fontFamily: 'Inter-SemiBold' },
  familyRel: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 2, fontFamily: 'Inter-Regular' },
  familyAction: { width: 30, height: 30, borderRadius: 15, backgroundColor: theme.colors.neutral[50], alignItems: 'center', justifyContent: 'center' },

  emptyFamily: { alignItems: 'center', paddingVertical: theme.spacing.xl, marginHorizontal: theme.spacing.lg, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, gap: 8 },
  emptyFamilyText: { color: theme.colors.textMuted, fontSize: theme.fontSize.md, fontFamily: 'Inter-Regular' },

  menuCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, marginHorizontal: theme.spacing.lg, ...theme.shadows.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  menuText: { flex: 1, fontSize: theme.fontSize.md, color: theme.colors.text, fontFamily: 'Inter-Regular' },

  langRow: { flexDirection: 'row', paddingHorizontal: theme.spacing.lg, gap: 10 },
  langCard: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, alignItems: 'center', gap: 6, borderWidth: 2, borderColor: 'transparent', ...theme.shadows.sm },
  langCardActive: { borderColor: theme.colors.primary[600], backgroundColor: theme.colors.primary[600] },
  langLabel: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text, fontFamily: 'Inter-Bold' },
  langLabelActive: { color: '#fff' },
  langSub: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, fontFamily: 'Inter-Regular' },
  langSubActive: { color: 'rgba(255,255,255,0.8)' },

  versionText: { textAlign: 'center', color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginTop: theme.spacing.xl, fontFamily: 'Inter-Regular' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.surface, borderTopLeftRadius: theme.radius.xxl, borderTopRightRadius: theme.radius.xxl, maxHeight: '92%', padding: theme.spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg },
  modalTitle: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, fontFamily: 'Inter-Bold' },

  fieldLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.neutral[700], marginBottom: 8, fontFamily: 'Inter-Medium' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.md, backgroundColor: theme.colors.neutral[100] },
  chipActive: { backgroundColor: theme.colors.primary[600] },
  chipText: { fontSize: theme.fontSize.sm, color: theme.colors.neutral[600], fontFamily: 'Inter-Regular' },
  chipTextActive: { color: '#fff', fontWeight: theme.fontWeight.semibold, fontFamily: 'Inter-SemiBold' },

  disabilityToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  disabilityLabel: { fontSize: theme.fontSize.md, color: theme.colors.text, fontFamily: 'Inter-Regular' },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: theme.colors.neutral[200], padding: 3 },
  toggleActive: { backgroundColor: theme.colors.secondary[500] },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  toggleKnobActive: { transform: [{ translateX: 20 }] },
});
