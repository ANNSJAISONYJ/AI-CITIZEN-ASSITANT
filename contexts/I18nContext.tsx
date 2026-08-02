import { createContext, useContext, useCallback, ReactNode } from 'react';
import { Language } from '@/types';
import { translate } from '@/lib/i18n';
import { useAuth } from './AuthContext';

interface I18nContextValue {
  lang: Language;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { language } = useAuth();

  const t = useCallback((key: string) => translate(language, key), [language]);

  return <I18nContext.Provider value={{ lang: language, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
