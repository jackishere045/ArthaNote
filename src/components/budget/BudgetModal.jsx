// src/components/budget/BudgetModal.jsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { addBudget, updateBudget } from '../../firebase/budget';
import { getUserCategories } from '../../firebase/categories';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getCategoryOptions } from '../../utils/categories';
import toast from 'react-hot-toast';

const BudgetModal = ({ 
  isOpen, 
  onClose, 
  onBudgetSaved, 
  editBudget = null 
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userCategories, setUserCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Load user categories on mount
  useEffect(() => {
    loadUserCategories();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (editBudget) {
      setFormData({
        category: editBudget.category || '',
        amount: editBudget.amount?.toString() || '',
        period: editBudget.period || 'monthly'
      });
    } else {
      setFormData({
        category: '',
        amount: '',
        period: 'monthly'
      });
    }
    setError('');
  }, [editBudget, isOpen]);

  const loadUserCategories = async () => {
    try {
      setLoadingCategories(true);
      const categoriesData = await getUserCategories();
      setUserCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error(t('failedToLoadCategories') || 'Gagal memuat kategori');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.category || !formData.amount || !formData.period) {
      setError(t('allFieldsRequired') || 'Semua field harus diisi');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError(t('invalidAmount') || 'Jumlah tidak valid');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const budgetData = {
        category: formData.category,
        amount: amount,
        period: formData.period
      };

      if (editBudget) {
        // Update existing budget
        await updateBudget(editBudget.id, budgetData);
        toast.success(t('budgetUpdated') || 'Budget berhasil diperbarui');
      } else {
        // Add new budget
        await addBudget(budgetData);
        toast.success(t('budgetAdded') || 'Budget berhasil ditambahkan');
      }

      if (onBudgetSaved) onBudgetSaved();
      onClose();
    } catch (error) {
      console.error('Error saving budget:', error);
      if (error.message.includes('already exists')) {
        setError(t('budgetAlreadyExists') || 'Budget untuk kategori dan periode ini sudah ada');
      } else {
        setError(error.message || (t('failedToSaveBudget') || 'Gagal menyimpan budget'));
      }
    } finally {
      setLoading(false);
    }
  };

  const periodOptions = [
    { value: 'daily', label: t('daily') || 'Harian' },
    { value: 'weekly', label: t('weekly') || 'Mingguan' },
    { value: 'monthly', label: t('monthly') || 'Bulanan' },
    { value: 'yearly', label: t('yearly') || 'Tahunan' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-lg shadow-xl transition-all duration-200 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {editBudget 
              ? (t('editBudget') || 'Edit Budget') 
              : (t('addBudget') || 'Tambah Budget')
            }
          </h2>
          
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isDark 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-100 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Category Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {t('category') || 'Kategori'} *
            </label>
            
            {loadingCategories ? (
              <div className={`p-3 rounded-lg text-sm ${
                isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}>
                {t('loadingCategories') || 'Memuat kategori...'}
              </div>
            ) : (
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className={`w-full p-3 rounded-lg border transition-colors duration-200 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                <option value="">
                  {t('selectCategory') || 'Pilih Kategori'}
                </option>
                {getCategoryOptions('expense', t, userCategories).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Budget Amount */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {t('budgetAmount') || 'Jumlah Budget'} *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="0"
              min="0"
              step="1000"
              required
              className={`w-full p-3 rounded-lg border transition-colors duration-200 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>

          {/* Period Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {t('budgetPeriod') || 'Periode Budget'} *
            </label>
            <select
              name="period"
              value={formData.period}
              onChange={handleInputChange}
              required
              className={`w-full p-3 rounded-lg border transition-colors duration-200 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                isDark 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {t('cancel') || 'Batal'}
            </button>
            
            <button
              type="submit"
              disabled={loading || loadingCategories}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 ${
                loading || loadingCategories
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
              }`}
            >
              {loading 
                ? (t('saving') || 'Menyimpan...') 
                : editBudget 
                  ? (t('updateBudget') || 'Perbarui Budget')
                  : (t('addBudget') || 'Tambah Budget')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetModal;