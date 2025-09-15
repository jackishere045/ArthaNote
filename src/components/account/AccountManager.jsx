import React, { useState, useEffect } from "react";
import {
  Wallet,
  Landmark,
  Smartphone,
  CreditCard,
  Trash2,
  Pencil,
  FolderOpen,
  Plus,
} from "lucide-react";
import { getUserAccounts, deleteAccount } from "../../firebase/accounts";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import AddAccountModal from "./AddAccountModal";
import { translations } from "../../i18n/translations";

const AccountManager = () => {
  const { isDark } = useTheme();
  const { language } = useLanguage();
  const t = (key) => translations[language][key] || key;

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await getUserAccounts();
      setAccounts(data);
    } catch (err) {
      console.error(err);
      setError(t("failedToLoadAccounts") || "Gagal memuat akun.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    const handler = () => fetchAccounts();
    window.addEventListener("accountBalanceChanged", handler);
    return () => window.removeEventListener("accountBalanceChanged", handler);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm(t("confirmDeleteAccount") || "Yakin mau hapus akun ini?")) return;
    try {
      await deleteAccount(id);
      fetchAccounts();
    } catch (err) {
      console.error(err);
      alert(t("failedToDeleteAccount") || "Gagal menghapus akun.");
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setShowModal(true);
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat(language === "id" ? "id-ID" : "en-US", { style: "currency", currency: "IDR" }).format(amount);

  const getAccountIcon = (type) => {
    const props = { className: "w-6 h-6" };
    switch (type) {
      case "cash":
        return <Wallet {...props} />;
      case "bank":
        return <Landmark {...props} />;
      case "eWallet":
        return <Smartphone {...props} />;
      case "credit":
        return <CreditCard {...props} />;
      default:
        return <Wallet {...props} />;
    }
  };

  const getAccountIconBg = (type) => {
    if (isDark) {
      switch (type) {
        case "cash":
          return "bg-green-900/30 text-green-400";
        case "bank":
          return "bg-blue-900/30 text-blue-400";
        case "eWallet":
          return "bg-yellow-900/30 text-yellow-400";
        case "credit":
          return "bg-pink-900/30 text-pink-400";
        default:
          return "bg-gray-700 text-gray-300";
      }
    } else {
      switch (type) {
        case "cash":
          return "bg-green-100 text-green-600";
        case "bank":
          return "bg-blue-100 text-blue-600";
        case "eWallet":
          return "bg-yellow-100 text-yellow-600";
        case "credit":
          return "bg-pink-100 text-pink-600";
        default:
          return "bg-gray-100 text-gray-600";
      }
    }
  };

  const getAccountTypeLabel = (type) => {
    switch (type) {
      case "cash":
        return t("cash");
      case "bank":
        return t("bank");
      case "eWallet":
        return t("eWallet");
      case "credit":
        return t("creditCard");
      default:
        return type;
    }
  };

  return (
    <div className={`min-h-screen px-4 sm:px-6 py-6 bg-gray-50 dark:bg-gray-900`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className={`p-6 rounded-xl shadow-sm ${isDark ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h2 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                {t("accounts")}
              </h2>
              <p className={`text-lg ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                {t("totalBalance")}:{" "}
                <span className={`ml-2 text-xl font-bold ${isDark ? "text-green-400" : "text-green-600"}`}>
                  {formatCurrency(accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0))}
                </span>
              </p>
            </div>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all hover:transform hover:-translate-y-1 shadow-lg"
              onClick={() => {
                setEditingAccount(null);
                setShowModal(true);
              }}
            >
              <Plus className="w-4 h-4" /> {t("addAccount")}
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className={isDark ? "text-gray-300" : "text-gray-600"}>{t("loadingAccounts") || "Memuat akun..."}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className={isDark ? "text-red-400" : "text-red-600"}>{error}</p>
            <button
              onClick={fetchAccounts}
              className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t("retry") || "Coba Lagi"}
            </button>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-gray-400" : "text-gray-400"}`} />
            <h3 className={`text-2xl font-semibold mb-2 ${isDark ? "text-white" : "text-gray-800"}`}>
              {t("noAccounts") || "Belum ada akun"}
            </h3>
            <p className={`mb-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              {t("addFirstAccount") || "Tambahkan akun pertama Anda untuk mulai mengatur keuangan."}
            </p>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all hover:transform hover:-translate-y-1 mx-auto"
              onClick={() => setShowModal(true)}
            >
              <Plus className="w-4 h-4" /> {t("addFirstAccountButton") || "Tambah Akun Pertama"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className={`rounded-xl shadow-lg hover:shadow-xl transition-all hover:transform hover:-translate-y-1 overflow-hidden border-l-4 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-blue-500"}`}
                style={{ borderLeftColor: account.color || "#3b82f6" }}
              >
                <div className={`flex justify-between items-center p-5 border-b ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getAccountIconBg(account.type)}`}>
                    {getAccountIcon(account.type)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isDark ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
                      onClick={() => handleEdit(account)}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isDark ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                      onClick={() => handleDelete(account.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className={`text-xl font-semibold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                    {account.name}
                  </h3>
                  <p className={`text-sm uppercase tracking-wide mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {getAccountTypeLabel(account.type)}
                  </p>

                  {account.accountNumber && (
                    <p className={`text-sm font-mono mb-4 px-3 py-2 rounded-lg ${isDark ? "text-gray-300 bg-gray-900 border border-gray-700" : "text-gray-600 bg-gray-50"}`}>
                      {account.accountNumber}
                    </p>
                  )}

                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {account.type === "credit" ? t("creditLimit") || "Limit Kredit" : t("currentBalance") || "Saldo Saat Ini"}
                    </span>
                    <span className={`text-lg font-bold ${isDark ? "text-green-400" : "text-green-600"}`}>
                      {formatCurrency(account.balance || 0)}
                    </span>
                  </div>

                  {account.description && (
                    <p className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {account.description}
                    </p>
                  )}
                </div>

                <div className={`px-5 py-3 border-t ${isDark ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                  <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    {t("lastUpdated")}: {account.updatedAt ? new Date(account.updatedAt.seconds * 1000).toLocaleString(language === "id" ? "id-ID" : "en-US") : "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <AddAccountModal
            account={editingAccount}
            isEditing={!!editingAccount}
            onClose={() => setShowModal(false)}
            onAccountAdded={fetchAccounts}
          />
        )}
      </div>
    </div>
  );
};

export default AccountManager;
