import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, BellOff, CheckCircle2, AlertTriangle, Clock, Info, Megaphone, ShieldAlert } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { theme } from '@/lib/theme';
import { Spinner, EmptyState, Button } from '@/components/ui';
import { Notification } from '@/types';

export default function NotificationsScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setNotifications((data as Notification[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    await load();
  };

  const markRead = async (n: Notification) => {
    if (n.is_read) return;
    await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
    await load();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'deadline': return <Clock color={theme.colors.accent[600]} size={18} />;
      case 'approval': return <CheckCircle2 color={theme.colors.secondary[600]} size={18} />;
      case 'document': return <Info color={theme.colors.primary[600]} size={18} />;
      case 'announcement': return <Megaphone color={theme.colors.primary[600]} size={18} />;
      case 'scam-alert': return <ShieldAlert color={theme.colors.error} size={18} />;
      default: return <Bell color={theme.colors.neutral[500]} size={18} />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'deadline': return theme.colors.accent[50];
      case 'approval': return theme.colors.secondary[50];
      case 'scam-alert': return '#fef2f2';
      default: return theme.colors.primary[50];
    }
  };

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => (window as any).history?.back?.() || undefined}>
          <ArrowLeft color={theme.colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('notifications')}</Text>
        {unread > 0 ? (
          <TouchableOpacity style={styles.markBtn} onPress={markAllRead}>
            <CheckCircle2 color={theme.colors.primary[600]} size={18} />
            <Text style={styles.markText}>Mark all</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 40 }} />}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary[600]} />}
      >
        {loading ? (
          <Spinner label={t('loading')} />
        ) : notifications.length > 0 ? (
          notifications.map(n => (
            <TouchableOpacity
              key={n.id}
              style={[styles.card, !n.is_read && styles.cardUnread]}
              onPress={() => markRead(n)}
            >
              <View style={[styles.iconBox, { backgroundColor: getIconBg(n.type) }]}>
                {getIcon(n.type)}
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{n.title}</Text>
                  {!n.is_read ? <View style={styles.unreadDot} /> : null}
                </View>
                <Text style={styles.cardBody} numberOfLines={3}>{n.body}</Text>
                <Text style={styles.cardTime}>{new Date(n.created_at).toLocaleDateString()} · {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyState
            icon={<View style={styles.emptyIcon}><BellOff color={theme.colors.neutral[300]} size={40} /></View>}
            title={t('noNotifications')}
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
  markBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.colors.primary[50], paddingHorizontal: 10, paddingVertical: 8, borderRadius: theme.radius.md },
  markText: { fontSize: theme.fontSize.xs, color: theme.colors.primary[700], fontWeight: theme.fontWeight.semibold, fontFamily: 'Inter-SemiBold' },

  card: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 14, gap: 12, ...theme.shadows.sm },
  cardUnread: { borderWidth: 1.5, borderColor: theme.colors.primary[200] },
  iconBox: { width: 40, height: 40, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { flex: 1, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, fontFamily: 'Inter-SemiBold' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary[600] },
  cardBody: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 4, lineHeight: 20, fontFamily: 'Inter-Regular' },
  cardTime: { fontSize: 10, color: theme.colors.textMuted, marginTop: 6, fontFamily: 'Inter-Regular' },

  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.neutral[100], alignItems: 'center', justifyContent: 'center' },
});
