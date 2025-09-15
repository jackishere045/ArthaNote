// Header.jsx - Tambahkan fixed positioning
import React from "react";
import { Menu, Plus, LogOut } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { logout } from "../../firebase/auth";

const Header = ({ sidebarOpen, setSidebarOpen, openAddTransaction }) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err.message);
    }
  };

  return (
    <header 
      className={`fixed top-0 right-0 left-0 lg:left-64 z-30 px-4 py-3 border-b transition-all duration-300 ${
        isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
      }`}
      style={{ height: '64px' }}
    >
      <div className="flex items-center justify-between h-full max-w-full overflow-hidden">
        {/* Left: Sidebar toggle + Title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white lg:hidden">ArthaNote</h2>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-4">
          <button
            onClick={openAddTransaction}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("addTransaction")}</span>
          </button>

          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;