import React, { useState } from "react";
import { Sun, Moon, Globe, DollarSign } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";

const SettingsComponent = () => {
  const { isDark, toggleTheme } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  const [currency, setCurrency] = useState("IDR");

  return (
    <div className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden p-4 lg:p-6">
      <div
        className={`w-full p-6 rounded-lg shadow-sm ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {t("settings")}
        </h3>

        <div className="space-y-6">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <span className="text-gray-900 dark:text-white">
                {t("darkMode")}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDark ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDark ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Language Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Globe className="h-5 w-5" />
              <span className="text-gray-900 dark:text-white">{t("language")}</span>
            </div>
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className={`px-3 py-1 rounded border ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Currency Selector */}
          {/* <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5" />
              <span className="text-gray-900 dark:text-white">{t("currency")}</span>
            </div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={`px-3 py-1 rounded border ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="IDR">IDR (Rp)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default SettingsComponent;
