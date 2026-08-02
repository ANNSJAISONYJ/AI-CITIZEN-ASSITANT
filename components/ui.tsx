import { ReactNode } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '@/lib/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  padded?: boolean;
}

export function Card({ children, style, onPress, padded = true }: CardProps) {
  const content = (
    <View style={[styles.card, padded && styles.padded, style as any]}>{children}</View>
  );
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.touchable}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  style,
  fullWidth,
}: ButtonProps) {
  const variantStyle = styles[`${variant}Btn` as keyof typeof styles] as ViewStyle;
  const sizeStyle = styles[`${size}Btn` as keyof typeof styles] as ViewStyle;
  const textVariantStyle = styles[`${variant}Text` as keyof typeof styles] as TextStyle;
  const textSizeStyle = styles[`${size}Text` as keyof typeof styles] as TextStyle;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.btnBase, variantStyle, sizeStyle, fullWidth && styles.fullWidth, disabled && styles.btnDisabled, style]}
    >
      <Text style={[styles.btnTextBase, textVariantStyle, textSizeStyle]}>
        {loading ? '...' : title}
      </Text>
    </TouchableOpacity>
  );
}

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  style?: ViewStyle;
  multiline?: boolean;
  numberOfLines?: number;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  style,
  multiline,
  numberOfLines,
}: InputProps) {
  return (
    <View style={styles.inputWrap}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
    </View>
  );
}

interface BadgeProps {
  label: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'accent';
  style?: ViewStyle;
}

export function Badge({ label, color = 'neutral', style }: BadgeProps) {
  const bgMap: Record<string, string> = {
    primary: theme.colors.primary[50],
    success: theme.colors.secondary[50],
    warning: theme.colors.accent[50],
    error: '#fef2f2',
    neutral: theme.colors.neutral[100],
    accent: theme.colors.accent[50],
  };
  const textMap: Record<string, string> = {
    primary: theme.colors.primary[700],
    success: theme.colors.secondary[700],
    warning: theme.colors.accent[700],
    error: theme.colors.error,
    neutral: theme.colors.neutral[600],
    accent: theme.colors.accent[700],
  };
  return (
    <View style={[styles.badge, { backgroundColor: bgMap[color] }, style]}>
      <Text style={[styles.badgeText, { color: textMap[color] }]}>{label}</Text>
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      {icon}
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
      {action}
    </View>
  );
}

interface SpinnerProps {
  size?: 'sm' | 'md';
  label?: string;
}

export function Spinner({ size = 'md', label }: SpinnerProps) {
  const dim = size === 'sm' ? 20 : 36;
  return (
    <View style={styles.spinnerWrap}>
      <View style={[styles.spinner, { width: dim, height: dim, borderRadius: dim / 2 }]} />
      {label ? <Text style={styles.spinnerLabel}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    ...theme.shadows.sm,
  },
  padded: { padding: theme.spacing.lg },
  touchable: { borderRadius: theme.radius.lg },

  btnBase: {
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryBtn: { backgroundColor: theme.colors.primary[600] },
  secondaryBtn: { backgroundColor: theme.colors.secondary[600] },
  outlineBtn: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.colors.primary[600] },
  ghostBtn: { backgroundColor: theme.colors.primary[50] },
  dangerBtn: { backgroundColor: theme.colors.error },
  btnDisabled: { opacity: 0.5 },
  fullWidth: { alignSelf: 'stretch' },

  smBtn: { paddingVertical: 8, paddingHorizontal: 14 },
  mdBtn: { paddingVertical: 14, paddingHorizontal: 20 },
  lgBtn: { paddingVertical: 18, paddingHorizontal: 28 },

  btnTextBase: { fontWeight: theme.fontWeight.semibold },
  primaryText: { color: '#fff' },
  secondaryText: { color: '#fff' },
  outlineText: { color: theme.colors.primary[700] },
  ghostText: { color: theme.colors.primary[700] },
  dangerText: { color: '#fff' },

  smText: { fontSize: theme.fontSize.sm },
  mdText: { fontSize: theme.fontSize.md },
  lgText: { fontSize: theme.fontSize.lg },

  inputWrap: { marginBottom: theme.spacing.md },
  inputLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[700],
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  sectionAction: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.fontWeight.semibold,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },

  spinnerWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xl },
  spinner: {
    borderWidth: 3,
    borderColor: theme.colors.primary[100],
    borderTopColor: theme.colors.primary[600],
  },
  spinnerLabel: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
});
