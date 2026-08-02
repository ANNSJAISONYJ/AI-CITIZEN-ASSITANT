import { useState } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, ImageBackground, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Landmark, ShieldCheck, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { theme } from '@/lib/theme';

export default function LoginScreen() {
  const { t } = useI18n();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) setError(error);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <LinearGradient
            colors={[theme.colors.primary[700], theme.colors.primary[500], theme.colors.primary[400]]}
            style={styles.hero}
          >
            <View style={styles.heroContent}>
              <View style={styles.logoWrap}>
                <Landmark color="#fff" size={32} strokeWidth={2.2} />
              </View>
              <Text style={styles.appName}>{t('appName')}</Text>
              <Text style={styles.appTagline}>{t('appTagline')}</Text>
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroBadge}>
                  <ShieldCheck color={theme.colors.primary[100]} size={13} />
                  <Text style={styles.heroBadgeText}>Secure</Text>
                </View>
                <View style={styles.heroBadge}>
                  <Sparkles color={theme.colors.primary[100]} size={13} />
                  <Text style={styles.heroBadgeText}>AI-Powered</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.form}>
            <Text style={styles.title}>{t('welcomeBack')}</Text>
            <Text style={styles.subtitle}>{t('signInSubtitle')}</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label={t('email')}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label={t('password')}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            <Button title={loading ? t('signingIn') : t('signIn')} onPress={handleSignIn} fullWidth size="lg" loading={loading} style={{ marginTop: theme.spacing.sm }} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('dontHaveAccount')} </Text>
              <Text style={styles.footerLink} onPress={() => router.push('/(auth)/register')}>{t('signUp')}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.primary[700] },
  scroll: { flexGrow: 1 },
  hero: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl + 8,
    borderBottomLeftRadius: theme.radius.xxl,
    borderBottomRightRadius: theme.radius.xxl,
  },
  heroContent: { alignItems: 'center' },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.xl,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  appName: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  appTagline: {
    fontSize: theme.fontSize.md,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  heroBadgeRow: { flexDirection: 'row', gap: 10, marginTop: theme.spacing.lg },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
  },
  heroBadgeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary[50],
    fontWeight: theme.fontWeight.semibold,
    fontFamily: 'Inter-SemiBold',
  },

  form: {
    padding: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: 6,
    marginBottom: theme.spacing.lg,
    fontFamily: 'Inter-Regular',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    fontFamily: 'Inter-Regular',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    fontFamily: 'Inter-Regular',
  },
  footerLink: {
    color: theme.colors.primary[600],
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.md,
    fontFamily: 'Inter-SemiBold',
  },
});
