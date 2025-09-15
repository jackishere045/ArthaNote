// src/components/savings/SavingsPage.jsx (Updated with source account display)
import React, { useState, useEffect } from 'react';
import { 
  PiggyBank, 
  Plus, 
  TrendingUp, 
  Target, 
  Minus, 
  Edit, 
  Trash2, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Wallet,
  AlertCircle,
  Building2
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getUserSavings, getSavingsSummary } from '../../firebase/savings';
import SavingsModal from './SavingsModal';

const SavingsPage = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  
  const [savings, setSavings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedSavings, setSelectedSavings] = useState(null);

  useEffect(() => {
    fetchSavingsData();
  }, []);

  const fetchSavingsData = async () => {
    try {
      setLoading(true);
      const [savingsData, summaryData] = await Promise.all([
        getUserSavings(),
        getSavingsSummary()
      ]);
      setSavings(savingsData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Error fetching savings data:', err);
      setError(t('failedToLoadSavings') || 'Gagal memuat data tabungan');
    } finally {
      setLoading(false);
    }
  };

  const handleModalOpen = (mode, savingsItem = null) => {
    setModalMode(mode);
    setSelectedSavings(savingsItem);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setModalMode('create');
    setSelectedSavings(null);
  };

  const handleModalSuccess = () => {
    fetchSavingsData();
    // Dispatch event to update other components
    window.dispatchEvent(new CustomEvent('accountBalanceChanged'));
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const calculateProgress = (current, target) => {
    if (!target || target <= 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'text-green-600 dark:text-green-400';
    if (progress >= 75) return 'text-blue-600 dark:text-blue-400';
    if (progress >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressBg = (progress) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className={`min-h-screen px-4 sm:px-6 py-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
              {t('loadingSavings') || 'Memuat tabungan...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-4 sm:px-6 py-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className={`p-6 rounded-xl shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('savingsManagement') || 'Manajemen Tabungan'}
              </h1>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('savingsDescription') || 'Kelola tabungan fleksibel Anda untuk dana darurat dan tujuan umum'}
              </p>
            </div>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all hover:transform hover:-translate-y-1 shadow-lg"
              onClick={() => handleModalOpen('create')}
            >
              <Plus className="w-4 h-4" />
              {t('addSavings') || 'Tambah Tabungan'}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Balance */}
            <div className={`p-4 rounded-xl shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('totalSavingsBalance') || 'Total Saldo Tabungan'}
                  </p>
                  <p className={`text-xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    {formatCurrency(summary.totalBalance)}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                  <PiggyBank className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Total Accounts */}
            <div className={`p-4 rounded-xl shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('totalSavingsAccounts') || 'Total Rekening Tabungan'}
                  </p>
                  <p className={`text-xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {summary.totalAccounts}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Monthly Growth */}
            <div className={`p-4 rounded-xl shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('monthlyGrowth') || 'Pertumbuhan Bulan Ini'}
                  </p>
                  <p className={`text-xl font-bold ${
                    summary.monthlyGrowth >= 0 
                      ? (isDark ? 'text-green-400' : 'text-green-600')
                      : (isDark ? 'text-red-400' : 'text-red-600')
                  }`}>
                    {summary.monthlyGrowth >= 0 ? '+' : ''}{formatCurrency(summary.monthlyGrowth)}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  summary.monthlyGrowth >= 0 
                    ? (isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-600')
                    : (isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-600')
                }`}>
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Monthly Deposits */}
            <div className={`p-4 rounded-xl shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('monthlyDeposits') || 'Setoran Bulan Ini'}
                  </p>
                  <p className={`text-xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    {formatCurrency(summary.monthlyDeposits)}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                  <ArrowUpCircle className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className={`w-16 h-16 mb-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            <p className={isDark ? 'text-red-400' : 'text-red-600'}>{error}</p>
            <button
              onClick={fetchSavingsData}
              className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('retry') || 'Coba Lagi'}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && savings.length === 0 && (
          <div className="text-center py-16">
            <PiggyBank className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
            <h3 className={`text-2xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {t('noSavings') || 'Belum ada tabungan'}
            </h3>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('addFirstSavings') || 'Buat tabungan pertama Anda untuk mulai mengatur dana'}
            </p>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all hover:transform hover:-translate-y-1 mx-auto"
              onClick={() => handleModalOpen('create')}
            >
              <Plus className="w-4 h-4" />
              {t('createFirstSavings') || 'Buat Tabungan Pertama'}
            </button>
          </div>
        )}

        {/* Savings Grid */}
        {!loading && !error && savings.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {savings.map((savingItem) => {
              const progress = calculateProgress(savingItem.balance, savingItem.targetAmount);
              const hasTarget = savingItem.targetAmount && savingItem.targetAmount > 0;
              
              return (
                <div
                  key={savingItem.id}
                  className={`rounded-xl shadow-lg hover:shadow-xl transition-all hover:transform hover:-translate-y-1 overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                >
                  {/* Header */}
                  <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                          <PiggyBank className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {savingItem.name}
                          </h3>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t('lastUpdated')}: {formatDate(savingItem.updatedAt)}
                          </p>
                          {/* Storage Account Info */}
                          {savingItem.accountName && (
                            <div className="flex items-center gap-1 mt-1">
                              <Building2 className="w-3 h-3" />
                              <p className={`text-xs italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {t('storageAccount') || 'Akun Penyimpanan'}: {savingItem.accountName}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleModalOpen('deposit', savingItem)}
                          className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-green-900/20 text-green-400 hover:bg-green-900/30' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                          title={t('deposit') || 'Setor'}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleModalOpen('withdraw', savingItem)}
                          className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-orange-900/20 text-orange-400 hover:bg-orange-900/30' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                          title={t('withdraw') || 'Tarik'}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleModalOpen('edit', savingItem)}
                          className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                          title={t('edit') || 'Edit'}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleModalOpen('delete', savingItem)}
                          className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                          title={t('delete') || 'Hapus'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Current Balance */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {t('currentBalance') || 'Saldo Saat Ini'}
                        </span>
                        <span className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                          {formatCurrency(savingItem.balance || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Target Progress */}
                    {hasTarget && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t('targetProgress') || 'Progress Target'}
                          </span>
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-500" />
                            <span className={`text-sm font-medium ${getProgressColor(progress)}`}>
                              {progress.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressBg(progress)}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between text-xs">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                            {formatCurrency(savingItem.balance || 0)}
                          </span>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                            {formatCurrency(savingItem.targetAmount)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {savingItem.notes && (
                    <div className={`px-6 py-4 border-t ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {savingItem.notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <SavingsModal
            mode={modalMode}
            savings={selectedSavings}
            onClose={handleModalClose}
            onSuccess={handleModalSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default SavingsPage;