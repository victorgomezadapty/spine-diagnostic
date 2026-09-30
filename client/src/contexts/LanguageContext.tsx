import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type Language, type Translations, getTranslation, translations } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const defaultLanguage: Language = "es";
const defaultTranslations = translations.es as Translations;

const LanguageContext = createContext<LanguageContextType>({
  language: defaultLanguage,
  setLanguage: () => {},
  t: defaultTranslations,
});

function getSavedLanguage(): Language {
  try {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("language");
      if (saved === "es" || saved === "en") {
        return saved;
      }
      if (typeof navigator !== "undefined" && navigator.language) {
        const browserLang = navigator.language.slice(0, 2);
        return browserLang === "es" ? "es" : "en";
      }
    }
  } catch (error) {
    console.warn("Failed to get saved language, using default:", error);
  }
  return defaultLanguage;
}

function saveLanguage(lang: Language): void {
  try {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.setItem("language", lang);
    }
  } catch (error) {
    console.warn("Failed to save language preference:", error);
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedLang = getSavedLanguage();
    setLanguageState(savedLang);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      try {
        document.documentElement.lang = language;
      } catch (error) {
        console.warn("Failed to set document language:", error);
      }
    }
  }, [language, isHydrated]);

  const setLanguage = (lang: Language) => {
    if (lang !== "es" && lang !== "en") {
      console.warn("Invalid language, using default:", lang);
      lang = defaultLanguage;
    }
    setLanguageState(lang);
    saveLanguage(lang);
  };

  let t: Translations;
  try {
    t = getTranslation(language);
  } catch (error) {
    console.error("Failed to get translation, using default:", error);
    t = defaultTranslations;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return context;
}
