import { memo, useCallback } from "react";
import { useTranslation } from "../../i18n/config.js";

/**
 * LanguageToggle
 *
 * A compact two-button pill that lets the collector switch between English
 * and Hindi. Lives in the CollectorNavbar so it's always accessible.
 *
 * Uses i18n.changeLanguage() — the config.js listener persists the choice
 * to localStorage so it survives page refreshes.
 */
const LanguageToggle = memo(() => {
  const { i18n, t } = useTranslation();
  const current = i18n.language;

  const switchTo = useCallback(
    (lang) => {
      if (lang !== current) i18n.changeLanguage(lang);
    },
    [i18n, current]
  );

  return (
    <div
      className="flex items-center rounded-full border border-white/30 overflow-hidden text-xs font-semibold"
      role="group"
      aria-label={t("language.toggle")}
    >
      <button
        onClick={() => switchTo("en")}
        aria-pressed={current === "en"}
        className={`px-2.5 py-1 transition-colors ${
          current === "en"
            ? "bg-white text-green-700"
            : "bg-transparent text-white/80 hover:text-white"
        }`}
      >
        {t("language.en")}
      </button>

      {/* Divider */}
      <span className="w-px h-4 bg-white/30" aria-hidden="true" />

      <button
        onClick={() => switchTo("hi")}
        aria-pressed={current === "hi"}
        className={`px-2.5 py-1 transition-colors ${
          current === "hi"
            ? "bg-white text-green-700"
            : "bg-transparent text-white/80 hover:text-white"
        }`}
      >
        {t("language.hi")}
      </button>
    </div>
  );
});

LanguageToggle.displayName = "LanguageToggle";
export default LanguageToggle;
