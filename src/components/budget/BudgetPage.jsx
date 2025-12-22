// src/components/budget/BudgetPage.jsx
import React, { useState, useEffect } from 'react';
import { Plus, PieChart, TrendingUp, AlertTriangle, DollarSign, Edit2, Trash2 } from 'lucide-react';
import { getUserBudgets, deleteBudget } from '../../firebase/budget';
import { getUserTransactions } from '../../firebase/transactions';
import { getUserCategories } from '../../firebase/categories';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCategoryName } from '../../utils/categories';
import BudgetModal from './BudgetModal';
import toast, { Toaster } from 'react-hot-toast';

const BudgetPage = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [userCategories, setUserCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [budgetsData, transactionsData, categoriesData] = await Promise.all([
        getUserBudgets(),
        getUserTransactions(1000), // Get more transactions for accurate calculation
        getUserCategories()
      ]);

      setBudgets(budgetsData);
      setTransactions(transactionsData);
      setUserCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(t('failedToLoadData') || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const getPeriodLabel = (period) => {
    const periodMap = {
      'daily': t('daily') || 'Harian',
      'weekly': t('weekly') || 'Mingguan',
      'monthly': t('monthly') || 'Bulanan',
      'yearly': t('yearly') || 'Tahunan'
    };
    return periodMap[period] || period;
  };

  const calculateSpentAmount = (category, budget) => {
    if (!budget.periodStart || !budget.periodEnd) return 0;
    
    const periodStart = budget.periodStart.toDate ? budget.periodStart.toDate() : new Date(budget.periodStart);
    const periodEnd = budget.periodEnd.toDate ? budget.periodEnd.toDate() : new Date(budget.periodEnd);
    
    const filteredTransactions = transactions.filter(transaction => {
      if (transaction.type !== 'expense' || transaction.category !== category) {
        return false;
      }

      const transactionDate = transaction.date?.toDate ? transaction.date.toDate() : new Date(transaction.date);
      
      // Cek apakah transaksi dalam range periode budget
      return transactionDate >= periodStart && transactionDate <= periodEnd;
    });

    return filteredTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  };

  // Calculate budget summary
  const getBudgetSummary = () => {
    const totalAllocated = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = budgets.reduce((sum, budget) => {
      return sum + calculateSpentAmount(budget.category, budget.period);
    }, 0);
    
    const overBudgetCount = budgets.filter(budget => {
      const spent = calculateSpentAmount(budget.category, budget.period);
      return spent > budget.amount;
    }).length;

    const nearLimitCount = budgets.filter(budget => {
      const spent = calculateSpentAmount(budget.category, budget.period);
      const percentage = (spent / budget.amount) * 100;
      return percentage > 80 && percentage <= 100;
    }).length;

    return {
      totalAllocated,
      totalSpent,
      totalRemaining: totalAllocated - totalSpent,
      overBudgetCount,
      nearLimitCount,
      budgetCount: budgets.length
    };
  };

  const handleAdd = () => {
    setEditBudget(null);
    setShowModal(true);
  };

  const handleEdit = (budget) => {
    setEditBudget(budget);
    setShowModal(true);
  };

  const handleDelete = async (budgetId) => {
    if (window.confirm(t('confirmDeleteBudget') || 'Apakah Anda yakin ingin menghapus budget ini?')) {
      try {
        await deleteBudget(budgetId);
        setBudgets(budgets.filter(budget => budget.id !== budgetId));
        toast.success(t('budgetDeleted') || 'Budget berhasil dihapus');
      } catch (error) {
        console.error('Error deleting budget:', error);
        toast.error(t('failedToDeleteBudget') || 'Gagal menghapus budget');
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditBudget(null);
  };

  const handleBudgetSaved = () => {
    loadData(); // Reload all data
  };

  const summary = getBudgetSummary();

  // Budget Card Component (inline)
  const BudgetCard = ({ budget, spent, userCategories, onEdit, onDelete }) => {
    const isOverBudget = spent > budget.amount;
    const remainingBudget = budget.amount - spent;
    const progressPercentage = budget.amount === 0 ? 0 : Math.min((spent / budget.amount) * 100, 100);

    const getProgressColor = () => {
      if (isOverBudget) return 'bg-red-500';
      if (progressPercentage > 80) return 'bg-yellow-500';
      if (progressPercentage > 60) return 'bg-orange-500';
      return 'bg-green-500';
    };

    const getProgressBgColor = () => {
      if (isDark) {
        if (isOverBudget) return 'bg-red-900/20';
        if (progressPercentage > 80) return 'bg-yellow-900/20';
        if (progressPercentage > 60) return 'bg-orange-900/20';
        return 'bg-green-900/20';
      } else {
        if (isOverBudget) return 'bg-red-100';
        if (progressPercentage > 80) return 'bg-yellow-100';
        if (progressPercentage > 60) return 'bg-orange-100';
        return 'bg-green-100';
      }
    };

    const categoryDisplayName = formatCategoryName(
      budget.category, 
      'expense', 
      t, 
      userCategories
    );

    return (
      <div className={`p-5 rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md ${
        isDark 
          ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold text-lg ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {categoryDisplayName}
              </h3>
              
              {isOverBudget && (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
            </div>
            
            <span className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {getPeriodLabel(budget.period)}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => onEdit(budget)}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
              title={t('editBudget') || 'Edit Budget'}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => onDelete(budget.id)}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-red-600'
              }`}
              title={t('deleteBudget') || 'Delete Budget'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Budget amounts */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {t('budgetAllocated') || 'Budget Dialokasikan'}
            </span>
            <span className={`font-medium ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {formatCurrency(budget.amount)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {t('spent') || 'Terpakai'}
            </span>
            <span className={`font-medium ${
              isOverBudget 
                ? 'text-red-500' 
                : isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {formatCurrency(spent)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {isOverBudget 
                ? (t('overBudget') || 'Over Budget') 
                : (t('remaining') || 'Sisa')
              }
            </span>
            <span className={`font-medium ${
              isOverBudget 
                ? 'text-red-500' 
                : remainingBudget < (budget.amount * 0.2)
                  ? 'text-yellow-500'
                  : 'text-green-500'
            }`}>
              {isOverBudget 
                ? `-${formatCurrency(Math.abs(remainingBudget))}` 
                : formatCurrency(remainingBudget)
              }
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {t('budgetProgress') || 'Progress Budget'}
            </span>
            <span className={`text-sm font-medium ${
              isOverBudget ? 'text-red-500' : 'text-blue-600'
            }`}>
              {Math.round((spent / budget.amount) * 100)}%
            </span>
          </div>

          <div className={`w-full h-3 rounded-full overflow-hidden ${getProgressBgColor()}`}>
            <div 
              className={`h-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOverBudget ? (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm text-red-500 font-medium">
                  {t('overBudgetStatus') || 'Melebihi Budget!'}
                </span>
              </>
            ) : progressPercentage > 80 ? (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-sm text-yellow-600 font-medium">
                  {t('nearLimitStatus') || 'Mendekati Batas'}
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-green-600 font-medium">
                  {t('onTrackStatus') || 'Sesuai Target'}
                </span>
              </>
            )}
          </div>

          {progressPercentage > 0 && (
            <div className="flex items-center gap-1">
              <TrendingUp className={`w-4 h-4 ${
                isOverBudget ? 'text-red-500' : 
                progressPercentage > 80 ? 'text-yellow-500' : 'text-green-500'
              }`} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen p-4 space-y-6 transition-colors duration-200 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <Toaster position="top-right" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {t('budgetManagement') || 'Manajemen Budget'}
          </h1>
          <p className={`mt-1 text-sm sm:text-base ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {t('budgetDescription') || 'Kelola dan pantau budget pengeluaran Anda'}
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          {t('addBudget') || 'Tambah Budget'}
        </button>
      </div>

      {/* Budget Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Allocated */}
        <div className={`p-4 rounded-xl shadow-sm border transition-all duration-200 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {t('totalAllocated') || 'Total Dialokasikan'}
              </p>
              <p className={`text-xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {formatCurrency(summary.totalAllocated)}
              </p>
            </div>
            
          </div>
        </div>

        {/* Total Spent */}
        <div className={`p-4 rounded-xl shadow-sm border transition-all duration-200 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {t('totalSpent') || 'Total Terpakai'}
              </p>
              <p className={`text-xl font-bold ${
                summary.totalSpent > summary.totalAllocated 
                  ? 'text-red-500' 
                  : isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {formatCurrency(summary.totalSpent)}
              </p>
            </div>
          </div>
        </div>

        {/* Budget Status */}
        <div className={`p-4 rounded-xl shadow-sm border transition-all duration-200 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {t('overBudgetCount') || 'Melebihi Budget'}
              </p>
              <p className={`text-xl font-bold ${
                summary.overBudgetCount > 0 ? 'text-red-500' : 'text-green-500'
              }`}>
                {summary.overBudgetCount}
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              summary.overBudgetCount > 0 
                ? 'bg-red-100 dark:bg-red-900/20' 
                : 'bg-green-100 dark:bg-green-900/20'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                summary.overBudgetCount > 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-green-600 dark:text-green-400'
              }`} />
            </div>
          </div>
        </div>

        {/* Total Budgets */}
        <div className={`p-4 rounded-xl shadow-sm border transition-all duration-200 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {t('totalBudgets') || 'Total Budget'}
              </p>
              <p className={`text-xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {summary.budgetCount}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
              <PieChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Budget List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className={`ml-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {t('loadingBudgets') || 'Memuat budget...'}
          </span>
        </div>
      ) : error ? (
        <div className={`text-center py-12 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
          >
            {t('retry') || 'Coba Lagi'}
          </button>
        </div>
      ) : budgets.length === 0 ? (
        <div className={`text-center py-12 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          <PieChart className={`w-16 h-16 mx-auto mb-4 ${
            isDark ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <h3 className={`text-lg font-medium mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {t('noBudgets') || 'Belum ada budget'}
          </h3>
          <p className="mb-4">
            {t('noBudgetsDescription') || 'Mulai dengan membuat budget pertama Anda'}
          </p>
          <button
            onClick={handleAdd}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200"
          >
            {t('createFirstBudget') || 'Buat Budget Pertama'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {budgets.map(budget => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              spent={calculateSpentAmount(budget.category, budget)} // tambah budget param
              userCategories={userCategories}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Budget Modal */}
      <BudgetModal
        isOpen={showModal}
        onClose={handleModalClose}
        onBudgetSaved={handleBudgetSaved}
        editBudget={editBudget}
      />
    </div>
  );
};

export default BudgetPage;