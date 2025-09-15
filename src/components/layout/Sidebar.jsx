// Sidebar.jsx - Pastikan fixed positioning benar
import React from "react";
import {
  Home,
  CreditCard,
  PieChart,
  TrendingUp,
  Settings,
  DollarSign,
  Wallet,
  User,
  X,
  PiggyBank,
  Target,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";

const Sidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  const menuItems = [
    { id: "dashboard", label: t("dashboard"), icon: Home },
    { id: "transactions", label: t("transactions"), icon: CreditCard },
    { id: "accounts", label: t("accounts"), icon: Wallet },
    { id: "budget", label: t("budget"), icon: PieChart },
    { id: "savings", label: t("savings"), icon: PiggyBank },
    // { id: "goals", label: t("goals"), icon: Target },
    { id: "reports", label: t("reports"), icon: TrendingUp },
    { id: "settings", label: t("settings"), icon: Settings },
  ];

  return (
    <>
      {/* Overlay untuk mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar utama */}
      <aside
        className={`
          fixed top-0 left-0 w-64 h-screen z-50 transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:z-30
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}
          border-r shadow-lg flex flex-col
        `}
      >
        {/* Header - Fixed height */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0" style={{ height: '80px' }}>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">ArthaNote</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Menu scrollable - Flex grow untuk mengisi ruang */}
        <nav className="flex-1 overflow-y-auto py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors
                  ${
                    activeTab === item.id
                      ? "bg-blue-50 border-r-2 border-blue-600 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User info - Fixed di bawah */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-3 text-gray-700 dark:text-gray-300">
          <User className="h-5 w-5" />
          <span className="text-sm truncate">{user?.displayName || user?.email || "Guest"}</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
