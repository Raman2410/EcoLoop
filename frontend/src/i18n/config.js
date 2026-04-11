/**
 * Zero-dependency i18n system — no npm packages required.
 *
 * Replaces react-i18next / i18next entirely.
 * API is identical to what components already use:
 *   const { t, i18n } = useTranslation()
 *   t("dashboard.title")
 *   t("assigned.toastVerified", { coins: 10 })
 *   i18n.changeLanguage("hi")
 *   i18n.language  → "en" | "hi"
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import en from "./en.json";
import hi from "./hi.json";

const TRANSLATIONS = { en, hi };
const STORAGE_KEY  = "ecoloop_language";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve a dot-notation key like "assigned.toastVerified"
 * from a nested translations object.
 */
function resolve(obj, key) {
  return key.split(".").reduce((cur, part) => {
    if (cur && typeof cur === "object") return cur[part];
    return undefined;
  }, obj);
}

/**
 * Replace {{variable}} placeholders with values from the params object.
 * e.g. interpolate("Earn {{remaining}} coins", { remaining: 5 }) → "Earn 5 coins"
 */
function interpolate(str, params) {
  if (!params || typeof str !== "string") return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    params[key] !== undefined ? params[key] : `{{${key}}}`
  );
}

// ── Context ───────────────────────────────────────────────────────────────────

export const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(
    () => localStorage.getItem(STORAGE_KEY) || "en"
  );

  const changeLanguage = useCallback((lang) => {
    if (TRANSLATIONS[lang]) {
      setLanguage(lang);
      localStorage.setItem(STORAGE_KEY, lang);
    }
  }, []);

  /**
   * t("some.nested.key")
   * t("some.key", { name: "Raj" })   — interpolates {{name}}
   */
  const t = useCallback((key, params) => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    const fallback = TRANSLATIONS.en;
    const value = resolve(dict, key) ?? resolve(fallback, key) ?? key;
    return interpolate(value, params);
  }, [language]);

  const value = useMemo(() => ({
    t,
    i18n: { language, changeLanguage },
  }), [t, language, changeLanguage]);

  return React.createElement(I18nContext.Provider, { value }, children);
}

/**
 * Drop-in replacement for react-i18next's useTranslation()
 * Returns { t, i18n } — same shape components already use.
 */
export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used inside <I18nProvider>");
  return ctx;
}
