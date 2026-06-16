import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { t as translate } from '../utils/i18n';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem('pastelhub-lang') || 'es';
    } catch {
      return 'es';
    }
  });

  const setLang = useCallback((l) => {
    setLangState(l);
    try {
      localStorage.setItem('pastelhub-lang', l);
    } catch (e) { console.warn('Failed to persist language preference:', e); }
  }, []);

  const t = useCallback((key, fallback) => {
    return translate(key, lang, fallback);
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
