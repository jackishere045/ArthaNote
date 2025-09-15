import React, { useState, useEffect } from "react";
import {
  UtensilsCrossed,
  CarFront,
  ShoppingCart,
  House,
  Cross,
  GraduationCap,
  Lightbulb,
  Briefcase,
  Gift,
  Laptop,
  Activity,
  Handshake,
  Gem,
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  PiggyBank, // Added for savings icon
} from "lucide-react";
import { getUserTransactions, deleteTransaction } from "../../firebase/transactions";
import AddTransaction from "./AddTransactions";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatCategoryName } from "../../utils/categories";

const TransactionList = ({ refreshTrigger }) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const [filterType, setFilterType] = useState("all");
  const [timeRange, setTimeRange] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, [refreshTrigger]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await getUserTransactions();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError(t("failedToLoadTransactions") || "Gagal memuat transaksi");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (transactionId) => {
    if (window.confirm(t("confirmDeleteTransaction") || "Apakah Anda yakin ingin menghapus transaksi ini?")) {
      try {
        await deleteTransaction(transactionId);
        setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
        alert(t("transactionDeleted") || "Transaksi berhasil dihapus");
        window.dispatchEvent(new CustomEvent("accountBalanceChanged"));
      } catch (error) {
        console.error("Error deleting transaction:", error);
        alert(t("transactionDeleteFailed") || "Gagal menghapus transaksi");
      }
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Helper function to check if transaction is savings-related
  const isSavingsTransaction = (category) => {
    return category === 'savings_deposit' || category === 'savings_withdraw' || 
           category?.includes('Setoran Tabungan') || category?.includes('Penarikan Tabungan');
  };

  const getCategoryIcon = (category, type) => {
    const size = "w-5 h-5";
    
    // Check if it's a savings transaction for blue color
    const isSavings = isSavingsTransaction(category);
    
    const iconClass = isSavings 
      ? "text-blue-600 dark:text-blue-400" // Blue for savings
      : type === "income" 
        ? "text-green-600 dark:text-green-400" 
        : "text-red-600 dark:text-red-400";

    // Updated icon mapping using consistent keys
    const iconMap = {
      // Savings categories (always show piggy bank icon)
      "savings_deposit": <PiggyBank className={`${size} ${iconClass}`} />,
      "savings_withdraw": <PiggyBank className={`${size} ${iconClass}`} />,
      
      // Expense categories
      "food": <UtensilsCrossed className={`${size} ${iconClass}`} />,
      "transport": <CarFront className={`${size} ${iconClass}`} />,
      "shopping": <ShoppingCart className={`${size} ${iconClass}`} />,
      "entertainment": <House className={`${size} ${iconClass}`} />,
      "health": <Cross className={`${size} ${iconClass}`} />,
      "education": <GraduationCap className={`${size} ${iconClass}`} />,
      "utilities": <Lightbulb className={`${size} ${iconClass}`} />,
      "investment": <Activity className={`${size} ${iconClass}`} />,
      "business": <Handshake className={`${size} ${iconClass}`} />,
      "gift": <Gem className={`${size} ${iconClass}`} />,
      
      // Income categories
      "salary": <Briefcase className={`${size} ${iconClass}`} />,
      "bonus": <Gift className={`${size} ${iconClass}`} />,
      "freelance": <Laptop className={`${size} ${iconClass}`} />,
      
      // Legacy translations (fallback for existing data)
      [t("food") || "Makanan"]: <UtensilsCrossed className={`${size} ${iconClass}`} />,
      [t("transport") || "Transportasi"]: <CarFront className={`${size} ${iconClass}`} />,
      [t("shopping") || "Belanja"]: <ShoppingCart className={`${size} ${iconClass}`} />,
      [t("entertainment") || "Hiburan"]: <House className={`${size} ${iconClass}`} />,
      [t("health") || "Kesehatan"]: <Cross className={`${size} ${iconClass}`} />,
      [t("education") || "Pendidikan"]: <GraduationCap className={`${size} ${iconClass}`} />,
      [t("utilities") || "Utilitas"]: <Lightbulb className={`${size} ${iconClass}`} />,
      [t("salary") || "Gaji"]: <Briefcase className={`${size} ${iconClass}`} />,
      [t("bonus") || "Bonus"]: <Gift className={`${size} ${iconClass}`} />,
      [t("freelance") || "Freelance"]: <Laptop className={`${size} ${iconClass}`} />,
      [t("investment") || "Investasi"]: <Activity className={`${size} ${iconClass}`} />,
      [t("business") || "Bisnis"]: <Handshake className={`${size} ${iconClass}`} />,
      [t("gift") || "Hadiah"]: <Gem className={`${size} ${iconClass}`} />,
    };

    // Check for savings transactions by category name (for legacy support)
    if (isSavings || category?.includes('Setoran') || category?.includes('Penarikan')) {
      return <PiggyBank className={`${size} text-blue-600 dark:text-blue-400`} />;
    }

    return (
      iconMap[category] ||
      (type === "income" ? <ArrowDownCircle className={`${size} ${iconClass}`} /> : <ArrowUpCircle className={`${size} ${iconClass}`} />)
    );
  };

  // Data untuk bulan dan tahun
  const months = [
    { value: "01", label: t("january") || "Januari" },
    { value: "02", label: t("february") || "Februari" },
    { value: "03", label: t("march") || "Maret" },
    { value: "04", label: t("april") || "April" },
    { value: "05", label: t("may") || "Mei" },
    { value: "06", label: t("june") || "Juni" },
    { value: "07", label: t("july") || "Juli" },
    { value: "08", label: t("august") || "Agustus" },
    { value: "09", label: t("september") || "September" },
    { value: "10", label: t("october") || "Oktober" },
    { value: "11", label: t("november") || "November" },
    { value: "12", label: t("december") || "Desember" }
  ];

  // Generate years (current year and past 10 years)
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= currentYear - 10; year--) {
    years.push(year);
  }

  const handleTimeRangeChange = (value) => {
  setTimeRange(value);

  // reset sesuai pilihan
  if (value === "specificMonth") {
    setSelectedMonth("");
    setSelectedYear("");
  } else if (value === "specificYear") {
    setSelectedYear("");
  } else if (value === "customRange") {
    setCustomStartDate("");
    setCustomEndDate("");
  }
};


  const applyFilters = () => {
    let filtered = [...transactions];
    
    // Filter by transaction type
    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    // Filter by time range
    if (timeRange !== "all") {
      const now = new Date();
      filtered = filtered.filter((t) => {
        const date = t.date?.toDate ? t.date.toDate() : new Date(t.date);
        
        if (timeRange === "day") {
          return (
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        }
        
        if (timeRange === "week") {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          return date >= oneWeekAgo && date <= now;
        }
        
        if (timeRange === "month") {
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }

        if (timeRange === "specificMonth" && selectedMonth && selectedYear) {
          return (
            date.getMonth() === parseInt(selectedMonth) - 1 && 
            date.getFullYear() === parseInt(selectedYear)
          );
        }

        if (timeRange === "specificYear" && selectedYear) {
          if (selectedYear !== "all") {
            return date.getFullYear() === parseInt(selectedYear);
          }
          return true; // kalau "all" → semua tahun lolos
        }


        if (timeRange === "customRange" && customStartDate && customEndDate) {
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999); // Include the entire end date
          return date >= startDate && date <= endDate;
        }

        return true;
      });
    }
    
    return filtered;
  };

  const filteredTransactions = applyFilters();

  return (
    <div className="transaction-list p-6 rounded-lg shadow-sm border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        {t("transactions") || "Transaksi"}
      </h3>

      {/* Filter Controls */}
      <div className="filters flex flex-col gap-3 mb-4">
        {/* First Row - Transaction Type and Time Range */}
        <div className="flex flex-row gap-3">
          <div className="flex flex-col flex-1">
            <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              {t("transactionType") || "Jenis Transaksi"}
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-full text-sm transition-colors duration-200"
            >
              <option value="all">{t("all") || "Semua"}</option>
              <option value="income">{t("income") || "Pemasukan"}</option>
              <option value="expense">{t("expense") || "Pengeluaran"}</option>
            </select>
          </div>

          <div className="flex flex-col flex-1">
            <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              {t("timeRange") || "Rentang Waktu"}
            </label>
            <select
              value={timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-full text-sm transition-colors duration-200"
            >
              <option value="all">{t("allTime") || "Semua Waktu"}</option>
              <option value="day">{t("today") || "Hari Ini"}</option>
              <option value="week">{t("week") || "1 Minggu"}</option>
              <option value="month">{t("month") || "1 Bulan"}</option>
              <option value="specificMonth">{t("specificMonth") || "Bulan Tertentu"}</option>
              <option value="specificYear">{t("specificYear") || "Tahun Tertentu"}</option>
              <option value="customRange">{t("customRange") || "Rentang Khusus"}</option>
            </select>
          </div>
        </div>

        {/* Month and Year Selectors - Show when specificMonth is selected */}
        {timeRange === "specificMonth" && (
          <div className="flex flex-row gap-3">
            <div className="flex flex-col flex-1">
              <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                {t("selectMonth") || "Pilih Bulan"}
              </label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-full text-sm transition-colors duration-200"
              >
                <option value="">{t("selectMonthPlaceholder") || "Pilih Bulan..."}</option>
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col flex-1">
              <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                {t("selectYear") || "Pilih Tahun"}
              </label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-full text-sm transition-colors duration-200"
              >
                <option value="">{t("selectYearPlaceholder") || "Pilih Tahun..."}</option>
                <option value="all">{t("allYears") || "Semua Tahun"}</option>
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

            </div>
          </div>
        )}

        {/* Year Selector - Show when specificYear is selected */}
        {timeRange === "specificYear" && (
          <div className="flex flex-row gap-3">
            <div className="flex flex-col flex-1">
              <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                {t("selectYear") || "Pilih Tahun"}
              </label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-full text-sm transition-colors duration-200"
              >
                <option value="">{t("selectYearPlaceholder") || "Pilih Tahun..."}</option>
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1"></div> {/* Empty space for alignment */}
          </div>
        )}

        {/* Custom Date Range - Show when customRange is selected */}
        {timeRange === "customRange" && (
          <div className="flex flex-row gap-3">
            <div className="flex flex-col flex-1">
              <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                {t("startDate") || "Tanggal Mulai"}
              </label>
              <input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-full text-sm transition-colors duration-200"
              />
            </div>
            <div className="flex flex-col flex-1">
              <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                {t("endDate") || "Tanggal Selesai"}
              </label>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-full text-sm transition-colors duration-200"
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="mb-4 px-4 py-2 rounded bg-blue-500 dark:bg-blue-700 text-white hover:bg-blue-600 dark:hover:bg-blue-600 transition-colors duration-200"
      >
        {t("addTransaction") || "Tambah Transaksi"}
      </button>

      {showAdd && (
        <AddTransaction
          onClose={() => setShowAdd(false)}
          onTransactionAdded={() => {
            fetchTransactions();
            setShowAdd(false);
            window.dispatchEvent(new CustomEvent("accountBalanceChanged"));
          }}
        />
      )}

      {/* Loading / Error / Empty */}
      {loading ? (
        <div className="transaction-list-loading text-gray-500 dark:text-gray-300">
          <div className="loading-spinner"></div>
          <p>{t("loadingTransactions") || "Memuat transaksi..."}</p>
        </div>
      ) : error ? (
        <div className="transaction-list-error">
          <p>{error}</p>
          <button className="retry-btn">{t("retry") || "Coba Lagi"}</button>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="empty-state text-gray-500 dark:text-gray-300">
          <h4 className="text-gray-900 dark:text-white">{t("noTransactions") || "Belum ada transaksi"}</h4>
          <p>{t("addFirstTransaction") || "Tambah transaksi pertama Anda"}</p>
        </div>
      ) : (
        <div className="transaction-items space-y-3">
          {filteredTransactions.map((transaction) => {
            const isSavings = isSavingsTransaction(transaction.category);
            
            return (
              <div
                key={transaction.id}
                className="transaction-item flex items-center justify-between p-4 rounded-lg shadow-sm border bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`transaction-icon p-2 rounded-full ${
                      isSavings
                        ? "bg-blue-100 dark:bg-blue-900/20" // Blue background for savings
                        : transaction.type === "income"
                        ? "bg-green-100 dark:bg-green-900/20"
                        : "bg-red-100 dark:bg-red-900/20"
                    }`}
                  >
                    {getCategoryIcon(transaction.category, transaction.type)}
                  </div>

                  <div className="transaction-details">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCategoryName(transaction.category, transaction.type, t) || transaction.category}
                      </span>
                      <span
                        className={`font-semibold ml-4 ${
                          isSavings
                            ? "text-blue-600 dark:text-blue-400" // Blue for savings
                            : transaction.type === "income"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {transaction.type === "expense" && !isSavings ? "-" : "+"}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-300 mt-1">
                      <span>{formatDate(transaction.date)}</span>
                      <span>•</span>
                      <span>
                        {transaction.accountName ||
                          (transaction.account === "cash"
                            ? t("cash") || "Tunai"
                            : transaction.account === "bank"
                            ? t("bank") || "Bank"
                            : transaction.account || "-")}
                      </span>
                    </div>

                    {transaction.note && (
                      <div className="text-sm text-gray-400 dark:text-gray-300 mt-1">
                        {transaction.note}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  className="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleDelete(transaction.id)}
                  title={t("deleteTransaction") || "Hapus transaksi"}
                >
                  <Trash2 className="w-5 h-5 text-gray-500 hover:text-red-600 dark:hover:text-red-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransactionList;