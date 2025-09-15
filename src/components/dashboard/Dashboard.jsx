import React, { useEffect, useState } from "react";
import { CreditCard, TrendingUp, Wallet, PiggyBank } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { getUserAccounts } from "../../firebase/accounts";
import { getUserTransactions } from "../../firebase/transactions";
import { formatCategoryName } from "../../utils/categories";

const Dashboard = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const acc = await getUserAccounts();
        setAccounts(acc);

        const trx = await getUserTransactions(100);
        setTransactions(trx);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const handler = () => fetchData();
    window.addEventListener("accountBalanceChanged", handler);
    return () => window.removeEventListener("accountBalanceChanged", handler);
  }, []);

  const totalBalance = accounts.reduce(
    (sum, account) => sum + (account.balance || 0),
    0
  );

  // Filter transaksi bulan ini
  const now = new Date();
  const monthlyTransactions = transactions.filter((t) => {
    const date = t.date?.toDate ? t.date.toDate() : new Date(t.date);
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });

  const monthlyIncome = monthlyTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const monthlyExpense = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  // Helper function to check if transaction is savings-related
  const isSavingsTransaction = (category) => {
    return category === 'savings_deposit' || category === 'savings_withdraw' || 
           category?.includes('Setoran Tabungan') || category?.includes('Penarikan Tabungan');
  };

  // Filter untuk tampilan transaksi
  const filteredTransactions =
    filterType === "all"
      ? transactions
      : transactions.filter((t) => t.type === filterType);

  return (
    <div
      className={`min-h-screen px-4 sm:px-6 py-6 ${
        isDark ? "bg-gray-900" : "bg-gray-50"
      } overflow-x-auto`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ===== Stats Cards ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Total Balance */}
          <div
            className={`p-4 sm:p-6 rounded-lg shadow-sm ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {t("totalBalance")}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">
                  {formatCurrency(totalBalance)}
                </p>
              </div>
              <div className="flex-shrink-0 ml-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Income */}
          <div
            className={`p-4 sm:p-6 rounded-lg shadow-sm ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {t("monthlyIncome")}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 break-words">
                  {formatCurrency(monthlyIncome)}
                </p>
              </div>
              <div className="flex-shrink-0 ml-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Expense */}
          <div
            className={`p-4 sm:p-6 rounded-lg shadow-sm ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {t("monthlyExpense")}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 break-words">
                  {formatCurrency(monthlyExpense)}
                </p>
              </div>
              <div className="flex-shrink-0 ml-3">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <CreditCard className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Recent Transactions ===== */}
        <div
          className={`w-full p-4 sm:p-6 rounded-lg shadow-sm ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("recentTransactions")}
          </h3>

          {/* Filter Transaksi */}
          <div className="flex flex-wrap gap-2 mb-4 w-full">
            {["all", "income", "expense"].map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterType === f
                    ? f === "income"
                      ? "bg-green-600 text-white"
                      : f === "expense"
                      ? "bg-red-600 text-white"
                      : "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {f === "all" ? t("all") : f === "income" ? t("income") : t("expense")}
              </button>
            ))}
          </div>

          <div className="space-y-3 w-full">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                {t("noTransactions")}
              </p>
            ) : (
              filteredTransactions.slice(0, 5).map((transaction) => {
                const date = transaction.date?.toDate
                  ? transaction.date.toDate()
                  : new Date(transaction.date);
                const isSavings = isSavingsTransaction(transaction.category);
                
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center flex-1 min-w-0 mr-3">
                      <div
                        className={`flex-shrink-0 p-2 rounded-full mr-3 ${
                          isSavings
                            ? "bg-blue-100 dark:bg-blue-900/20"
                            : transaction.type === "income"
                            ? "bg-green-100 dark:bg-green-900/20"
                            : "bg-red-100 dark:bg-red-900/20"
                        }`}
                      >
                        {isSavings ? (
                          <PiggyBank
                            className="h-4 w-4 text-blue-600 dark:text-blue-400"
                          />
                        ) : (
                          <CreditCard
                            className={`h-4 w-4 ${
                              transaction.type === "income"
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {formatCategoryName(transaction.category, transaction.type, t)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {transaction.accountName || transaction.account}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p
                        className={`font-semibold text-sm ${
                          isSavings
                            ? "text-blue-600 dark:text-blue-400"
                            : transaction.type === "income"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {transaction.type === "expense" && !isSavings ? "-" : "+"}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {date.toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;