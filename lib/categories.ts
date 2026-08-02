import { SchemeCategory } from '@/types';
import {
  GraduationCap,
  PiggyBank,
  HeartPulse,
  Home,
  Wheat,
  Briefcase,
  Store,
  Coins,
  ShieldCheck,
  Receipt,
  Users,
  Accessibility,
  PersonStanding,
  LucideIcon,
} from 'lucide-react-native';
import { theme } from './theme';

interface CategoryConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  label: { en: string; hi: string; ta: string };
}

export const categoryConfig: Record<SchemeCategory, CategoryConfig> = {
  scholarship: {
    icon: GraduationCap,
    color: theme.colors.primary[700],
    bgColor: theme.colors.primary[50],
    label: { en: 'Scholarship', hi: 'छात्रवृत्ति', ta: 'உதவித்தொகை' },
  },
  pension: {
    icon: PiggyBank,
    color: theme.colors.secondary[700],
    bgColor: theme.colors.secondary[50],
    label: { en: 'Pension', hi: 'पेंशन', ta: 'ஓய்வூதியம்' },
  },
  healthcare: {
    icon: HeartPulse,
    color: '#e11d48',
    bgColor: '#fff1f2',
    label: { en: 'Healthcare', hi: 'स्वास्थ्य', ta: 'சுகாதாரம்' },
  },
  housing: {
    icon: Home,
    color: theme.colors.accent[700],
    bgColor: theme.colors.accent[50],
    label: { en: 'Housing', hi: 'आवास', ta: 'வீட்டுவசதி' },
  },
  farmer: {
    icon: Wheat,
    color: '#16a34a',
    bgColor: '#f0fdf4',
    label: { en: 'Farmer', hi: 'किसान', ta: 'விவசாயி' },
  },
  employment: {
    icon: Briefcase,
    color: theme.colors.primary[700],
    bgColor: theme.colors.primary[50],
    label: { en: 'Employment', hi: 'रोजगार', ta: 'வேலைவாய்ப்பு' },
  },
  business: {
    icon: Store,
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    label: { en: 'Business', hi: 'व्यवसाय', ta: 'வணிகம்' },
  },
  subsidy: {
    icon: Coins,
    color: theme.colors.accent[700],
    bgColor: theme.colors.accent[50],
    label: { en: 'Subsidy', hi: 'सब्सिडी', ta: 'மானியம்' },
  },
  insurance: {
    icon: ShieldCheck,
    color: theme.colors.secondary[700],
    bgColor: theme.colors.secondary[50],
    label: { en: 'Insurance', hi: 'बीमा', ta: 'காப்பீடு' },
  },
  tax: {
    icon: Receipt,
    color: theme.colors.neutral[700],
    bgColor: theme.colors.neutral[100],
    label: { en: 'Tax', hi: 'कर', ta: 'வரி' },
  },
  women: {
    icon: Users,
    color: '#db2777',
    bgColor: '#fdf2f8',
    label: { en: 'Women', hi: 'महिला', ta: 'பெண்கள்' },
  },
  disability: {
    icon: Accessibility,
    color: '#0891b2',
    bgColor: '#ecfeff',
    label: { en: 'Disability', hi: 'दिव्यांग', ta: 'மாற்றுத்திறன்' },
  },
  senior: {
    icon: PersonStanding,
    color: theme.colors.secondary[700],
    bgColor: theme.colors.secondary[50],
    label: { en: 'Senior', hi: 'वरिष्ठ', ta: 'மூத்தோர்' },
  },
};

export function getCategoryLabel(category: string, lang: 'en' | 'hi' | 'ta'): string {
  const cfg = (categoryConfig as Record<string, CategoryConfig>)[category];
  return cfg ? cfg.label[lang] : category;
}
