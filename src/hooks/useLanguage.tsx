import { createContext, useContext, useState, ReactNode } from "react";
import { Language, TEXT } from "@/lib/i18n";

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: Record<string, string>;
  dir: "rtl" | "ltr";
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language | null>(null);

  if (!lang) {
    return <LanguageContext.Provider value={{ lang: "ar", setLang, t: TEXT.ar, dir: "rtl" }}>{children}</LanguageContext.Provider>;
  }

  const t = TEXT[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be inside LanguageProvider");
  return ctx;
};
