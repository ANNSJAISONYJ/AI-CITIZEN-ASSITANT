import { useState } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Landmark } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { theme } from '@/lib/theme';

export default function RegisterScreen() {
  const { t } = useI18n();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await signUp(email, password, fullName);
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
              <Text style={styles.appTagline}>{t('signUpSubtitle')}</Text>
            </View>
          </LinearGradient>

          <View style={styles.form}>
            <Text style={styles.title}>{t('createAccount')}</Text>
            <Text style={styles.subtitle}>{t('signUpSubtitle')}</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label={t('fullName')}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Rajesh Kumar"
              autoCapitalize="words"
            />
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

            <Button title={loading ? t('signingUp') : t('createAccount')} onPress={handleSignUp} fullWidth size="lg" loading={loading} style={{ marginTop: theme.spacing.sm }} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('alreadyHaveAccount')} </Text>
              <Text style={styles.footerLink} onPress={() => router.push('/(auth)/login')}>{t('signIn')}</Text>
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
    paddingVertical: theme.spacing.xxl,
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
