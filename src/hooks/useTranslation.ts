import { useSettings } from '../contexts/SettingsContext';
import { translations } from '../translations';

export const useTranslation = () => {
  const { settings } = useSettings();
  const currentLanguage = settings.language;

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[currentLanguage];
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        // Fallback to Hungarian if translation not found
        value = translations.hu;
        for (const k of keys) {
          value = value?.[k];
          if (value === undefined) {
            return key; // Return the key if no translation found
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return { t, language: currentLanguage };
};